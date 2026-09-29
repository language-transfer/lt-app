// Downloads real lessons with the platform's background downloads
// (background_downloader) and checks that they arrive verified in the object
// store, can be deleted and cancelled, and play from the device. Run on a
// simulator, emulator or device:
//   fvm flutter test integration_test/downloads_test.dart -d <device>
//
// Real downloads take as long as the network does, so tests may run for
// minutes; the default 30 s limit would cut them off before [eventually]
// gives up.
@Timeout(Duration(minutes: 5))
library;

import 'dart:convert';
import 'dart:io';

import 'package:audio_service/audio_service.dart';
import 'package:background_downloader/background_downloader.dart';
import 'package:drift/native.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:integration_test/integration_test.dart';
import 'package:just_audio/just_audio.dart';
import 'package:languagetransfer/src/core/storage/database.dart';
import 'package:languagetransfer/src/core/storage/integrity.dart';
import 'package:languagetransfer/src/core/storage/object_store.dart';
import 'package:languagetransfer/src/features/catalog/data/catalog_api.dart';
import 'package:languagetransfer/src/features/catalog/domain/course_index.dart';
import 'package:languagetransfer/src/features/catalog/domain/course_metadata.dart';
import 'package:languagetransfer/src/features/catalog/domain/lesson.dart';
import 'package:languagetransfer/src/features/downloads/data/background_downloader_backend.dart';
import 'package:languagetransfer/src/features/downloads/data/download_manager.dart';
import 'package:languagetransfer/src/features/downloads/data/download_repository.dart';
import 'package:languagetransfer/src/features/downloads/domain/lesson_download.dart';
import 'package:languagetransfer/src/features/player/data/lesson_sources.dart';
import 'package:languagetransfer/src/features/settings/data/settings_repository.dart';
import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';

const userAgent = 'LanguageTransfer-Flutter/test';

/// Waits until [condition] holds, checking every 250 ms.
Future<void> eventually(
  Future<bool> Function() condition, {
  required String reason,
  Duration timeout = const Duration(minutes: 2),
}) async {
  final deadline = DateTime.now().add(timeout);
  while (!await condition()) {
    if (DateTime.now().isAfter(deadline)) fail('Timed out waiting: $reason');
    await Future<void>.delayed(const Duration(milliseconds: 250));
  }
}

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  final client = http.Client();
  final applePlayer = defaultTargetPlatform == TargetPlatform.iOS;
  late CourseIndex index;
  late List<Lesson> lessons;

  late Directory root;
  late ObjectStore store;
  late AppDatabase database;
  late DownloadRepository repository;
  late DownloadManager manager;

  setUpAll(() async {
    final api = CatalogApi(client, userAgent: userAgent);
    index = CourseIndex.parse(await api.fetchIndexJson());
    final entry = index.entryFor('spanish')!;
    final bytes = await api.fetchObject(index, entry.metadata);
    lessons = CourseMetadata.parse(utf8.decode(bytes)).lessons.sublist(0, 3);
  });

  tearDownAll(client.close);

  setUp(() async {
    // Where the app keeps its objects, so paths resolve as in production.
    final support = await getApplicationSupportDirectory();
    root = Directory(p.join(support.path, 'integration-test-objects'));
    if (root.existsSync()) root.deleteSync(recursive: true);
    store = ObjectStore(root);
    database = AppDatabase(NativeDatabase.memory());
    repository = DownloadRepository(database: database);
    manager = DownloadManager(
      backend: BackgroundDownloaderBackend(userAgent: userAgent),
      repository: repository,
      store: store,
      settings: SettingsRepository(database: database),
      applePlayer: applePlayer,
    );
    await manager.start();
  });

  tearDown(() async {
    await manager.dispose();
    // The downloader's update stream can only be listened to once.
    await FileDownloader().resetUpdates();
    await database.close();
    if (root.existsSync()) root.deleteSync(recursive: true);
  });

  Future<DownloadStatus?> statusOf(Lesson lesson) async =>
      (await repository.loadCourse('spanish'))[lesson.id]?.status;

  Future<void> download(List<Lesson> lessons) => manager.download(
    courseId: 'spanish',
    index: index,
    lessons: lessons,
    quality: AudioQuality.low,
  );

  test('downloads lessons verified into the object store', () async {
    await download(lessons.sublist(0, 2));

    for (final lesson in lessons.sublist(0, 2)) {
      await eventually(
        () async => await statusOf(lesson) == DownloadStatus.complete,
        reason: '${lesson.id} complete (now ${await statusOf(lesson)})',
      );
      final pointer = lesson.variants.low;
      final file = store.fileFor(pointer, extension: 'm4a');
      expect(file.lengthSync(), pointer.size);
      await verifyFile(pointer, file);
    }
    final files = await manager.filesForQueue('spanish');
    expect(files.keys, unorderedEquals([lessons[0].id, lessons[1].id]));
  });

  test('deletes a download and its file', () async {
    await download([lessons[0]]);
    await eventually(
      () async => await statusOf(lessons[0]) == DownloadStatus.complete,
      reason: 'download complete',
    );
    final file = store.fileFor(lessons[0].variants.low, extension: 'm4a');
    expect(file.existsSync(), isTrue);

    await manager.delete('spanish', [lessons[0].id]);

    expect(await statusOf(lessons[0]), isNull);
    expect(file.existsSync(), isFalse);
  });

  test('cancels a download on its way', () async {
    await download([lessons[2]]);
    await manager.delete('spanish', [lessons[2].id]);

    // Long enough for the lesson to have arrived had it not been cancelled.
    await Future<void>.delayed(const Duration(seconds: 15));
    expect(await statusOf(lessons[2]), isNull);
    expect(
      store.fileFor(lessons[2].variants.low, extension: 'm4a').existsSync(),
      isFalse,
    );
    expect(
      await FileDownloader().allTaskIds(
        group: BackgroundDownloaderBackend.group,
      ),
      isNot(contains(lessons[2].variants.low.object)),
    );
  });

  test('plays a downloaded lesson from its file', () async {
    await download([lessons[0]]);
    await eventually(
      () async => await statusOf(lessons[0]) == DownloadStatus.complete,
      reason: 'download complete',
    );

    final sources =
        await LessonSources(
          applePlayer: applePlayer,
          client: client,
          downloads: manager,
        ).forQueue(
          courseId: 'spanish',
          index: index,
          lessons: lessons,
          streamQuality: AudioQuality.low,
          tags: [
            for (final lesson in lessons) MediaItem(id: lesson.id, title: ''),
          ],
        );
    bool isFile(AudioSource source) =>
        source is UriAudioSource && source.uri.scheme == 'file';
    expect(isFile(sources[0]), isTrue);
    expect(isFile(sources[1]), isFalse, reason: 'not downloaded, streams');

    final player = AudioPlayer();
    addTearDown(player.dispose);
    final duration = await player.setAudioSource(sources[0]);
    expect(duration, isNotNull);
    await player.play().timeout(const Duration(seconds: 3), onTimeout: () {});
    expect(player.position, greaterThan(Duration.zero));
  });
}
