import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:languagetransfer/src/core/format/byte_text.dart';
import 'package:languagetransfer/src/features/catalog/domain/lesson.dart';
import 'package:languagetransfer/src/features/downloads/application/download_controller.dart';
import 'package:languagetransfer/src/features/downloads/application/download_providers.dart';
import 'package:languagetransfer/src/features/downloads/domain/lesson_download.dart';
import 'package:languagetransfer/src/features/downloads/presentation/download_actions.dart';
import 'package:languagetransfer/src/l10n/app_localizations.dart';

/// The download entry of a lesson's options sheet. Follows the download
/// while the sheet is open, and closes the sheet before its action runs.
class LessonDownloadTile extends ConsumerWidget {
  const LessonDownloadTile({
    required this.courseId,
    required this.lesson,
    super.key,
  });

  final String courseId;
  final Lesson lesson;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context);
    final download = ref
        .watch(courseDownloadsProvider(courseId))
        .value?[lesson.id];
    final size = ByteText.size(l10n, downloadSize(ref, lesson, download));
    final navigator = Navigator.of(context);

    void startDownload() {
      navigator.pop();
      // The sheet is closing, so a snack bar goes through the navigator's
      // context, which stays.
      if (!navigator.context.mounted) return;
      startLessonDownload(navigator.context, ref, courseId, lesson);
    }

    void deleteDownload() {
      navigator.pop();
      runDownloadAction(
        ref.read(downloadControllerProvider).delete(courseId, [lesson.id]),
      );
    }

    return switch (download?.status) {
      null => ListTile(
        leading: const Icon(Icons.download),
        title: Text(l10n.downloadLesson),
        subtitle: Text(size),
        onTap: startDownload,
      ),
      DownloadStatus.queued || DownloadStatus.downloading => ListTile(
        leading: const Icon(Icons.close),
        title: Text(l10n.cancelDownload),
        onTap: deleteDownload,
      ),
      DownloadStatus.complete => ListTile(
        leading: const Icon(Icons.delete_outline),
        title: Text(l10n.deleteDownload),
        subtitle: Text(size),
        onTap: deleteDownload,
      ),
      DownloadStatus.failed => ListTile(
        leading: const Icon(Icons.refresh),
        title: Text(l10n.retryDownload),
        subtitle: Text(switch (download!.failure) {
          DownloadFailure.storage => l10n.downloadFailedStorage,
          DownloadFailure.connection => l10n.downloadFailedConnection,
          DownloadFailure.server => l10n.downloadFailedServer,
          DownloadFailure.damaged => l10n.downloadFailedDamaged,
          DownloadFailure.other || null => l10n.downloadFailedOther,
        }),
        onTap: startDownload,
      ),
    };
  }
}
