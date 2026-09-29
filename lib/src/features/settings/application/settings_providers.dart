import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:languagetransfer/src/core/providers.dart';
import 'package:languagetransfer/src/features/settings/data/settings_repository.dart';
import 'package:languagetransfer/src/features/settings/domain/app_settings.dart';

final settingsRepositoryProvider = Provider<SettingsRepository>(
  (ref) => SettingsRepository(database: ref.watch(databaseProvider)),
);

final settingsProvider = StreamProvider<AppSettings>(
  (ref) => ref.watch(settingsRepositoryProvider).watch(),
);
