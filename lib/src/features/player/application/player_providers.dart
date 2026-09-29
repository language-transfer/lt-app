import 'package:audio_service/audio_service.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:languagetransfer/src/core/logging.dart';
import 'package:languagetransfer/src/core/providers.dart';
import 'package:languagetransfer/src/core/read_future.dart';
import 'package:languagetransfer/src/features/catalog/application/catalog_providers.dart';
import 'package:languagetransfer/src/features/catalog/domain/course.dart';
import 'package:languagetransfer/src/features/catalog/domain/course_index.dart';
import 'package:languagetransfer/src/features/player/data/lesson_audio_handler.dart';

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

/// Whether the mini-player shows: once a lesson is in the player, until
/// playback stops.
final miniPlayerVisibleProvider = Provider<bool>(
  (ref) =>
      ref.watch(nowPlayingProvider).value != null &&
      ref.watch(playerStatusProvider).processing != AudioProcessingState.idle,
);

final playbackPositionProvider = StreamProvider<Duration>(
  (ref) => ref.watch(audioHandlerProvider).positionStream,
);

final playerControllerProvider =
    NotifierProvider<PlayerController, AsyncValue<void>>(PlayerController.new);

/// Starts lessons. Its state is the latest start: an error means the lesson
/// could not even be handed to the player, which then has nothing to show.
/// A lesson that cannot be loaded shows in [playerStatusProvider] instead.
class PlayerController extends Notifier<AsyncValue<void>> {
  ({String courseId, int lessonIndex})? _last;

  @override
  AsyncValue<void> build() => const AsyncData(null);

  /// Plays lesson [lessonIndex] of [courseId] and the rest of the course
  /// after it.
  Future<void> playLesson(String courseId, int lessonIndex) {
    _last = (courseId: courseId, lessonIndex: lessonIndex);
    return _run(() => _start(courseId, lessonIndex));
  }

  /// Tries again with the lesson in the player (autoplay may have moved on
  /// since the last request), at its saved position, or else with the last
  /// request.
  Future<void> retry() => _run(() async {
    final current = ref.read(audioHandlerProvider).mediaItem.value;
    if (current != null) {
      final metadata = await ref.readFuture(
        courseMetadataProvider(current.courseId).future,
      );
      final index = metadata.indexOf(current.lessonId);
      if (index != null) {
        await _start(current.courseId, index);
        return;
      }
    }
    final last = _last;
    if (last != null) await _start(last.courseId, last.lessonIndex);
  });

  Future<void> _run(Future<void> Function() start) async {
    state = const AsyncLoading();
    try {
      await start();
      if (ref.mounted) state = const AsyncData(null);
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
