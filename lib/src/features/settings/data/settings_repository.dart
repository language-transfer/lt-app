import 'package:languagetransfer/src/core/storage/database.dart';
import 'package:languagetransfer/src/features/catalog/domain/lesson.dart';
import 'package:languagetransfer/src/features/settings/domain/app_settings.dart';

/// Stores [AppSettings] as key-value rows.
///
/// The first four keys are named like the Expo app's preferences (upstream
/// `src/storage/persistence.ts`), but nothing is read from that app's
/// storage. Values that cannot be read fall back to the default instead of
/// failing.
class SettingsRepository {
  SettingsRepository({required this._database});

  final AppDatabase _database;

  static const _streamQuality = 'stream-quality';
  static const _downloadQuality = 'download-quality';
  static const _downloadOnlyOnWifi = 'download-only-on-wifi';
  static const _autoDeleteFinished = 'auto-delete-finished';
  static const _autoplay = 'autoplay';
  static const _playbackSpeed = 'playback-speed';

  Stream<AppSettings> watch() =>
      _database.select(_database.settingsTable).watch().map(_fromRows);

  Future<AppSettings> load() async =>
      _fromRows(await _database.select(_database.settingsTable).get());

  Future<void> _save(AppSettings settings) => _database.batch((batch) {
    batch.insertAllOnConflictUpdate(_database.settingsTable, [
      _row(_streamQuality, settings.streamQuality.name),
      _row(_downloadQuality, settings.downloadQuality.name),
      _row(_downloadOnlyOnWifi, '${settings.downloadOnlyOnWifi}'),
      _row(_autoDeleteFinished, '${settings.autoDeleteFinished}'),
      _row(_autoplay, '${settings.autoplay}'),
      _row(_playbackSpeed, '${settings.playbackSpeed}'),
    ]);
  });

  /// Applies [change] to the stored settings, in one transaction so that
  /// changes made at the same time are not lost.
  Future<AppSettings> update(AppSettings Function(AppSettings) change) {
    return _database.transaction(() async {
      final updated = change(await load());
      await _save(updated);
      return updated;
    });
  }

  static SettingsTableCompanion _row(String key, String value) =>
      SettingsTableCompanion.insert(key: key, value: value);

  static AppSettings _fromRows(List<SettingRow> rows) {
    final values = {for (final row in rows) row.key: row.value};
    const defaults = AppSettings();
    return AppSettings(
      streamQuality: _quality(values[_streamQuality], defaults.streamQuality),
      downloadQuality: _quality(
        values[_downloadQuality],
        defaults.downloadQuality,
      ),
      downloadOnlyOnWifi: _bool(
        values[_downloadOnlyOnWifi],
        defaults.downloadOnlyOnWifi,
      ),
      autoDeleteFinished: _bool(
        values[_autoDeleteFinished],
        defaults.autoDeleteFinished,
      ),
      autoplay: _bool(values[_autoplay], defaults.autoplay),
      playbackSpeed: _speed(values[_playbackSpeed], defaults.playbackSpeed),
    );
  }

  static AudioQuality _quality(String? value, AudioQuality fallback) =>
      AudioQuality.values.asNameMap()[value] ?? fallback;

  static bool _bool(String? value, bool fallback) => switch (value) {
    'true' => true,
    'false' => false,
    _ => fallback,
  };

  static double _speed(String? value, double fallback) {
    final parsed = value == null ? null : double.tryParse(value);
    return AppSettings.speeds.contains(parsed) ? parsed! : fallback;
  }
}
