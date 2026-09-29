import 'dart:async';

import 'package:audio_service/audio_service.dart';
import 'package:audio_session/audio_session.dart';
import 'package:just_audio/just_audio.dart';
import 'package:languagetransfer/src/core/logging.dart';
import 'package:languagetransfer/src/features/catalog/domain/course_index.dart';
import 'package:languagetransfer/src/features/catalog/domain/lesson.dart';
import 'package:languagetransfer/src/features/player/data/lesson_sources.dart';
import 'package:languagetransfer/src/features/progress/application/lesson_completion.dart';
import 'package:languagetransfer/src/features/progress/data/progress_repository.dart';
import 'package:languagetransfer/src/features/progress/domain/playback_rules.dart';
import 'package:languagetransfer/src/features/settings/data/settings_repository.dart';
import 'package:languagetransfer/src/features/settings/domain/app_settings.dart';

/// Identifies a queue item; stored in [MediaItem.extras].
extension LessonMediaItem on MediaItem {
  String get courseId => extras!['courseId']! as String;
  String get lessonId => extras!['lessonId']! as String;
}

/// Plays lessons in the background and keeps the lock screen, notification,
/// headset buttons and the app's UI in sync.
///
/// A course is played as a queue of all its lessons, so playback continues
/// into the next lesson like in the Expo app (`src/services/audioPlayer.ts`)
/// unless autoplay is off. Progress is saved while playing, not by the UI,
/// so it is kept even when the app is in the background.
class LessonAudioHandler extends BaseAudioHandler {
  LessonAudioHandler({
    required this._player,
    required this._progress,
    required this._completion,
    required this._settings,
    required this._sources,
  });

  final AudioPlayer _player;
  final ProgressRepository _progress;
  final LessonCompletion _completion;
  final SettingsRepository _settings;
  final LessonSources _sources;

  final _subscriptions = <StreamSubscription<Object?>>[];
  Timer? _saveTimer;
  AppSettings _currentSettings = const AppSettings();

  /// Why the lesson could not be loaded or played. After a failure the
  /// player turns idle, which must not hide it, so it is kept until the next
  /// attempt or until the lesson plays again.
  String? _failure;

  /// Counts [playCourse] and [stop] calls; a lesson whose request was
  /// overtaken by either does not start.
  int _requests = 0;

  /// How many moves to another lesson or queue are under way. Until they
  /// are done, the player's index and position may still belong to the
  /// lesson before, and just_audio reports the move as an automatic advance.
  int _switches = 0;

  /// Configures the audio session and starts listening to the player. Call
  /// once before anything else.
  Future<void> init() async {
    final session = await AudioSession.instance;
    // Spoken audio: pause for other speech (navigation, calls) instead of
    // ducking, since ducked speech is hard to follow.
    await session.configure(const AudioSessionConfiguration.speech());
    _currentSettings = await _settings.load();
    _subscriptions.addAll([
      _player.playbackEventStream.listen(
        _broadcastState,
        onError: _onPlaybackError,
      ),
      // setSpeed reports its playback event before the new speed.
      _player.speedStream.listen((_) => _broadcastState(_player.playbackEvent)),
      _player.currentIndexStream.listen((_) => _publishCurrentItem()),
      _player.positionDiscontinuityStream.listen(_onDiscontinuity),
      _player.playingStream.listen(_onPlayingChanged),
      _player.processingStateStream.listen(_onProcessingState),
      _settings.watch().listen((settings) => _currentSettings = settings),
    ]);
  }

  /// The playback position, for the player screen.
  Stream<Duration> get positionStream => _player.positionStream;

  /// Plays [lessons] of a course, starting with [startIndex] at its saved
  /// position, with [artUri] as the artwork on the lock screen. The lesson
  /// played so far is left as with [skipToQueueItem].
  ///
  /// If the lesson cannot be loaded, for example without a network
  /// connection, the failure is broadcast in [playbackState] (processing
  /// state `error`) instead of thrown, because that is what the player
  /// screen shows. Throws only if the course's progress or downloads cannot
  /// be read; the lesson played so far then plays on.
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
    final settings = await _settings.load();
    final progress = await _progress.loadCourse(courseId);
    final sources = await _sources.forQueue(
      courseId: courseId,
      index: index,
      lessons: lessons,
      streamQuality: settings.streamQuality,
      tags: items,
    );
    final start = lessons[startIndex];
    if (request != _requests) return;

    await _player.pause();
    await _leaveLesson();
    if (request != _requests) return;
    var loaded = false;
    await _switch(() async {
      _failure = null;
      queue.add(items);
      mediaItem.add(items[startIndex]);
      try {
        await _player.setAudioSources(
          sources,
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
    await _leaveLesson();
    await _player.stop();
    await super.stop();
  }

  /// Swiping the app away stops playback and removes the notification, like
  /// the Expo app (`AppKilledPlaybackBehavior`,
  /// `StopPlaybackAndRemoveNotification`).
  @override
  Future<void> onTaskRemoved() => stop();

  Future<void> dispose() async {
    _saveTimer?.cancel();
    for (final subscription in _subscriptions) {
      await subscription.cancel();
    }
    await _player.dispose();
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

  /// Plays lesson [index] of the queue from its start.
  Future<void> _moveTo(int index) async {
    await _leaveLesson();
    await _switch(() => _player.seek(Duration.zero, index: index));
    _publishCurrentItem();
  }

  /// Runs [move], which takes the player to another lesson or queue.
  Future<void> _switch(Future<void> Function() move) async {
    _switches++;
    try {
      await move();
    } finally {
      _switches--;
    }
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
        await _completion.playedThrough(item.courseId, item.lessonId);
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
          () => _completion.playedThrough(item.courseId, item.lessonId),
        );
      }
    }
    if (!_currentSettings.autoplay) {
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
    final item = _loadedItem;
    if (item == null) return;
    _run('finish the course', () async {
      if (_isAtEnd(item)) {
        await _completion.playedThrough(item.courseId, item.lessonId);
      }
      await _player.pause();
      await _player.seek(Duration.zero);
    });
  }

  /// Saves the position while playing and whenever playback stops, also
  /// when the player pauses by itself (headphones unplugged, a call).
  void _onPlayingChanged(bool playing) {
    _saveTimer?.cancel();
    if (playing) {
      _saveTimer = Timer.periodic(
        PlaybackRules.saveInterval,
        (_) => _run('save the position', _savePosition),
      );
    } else {
      _run('save the position', _savePosition);
    }
  }

  Future<void> _savePosition() async {
    final item = _loadedItem;
    // Within the last seconds the lesson is about to be finished, which
    // resets its position.
    if (item == null || _isAtEnd(item)) return;
    await _progress.savePosition(
      item.courseId,
      item.lessonId,
      _player.position,
    );
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
