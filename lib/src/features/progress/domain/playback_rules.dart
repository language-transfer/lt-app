import 'package:languagetransfer/src/features/catalog/domain/lesson.dart';
import 'package:languagetransfer/src/features/progress/domain/lesson_progress.dart';

/// Rules for resuming and finishing lessons, taken from the Expo app so that
/// listening behaves the same.
abstract final class PlaybackRules {
  /// A lesson never resumes closer to its end than this, so there is time to
  /// pause or scrub (upstream `src/services/audioPlayer.ts`).
  static const resumeMargin = Duration(seconds: 10);

  /// A lesson that stops this close to its end counts as finished
  /// (upstream `src/services/trackPlayerService.ts`,
  /// `FINISH_THRESHOLD_SECONDS`).
  static const finishThreshold = Duration(seconds: 5);

  /// How often the position is saved while playing (upstream
  /// `PROGRESS_PERSIST_INTERVAL_MS`).
  static const saveInterval = Duration(seconds: 3);

  /// How far back and forward skip, also for screen readers adjusting the
  /// seek line (upstream `src/services/audioPlayer.ts`,
  /// `backwardJumpInterval`).
  static const skipInterval = Duration(seconds: 10);

  /// Where to start a [duration]-long lesson given a [saved] position.
  static Duration resumePosition(Duration? saved, Duration duration) {
    if (saved == null || saved <= Duration.zero) return Duration.zero;
    final latest = duration - resumeMargin;
    if (latest <= Duration.zero) return Duration.zero;
    return saved < latest ? saved : latest;
  }

  /// Whether stopping at [position] finishes a [duration]-long lesson.
  static bool isAtEnd(Duration position, Duration duration) =>
      duration > Duration.zero && duration - position <= finishThreshold;

  /// The lesson "continue" opens: the lesson played most recently, or the
  /// one after it if that one is finished (upstream
  /// `LanguageHomeTopButton.tsx`, `getNextLesson`). If none was played yet,
  /// the first lesson that is not finished.
  ///
  /// Returns an index into [lessons], or `null` for an empty course.
  static int? continueIndex(
    List<Lesson> lessons,
    Iterable<LessonProgress> progress,
  ) {
    if (lessons.isEmpty) return null;
    final position = {for (final (i, lesson) in lessons.indexed) lesson.id: i};
    final finished = <int>{};
    ({int index, DateTime at, bool finished})? latest;
    for (final entry in progress) {
      final index = position[entry.lessonId];
      if (index == null) continue; // The lesson no longer exists.
      if (entry.finished) finished.add(index);
      final at = entry.listenedAt;
      if (at == null) continue;
      // Times are stored to the second, so two lessons can tie; the later
      // lesson in the course wins, since listening moves forward.
      if (latest == null ||
          at.isAfter(latest.at) ||
          (at == latest.at && index > latest.index)) {
        latest = (index: index, at: at, finished: entry.finished);
      }
    }
    if (latest == null) {
      for (var i = 0; i < lessons.length; i++) {
        if (!finished.contains(i)) return i;
      }
      return 0;
    }
    if (!latest.finished) return latest.index;
    return latest.index + 1 < lessons.length ? latest.index + 1 : latest.index;
  }
}
