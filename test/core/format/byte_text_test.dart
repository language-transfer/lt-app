import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:languagetransfer/src/core/format/byte_text.dart';
import 'package:languagetransfer/src/l10n/app_localizations.dart';

void main() {
  final l10n = lookupAppLocalizations(const Locale('en'));

  test('shows decimal units, with a decimal only for small sizes', () {
    for (final (bytes, text) in [
      (4900000, '4.9 MB'),
      (99940000, '99.9 MB'),
      (432000000, '432 MB'),
      (1200000000, '1.2 GB'),
      (0, '0.0 MB'),
    ]) {
      expect(ByteText.size(l10n, bytes), text, reason: '$bytes bytes');
    }
  });

  test('picks the unit and decimals after rounding', () {
    expect(ByteText.size(l10n, 99960000), '100 MB');
    expect(ByteText.size(l10n, 999600000), '1.0 GB');
    expect(ByteText.size(l10n, 999400000), '999 MB');
  });
}
