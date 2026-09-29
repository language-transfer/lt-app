import 'package:languagetransfer/src/features/catalog/domain/lesson.dart';
import 'package:languagetransfer/src/features/downloads/domain/lesson_download.dart';
import 'package:languagetransfer/src/features/settings/domain/app_settings.dart';

/// Which lessons to download, how large their downloads are, and when new
/// downloads wait for Wi-Fi. Settings that have not loaded yet count as the
/// defaults.
abstract final class DownloadRules {
  /// The lessons "Download all" still has to fetch: neither downloaded nor
  /// on their way. Starts at [continueIndex], so the lessons the listener
  /// hears next arrive first, then wraps around to the earlier ones.
  static List<Lesson> lessonsToDownload(
    List<Lesson> lessons,
    Map<String, LessonDownload> downloads,
    int? continueIndex,
  ) {
    final start = continueIndex ?? 0;
    return [
      for (final lesson in [...lessons.skip(start), ...lessons.take(start)])
        if (downloads[lesson.id]
            case null || LessonDownload(status: DownloadStatus.failed))
          lesson,
    ];
  }

  /// The size [lesson]'s download would have in the download quality of
  /// [settings], on Apple's player or not (see [LessonVariants.select]).
  static int plannedSize(
    Lesson lesson,
    AppSettings? settings, {
    required bool applePlayer,
  }) => lesson.variants
      .select(
        (settings ?? const AppSettings()).downloadQuality,
        applePlayer: applePlayer,
      )
      .pointer
      .size;

  /// True if new downloads would not start now because they wait for
  /// Wi-Fi. While the network state is unknown ([onWifi] is `null`), this
  /// assumes the best rather than warn.
  static bool waitForWifi(AppSettings? settings, {required bool? onWifi}) =>
      (settings ?? const AppSettings()).downloadOnlyOnWifi && !(onWifi ?? true);
}
