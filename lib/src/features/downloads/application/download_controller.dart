import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:languagetransfer/src/core/read_future.dart';
import 'package:languagetransfer/src/features/catalog/application/catalog_providers.dart';
import 'package:languagetransfer/src/features/catalog/domain/lesson.dart';
import 'package:languagetransfer/src/features/downloads/application/download_providers.dart';
import 'package:languagetransfer/src/features/progress/application/progress_providers.dart';
import 'package:languagetransfer/src/features/settings/application/settings_providers.dart';

final downloadControllerProvider = Provider<DownloadController>(
  DownloadController.new,
);

/// The download actions of the screens (upstream `CourseDownloadManager` in
/// `src/services/downloadManager.ts`).
class DownloadController {
  DownloadController(this._ref);

  final Ref _ref;

  /// Downloads [lessons] of [courseId] in the download quality setting.
  Future<void> download(String courseId, List<Lesson> lessons) async {
    final loaded = await _ref.readFuture(courseIndexProvider.future);
    final settings = await _ref.read(settingsRepositoryProvider).load();
    await _ref
        .read(downloadManagerProvider)
        .download(
          courseId: courseId,
          index: loaded.index,
          lessons: lessons,
          quality: settings.downloadQuality,
        );
  }

  /// Deletes the downloads of [lessonIds], cancelling those on their way.
  Future<void> delete(String courseId, Iterable<String> lessonIds) =>
      _ref.read(downloadManagerProvider).delete(courseId, lessonIds);

  /// Deletes the downloads of every finished lesson of [courseId].
  Future<void> deleteFinished(String courseId) async {
    final progress = await _ref
        .read(progressRepositoryProvider)
        .loadCourse(courseId);
    await delete(courseId, [
      for (final lesson in progress.values)
        if (lesson.finished) lesson.lessonId,
    ]);
  }

  Future<void> deleteAll(String courseId) =>
      _ref.read(downloadManagerProvider).deleteCourse(courseId);
}
