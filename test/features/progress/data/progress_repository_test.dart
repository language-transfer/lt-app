import 'package:drift/native.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:languagetransfer/src/core/storage/database.dart';
import 'package:languagetransfer/src/features/progress/data/progress_repository.dart';
import 'package:languagetransfer/src/features/progress/domain/lesson_progress.dart';

void main() {
  late AppDatabase database;
  late DateTime now;
  late ProgressRepository repo;

  setUp(() {
    database = AppDatabase(NativeDatabase.memory());
    now = DateTime(2026, 9, 28, 12);
    repo = ProgressRepository(database: database, now: () => now);
  });

  tearDown(() => database.close());

  test('saves and updates the position', () async {
    await repo.savePosition('greek', 'greek1', const Duration(seconds: 42));
    now = now.add(const Duration(minutes: 1));
    await repo.savePosition('greek', 'greek1', const Duration(seconds: 90));

    final progress = (await repo.loadCourse('greek'))['greek1']!;
    expect(progress.position, const Duration(seconds: 90));
    expect(progress.finished, isFalse);
    expect(progress.listenedAt, now);
  });

  test(
    'playing through resets the position; saving later keeps it finished',
    () async {
      await repo.savePosition('greek', 'greek1', const Duration(seconds: 42));
      now = now.add(const Duration(minutes: 1));
      await repo.markPlayedThrough('greek', 'greek1');

      var progress = (await repo.loadCourse('greek'))['greek1']!;
      expect(progress.finished, isTrue);
      expect(progress.position, isNull);
      expect(progress.listenedAt, now);

      await repo.savePosition('greek', 'greek1', const Duration(seconds: 7));
      progress = (await repo.loadCourse('greek'))['greek1']!;
      expect(progress.finished, isTrue, reason: 'replaying keeps it finished');
      expect(progress.position, const Duration(seconds: 7));
    },
  );

  test('marking finished keeps the position and listening time', () async {
    await repo.savePosition('greek', 'greek1', const Duration(seconds: 42));
    final listenedAt = now;
    now = now.add(const Duration(days: 1));

    await repo.markFinished('greek', 'greek1');
    await repo.markFinished('greek', 'greek2');

    final progress = await repo.loadCourse('greek');
    expect(progress['greek1']!.finished, isTrue);
    expect(progress['greek1']!.position, const Duration(seconds: 42));
    expect(progress['greek1']!.listenedAt, listenedAt);
    expect(progress['greek2']!.finished, isTrue);
    expect(progress['greek2']!.listenedAt, isNull, reason: 'never played');
  });

  test('marking unfinished keeps the listening time', () async {
    await repo.markPlayedThrough('greek', 'greek1');
    final listenedAt = now;
    now = now.add(const Duration(days: 1));

    await repo.markUnfinished('greek', 'greek1');

    final progress = (await repo.loadCourse('greek'))['greek1']!;
    expect(progress.finished, isFalse);
    expect(progress.listenedAt, listenedAt);
  });

  test('finds the most recent course', () async {
    expect(await repo.mostRecentCourseId(), isNull);
    await repo.savePosition('greek', 'greek1', Duration.zero);
    now = now.add(const Duration(minutes: 1));
    await repo.savePosition('spanish', 'spanish4', Duration.zero);
    now = now.add(const Duration(minutes: 1));
    await repo.markFinished('german', 'german1');

    expect(await repo.mostRecentCourseId(), 'spanish');
  });

  test('counts finished lessons per course', () async {
    await repo.markFinished('greek', 'greek1');
    await repo.markFinished('greek', 'greek2');
    await repo.savePosition('greek', 'greek3', const Duration(seconds: 1));
    await repo.markFinished('spanish', 'spanish1');

    expect(await repo.watchFinishedCounts().first, {'greek': 2, 'spanish': 1});
  });

  test('watchCourse emits updates', () async {
    final updates = repo.watchCourse('greek').map((p) => p['greek1']?.finished);
    final expectation = expectLater(updates, emitsInOrder([null, false, true]));

    await pumpEventQueue();
    await repo.savePosition('greek', 'greek1', const Duration(seconds: 1));
    await pumpEventQueue();
    await repo.markFinished('greek', 'greek1');

    await expectation;
  });

  test('watches emit only when their result changes', () async {
    await repo.markFinished('greek', 'greek1');
    final counts = <Map<String, int>>[];
    final spanish = <Map<String, LessonProgress>>[];
    final subscriptions = [
      repo.watchFinishedCounts().listen(counts.add),
      repo.watchCourse('spanish').listen(spanish.add),
    ];
    await pumpEventQueue();

    // The player saves the position of a Greek lesson every few seconds.
    for (var seconds = 3; seconds <= 9; seconds += 3) {
      await repo.savePosition('greek', 'greek2', Duration(seconds: seconds));
      await pumpEventQueue();
    }
    await repo.markFinished('greek', 'greek2');
    await pumpEventQueue();

    expect(counts, [
      {'greek': 1},
      {'greek': 2},
    ]);
    expect(spanish, [isEmpty]);
    for (final subscription in subscriptions) {
      await subscription.cancel();
    }
  });

  test('clears one course only', () async {
    await repo.markFinished('greek', 'greek1');
    await repo.markFinished('spanish', 'spanish1');

    await repo.clearCourse('greek');

    expect(await repo.loadCourse('greek'), isEmpty);
    expect(await repo.loadCourse('spanish'), hasLength(1));
  });
}
