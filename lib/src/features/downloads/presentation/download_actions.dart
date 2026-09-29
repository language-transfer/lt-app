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
import 'package:languagetransfer/src/features/downloads/domain/download_rules.dart';
import 'package:languagetransfer/src/features/downloads/domain/lesson_download.dart';
import 'package:languagetransfer/src/features/settings/application/settings_providers.dart';
import 'package:languagetransfer/src/l10n/app_localizations.dart';

/// The size of [lesson]'s download: of the existing [download], or what it
/// would be in the download quality setting. For build methods.
int downloadSize(WidgetRef ref, Lesson lesson, LessonDownload? download) =>
    download?.size ??
    DownloadRules.plannedSize(
      lesson,
      ref.watch(settingsProvider).value,
      applePlayer: ref.watch(applePlayerProvider),
    );

/// True if new downloads would not start now because they wait for Wi-Fi
/// ([DownloadRules.waitForWifi]). For build methods; rebuilds when either
/// changes.
bool downloadsWaitForWifi(WidgetRef ref) => DownloadRules.waitForWifi(
  ref.watch(settingsProvider).value,
  onWifi: ref.watch(onWifiProvider),
);

/// Starts downloading one lesson, and says so if it has to wait for Wi-Fi,
/// since otherwise nothing seems to happen.
void startLessonDownload(
  BuildContext context,
  WidgetRef ref,
  String courseId,
  Lesson lesson,
) {
  final waits = DownloadRules.waitForWifi(
    ref.read(settingsProvider).value,
    onWifi: ref.read(onWifiProvider),
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
  final applePlayer = ref.read(applePlayerProvider);
  final bytes = lessons.fold(
    0,
    (sum, lesson) =>
        sum +
        DownloadRules.plannedSize(lesson, settings, applePlayer: applePlayer),
  );
  final waits = DownloadRules.waitForWifi(
    settings,
    onWifi: ref.read(onWifiProvider),
  );
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
