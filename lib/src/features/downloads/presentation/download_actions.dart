import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:languagetransfer/src/core/format/byte_text.dart';
import 'package:languagetransfer/src/core/logging.dart';
import 'package:languagetransfer/src/core/network/connectivity.dart';
import 'package:languagetransfer/src/core/providers.dart';
import 'package:languagetransfer/src/core/widgets/confirm_dialog.dart';
import 'package:languagetransfer/src/features/catalog/domain/lesson.dart';
import 'package:languagetransfer/src/features/downloads/application/download_controller.dart';
import 'package:languagetransfer/src/features/downloads/domain/lesson_download.dart';
import 'package:languagetransfer/src/features/settings/application/settings_providers.dart';
import 'package:languagetransfer/src/features/settings/domain/app_settings.dart';
import 'package:languagetransfer/src/l10n/app_localizations.dart';

/// The size of [lesson]'s download: of the existing [download], or what it
/// would be in the download quality setting. For build methods.
int downloadSize(WidgetRef ref, Lesson lesson, LessonDownload? download) =>
    download?.size ??
    _plannedSize(
      ref.watch(settingsProvider).value,
      ref.watch(downloadManagerProvider).applePlayer,
      lesson,
    );

int _plannedSize(AppSettings? settings, bool applePlayer, Lesson lesson) =>
    lesson.variants
        .select(
          (settings ?? const AppSettings()).downloadQuality,
          applePlayer: applePlayer,
        )
        .pointer
        .size;

/// True if new downloads would not start now because they wait for Wi-Fi.
/// For build methods; rebuilds when either changes.
bool downloadsWaitForWifi(WidgetRef ref) =>
    _waitForWifi(ref.watch(settingsProvider).value, ref.watch(onWifiProvider));

bool _waitForWifi(AppSettings? settings, bool? onWifi) =>
    (settings ?? const AppSettings()).downloadOnlyOnWifi &&
    // While the network state is unknown, assume the best rather than warn.
    !(onWifi ?? true);

/// Starts downloading one lesson, and says so if it has to wait for Wi-Fi,
/// since otherwise nothing seems to happen.
void startLessonDownload(
  BuildContext context,
  WidgetRef ref,
  String courseId,
  Lesson lesson,
) {
  final waits = _waitForWifi(
    ref.read(settingsProvider).value,
    ref.read(onWifiProvider),
  );
  runDownloadAction(
    ref.read(downloadControllerProvider).download(courseId, [lesson]),
  );
  if (waits) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(AppLocalizations.of(context).downloadStartsOnWifi),
      ),
    );
  }
}

/// Runs a download action started from the UI. Its outcome shows in the
/// download state, so a failure only needs logging.
void runDownloadAction(Future<void> action) {
  unawaited(
    action.catchError((Object error, StackTrace stackTrace) {
      logRecoverable('Download action failed', error, stackTrace);
    }),
  );
}

/// The lessons "Download all" still has to fetch: neither downloaded nor on
/// their way. Starts at [continueIndex], so the lessons the listener hears
/// next arrive first, then wraps around to the earlier ones.
List<Lesson> lessonsToDownload(
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

/// Asks before downloading [lessons] (upstream "Download All" confirms
/// with the total size too), then starts.
Future<void> confirmDownloadAll(
  BuildContext context,
  WidgetRef ref, {
  required String courseId,
  required List<Lesson> lessons,
}) async {
  final l10n = AppLocalizations.of(context);
  final settings = ref.read(settingsProvider).value;
  final applePlayer = ref.read(downloadManagerProvider).applePlayer;
  final bytes = lessons.fold(
    0,
    (sum, lesson) => sum + _plannedSize(settings, applePlayer, lesson),
  );
  final waits = _waitForWifi(settings, ref.read(onWifiProvider));
  final confirmed = await showConfirmDialog(
    context,
    title: l10n.downloadAllQuestion(lessons.length),
    body: [
      l10n.downloadAllBody(ByteText.size(l10n, bytes)),
      if (waits) l10n.downloadWhenOnWifi,
    ].join(' '),
    action: l10n.download,
  );
  if (!confirmed || !context.mounted) return;
  runDownloadAction(
    ref.read(downloadControllerProvider).download(courseId, lessons),
  );
}
