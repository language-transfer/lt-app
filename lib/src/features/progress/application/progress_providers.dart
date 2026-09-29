import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_riverpod/misc.dart';
import 'package:languagetransfer/src/core/providers.dart';
import 'package:languagetransfer/src/features/progress/application/lesson_completion.dart';
import 'package:languagetransfer/src/features/progress/data/progress_repository.dart';
import 'package:languagetransfer/src/features/progress/domain/lesson_progress.dart';

final progressRepositoryProvider = Provider<ProgressRepository>(
  (ref) => ProgressRepository(database: ref.watch(databaseProvider)),
);

/// Progress of every lesson in a course that has any, by lesson id.
final StreamProviderFamily<Map<String, LessonProgress>, String>
courseProgressProvider =
    StreamProvider.family<Map<String, LessonProgress>, String>(
      (ref, courseId) =>
          ref.watch(progressRepositoryProvider).watchCourse(courseId),
    );

/// Finished lessons per course id, for the course list.
final finishedCountsProvider = StreamProvider<Map<String, int>>(
  (ref) => ref.watch(progressRepositoryProvider).watchFinishedCounts(),
);

/// The instance the player uses too, created in `lib/main.dart`.
final lessonCompletionProvider = Provider<LessonCompletion>(
  (ref) => throw UnimplementedError('Provided in main()'),
);
