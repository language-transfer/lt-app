import 'dart:io';

import 'package:audio_service/audio_service.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:drift/drift.dart' show driftRuntimeOptions;
import 'package:drift/native.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_riverpod/misc.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:languagetransfer/src/app.dart';
import 'package:languagetransfer/src/core/network/connectivity.dart';
import 'package:languagetransfer/src/core/providers.dart';
import 'package:languagetransfer/src/core/routing/app_router.dart';
import 'package:languagetransfer/src/core/routing/app_routes.dart';
import 'package:languagetransfer/src/core/storage/database.dart';
import 'package:languagetransfer/src/core/storage/object_store.dart';
import 'package:languagetransfer/src/features/about/presentation/about_screen.dart';
import 'package:languagetransfer/src/features/catalog/application/catalog_providers.dart';
import 'package:languagetransfer/src/features/catalog/data/course_index_repository.dart';
import 'package:languagetransfer/src/features/catalog/domain/course_index.dart';
import 'package:languagetransfer/src/features/catalog/domain/course_metadata.dart';
import 'package:languagetransfer/src/features/catalog/domain/file_pointer.dart';
import 'package:languagetransfer/src/features/catalog/domain/lesson.dart';
import 'package:languagetransfer/src/features/downloads/application/download_providers.dart';
import 'package:languagetransfer/src/features/downloads/data/download_manager.dart';
import 'package:languagetransfer/src/features/downloads/data/download_repository.dart';
import 'package:languagetransfer/src/features/downloads/domain/lesson_download.dart';
import 'package:languagetransfer/src/features/progress/application/lesson_completion.dart';
import 'package:languagetransfer/src/features/progress/application/progress_providers.dart';
import 'package:languagetransfer/src/features/progress/data/progress_repository.dart';
import 'package:languagetransfer/src/features/settings/application/settings_providers.dart';
import 'package:languagetransfer/src/features/settings/data/settings_repository.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:path/path.dart' as p;

import 'app_fonts.dart' show loadAppFonts;
import 'fake_artwork_files.dart';
import 'fake_audio_handler.dart';
import 'fake_download_backend.dart';
import 'fixtures.dart';

/// The whole app for widget tests: the real screens, router and theme, with
/// the course index from the fixtures, generated lessons, an in-memory
/// database and fakes for playback, downloads and the network.
class TestApp {
  TestApp._(this.root, this.database)
    : progress = ProgressRepository(database: database),
      settings = SettingsRepository(database: database),
      downloadRepository = DownloadRepository(database: database) {
    downloads = DownloadManager(
      backend: backend,
      repository: downloadRepository,
      store: ObjectStore(Directory(p.join(root.path, 'objects'))),
      settings: settings,
      applePlayer: false,
    );
    completion = LessonCompletion(
      progress: progress,
      settings: settings,
      deleteDownload: (courseId, lessonId) =>
          downloads.delete(courseId, [lessonId]),
    );
  }

  /// Call [loadAppFonts] in `setUpAll` first: inside `testWidgets` the
  /// engine's font loading never completes.
  ///
  /// Create it inside the test body, not in `setUp`: work queued by futures
  /// created outside the widget test's fake time never runs in it, which
  /// silently stops downloads.
  factory TestApp.create() {
    // Every test opens its own in-memory database and closes it at the end,
    // which drift would otherwise warn about as if they were shared.
    driftRuntimeOptions.dontWarnAboutMultipleDatabases = true;
    return TestApp._(
      Directory.systemTemp.createTempSync('app_harness'),
      AppDatabase(NativeDatabase.memory()),
    );
  }

  final Directory root;
  final AppDatabase database;
  final ProgressRepository progress;
  final SettingsRepository settings;
  final DownloadRepository downloadRepository;
  final handler = FakeLessonAudioHandler();
  final backend = FakeDownloadBackend();
  late final DownloadManager downloads;
  late final LessonCompletion completion;
  final index = CourseIndex.parse(fixture('all_courses.json'));

  /// The network connections the system reports.
  List<ConnectivityResult> connectivity = const [ConnectivityResult.wifi];

  /// If set, loading the course index fails with it.
  Object? indexError;

  /// Lessons of [courseId]: as many as the index announces, with durations
  /// and sizes in the range of the real ones.
  CourseMetadata metadataFor(String courseId) {
    final count = index.entryFor(courseId)!.lessonCount;
    return CourseMetadata(
      lessons: [
        for (var i = 1; i <= count; i++)
          Lesson(
            id: '$courseId$i',
            title: 'Lesson $i',
            duration: Duration(seconds: 300 + (i * 37) % 400),
            variants: LessonVariants(
              low: _pointer(courseId, i, 0, 8000),
              high: _pointer(courseId, i, 1, 16000),
            ),
          ),
      ],
    );
  }

  FilePointer _pointer(String courseId, int lesson, int variant, int rate) =>
      FilePointer(
        object: fakeObjectId(
          courseId.hashCode.abs() * 1000 + lesson * 2 + variant,
        ),
        size: (300 + (lesson * 37) % 400) * rate,
      );

  List<Override> _overrides(String location) => [
    databaseProvider.overrideWithValue(database),
    objectStoreProvider.overrideWithValue(
      ObjectStore(Directory(p.join(root.path, 'objects'))),
    ),
    httpClientProvider.overrideWithValue(
      MockClient((request) async => http.Response('offline in tests', 503)),
    ),
    userAgentProvider.overrideWithValue('LanguageTransfer-Flutter/test'),
    audioHandlerProvider.overrideWithValue(handler),
    downloadManagerProvider.overrideWithValue(downloads),
    artworkFilesProvider.overrideWithValue(FakeArtworkFiles()),
    progressRepositoryProvider.overrideWithValue(progress),
    settingsRepositoryProvider.overrideWithValue(settings),
    downloadRepositoryProvider.overrideWithValue(downloadRepository),
    lessonCompletionProvider.overrideWithValue(completion),
    initialLocationProvider.overrideWithValue(location),
    courseIndexProvider.overrideWith(
      (ref) => indexError == null
          ? Stream.value(LoadedCourseIndex(index, DateTime(2026, 9, 29)))
          : Stream.error(indexError!),
    ),
    courseMetadataProvider.overrideWith(
      (ref, courseId) => metadataFor(courseId),
    ),
    connectivityProvider.overrideWith((ref) => Stream.value(connectivity)),
    packageInfoProvider.overrideWith(
      (ref) => PackageInfo(
        appName: 'Language Transfer',
        packageName: 'org.languagetransfer.dev',
        version: '0.1.0',
        buildNumber: '1',
      ),
    ),
  ];

  /// Someone in the middle of Complete Greek: lessons 1 and 2 finished,
  /// lesson 3 at 2:00 and, if [playing], playing; a download in every state
  /// (lesson 1 complete, 2 downloading, 3 queued, 4 failed).
  Future<void> seedListening(WidgetTester tester, {bool playing = true}) async {
    final lessons = metadataFor('greek').lessons;
    await tester.runAsync(() async {
      // Distinct times, as when someone really listens.
      var now = DateTime(2026, 9, 28, 20);
      final listening = ProgressRepository(
        database: database,
        now: () => now = now.add(const Duration(minutes: 10)),
      );
      await listening.markPlayedThrough('greek', 'greek1');
      await listening.markPlayedThrough('greek', 'greek2');
      await listening.savePosition(
        'greek',
        'greek3',
        const Duration(minutes: 2),
      );
      await downloadRepository.putAll([
        for (final (i, status) in [
          DownloadStatus.complete,
          DownloadStatus.downloading,
          DownloadStatus.queued,
          DownloadStatus.failed,
        ].indexed)
          LessonDownload(
            courseId: 'greek',
            lessonId: lessons[i].id,
            objectId: lessons[i].variants.high.object,
            variant: AudioVariant.high,
            size: lessons[i].variants.high.size,
            url: index.urlFor(lessons[i].variants.high),
            status: status,
            requestedAt: DateTime(2026, 9, 29),
          ),
      ]);
    });
    if (!playing) return;
    final items = [
      for (final lesson in lessons)
        MediaItem(
          id: 'greek/${lesson.id}',
          title: lesson.title,
          artist: 'Complete Greek',
          album: 'Language Transfer',
          duration: lesson.duration,
          extras: {'courseId': 'greek', 'lessonId': lesson.id},
        ),
    ];
    handler.show(
      item: items[2],
      queueItems: items,
      playing: true,
      position: const Duration(minutes: 2),
    );
  }

  /// Shows the app at [location] on a screen of [size] (logical pixels),
  /// with the system text size [textScale] and [brightness].
  Future<void> pump(
    WidgetTester tester, {
    String location = AppRoutes.courses,
    Size size = const Size(411, 891),
    double textScale = 1,
    Brightness brightness = Brightness.light,
  }) async {
    tester.view
      ..devicePixelRatio = 2
      ..physicalSize = size * 2;
    tester.platformDispatcher
      ..textScaleFactorTestValue = textScale
      ..platformBrightnessTestValue = brightness;
    addTearDown(() {
      tester.view.reset();
      tester.platformDispatcher.clearAllTestValues();
    });
    await tester.pumpWidget(
      ProviderScope(
        retry: (_, _) => null,
        overrides: _overrides(location),
        child: const LanguageTransferApp(),
      ),
    );
    await tester.pumpAndSettle();
  }

  /// Unmounts the app and releases everything [TestApp.create] set up.
  Future<void> dispose(WidgetTester tester) async {
    await tester.pumpWidget(const SizedBox.shrink());
    // Lets drift's zero-delay timers run, which close the queries the
    // screens watched; a pump without a duration does not advance time.
    await tester.pump(Duration.zero);
    await downloads.dispose();
    await backend.close();
    await handler.dispose();
    await database.close();
    root.deleteSync(recursive: true);
  }
}
