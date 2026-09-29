import 'package:drift/native.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:languagetransfer/src/core/storage/database.dart';
import 'package:languagetransfer/src/features/progress/application/lesson_completion.dart';
import 'package:languagetransfer/src/features/progress/data/progress_repository.dart';
import 'package:languagetransfer/src/features/settings/data/settings_repository.dart';

void main() {
  late AppDatabase database;
  late ProgressRepository progress;
  late SettingsRepository settings;
  late List<String> deleted;
  late LessonCompletion completion;

  setUp(() {
    database = AppDatabase(NativeDatabase.memory());
    progress = ProgressRepository(database: database);
    settings = SettingsRepository(database: database);
    deleted = [];
    completion = LessonCompletion(
      progress: progress,
      settings: settings,
      deleteDownload: (courseId, lessonId) async =>
          deleted.add('$courseId/$lessonId'),
    );
  });

  tearDown(() => database.close());

  test('finishes the lesson and keeps its download by default', () async {
    await completion.playedThrough('greek', 'greek1');
    await completion.setFinished('greek', 'greek2', finished: true);

    final lessons = await progress.loadCourse('greek');
    expect(lessons['greek1']!.finished, isTrue);
    expect(lessons['greek2']!.finished, isTrue);
    expect(deleted, isEmpty);
  });

  test('marks a lesson not finished again', () async {
    await completion.playedThrough('greek', 'greek1');

    await completion.setFinished('greek', 'greek1', finished: false);

    expect((await progress.loadCourse('greek'))['greek1']!.finished, isFalse);
  });

  test('deletes the download when "delete finished downloads" is on', () async {
    await settings.update((s) => s.copyWith(autoDeleteFinished: true));

    await completion.playedThrough('greek', 'greek1');
    await completion.setFinished('greek', 'greek2', finished: true);
    await completion.setFinished('greek', 'greek3', finished: false);

    expect(deleted, ['greek/greek1', 'greek/greek2']);
  });
}
