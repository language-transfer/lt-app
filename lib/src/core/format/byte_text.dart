import 'package:intl/intl.dart';
import 'package:languagetransfer/src/l10n/app_localizations.dart';

/// Formats file sizes, in decimal units like the operating systems' storage
/// settings (1 MB = 1,000,000 bytes).
abstract final class ByteText {
  /// "4.9 MB", "432 MB" or "1.2 GB". The unit and the decimal follow the
  /// rounded size, so 99.96 MB reads "100 MB" rather than "100.0 MB".
  static String size(AppLocalizations l10n, int bytes) {
    final megabytes = bytes / 1e6;
    if (megabytes.round() >= 1000) {
      return l10n.sizeGigabytes(_decimal(bytes / 1e9, 1, l10n.localeName));
    }
    final digits = (megabytes * 10).round() >= 1000 ? 0 : 1;
    return l10n.sizeMegabytes(_decimal(megabytes, digits, l10n.localeName));
  }

  static String _decimal(double value, int digits, String locale) =>
      NumberFormat.decimalPatternDigits(
        locale: locale,
        decimalDigits: digits,
      ).format(value);
}
