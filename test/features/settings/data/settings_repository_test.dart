import 'package:drift/native.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:languagetransfer/src/core/storage/database.dart';
import 'package:languagetransfer/src/features/catalog/domain/lesson.dart';
import 'package:languagetransfer/src/features/settings/data/settings_repository.dart';
import 'package:languagetransfer/src/features/settings/domain/app_settings.dart';

void main() {
  late AppDatabase database;
  late SettingsRepository repo;

  setUp(() {
    database = AppDatabase(NativeDatabase.memory());
    repo = SettingsRepository(database: database);
  });

  tearDown(() => database.close());

  test('defaults match the Expo app', () async {
    final settings = await repo.load();
    expect(settings.streamQuality, AudioQuality.low);
    expect(settings.downloadQuality, AudioQuality.high);
    expect(settings.downloadOnlyOnWifi, isTrue);
    expect(settings.autoDeleteFinished, isFalse);
    expect(settings.autoplay, isTrue);
    expect(settings.playbackSpeed, 1);
  });

  test('saves and loads every value', () async {
    const changed = AppSettings(
      streamQuality: AudioQuality.high,
      downloadQuality: AudioQuality.low,
      downloadOnlyOnWifi: false,
      autoDeleteFinished: true,
      autoplay: false,
      playbackSpeed: 1.25,
    );
    await repo.update((_) => changed);
    expect(await repo.load(), changed);
  });

  test('update applies a change to the stored values', () async {
    await repo.update((s) => s.copyWith(playbackSpeed: 1.5));
    final updated = await repo.update((s) => s.copyWith(autoplay: false));

    expect(updated.playbackSpeed, 1.5);
    expect(updated.autoplay, isFalse);
    expect(await repo.load(), updated);
  });

  test('unreadable values fall back to the defaults', () async {
    await database.batch((batch) {
      batch.insertAll(database.settingsTable, [
        SettingsTableCompanion.insert(key: 'stream-quality', value: 'ultra'),
        SettingsTableCompanion.insert(key: 'autoplay', value: 'yes'),
        SettingsTableCompanion.insert(key: 'playback-speed', value: '9'),
      ]);
    });

    expect(await repo.load(), const AppSettings());
  });

  test('watch emits changes', () async {
    final speeds = repo.watch().map((s) => s.playbackSpeed);
    final expectation = expectLater(speeds, emitsInOrder([1.0, 2.0]));

    await pumpEventQueue();
    await repo.update((s) => s.copyWith(playbackSpeed: 2));

    await expectation;
  });
}
