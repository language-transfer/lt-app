import 'dart:io';

import 'package:audio_service/audio_service.dart';
import 'package:drift_flutter/drift_flutter.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:http/http.dart' as http;
import 'package:just_audio/just_audio.dart';
import 'package:languagetransfer/src/app.dart';
import 'package:languagetransfer/src/core/providers.dart';
import 'package:languagetransfer/src/core/routing/app_router.dart';
import 'package:languagetransfer/src/core/routing/app_routes.dart';
import 'package:languagetransfer/src/core/storage/database.dart';
import 'package:languagetransfer/src/core/storage/object_store.dart';
import 'package:languagetransfer/src/features/catalog/domain/course.dart';
import 'package:languagetransfer/src/features/downloads/application/download_providers.dart';
import 'package:languagetransfer/src/features/downloads/data/background_downloader_backend.dart';
import 'package:languagetransfer/src/features/downloads/data/download_manager.dart';
import 'package:languagetransfer/src/features/downloads/data/download_repository.dart';
import 'package:languagetransfer/src/features/player/application/player_providers.dart';
import 'package:languagetransfer/src/features/player/data/artwork_files.dart';
import 'package:languagetransfer/src/features/player/data/lesson_audio_handler.dart';
import 'package:languagetransfer/src/features/player/data/lesson_sources.dart';
import 'package:languagetransfer/src/features/progress/application/lesson_completion.dart';
import 'package:languagetransfer/src/features/progress/application/progress_providers.dart';
import 'package:languagetransfer/src/features/progress/data/progress_repository.dart';
import 'package:languagetransfer/src/features/settings/application/settings_providers.dart';
import 'package:languagetransfer/src/features/settings/data/settings_repository.dart';
import 'package:languagetransfer/src/l10n/app_localizations.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  LicenseRegistry.addLicense(_bundledFontLicenses);

  final (info, support, temporary) = await (
    PackageInfo.fromPlatform(),
    getApplicationSupportDirectory(),
    getTemporaryDirectory(),
  ).wait;
  // App state in Application Support rather than Documents, which iOS can
  // show to the user.
  final database = AppDatabase(
    driftDatabase(
      name: 'languagetransfer',
      native: const DriftNativeOptions(
        databaseDirectory: getApplicationSupportDirectory,
      ),
    ),
  );
  final objectStore = ObjectStore(Directory(p.join(support.path, 'objects')));
  // Covers can be written again at any time, so they go to the cache.
  final artwork = ArtworkFiles(Directory(p.join(temporary.path, 'artwork')));
  final client = http.Client();
  final userAgent =
      'LanguageTransfer-Flutter/${info.version} (${Platform.operatingSystem})';
  final applePlayer = Platform.isIOS || Platform.isMacOS;
  final progress = ProgressRepository(database: database);
  final settings = SettingsRepository(database: database);
  final downloadRepository = DownloadRepository(database: database);

  final downloads = DownloadManager(
    backend: BackgroundDownloaderBackend(userAgent: userAgent),
    repository: downloadRepository,
    store: objectStore,
    settings: settings,
    applePlayer: applePlayer,
  );
  // Not awaited: the first frame need not wait for the downloader. Failures
  // are logged, and streaming works without downloads.
  downloads.start().ignore();
  final completion = LessonCompletion(
    progress: progress,
    settings: settings,
    deleteDownload: (courseId, lessonId) =>
        downloads.delete(courseId, [lessonId]),
  );

  Future<LessonAudioHandler> startPlayer() async {
    final handler = await AudioService.init(
      builder: () => LessonAudioHandler(
        player: AudioPlayer.new,
        progress: progress,
        playedThrough: completion.playedThrough,
        settings: settings,
        sources: LessonSources(
          applePlayer: applePlayer,
          client: client,
          downloads: downloads,
        ),
      ),
      config: AudioServiceConfig(
        androidNotificationChannelId: 'org.languagetransfer.playback',
        // Shown in the system's notification settings, before any widget
        // exists, so the strings are looked up for the system's languages.
        androidNotificationChannelName: lookupAppLocalizations(
          basicLocaleListResolution(
            PlatformDispatcher.instance.locales,
            AppLocalizations.supportedLocales,
          ),
        ).playbackChannelName,
        // White line art of the logo (res/drawable-*/ic_stat_lt.png).
        androidNotificationIcon: 'drawable/ic_stat_lt',
      ),
    );
    await handler.init();
    return handler;
  }

  // Opens the course listened to last, with the course list beneath it.
  final (handler, recent) = await (
    startPlayer(),
    progress.mostRecentCourseId(),
  ).wait;
  final recentCourse = recent == null ? null : Courses.resolve(recent);

  runApp(
    ProviderScope(
      // Riverpod 3 retries failed providers automatically. Here every retry
      // is a network request, so the listener decides when to try again.
      retry: (_, _) => null,
      overrides: [
        databaseProvider.overrideWithValue(database),
        objectStoreProvider.overrideWithValue(objectStore),
        httpClientProvider.overrideWithValue(client),
        userAgentProvider.overrideWithValue(userAgent),
        packageInfoProvider.overrideWithValue(info),
        applePlayerProvider.overrideWithValue(applePlayer),
        audioHandlerProvider.overrideWithValue(handler),
        downloadManagerProvider.overrideWithValue(downloads),
        artworkFilesProvider.overrideWithValue(artwork),
        progressRepositoryProvider.overrideWithValue(progress),
        settingsRepositoryProvider.overrideWithValue(settings),
        downloadRepositoryProvider.overrideWithValue(downloadRepository),
        lessonCompletionProvider.overrideWithValue(completion),
        initialLocationProvider.overrideWithValue(
          recentCourse == null
              ? AppRoutes.courses
              : AppRoutes.course(recentCourse.id),
        ),
      ],
      child: const LanguageTransferApp(),
    ),
  );
}

/// Flutter lists package licenses automatically, but not bundled fonts.
Stream<LicenseEntry> _bundledFontLicenses() async* {
  for (final (name, file) in const [
    ('Ysabeau Office', 'assets/fonts/YsabeauOffice-OFL.txt'),
    ('Noto Naskh Arabic', 'assets/fonts/NotoNaskhArabic-OFL.txt'),
  ]) {
    yield LicenseEntryWithLineBreaks([name], await rootBundle.loadString(file));
  }
}
