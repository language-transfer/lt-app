import 'package:audio_service/audio_service.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:languagetransfer/src/core/logging.dart';
import 'package:languagetransfer/src/core/read_future.dart';
import 'package:languagetransfer/src/features/catalog/application/catalog_providers.dart';
import 'package:languagetransfer/src/features/catalog/domain/course.dart';
import 'package:languagetransfer/src/features/catalog/domain/course_index.dart';
import 'package:languagetransfer/src/features/player/data/artwork_files.dart';
import 'package:languagetransfer/src/features/player/data/lesson_audio_handler.dart';
import 'package:languagetransfer/src/features/player/domain/sleep_timer.dart';

/// The player, created in `lib/main.dart` with the audio service.
final audioHandlerProvider = Provider<LessonAudioHandler>(
  (ref) => throw UnimplementedError('Provided in main()'),
);

/// Where the lock screen's course covers are written, created in
/// `lib/main.dart`.
final artworkFilesProvider = Provider<ArtworkFiles>(
  (ref) => throw UnimplementedError('Provided in main()'),
);

final _playbackStateProvider = StreamProvider<PlaybackState>(
  (ref) => ref.watch(audioHandlerProvider).playbackState,
);

/// What the player's controls show. The full [PlaybackState] changes with
/// every buffering update while a lesson streams; this changes only when
/// something shown changes.
typedef PlayerStatus = ({
  bool playing,
  AudioProcessingState processing,
  int? queueIndex,
  double speed,
  String? error,
});

final playerStatusProvider = Provider<PlayerStatus>((ref) {
  final state = ref.watch(_playbackStateProvider).value ?? PlaybackState();
  return (
    playing: state.playing,
    processing: state.processingState,
    queueIndex: state.queueIndex,
    speed: state.speed,
    error: state.errorMessage,
  );
});

/// The lesson in the player, or `null` before anything was played.
final nowPlayingProvider = StreamProvider<MediaItem?>(
  (ref) => ref.watch(audioHandlerProvider).mediaItem,
);

/// The lesson in the player while there is something to play: `null`
/// before anything was played and once playback stopped (the notification
/// was swiped away, or the app removed from the recent apps). The
/// mini-player shows it, and the course page calls it the one playing.
final activeLessonProvider = Provider<MediaItem?>((ref) {
  final item = ref.watch(nowPlayingProvider).value;
  final stopped =
      ref.watch(playerStatusProvider).processing == AudioProcessingState.idle;
  return stopped ? null : item;
});

final playbackPositionProvider = StreamProvider<Duration>(
  (ref) => ref.watch(audioHandlerProvider).positionStream,
);

/// The sleep timer; `null` when it is off.
final sleepTimerProvider = StreamProvider<SleepTimer?>(
  (ref) => ref.watch(audioHandlerProvider).sleepTimerStream,
);

/// A lesson asked for with [PlayerController.playLesson].
typedef LessonRequest = ({String courseId, int lessonIndex});

/// The lesson last asked for, from the request until the player has it, so
/// the player can show it at once rather than the lesson before. Kept when
/// the lesson could not be started, so the player can say so.
final requestedLessonProvider =
    NotifierProvider<RequestedLesson, LessonRequest?>(RequestedLesson.new);

class RequestedLesson extends Notifier<LessonRequest?> {
  @override
  LessonRequest? build() => null;

  LessonRequest? get _request => state;
  set _request(LessonRequest? request) => state = request;
}

final playerControllerProvider =
    NotifierProvider<PlayerController, AsyncValue<void>>(PlayerController.new);

/// Starts lessons. Its state is the latest start: an error means the lesson
/// could not even be handed to the player, which then has nothing to show.
/// A lesson that cannot be loaded shows in [playerStatusProvider] instead.
class PlayerController extends Notifier<AsyncValue<void>> {
  @override
  AsyncValue<void> build() => const AsyncData(null);

  /// Plays lesson [lessonIndex] of [courseId] and the rest of the course
  /// after it.
  Future<void> playLesson(String courseId, int lessonIndex) {
    ref.read(requestedLessonProvider.notifier)._request = (
      courseId: courseId,
      lessonIndex: lessonIndex,
    );
    return _run(() => _start(courseId, lessonIndex));
  }

  /// Tries again with the lesson asked for, if it could not be started, or
  /// else with the lesson in the player (autoplay may have moved on since
  /// it was asked for), at its saved position.
  Future<void> retry() => _run(() async {
    if (ref.read(requestedLessonProvider) case final requested?) {
      await _start(requested.courseId, requested.lessonIndex);
      return;
    }
    final current = ref.read(audioHandlerProvider).mediaItem.value;
    if (current == null) return;
    final metadata = await ref.readFuture(
      courseMetadataProvider(current.courseId).future,
    );
    final index = metadata.indexOf(current.lessonId);
    if (index != null) await _start(current.courseId, index);
  });

  /// Stops playback if the lesson in the player, or the one asked for, is
  /// of [courseId], as before the course's progress or downloads are
  /// deleted: the player saves its position on the way, and would go on
  /// saving it.
  Future<void> stopCourse(String courseId) async {
    final requests = ref.read(requestedLessonProvider.notifier);
    final handler = ref.read(audioHandlerProvider);
    if (requests._request?.courseId != courseId &&
        handler.mediaItem.value?.courseId != courseId) {
      return;
    }
    requests._request = null;
    state = const AsyncData(null);
    await handler.stop();
  }

  Future<void> _run(Future<void> Function() start) async {
    final request = ref.read(requestedLessonProvider.notifier)._request;
    state = const AsyncLoading();
    try {
      await start();
      if (!ref.mounted) return;
      state = const AsyncData(null);
      // The player has the lesson now, unless another was asked for since.
      final requests = ref.read(requestedLessonProvider.notifier);
      if (requests._request == request) requests._request = null;
    } on Object catch (error, stackTrace) {
      logRecoverable('Could not start the lesson', error, stackTrace);
      if (ref.mounted) state = AsyncError(error, stackTrace);
    }
  }

  Future<void> _start(String courseId, int lessonIndex) async {
    final course = Courses.resolve(courseId);
    if (course == null) throw UnknownCourseException(courseId);
    final loaded = await ref.readFuture(courseIndexProvider.future);
    final metadata = await ref.readFuture(
      courseMetadataProvider(course.id).future,
    );
    final artUri = await ref.read(artworkFilesProvider).uriFor(course.cover);
    await ref
        .read(audioHandlerProvider)
        .playCourse(
          courseId: course.id,
          courseTitle: course.fullTitle,
          index: loaded.index,
          lessons: metadata.lessons,
          startIndex: lessonIndex,
          artUri: artUri,
        );
  }
}
