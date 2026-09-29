import 'package:languagetransfer/src/features/progress/data/progress_repository.dart';
import 'package:languagetransfer/src/features/settings/data/settings_repository.dart';

/// Marks lessons finished, for the player and the screens alike.
///
/// With "Delete lessons after finishing" on, the lesson's download is deleted
/// too (upstream `src/storage/persistence.ts`, `markLessonFinished`); one
/// still on its way is cancelled.
class LessonCompletion {
  LessonCompletion({
    required this._progress,
    required this._settings,
    required this._deleteDownload,
  });

  final ProgressRepository _progress;
  final SettingsRepository _settings;
  final Future<void> Function(String courseId, String lessonId) _deleteDownload;

  /// The player played the lesson through.
  Future<void> playedThrough(String courseId, String lessonId) async {
    await _progress.markPlayedThrough(courseId, lessonId);
    await _deleteIfWanted(courseId, lessonId);
  }

  /// The listener marked the lesson finished or not finished.
  Future<void> setFinished(
    String courseId,
    String lessonId, {
    required bool finished,
  }) async {
    if (finished) {
      await _progress.markFinished(courseId, lessonId);
      await _deleteIfWanted(courseId, lessonId);
    } else {
      await _progress.markUnfinished(courseId, lessonId);
    }
  }

  Future<void> _deleteIfWanted(String courseId, String lessonId) async {
    if ((await _settings.load()).autoDeleteFinished) {
      await _deleteDownload(courseId, lessonId);
    }
  }
}
