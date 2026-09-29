import 'package:languagetransfer/src/l10n/app_localizations.dart';

/// Formats durations for display and for screen readers.
abstract final class DurationText {
  /// "6:58", or "1:02:03" from one hour.
  static String clock(Duration duration) {
    final total = duration.isNegative ? 0 : duration.inSeconds;
    final hours = total ~/ 3600;
    final minutes = (total % 3600) ~/ 60;
    final seconds = (total % 60).toString().padLeft(2, '0');
    return hours > 0
        ? '$hours:${minutes.toString().padLeft(2, '0')}:$seconds'
        : '$minutes:$seconds';
  }

  /// Time left, rounded up, so a playing lesson never shows "0:00" before
  /// it ends.
  static Duration remaining(Duration position, Duration duration) {
    final left = duration - position;
    if (left <= Duration.zero) return Duration.zero;
    return Duration(seconds: (left.inMilliseconds / 1000).ceil());
  }

  /// "6 minutes 58 seconds", so screen readers do not read "6:58" as a time
  /// of day.
  static String spoken(AppLocalizations l10n, Duration duration) {
    final total = duration.isNegative ? 0 : duration.inSeconds;
    if (total == 0) return l10n.durationZero;
    return l10n
        .durationWords(total ~/ 60, total % 60)
        .replaceAll(RegExp(r'\s+'), ' ')
        .trim();
  }
}
