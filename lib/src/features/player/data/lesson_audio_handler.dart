import 'dart:async';

import 'package:audio_service/audio_service.dart';
import 'package:audio_session/audio_session.dart';
import 'package:flutter/foundation.dart';
import 'package:just_audio/just_audio.dart';
import 'package:languagetransfer/src/core/logging.dart';
import 'package:languagetransfer/src/features/catalog/domain/course_index.dart';
import 'package:languagetransfer/src/features/catalog/domain/lesson.dart';
import 'package:languagetransfer/src/features/player/data/lesson_sources.dart';
import 'package:languagetransfer/src/features/player/domain/sleep_timer.dart';
import 'package:languagetransfer/src/features/progress/data/progress_repository.dart';
import 'package:languagetransfer/src/features/progress/domain/playback_rules.dart';
import 'package:languagetransfer/src/features/settings/data/settings_repository.dart';
import 'package:languagetransfer/src/features/settings/domain/app_settings.dart';

/// Identifies a queue item; stored in [MediaItem.extras].
extension LessonMediaItem on MediaItem {
  String get courseId => extras!['courseId']! as String;
  String get lessonId => extras!['lessonId']! as String;
}

/// Records that a lesson was played to its end.
typedef PlayedThrough = Future<void> Function(String courseId, String lessonId);

/// Plays lessons in the background and keeps the lock screen, notification,
/// headset buttons and the app's UI in sync.
///
/// A course is played as a queue of all its lessons, so playback continues
/// into the next lesson like in the Expo app (`src/services/audioPlayer.ts`)
/// unless autoplay is off. Progress is saved while playing, not by the UI,
/// so it is kept even when the app is in the background.
class LessonAudioHandler extends BaseAudioHandler {
  LessonAudioHandler({
    required AudioPlayer Function() player,
    required this._progress,
    required this._playedThrough,
    required this._settings,
    required this._sources,
  }) : _newPlayer = player;

  /// Makes a player: one at the start, and a new one for a lesson started
  /// again after a failure (see [playCourse]).
  final AudioPlayer Function() _newPlayer;

  final ProgressRepository _progress;

  /// `LessonCompletion.playedThrough`, which also applies the settings
  /// that go with finishing a lesson.
  final PlayedThrough _playedThrough;

  final SettingsRepository _settings;
  final LessonSources _sources;

  late AudioPlayer _player;
  final _playerSubscriptions = <StreamSubscription<Object?>>[];
  final _subscriptions = <StreamSubscription<Object?>>[];
  Timer? _saveTimer;
  AppSettings _currentSettings = const AppSettings();

  /// The position of whichever player plays, for the screens.
  late final _positions = StreamController<Duration>.broadcast(
    onListen: _followPosition,
    onCancel: () => _positionFollower?.cancel(),
  );
  StreamSubscription<Duration>? _positionFollower;

  final _sleepTimers = StreamController<SleepTimer?>.broadcast();
  late final _sleep = SleepCountdown(
    onChanged: _sleepTimers.add,
    onVolume: (volume) =>
        _run('set the volume', () => _player.setVolume(volume)),
    onRunOut: () => _run('stop for the sleep timer', () async {
      await _player.pause();
      await _player.setVolume(1);
    }),
  );

  /// What the queue plays, for streaming a lesson whose download goes.
  ({
    CourseIndex index,
    List<Lesson> lessons,
    AudioQuality quality,
    List<MediaItem> items,
  })?
  _queue;

  /// The downloaded files the queue plays, by queue index.
  Map<int, String> _files = {};

  /// Those of [_files] whose downloads were deleted.
  final _released = <String>{};

  /// What the last periodic save wrote: the item id and position.
  (String, Duration)? _periodicallySaved;

  /// Why the lesson could not be loaded or played. After a failure the
  /// player turns idle, which must not hide it, so it is kept until the next
  /// attempt or until the lesson plays again.
  String? _failure;

  /// Counts [playCourse] and [stop] calls; a lesson whose request was
  /// overtaken by either does not start.
  int _requests = 0;

  /// How many changes to the player's lesson or queue are under way. Until
  /// they are done, the player's index and position may still belong to
  /// the lesson before, and just_audio reports the move as an automatic
  /// advance.
  int _switches = 0;

  /// Configures the audio session and starts listening to the player. Call
  /// once before anything else.
  Future<void> init() async {
    final session = await AudioSession.instance;
    // Spoken audio: pause for other speech (navigation, calls) instead of
    // ducking, since ducked speech is hard to follow.
    await session.configure(const AudioSessionConfiguration.speech());
    _currentSettings = await _settings.load();
    _attach(_newPlayer());
    _subscriptions.addAll([
      _settings.watch().listen((settings) => _currentSettings = settings),
      _sources.released.listen((paths) {
        _released.addAll(paths);
        _run('stream deleted downloads', _streamDeletedDownloads);
      }),
    ]);
  }

  /// The player in use, for tests that check its state.
  @visibleForTesting
  AudioPlayer get player => _player;

  /// The playback position, for the player screen.
  Stream<Duration> get positionStream async* {
    yield _player.position;
    yield* _positions.stream;
  }

  /// The sleep timer now and whenever it changes; `null` when it is off.
  Stream<SleepTimer?> get sleepTimerStream async* {
    yield _sleep.timer;
    yield* _sleepTimers.stream;
  }

  /// Sets the sleep timer, or turns it off with `null`.
  void setSleepTimer(SleepTimer? timer) => _sleep.set(timer);

  /// Plays [lessons] of a course, starting with [startIndex] at its saved
  /// position, with [artUri] as the artwork on the lock screen. The lesson
  /// played so far is left as with [skipToQueueItem].
  ///
  /// If the lesson cannot be loaded, for example without a network
  /// connection, the failure is broadcast in [playbackState] (processing
  /// state `error`) instead of thrown, because that is what the player
  /// screen shows. The next attempt then starts on a new player: after a
  /// failure the old one may not recover (for example when iOS has closed
  /// the local server that feeds it streams while the app was suspended).
  ///
  /// Throws only if the course's progress or downloads cannot be read; the
  /// lesson played so far then plays on.
  Future<void> playCourse({
    required String courseId,
    required String courseTitle,
    required CourseIndex index,
    required List<Lesson> lessons,
    required int startIndex,
    Uri? artUri,
  }) async {
    RangeError.checkValidIndex(startIndex, lessons, 'startIndex');
    final request = ++_requests;
    final items = [
      for (final lesson in lessons)
        MediaItem(
          id: '$courseId/${lesson.id}',
          title: lesson.title,
          // Lock screens and notifications show title and artist, so the
          // course goes there.
          artist: courseTitle,
          album: 'Language Transfer',
          artUri: artUri,
          duration: lesson.duration,
          extras: {'courseId': courseId, 'lessonId': lesson.id},
        ),
    ];
    // Read while the settings and sources are prepared; its error, if any,
    // surfaces where it is awaited.
    final progressLoad = _progress.loadCourse(courseId)..ignore();
    final settings = await _settings.load();
    final audio = await _sources.forQueue(
      courseId: courseId,
      index: index,
      lessons: lessons,
      streamQuality: settings.streamQuality,
      tags: items,
    );
    final progress = await progressLoad;
    final start = lessons[startIndex];
    if (request != _requests) return;

    await _player.pause();
    await _leaveLesson();
    if (request != _requests) return;
    var loaded = false;
    await _switch(() async {
      if (_failure != null) await _replacePlayer();
      _failure = null;
      _queue = (
        index: index,
        lessons: lessons,
        quality: settings.streamQuality,
        items: items,
      );
      _files = Map.of(audio.files);
      _released.clear();
      queue.add(items);
      mediaItem.add(items[startIndex]);
      try {
        await _player.setAudioSources(
          audio.sources,
          initialIndex: startIndex,
          initialPosition: PlaybackRules.resumePosition(
            progress[start.id]?.position,
            start.duration,
          ),
        );
        await _player.setSpeed(settings.playbackSpeed);
        loaded = true;
      } on PlayerInterruptedException {
        // A later request, or stop(), cut the loading short.
      } on Object catch (error, stackTrace) {
        if (request == _requests) _onPlaybackError(error, stackTrace);
      }
    });
    if (request != _requests || !loaded) return;
    // Completes only when playback pauses, so it is not awaited.
    unawaited(_player.play());
  }

  @override
  Future<void> play() => _player.play();

  @override
  Future<void> pause() => _player.pause();

  @override
  Future<void> seek(Duration position) async {
    await _player.seek(position);
    await _savePosition();
  }

  @override
  Future<void> rewind() {
    final target = _player.position - PlaybackRules.skipInterval;
    return seek(target.isNegative ? Duration.zero : target);
  }

  @override
  Future<void> fastForward() {
    final duration = _player.duration;
    final target = _player.position + PlaybackRules.skipInterval;
    return seek(duration != null && target > duration ? duration : target);
  }

  @override
  Future<void> skipToNext() async {
    final next = _player.nextIndex;
    if (next != null) await _moveTo(next);
  }

  @override
  Future<void> skipToPrevious() async {
    final previous = _player.previousIndex;
    if (previous != null) await _moveTo(previous);
  }

  @override
  Future<void> skipToQueueItem(int index) async {
    if (index >= 0 && index < queue.value.length) await _moveTo(index);
  }

  @override
  Future<void> setSpeed(double speed) async {
    await _player.setSpeed(speed);
    await _settings.update((s) => s.copyWith(playbackSpeed: speed));
  }

  @override
  Future<void> stop() async {
    _requests++;
    _sleep.set(null);
    await _leaveLesson();
    await _player.stop();
    await super.stop();
    // Stopped, the player reads no file: its lesson can let go of a deleted
    // download too.
    if (_released.isNotEmpty) {
      _run('stream deleted downloads', _streamDeletedDownloads);
    }
  }

  /// Swiping the app away stops playback and removes the notification, like
  /// the Expo app (upstream `src/services/audioPlayer.ts`,
  /// `AppKilledPlaybackBehavior.StopPlaybackAndRemoveNotification`).
  @override
  Future<void> onTaskRemoved() => stop();

  Future<void> dispose() async {
    _saveTimer?.cancel();
    _sleep.dispose();
    await _sleepTimers.close();
    for (final subscription in [..._subscriptions, ..._playerSubscriptions]) {
      await subscription.cancel();
    }
    await _positionFollower?.cancel();
    await _positions.close();
    await _player.dispose();
  }

  void _attach(AudioPlayer player) {
    _player = player;
    _playerSubscriptions.addAll([
      player.playbackEventStream.listen(
        _broadcastState,
        onError: _onPlaybackError,
      ),
      // setSpeed reports its playback event before the new speed.
      player.speedStream.listen((_) => _broadcastState(player.playbackEvent)),
      player.currentIndexStream.listen((_) => _onCurrentIndex()),
      player.positionDiscontinuityStream.listen(_onDiscontinuity),
      player.playingStream.listen(_onPlayingChanged),
      player.processingStateStream.listen(_onProcessingState),
    ]);
  }

  /// Puts a new player in place of the current one, which is released.
  Future<void> _replacePlayer() async {
    for (final subscription in _playerSubscriptions) {
      await subscription.cancel();
    }
    _playerSubscriptions.clear();
    final old = _player;
    _attach(_newPlayer());
    if (_positions.hasListener) _followPosition();
    await old.dispose();
  }

  void _followPosition() {
    unawaited(_positionFollower?.cancel());
    _positionFollower = _player.positionStream.listen(_positions.add);
  }

  /// The queue item the player is on; `null` while it moves to another.
  MediaItem? get _currentItem {
    if (_switches > 0) return null;
    final index = _player.currentIndex;
    final items = queue.value;
    return index == null || index >= items.length ? null : items[index];
  }

  /// The lesson the player has loaded; `null` while it moves to another, is
  /// loading, or failed.
  MediaItem? get _loadedItem => switch (_player.processingState) {
    ProcessingState.idle || ProcessingState.loading => null,
    ProcessingState.buffering ||
    ProcessingState.ready ||
    ProcessingState.completed => _currentItem,
  };

  bool _isAtEnd(MediaItem item) {
    final duration = _player.duration ?? item.duration;
    return duration != null &&
        PlaybackRules.isAtEnd(_player.position, duration);
  }

  void _publishCurrentItem() {
    final item = _currentItem;
    if (item != null && item != mediaItem.value) mediaItem.add(item);
  }

  void _onCurrentIndex() {
    _publishCurrentItem();
    // The lesson left may have lost its download while it played.
    if (_released.isNotEmpty) {
      _run('stream deleted downloads', _streamDeletedDownloads);
    }
  }

  /// Plays lesson [index] of the queue from its start.
  Future<void> _moveTo(int index) async {
    await _leaveLesson();
    await _switch(() => _player.seek(Duration.zero, index: index));
    _onCurrentIndex();
  }

  /// Runs [change], which changes the player's lesson or queue.
  Future<void> _switch(Future<void> Function() change) async {
    _switches++;
    try {
      await change();
    } finally {
      _switches--;
    }
  }

  /// Streams the lessons in the queue whose downloads were deleted, then
  /// lets go of their files. The lesson playing keeps its file until the
  /// player moves on or stops, since the player may still read it.
  Future<void> _streamDeletedDownloads() async {
    final playing = _queue;
    if (playing == null || _switches > 0) return;
    // Stopped or failed, just_audio has let go of the platform's player.
    final stopped = _player.processingState == ProcessingState.idle;
    final current = _player.currentIndex;
    final deleted = [
      for (final MapEntry(key: index, value: path) in _files.entries)
        if ((stopped || index != current) && _released.contains(path)) index,
    ];
    if (deleted.isEmpty) return;
    await _switch(() async {
      for (final index in deleted) {
        // The stream goes in after the file before the file goes: the other
        // way round, a stopped player would move on to the next lesson
        // (verified in just_audio 0.10's idle player).
        await _player.insertAudioSource(
          index + 1,
          _sources.streamFor(
            playing.index,
            playing.lessons[index],
            playing.quality,
            playing.items[index],
          ),
        );
        await _player.removeAudioSourceAt(index);
        _released.remove(_files.remove(index));
      }
    });
    await _sources.useFiles(_files.values.toSet());
  }

  /// Before the player leaves a lesson on request: one left within its last
  /// seconds is finished (upstream `trackPlayerService.ts`,
  /// `PlaybackActiveTrackChanged`), any other keeps its position. A failure
  /// is logged, so the next lesson still plays.
  Future<void> _leaveLesson() async {
    final item = _loadedItem;
    if (item == null) return;
    try {
      if (_isAtEnd(item)) {
        await _playedThrough(item.courseId, item.lessonId);
      } else {
        await _progress.savePosition(
          item.courseId,
          item.lessonId,
          _player.position,
        );
      }
    } on Object catch (error, stackTrace) {
      logRecoverable('Could not leave the lesson', error, stackTrace);
    }
  }

  /// A lesson that plays to its end is finished; with autoplay off, playback
  /// then stops at the start of the next lesson.
  void _onDiscontinuity(PositionDiscontinuity discontinuity) {
    if (_switches > 0 ||
        discontinuity.reason != PositionDiscontinuityReason.autoAdvance) {
      return;
    }
    final ended = discontinuity.previousEvent;
    final index = ended.currentIndex;
    final items = queue.value;
    if (index != null && index < items.length) {
      final item = items[index];
      final duration = ended.duration ?? item.duration;
      // The last event before the advance can be minutes old; playback went
      // on from the position it reported until now. (On iOS the advance
      // itself still reports that old position and time.)
      final position =
          ended.updatePosition +
          DateTime.now().difference(ended.updateTime) * _player.speed;
      if (duration != null && PlaybackRules.isAtEnd(position, duration)) {
        _run(
          'finish the lesson',
          () => _playedThrough(item.courseId, item.lessonId),
        );
      }
    }
    // A sleep timer set to the end of the lesson stops here too.
    final sleeps = _sleep.lessonEnded();
    if (!_currentSettings.autoplay || sleeps) {
      _run('stop after the lesson', () async {
        await _player.pause();
        await _player.seek(Duration.zero);
        // Saved as the start, so the lesson reads as not started; the
        // player may report a few milliseconds after a seek to zero.
        final next = _loadedItem;
        if (next != null) {
          await _progress.savePosition(
            next.courseId,
            next.lessonId,
            Duration.zero,
          );
        }
      });
    }
  }

  /// The last lesson of the course ended.
  void _onProcessingState(ProcessingState state) {
    if (state != ProcessingState.completed) return;
    // Playback stops anyway; a timer waiting for the lesson's end is done.
    _sleep.lessonEnded();
    final item = _loadedItem;
    if (item == null) return;
    _run('finish the course', () async {
      if (_isAtEnd(item)) {
        await _playedThrough(item.courseId, item.lessonId);
      }
      await _player.pause();
      await _player.seek(Duration.zero);
    });
  }

  /// Saves the position while playing and whenever playback stops, also
  /// when the player pauses by itself (headphones unplugged, a call).
  void _onPlayingChanged(bool playing) {
    _sleep.playing = playing;
    _saveTimer?.cancel();
    if (playing) {
      _saveTimer = Timer.periodic(
        PlaybackRules.saveInterval,
        (_) =>
            _run('save the position', () => _savePosition(periodically: true)),
      );
    } else {
      _run('save the position', _savePosition);
    }
  }

  /// Saves the position of the lesson loaded. A periodic save is skipped
  /// while the position has not moved since the last one, as while the
  /// stream buffers.
  Future<void> _savePosition({bool periodically = false}) async {
    final item = _loadedItem;
    // Within the last seconds the lesson is about to be finished, which
    // resets its position.
    if (item == null || _isAtEnd(item)) return;
    final position = _player.position;
    final saved = (item.id, position);
    if (periodically && saved == _periodicallySaved) return;
    _periodicallySaved = periodically ? saved : null;
    await _progress.savePosition(item.courseId, item.lessonId, position);
  }

  void _broadcastState(PlaybackEvent event) {
    final playing = _player.playing;
    final processing = _player.processingState;
    if (processing == ProcessingState.ready ||
        processing == ProcessingState.buffering) {
      _failure = null;
    }
    final failure = _failure;
    // A new state rather than a copy, so a cleared failure clears its
    // message too.
    playbackState.add(
      PlaybackState(
        controls: [
          MediaControl.skipToPrevious,
          MediaControl.rewind,
          if (playing) MediaControl.pause else MediaControl.play,
          MediaControl.fastForward,
          MediaControl.skipToNext,
        ],
        systemActions: const {
          MediaAction.seek,
          MediaAction.rewind,
          MediaAction.fastForward,
          MediaAction.skipToNext,
          MediaAction.skipToPrevious,
        },
        // Back 10 s, play/pause and forward 10 s in the compact notification.
        androidCompactActionIndices: const [1, 2, 3],
        processingState: failure != null
            ? AudioProcessingState.error
            : switch (processing) {
                ProcessingState.idle => AudioProcessingState.idle,
                ProcessingState.loading => AudioProcessingState.loading,
                ProcessingState.buffering => AudioProcessingState.buffering,
                ProcessingState.ready => AudioProcessingState.ready,
                ProcessingState.completed => AudioProcessingState.completed,
              },
        playing: playing,
        updatePosition: _player.position,
        bufferedPosition: _player.bufferedPosition,
        speed: _player.speed,
        queueIndex: event.currentIndex,
        errorMessage: failure,
      ),
    );
  }

  void _onPlaybackError(Object error, StackTrace stackTrace) {
    logRecoverable('Playback failed', error, stackTrace);
    _failure = switch (error) {
      PlayerException(:final message?) => message,
      PlayerException(:final code) => 'Playback error $code',
      _ => '$error',
    };
    playbackState.add(
      playbackState.value.copyWith(
        processingState: AudioProcessingState.error,
        playing: false,
        errorMessage: _failure,
      ),
    );
  }

  /// Runs background work triggered by player events. It starts after the
  /// event has been delivered: just_audio delivers its events synchronously
  /// and throws if the player is called back while it does. A failure must
  /// not stop playback.
  void _run(String what, Future<void> Function() work) {
    unawaited(
      Future.microtask(work).catchError((Object error, StackTrace stackTrace) {
        logRecoverable('Could not $what', error, stackTrace);
      }),
    );
  }
}
