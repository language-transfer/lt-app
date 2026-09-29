import 'package:drift/drift.dart' hide isNull;
import 'package:drift/native.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:languagetransfer/src/core/storage/database.dart';
import 'package:languagetransfer/src/features/catalog/domain/lesson.dart';
import 'package:languagetransfer/src/features/downloads/data/download_repository.dart';
import 'package:languagetransfer/src/features/downloads/domain/lesson_download.dart';

import '../../../helpers/fixtures.dart';

void main() {
  late AppDatabase database;
  late DownloadRepository repository;
  final requestedAt = DateTime(2026, 9, 28, 12);

  LessonDownload download(
    String courseId,
    String lessonId,
    String objectId, {
    DownloadStatus status = DownloadStatus.queued,
  }) => LessonDownload(
    courseId: courseId,
    lessonId: lessonId,
    objectId: objectId,
    variant: AudioVariant.low,
    size: 1000,
    url: Uri.parse('https://example.org/cas/$objectId'),
    status: status,
    requestedAt: requestedAt,
  );

  setUp(() {
    database = AppDatabase(NativeDatabase.memory());
    repository = DownloadRepository(database: database);
  });

  tearDown(() => database.close());

  test('stores and reads back downloads by lesson', () async {
    final first = download('greek', 'greek1', fakeObjectId(1));
    await repository.putAll([
      first,
      download('spanish', 'spanish1', fakeObjectId(2)),
    ]);

    expect(await repository.loadCourse('greek'), {'greek1': first});
    expect(await repository.loadAll(), hasLength(2));
  });

  test('replaces an earlier download of the same lesson', () async {
    await repository.putAll([
      download(
        'greek',
        'greek1',
        fakeObjectId(1),
        status: DownloadStatus.failed,
      ),
    ]);
    await repository.putAll([download('greek', 'greek1', fakeObjectId(2))]);

    final row = (await repository.loadCourse('greek'))['greek1']!;
    expect(row.objectId, fakeObjectId(2));
    expect(row.status, DownloadStatus.queued);
  });

  test('sets the status of every lesson using an object', () async {
    await repository.putAll([
      download('ingles', 'ingles1', fakeObjectId(1)),
      download('ingles_completo', 'ingles_completo1', fakeObjectId(1)),
      download('greek', 'greek1', fakeObjectId(2)),
    ]);

    await repository.setStatus(fakeObjectId(1), DownloadStatus.complete);

    final statuses = {
      for (final row in await repository.loadAll()) row.lessonId: row.status,
    };
    expect(statuses, {
      'ingles1': DownloadStatus.complete,
      'ingles_completo1': DownloadStatus.complete,
      'greek1': DownloadStatus.queued,
    });
    expect(await repository.loadByObject(fakeObjectId(1)), hasLength(2));
  });

  test('removes downloads and reports what is still referenced', () async {
    await repository.putAll([
      download('greek', 'greek1', fakeObjectId(1)),
      download('greek', 'greek2', fakeObjectId(2)),
      download('italian', 'italian1', fakeObjectId(2)),
    ]);

    final removed = await repository.remove('greek', ['greek1', 'greek2']);

    expect(
      removed.map((row) => row.lessonId),
      unorderedEquals(['greek1', 'greek2']),
    );
    expect(await repository.referenced([fakeObjectId(1), fakeObjectId(2)]), {
      fakeObjectId(2),
    });
    expect(await repository.referenced([]), isEmpty);
  });

  test('leaves a status that is already set alone', () async {
    await repository.putAll([download('greek', 'greek1', fakeObjectId(1))]);
    final seen = <String>[];
    final subscription = repository.watchCourse('greek').listen((rows) {
      final row = rows['greek1']!;
      seen.add('${row.status.name} ${row.failure?.name}');
    });
    Future<void> set(DownloadStatus status, [DownloadFailure? failure]) async {
      await repository.setStatus(fakeObjectId(1), status, failure: failure);
      await pumpEventQueue();
    }

    await pumpEventQueue();
    await set(DownloadStatus.queued);
    await set(DownloadStatus.downloading);
    await set(DownloadStatus.downloading);
    await set(DownloadStatus.failed, DownloadFailure.connection);
    await set(DownloadStatus.failed, DownloadFailure.connection);
    await set(DownloadStatus.failed, DownloadFailure.storage);
    await set(DownloadStatus.queued);

    expect(seen, [
      'queued null',
      'downloading null',
      'failed connection',
      'failed storage',
      'queued null',
    ]);
    await subscription.cancel();
  });

  test('emits changes to a course', () async {
    final emitted = repository
        .watchCourse('greek')
        .map((rows) => rows.keys.toList());
    final expectation = expectLater(
      emitted,
      emitsInOrder([
        <String>[],
        ['greek1'],
      ]),
    );

    await Future<void>.delayed(Duration.zero);
    await repository.putAll([download('greek', 'greek1', fakeObjectId(1))]);
    await expectation;
  });

  test('does not emit a course again for changes to another', () async {
    final updates = <Map<String, LessonDownload>>[];
    final subscription = repository.watchCourse('greek').listen(updates.add);
    await pumpEventQueue();

    await repository.putAll([download('spanish', 'spanish1', fakeObjectId(2))]);
    await pumpEventQueue();

    expect(updates, [isEmpty]);
    await subscription.cancel();
  });

  test('skips rows it cannot read instead of failing', () async {
    await repository.putAll([download('greek', 'greek1', fakeObjectId(1))]);
    await database
        .into(database.downloadsTable)
        .insert(
          DownloadsTableCompanion.insert(
            courseId: 'greek',
            lessonId: 'greek2',
            objectId: fakeObjectId(2),
            variant: 'hq-flac',
            size: 1,
            url: 'https://example.org/x',
            status: 'queued',
            requestedAt: requestedAt,
          ),
        );
    await (database.update(database.downloadsTable)
          ..where((row) => row.lessonId.equals('greek1')))
        .write(const DownloadsTableCompanion(status: Value('paused')));

    expect(await repository.loadCourse('greek'), isEmpty);
  });

  test('keeps why a download failed, until it is requested again', () async {
    await repository.putAll([download('greek', 'greek1', fakeObjectId(1))]);

    await repository.setStatus(
      fakeObjectId(1),
      DownloadStatus.failed,
      failure: DownloadFailure.storage,
    );
    expect(
      (await repository.loadCourse('greek'))['greek1']!.failure,
      DownloadFailure.storage,
    );

    await repository.setStatus(fakeObjectId(1), DownloadStatus.queued);
    expect((await repository.loadCourse('greek'))['greek1']!.failure, isNull);
  });

  test('reads a reason it does not know as "other"', () async {
    await repository.putAll([
      download(
        'greek',
        'greek1',
        fakeObjectId(1),
        status: DownloadStatus.failed,
      ),
    ]);
    await (database.update(database.downloadsTable)
          ..where((row) => row.lessonId.equals('greek1')))
        .write(const DownloadsTableCompanion(failure: Value('quota')));

    expect(
      (await repository.loadCourse('greek'))['greek1']!.failure,
      DownloadFailure.other,
    );
  });
}
