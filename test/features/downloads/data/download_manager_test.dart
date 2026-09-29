import 'dart:async';
import 'dart:io';

import 'package:drift/native.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:languagetransfer/src/core/storage/database.dart';
import 'package:languagetransfer/src/core/storage/file_pointer.dart';
import 'package:languagetransfer/src/core/storage/object_store.dart';
import 'package:languagetransfer/src/features/catalog/domain/course_index.dart';
import 'package:languagetransfer/src/features/catalog/domain/lesson.dart';
import 'package:languagetransfer/src/features/downloads/data/download_backend.dart';
import 'package:languagetransfer/src/features/downloads/data/download_manager.dart';
import 'package:languagetransfer/src/features/downloads/data/download_repository.dart';
import 'package:languagetransfer/src/features/downloads/domain/lesson_download.dart';
import 'package:languagetransfer/src/features/settings/data/settings_repository.dart';
import 'package:path/path.dart' as p;

import '../../../helpers/fake_download_backend.dart';
import '../../../helpers/fixtures.dart';

/// A lesson whose low- and high-quality files are made of known bytes.
({Lesson lesson, List<int> low, List<int> high}) lessonWithAudio(String id) {
  final low = utf8Bytes('$id low');
  final high = utf8Bytes('$id high');
  return (
    lesson: Lesson(
      id: id,
      title: id,
      duration: const Duration(minutes: 5),
      variants: LessonVariants(low: pointerFor(low), high: pointerFor(high)),
    ),
    low: low,
    high: high,
  );
}

void main() {
  final index = CourseIndex.parse(fixture('all_courses.json'));
  final one = lessonWithAudio('greek1');
  final two = lessonWithAudio('greek2');
  final three = lessonWithAudio('greek3');

  late Directory root;
  late ObjectStore store;
  late AppDatabase database;
  late DownloadRepository repository;
  late SettingsRepository settings;
  late FakeDownloadBackend backend;
  late DownloadManager manager;
  late DateTime now;

  DownloadManager createManager({bool applePlayer = false}) => DownloadManager(
    backend: backend,
    repository: repository,
    store: store,
    settings: settings,
    applePlayer: applePlayer,
    now: () => now,
  );

  /// Lets events reach the manager and waits until it has handled them.
  Future<void> settle() async {
    await pumpEventQueue();
    await manager.idle;
    // Events sent by the last of that work reach their listeners.
    await pumpEventQueue();
  }

  Future<DownloadFailure?> failureOf(String lessonId) async =>
      (await repository.loadCourse('greek'))[lessonId]?.failure;

  Future<Map<String, DownloadStatus>> statuses(String courseId) async => {
    for (final MapEntry(:key, :value) in (await repository.loadCourse(
      courseId,
    )).entries)
      key: value.status,
  };

  File fileOf(FilePointer pointer, AudioVariant variant) =>
      store.fileFor(pointer, extension: variant.fileExtension);

  Future<void> writeFile(FilePointer pointer, List<int> bytes) async {
    final file = fileOf(pointer, AudioVariant.high);
    await file.parent.create(recursive: true);
    await file.writeAsBytes(bytes);
  }

  Future<void> download(List<Lesson> lessons) => manager.download(
    courseId: 'greek',
    index: index,
    lessons: lessons,
    quality: AudioQuality.high,
  );

  setUp(() async {
    root = Directory.systemTemp.createTempSync('download_manager_test');
    store = ObjectStore(Directory(p.join(root.path, 'objects')));
    database = AppDatabase(NativeDatabase.memory());
    repository = DownloadRepository(database: database);
    settings = SettingsRepository(database: database);
    backend = FakeDownloadBackend();
    now = DateTime(2026, 9, 28, 12);
    manager = createManager();
  });

  tearDown(() async {
    await manager.dispose();
    await backend.close();
    await database.close();
    root.deleteSync(recursive: true);
  });

  group('start', () {
    test('listens before the backend starts', () async {
      await manager.start();

      expect(backend.listenedBeforeStart, isTrue);
    });

    test('work requested meanwhile waits for the downloader', () async {
      backend.startGate = Completer();
      final started = manager.start();
      final requested = download([one.lesson]);
      await pumpEventQueue();
      expect(backend.enqueued, isEmpty);

      backend.startGate!.complete();
      await started;
      await requested;

      expect(backend.enqueued, hasLength(1));
    });

    test('applies the Wi-Fi setting, and again when it changes', () async {
      await manager.start();
      expect(backend.wifiOnlyCalls, [true]);

      await settings.update((s) => s.copyWith(downloadOnlyOnWifi: false));
      await settle();

      expect(backend.wifiOnlyCalls, [true, false]);
    });
  });

  group('download', () {
    setUp(() => manager.start());

    test(
      'requests the chosen quality into the object store, in order',
      () async {
        await download([one.lesson, two.lesson]);

        expect(backend.enqueued.map((r) => r.taskId), [
          one.lesson.variants.high.object,
          two.lesson.variants.high.object,
        ]);
        final first = backend.enqueued.first;
        expect(first.url, index.urlFor(one.lesson.variants.high));
        expect(
          first.file.path,
          fileOf(one.lesson.variants.high, AudioVariant.high).path,
        );
        expect(
          backend.enqueued[0].requestedAt.isBefore(
            backend.enqueued[1].requestedAt,
          ),
          isTrue,
        );
        expect(await statuses('greek'), {
          'greek1': DownloadStatus.queued,
          'greek2': DownloadStatus.queued,
        });
      },
    );

    test('stores the order of requests to the millisecond', () async {
      // The clock stands still, as within one millisecond.
      await download([three.lesson, one.lesson]);
      await download([two.lesson]);

      final rows = await repository.loadAll();
      final times = {for (final row in rows) row.lessonId: row.requestedAt};
      expect(times.values.toSet(), hasLength(3));
      expect(
        (rows..sort((a, b) => a.requestedAt.compareTo(b.requestedAt))).map(
          (row) => row.lessonId,
        ),
        ['greek3', 'greek1', 'greek2'],
      );
    });

    test('skips lessons already requested', () async {
      await download([one.lesson]);
      await download([one.lesson, two.lesson]);

      expect(backend.enqueued.map((r) => r.taskId), [
        one.lesson.variants.high.object,
        two.lesson.variants.high.object,
      ]);
    });

    test(
      'keeps an existing download when the quality setting changed',
      () async {
        await download([one.lesson]);
        await manager.download(
          courseId: 'greek',
          index: index,
          lessons: [one.lesson],
          quality: AudioQuality.low,
        );

        expect(backend.enqueued, hasLength(1));
        final row = (await repository.loadCourse('greek'))['greek1']!;
        expect(row.variant, AudioVariant.high);
      },
    );

    test(
      'uses low quality for "high" on Apple devices without hq-mov',
      () async {
        await manager.dispose();
        manager = createManager(applePlayer: true);

        await download([one.lesson]);

        expect(backend.enqueued.single.taskId, one.lesson.variants.low.object);
        expect(p.extension(backend.enqueued.single.file.path), '.m4a');
      },
    );

    test('marks audio that is already on the device complete', () async {
      await writeFile(one.lesson.variants.high, one.high);

      await download([one.lesson]);
      await settle();

      expect(backend.enqueued, isEmpty);
      expect(await statuses('greek'), {'greek1': DownloadStatus.complete});
    });

    test('marks the lessons failed if the platform rejects them', () async {
      backend.failEnqueue = true;

      await download([one.lesson]);

      expect(await statuses('greek'), {'greek1': DownloadStatus.failed});
      expect(await failureOf('greek1'), DownloadFailure.other);
    });
  });

  group('updates', () {
    setUp(() async {
      await manager.start();
      await download([one.lesson]);
    });

    String taskId() => one.lesson.variants.high.object;

    test('reports progress while running', () async {
      final updates = <Map<String, double>>[];
      manager.progress.listen(updates.add);

      backend
        ..emit(DownloadStateChanged(taskId(), DownloadTaskState.running))
        ..emit(DownloadProgressed(taskId(), 0.4));
      await settle();

      expect(await statuses('greek'), {'greek1': DownloadStatus.downloading});
      expect(manager.currentProgress, {taskId(): 0.4});
      expect(updates.last, {taskId(): 0.4});
    });

    test('shows a finished download as done while it is checked', () async {
      final updates = <Map<String, double>>[];
      manager.progress.listen(updates.add);
      backend
        ..emit(DownloadStateChanged(taskId(), DownloadTaskState.running))
        ..emit(DownloadProgressed(taskId(), 0.4));
      await settle();

      await backend.finish(taskId(), one.high);
      await settle();

      // Never back to nothing (0 %) before the check is recorded.
      final shown = <double?>[];
      for (final update in updates) {
        final fraction = update[taskId()];
        if (shown.isEmpty || shown.last != fraction) shown.add(fraction);
      }
      expect(shown, [0.4, 1.0, null]);
      expect(await statuses('greek'), {'greek1': DownloadStatus.complete});
    });

    test('marks a verified file complete', () async {
      await backend.finish(taskId(), one.high);
      await settle();

      expect(await statuses('greek'), {'greek1': DownloadStatus.complete});
      expect(manager.currentProgress, isEmpty);
    });

    test('deletes a file that does not match and marks it failed', () async {
      await backend.finish(taskId(), utf8Bytes('something else'));
      await settle();

      expect(await statuses('greek'), {'greek1': DownloadStatus.failed});
      expect(await failureOf('greek1'), DownloadFailure.damaged);
      expect(
        fileOf(one.lesson.variants.high, AudioVariant.high).existsSync(),
        isFalse,
      );
    });

    test('marks failed downloads failed, with the reason', () async {
      backend.emit(
        DownloadStateChanged(
          taskId(),
          DownloadTaskState.failed,
          failure: DownloadFailure.storage,
        ),
      );
      await settle();

      expect(await statuses('greek'), {'greek1': DownloadStatus.failed});
      expect(await failureOf('greek1'), DownloadFailure.storage);
    });

    test('marks downloads the system cancelled failed', () async {
      backend.emit(DownloadStateChanged(taskId(), DownloadTaskState.canceled));
      await settle();

      expect(await statuses('greek'), {'greek1': DownloadStatus.failed});
      expect(await failureOf('greek1'), DownloadFailure.other);
    });

    test('requests a failed download again', () async {
      backend.emit(DownloadStateChanged(taskId(), DownloadTaskState.failed));
      backend.active.clear();
      await settle();

      await download([one.lesson]);

      expect(backend.enqueued, hasLength(2));
      expect(await statuses('greek'), {'greek1': DownloadStatus.queued});
      expect(await failureOf('greek1'), isNull);
    });

    test('ignores a late update after the file was verified', () async {
      await backend.finish(taskId(), one.high);
      await settle();

      backend.emit(DownloadStateChanged(taskId(), DownloadTaskState.running));
      await settle();

      expect(await statuses('greek'), {'greek1': DownloadStatus.complete});
    });

    test(
      'deletes a file that arrives after its download was deleted',
      () async {
        await manager.delete('greek', ['greek1']);

        await backend.finish(taskId(), one.high);
        await settle();

        expect(
          fileOf(one.lesson.variants.high, AudioVariant.high).existsSync(),
          isFalse,
        );
        expect(await repository.loadAll(), isEmpty);
      },
    );
  });

  group('delete', () {
    setUp(() => manager.start());

    test('cancels downloads on their way and deletes finished files', () async {
      await download([one.lesson, two.lesson]);
      await backend.finish(one.lesson.variants.high.object, one.high);
      await settle();

      await manager.delete('greek', ['greek1', 'greek2']);

      expect(backend.canceled, [two.lesson.variants.high.object]);
      expect(
        fileOf(one.lesson.variants.high, AudioVariant.high).existsSync(),
        isFalse,
      );
      expect(await repository.loadAll(), isEmpty);
    });

    test('keeps audio another lesson still uses', () async {
      // Two courses sharing one recording.
      await download([one.lesson]);
      await manager.download(
        courseId: 'ingles_completo',
        index: index,
        lessons: [one.lesson],
        quality: AudioQuality.high,
      );
      await backend.finish(one.lesson.variants.high.object, one.high);
      await settle();
      expect(await statuses('ingles_completo'), {
        'greek1': DownloadStatus.complete,
      });

      await manager.delete('greek', ['greek1']);

      expect(
        fileOf(one.lesson.variants.high, AudioVariant.high).existsSync(),
        isTrue,
      );
      expect(backend.canceled, isEmpty);
    });

    test('keeps files the player uses until its next queue', () async {
      await download([one.lesson]);
      await backend.finish(one.lesson.variants.high.object, one.high);
      await settle();
      final files = await manager.filesForQueue('greek');
      expect(files.keys, ['greek1']);

      await manager.delete('greek', ['greek1']);
      final file = fileOf(one.lesson.variants.high, AudioVariant.high);
      expect(file.existsSync(), isTrue);
      expect(await manager.filesForQueue('greek'), isEmpty);
      expect(file.existsSync(), isFalse);
    });

    test('says which deleted files the queue still plays, and deletes each '
        'once it lets go', () async {
      await download([one.lesson, two.lesson]);
      await backend.finish(one.lesson.variants.high.object, one.high);
      await backend.finish(two.lesson.variants.high.object, two.high);
      await settle();
      await manager.filesForQueue('greek');
      final released = <Set<String>>[];
      final subscription = manager.released.listen(released.add);
      addTearDown(subscription.cancel);
      final first = fileOf(one.lesson.variants.high, AudioVariant.high);
      final second = fileOf(two.lesson.variants.high, AudioVariant.high);

      await manager.delete('greek', ['greek1', 'greek2']);
      await pumpEventQueue();
      expect(released, [
        {first.path, second.path},
      ]);
      expect(first.existsSync(), isTrue);
      expect(second.existsSync(), isTrue);

      // The player streams lesson 2 now; lesson 1 still plays from its file.
      await manager.useFiles({first.path});
      expect(second.existsSync(), isFalse);
      expect(first.existsSync(), isTrue);

      await manager.useFiles({});
      expect(first.existsSync(), isFalse);
    });

    test('deletes at once a file the queue no longer plays', () async {
      await download([one.lesson]);
      await backend.finish(one.lesson.variants.high.object, one.high);
      await settle();
      await manager.filesForQueue('greek');
      await manager.useFiles({});
      final released = <Set<String>>[];
      final subscription = manager.released.listen(released.add);
      addTearDown(subscription.cancel);

      await manager.delete('greek', ['greek1']);
      await pumpEventQueue();

      expect(
        fileOf(one.lesson.variants.high, AudioVariant.high).existsSync(),
        isFalse,
      );
      expect(released, isEmpty);
    });

    test('keeps a file the player used if it is requested again', () async {
      await download([one.lesson]);
      await backend.finish(one.lesson.variants.high.object, one.high);
      await settle();
      await manager.filesForQueue('greek');
      await manager.delete('greek', ['greek1']);

      await download([one.lesson]);
      await settle();
      await manager.filesForQueue('spanish');

      expect(
        fileOf(one.lesson.variants.high, AudioVariant.high).existsSync(),
        isTrue,
      );
      expect(await statuses('greek'), {'greek1': DownloadStatus.complete});
    });

    test('deletes a whole course', () async {
      await download([one.lesson, two.lesson]);

      await manager.deleteCourse('greek');

      expect(await repository.loadAll(), isEmpty);
      expect(backend.canceled, hasLength(2));
    });
  });

  test('gives the player only verified files that exist', () async {
    await manager.start();
    await download([one.lesson, two.lesson, three.lesson]);
    await backend.finish(one.lesson.variants.high.object, one.high);
    await backend.finish(two.lesson.variants.high.object, two.high);
    await settle();
    await fileOf(two.lesson.variants.high, AudioVariant.high).delete();

    final files = await manager.filesForQueue('greek');

    expect(files.keys, ['greek1']);
    expect(files['greek1']!.readAsBytesSync(), one.high);
  });

  group('catching up at start', () {
    Future<void> putRow(Lesson lesson, DownloadStatus status, int minute) =>
        repository.putAll([
          LessonDownload(
            courseId: 'greek',
            lessonId: lesson.id,
            objectId: lesson.variants.high.object,
            variant: AudioVariant.high,
            size: lesson.variants.high.size,
            url: index.urlFor(lesson.variants.high),
            status: status,
            requestedAt: now.add(Duration(minutes: minute)),
          ),
        ]);

    test('finds files that arrived while the app was not running', () async {
      await putRow(one.lesson, DownloadStatus.downloading, 0);
      await writeFile(one.lesson.variants.high, one.high);

      await manager.start();
      await settle();

      expect(backend.enqueued, isEmpty);
      expect(await statuses('greek'), {'greek1': DownloadStatus.complete});
    });

    test('marks a damaged file that arrived meanwhile failed', () async {
      await putRow(one.lesson, DownloadStatus.downloading, 0);
      await writeFile(one.lesson.variants.high, utf8Bytes('something else'));

      await manager.start();
      await settle();

      expect(backend.enqueued, isEmpty);
      expect(await statuses('greek'), {'greek1': DownloadStatus.failed});
      expect(await failureOf('greek1'), DownloadFailure.damaged);
    });

    test('requests again what the system dropped, in order', () async {
      await putRow(two.lesson, DownloadStatus.queued, 1);
      await putRow(one.lesson, DownloadStatus.downloading, 0);
      await putRow(three.lesson, DownloadStatus.queued, 2);
      backend.active.add(three.lesson.variants.high.object);

      await manager.start();

      expect(backend.enqueued.map((r) => r.taskId), [
        one.lesson.variants.high.object,
        two.lesson.variants.high.object,
      ]);
      expect(await statuses('greek'), {
        'greek1': DownloadStatus.queued,
        'greek2': DownloadStatus.queued,
        'greek3': DownloadStatus.queued,
      });
    });

    test('downloads a finished lesson again if its file is gone', () async {
      await putRow(one.lesson, DownloadStatus.complete, 0);

      await manager.start();

      expect(backend.enqueued.single.taskId, one.lesson.variants.high.object);
    });

    test('leaves failed downloads to the listener', () async {
      await putRow(one.lesson, DownloadStatus.failed, 0);

      await manager.start();

      expect(backend.enqueued, isEmpty);
      expect(await statuses('greek'), {'greek1': DownloadStatus.failed});
    });

    test('cancels downloads nobody wants any more', () async {
      backend.active.add(one.lesson.variants.high.object);

      await manager.start();

      expect(backend.canceled, [one.lesson.variants.high.object]);
    });

    test(
      'handles updates held back while the app was not running first',
      () async {
        await putRow(one.lesson, DownloadStatus.downloading, 0);
        await putRow(two.lesson, DownloadStatus.downloading, 1);
        await writeFile(one.lesson.variants.high, one.high);
        backend.heldBack.addAll([
          DownloadStateChanged(
            one.lesson.variants.high.object,
            DownloadTaskState.complete,
          ),
          DownloadStateChanged(
            two.lesson.variants.high.object,
            DownloadTaskState.failed,
          ),
        ]);

        await manager.start();
        await settle();

        expect(backend.enqueued, isEmpty);
        expect(await statuses('greek'), {
          'greek1': DownloadStatus.complete,
          'greek2': DownloadStatus.failed,
        });
      },
    );

    test('deletes audio and abandoned partial files nobody wants', () async {
      await putRow(one.lesson, DownloadStatus.complete, 0);
      await writeFile(one.lesson.variants.high, one.high);
      final orphan = fileOf(two.lesson.variants.high, AudioVariant.high);
      await writeFile(two.lesson.variants.high, two.high);
      final metadata = store.fileFor(three.lesson.variants.high);
      await metadata.parent.create(recursive: true);
      await metadata.writeAsString('{}');
      final oldPartial = File('${metadata.path}.part')..writeAsStringSync('{');
      final newPartial = File('${orphan.path}.part')..writeAsStringSync('x');
      oldPartial.setLastModifiedSync(now.subtract(const Duration(hours: 2)));
      newPartial.setLastModifiedSync(now);

      await manager.start();

      expect(
        fileOf(one.lesson.variants.high, AudioVariant.high).existsSync(),
        isTrue,
      );
      expect(orphan.existsSync(), isFalse);
      expect(metadata.existsSync(), isTrue);
      expect(oldPartial.existsSync(), isFalse);
      expect(newPartial.existsSync(), isTrue);
    });
  });
}
