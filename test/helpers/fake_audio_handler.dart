import 'dart:async';

import 'package:audio_service/audio_service.dart';
import 'package:languagetransfer/src/features/catalog/domain/course_index.dart';
import 'package:languagetransfer/src/features/catalog/domain/lesson.dart';
import 'package:languagetransfer/src/features/player/data/lesson_audio_handler.dart';

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

  /// Speeds passed to [setSpeed].
  final speeds = <double>[];

  @override
  Future<void> setSpeed(double speed) async => speeds.add(speed);

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
    if (playError case final error?) throw error;
    played.add((courseId: courseId, startIndex: startIndex));
    this.artUri = artUri;
  }

  @override
  Future<void> dispose() => _positions.close();
}
