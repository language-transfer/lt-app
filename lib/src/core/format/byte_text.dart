import 'package:intl/intl.dart';
import 'package:languagetransfer/src/l10n/app_localizations.dart';

/// Formats file sizes, in decimal units like the operating systems' storage
/// settings (1 MB = 1,000,000 bytes).
abstract final class ByteText {
  /// "4.9 MB", "432 MB" or "1.2 GB".
  static String size(AppLocalizations l10n, int bytes) {
    if (bytes >= 1000 * 1000 * 1000) {
      return l10n.sizeGigabytes(_decimal(bytes / 1e9, 1, l10n.localeName));
    }
    final megabytes = bytes / 1e6;
    return l10n.sizeMegabytes(
      _decimal(megabytes, megabytes < 100 ? 1 : 0, l10n.localeName),
    );
  }

  static String _decimal(double value, int digits, String locale) =>
      NumberFormat.decimalPatternDigits(
        locale: locale,
        decimalDigits: digits,
      ).format(value);
}
