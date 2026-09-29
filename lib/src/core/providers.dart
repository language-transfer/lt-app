import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:http/http.dart' as http;
import 'package:languagetransfer/src/core/storage/database.dart';
import 'package:languagetransfer/src/core/storage/object_store.dart';
import 'package:package_info_plus/package_info_plus.dart';

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

/// The app's name, version and build, read once at startup.
final packageInfoProvider = Provider<PackageInfo>(
  (ref) => throw UnimplementedError('Provided in main()'),
);

/// True on iOS and macOS, whose player needs other lesson files than
/// Android's (`LessonVariants.select`).
final applePlayerProvider = Provider<bool>(
  (ref) => throw UnimplementedError('Provided in main()'),
);
