import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:http/http.dart' as http;
import 'package:languagetransfer/src/core/storage/database.dart';
import 'package:languagetransfer/src/core/storage/object_store.dart';
import 'package:languagetransfer/src/features/downloads/data/download_manager.dart';
import 'package:languagetransfer/src/features/player/data/artwork_files.dart';
import 'package:languagetransfer/src/features/player/data/lesson_audio_handler.dart';

/// Infrastructure created once at startup (`lib/main.dart`) and injected
/// with `ProviderScope.overrides`, so tests can replace any of it.

final databaseProvider = Provider<AppDatabase>(
  (ref) => throw UnimplementedError('Provided in main()'),
);

final objectStoreProvider = Provider<ObjectStore>(
  (ref) => throw UnimplementedError('Provided in main()'),
);

final httpClientProvider = Provider<http.Client>(
  (ref) => throw UnimplementedError('Provided in main()'),
);

/// Identifies the app to Language Transfer's servers, such as
/// `LanguageTransfer-Flutter/0.1.0 (ios)`.
final userAgentProvider = Provider<String>(
  (ref) => throw UnimplementedError('Provided in main()'),
);

final audioHandlerProvider = Provider<LessonAudioHandler>(
  (ref) => throw UnimplementedError('Provided in main()'),
);

final downloadManagerProvider = Provider<DownloadManager>(
  (ref) => throw UnimplementedError('Provided in main()'),
);

final artworkFilesProvider = Provider<ArtworkFiles>(
  (ref) => throw UnimplementedError('Provided in main()'),
);
