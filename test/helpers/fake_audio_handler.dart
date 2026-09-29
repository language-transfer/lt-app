import 'dart:async';

import 'package:audio_service/audio_service.dart';
import 'package:just_audio/just_audio.dart';
import 'package:languagetransfer/src/features/catalog/domain/course_index.dart';
import 'package:languagetransfer/src/features/catalog/domain/lesson.dart';
import 'package:languagetransfer/src/features/player/data/lesson_audio_handler.dart';
import 'package:languagetransfer/src/features/player/domain/sleep_timer.dart';

/// Stands in for [LessonAudioHandler] in widget tests: no player, no
/// platform channels. Tests set what the player shows with [show].
class FakeLessonAudioHandler extends BaseAudioHandler
    implements LessonAudioHandler {
  final _positions = StreamController<Duration>.broadcast();
  Duration _position = Duration.zero;

  /// Courses and lessons passed to [playCourse], for assertions.
  final played = <({String courseId, int startIndex})>[];

  /// The artwork passed with the last [playCourse].
  Uri? artUri;

  /// If set, [playCourse] throws it, as when the course's progress or
  /// downloads cannot be read.
  Exception? playError;

  /// If set, [playCourse] waits for it, as the real one waits for the
  /// lesson's progress and sources.
  Completer<void>? startGate;

  /// If set, [stop] runs it first, as the real one saves the lesson's
  /// position on the way.
  Future<void> Function()? onStop;

  /// Shows [item] of [queueItems] as the lesson in the player.
  void show({
    required MediaItem item,
    required List<MediaItem> queueItems,
    bool playing = false,
    AudioProcessingState processingState = AudioProcessingState.ready,
    Duration position = Duration.zero,
    String? errorMessage,
  }) {
    queue.add(queueItems);
    mediaItem.add(item);
    _position = position;
    _positions.add(position);
    playbackState.add(
      PlaybackState(
        playing: playing,
        processingState: processingState,
        queueIndex: queueItems.indexOf(item),
        updatePosition: position,
        errorMessage: errorMessage,
      ),
    );
  }

  /// Moves the position only, as playback does between state changes.
  void movePosition(Duration position) {
    _position = position;
    _positions.add(position);
  }

  @override
  AudioPlayer get player => throw UnsupportedError('The fake has no player');

  /// Speeds passed to [setSpeed].
  final speeds = <double>[];

  /// Skips asked for: 'next' or 'previous'.
  final skips = <String>[];

  @override
  Future<void> skipToNext() async => skips.add('next');

  @override
  Future<void> skipToPrevious() async => skips.add('previous');

  /// Transport controls used: 'play', 'pause', 'rewind' or 'fastForward'.
  final transport = <String>[];

  @override
  Future<void> play() async => transport.add('play');

  @override
  Future<void> pause() async => transport.add('pause');

  @override
  Future<void> rewind() async => transport.add('rewind');

  @override
  Future<void> fastForward() async => transport.add('fastForward');

  /// Positions passed to [seek].
  final seeks = <Duration>[];

  @override
  Future<void> seek(Duration position) async => seeks.add(position);

  final _sleepTimers = StreamController<SleepTimer?>.broadcast();

  /// The timer last set with [setSleepTimer].
  SleepTimer? sleepTimer;

  @override
  Stream<SleepTimer?> get sleepTimerStream async* {
    yield sleepTimer;
    yield* _sleepTimers.stream;
  }

  @override
  void setSleepTimer(SleepTimer? timer) {
    sleepTimer = timer;
    _sleepTimers.add(timer);
  }

  @override
  Future<void> setSpeed(double speed) async => speeds.add(speed);

  @override
  Future<void> stop() async {
    await onStop?.call();
    await super.stop();
  }

  @override
  Future<void> init() async {}

  @override
  Stream<Duration> get positionStream async* {
    yield _position;
    yield* _positions.stream;
  }

  @override
  Future<void> playCourse({
    required String courseId,
    required String courseTitle,
    required CourseIndex index,
    required List<Lesson> lessons,
    required int startIndex,
    Uri? artUri,
  }) async {
    if (startGate case final gate?) await gate.future;
    if (playError case final error?) throw error;
    played.add((courseId: courseId, startIndex: startIndex));
    this.artUri = artUri;
  }

  @override
  Future<void> dispose() async {
    await _positions.close();
    await _sleepTimers.close();
  }
}
