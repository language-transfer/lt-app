import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:languagetransfer/src/core/format/duration_text.dart';
import 'package:languagetransfer/src/l10n/app_localizations.dart';

void main() {
  final l10n = lookupAppLocalizations(const Locale('en'));

  test('clock shows minutes and seconds, and hours from one hour', () {
    expect(DurationText.clock(Duration.zero), '0:00');
    expect(DurationText.clock(const Duration(seconds: 418)), '6:58');
    expect(
      DurationText.clock(const Duration(hours: 1, minutes: 2, seconds: 3)),
      '1:02:03',
    );
    expect(DurationText.clock(const Duration(seconds: -5)), '0:00');
  });

  test('remaining rounds up, so it reaches 0:00 only at the end', () {
    const duration = Duration(seconds: 10);
    expect(
      DurationText.remaining(const Duration(milliseconds: 1200), duration),
      const Duration(seconds: 9),
    );
    expect(
      DurationText.remaining(const Duration(milliseconds: 9999), duration),
      const Duration(seconds: 1),
    );
    expect(DurationText.remaining(duration, duration), Duration.zero);
    expect(
      DurationText.remaining(const Duration(seconds: 11), duration),
      Duration.zero,
    );
  });

  test('spoken leaves out the parts that are zero', () {
    for (final (seconds, words) in [
      (418, '6 minutes 58 seconds'),
      (61, '1 minute 1 second'),
      (60, '1 minute'),
      (1, '1 second'),
      (0, '0 seconds'),
      (-3, '0 seconds'),
    ]) {
      expect(
        DurationText.spoken(l10n, Duration(seconds: seconds)),
        words,
        reason: '$seconds s',
      );
    }
  });
}
