import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_riverpod/misc.dart';
import 'package:languagetransfer/src/core/providers.dart';
import 'package:languagetransfer/src/features/downloads/data/download_repository.dart';
import 'package:languagetransfer/src/features/downloads/domain/lesson_download.dart';

final downloadRepositoryProvider = Provider<DownloadRepository>(
  (ref) => DownloadRepository(database: ref.watch(databaseProvider)),
);

/// Downloads of a course by lesson id.
final StreamProviderFamily<Map<String, LessonDownload>, String>
courseDownloadsProvider =
    StreamProvider.family<Map<String, LessonDownload>, String>(
      (ref, courseId) =>
          ref.watch(downloadRepositoryProvider).watchCourse(courseId),
    );

/// How far each running download is, by object id (0 to 1).
final downloadProgressProvider = StreamProvider<Map<String, double>>((
  ref,
) async* {
  final manager = ref.watch(downloadManagerProvider);
  yield manager.currentProgress;
  yield* manager.progress;
});
