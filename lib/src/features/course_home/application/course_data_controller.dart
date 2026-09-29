import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:languagetransfer/src/core/logging.dart';
import 'package:languagetransfer/src/core/read_future.dart';
import 'package:languagetransfer/src/features/catalog/application/catalog_providers.dart';
import 'package:languagetransfer/src/features/catalog/domain/course_index.dart';
import 'package:languagetransfer/src/features/downloads/application/download_controller.dart';
import 'package:languagetransfer/src/features/player/application/player_providers.dart';
import 'package:languagetransfer/src/features/progress/application/progress_providers.dart';

final courseDataControllerProvider = Provider<CourseDataController>(
  CourseDataController.new,
);

/// Deletes what the app keeps of a course, for the course's management
/// screen (upstream `src/components/data-management/DataManagementScreen.tsx`).
///
/// Unlike upstream, a course that is playing stops first: the player would
/// otherwise save the lesson's position again right after it was cleared.
class CourseDataController {
  CourseDataController(this._ref);

  final Ref _ref;

  /// Marks every lesson of [courseId] unfinished and forgets where each was
  /// left.
  Future<void> clearProgress(String courseId) async {
    await _ref.read(playerControllerProvider.notifier).stopCourse(courseId);
    await _ref.read(progressRepositoryProvider).clearCourse(courseId);
  }

  /// Clears the progress of [courseId], deletes its downloads and the local
  /// copy of its metadata.
  Future<void> deleteAll(String courseId) async {
    await clearProgress(courseId);
    await _ref.read(downloadControllerProvider).deleteAll(courseId);
    await _deleteMetadataCopy(courseId);
  }

  /// The index says which copy is the course's. Without an index on the
  /// device there is nothing to go by, and the rest is deleted all the same.
  Future<void> _deleteMetadataCopy(String courseId) async {
    final CourseIndexEntry? entry;
    try {
      final loaded = await _ref.readFuture(courseIndexProvider.future);
      entry = loaded.index.entryFor(courseId);
    } on Exception catch (error, stackTrace) {
      logRecoverable(
        'Could not find the stored lessons of $courseId',
        error,
        stackTrace,
      );
      return;
    }
    if (entry != null) {
      await _ref.read(courseMetadataRepositoryProvider).deleteLocalCopy(entry);
    }
  }
}
