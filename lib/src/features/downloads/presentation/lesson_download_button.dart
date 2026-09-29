import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:languagetransfer/src/core/format/byte_text.dart';
import 'package:languagetransfer/src/core/theme/lt_colors.dart';
import 'package:languagetransfer/src/core/widgets/text_width.dart';
import 'package:languagetransfer/src/features/downloads/domain/lesson_download.dart';
import 'package:languagetransfer/src/l10n/app_localizations.dart';

/// A lesson's download control at the end of its row: the state as an icon
/// with a short caption below.
///
/// A downloaded or failed lesson opens its options instead of acting at
/// once: deleting would cost a new download, and a failed download first
/// says why it failed.
class LessonDownloadButton extends StatelessWidget {
  const LessonDownloadButton({
    required this.download,
    required this.progress,
    required this.size,
    required this.color,
    required this.width,
    required this.onDownload,
    required this.onCancel,
    required this.onOptions,
    super.key,
  });

  static const _minWidth = 72.0;
  static const _captionPadding = 8.0;

  /// A width that fits every caption at the current text size, so the icons
  /// line up from row to row: at least 72, more with large text or longer
  /// translations.
  static double widthFor(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final widest = widestTextWidth(context, [
      l10n.downloadQueued,
      l10n.downloadFailed,
      l10n.downloadPercent(100),
      // Figures are tabular, so this is as wide as any lesson's size.
      ByteText.size(l10n, 88800000),
    ], Theme.of(context).textTheme.labelSmall);
    return math.max(_minWidth, widest + 2 * _captionPadding);
  }

  /// `null` if the lesson is neither downloaded nor requested.
  final LessonDownload? download;

  /// 0 to 1 while downloading.
  final double? progress;

  /// Size in bytes.
  final int size;

  /// Course ink, for a download in progress or done.
  final Color color;

  /// From [widthFor], the same for every row.
  final double width;

  final VoidCallback onDownload;
  final VoidCallback onCancel;
  final VoidCallback onOptions;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final colors = LtColors.of(context);
    final sizeText = ByteText.size(l10n, size);
    final percent = ((progress ?? 0) * 100).floor();

    // What it shows, what activating it is called, and what it does.
    final (
      IconData icon,
      Color iconColor,
      String caption,
      Color captionColor,
      String action,
      String state,
      VoidCallback onTap,
    ) = switch (download?.status) {
      null => (
        Icons.download,
        colors.pencil,
        sizeText,
        colors.pencil,
        l10n.downloadLesson,
        sizeText,
        onDownload,
      ),
      DownloadStatus.queued => (
        Icons.download,
        colors.rule,
        l10n.downloadQueued,
        colors.pencil,
        l10n.cancelDownload,
        l10n.downloadQueued,
        onCancel,
      ),
      DownloadStatus.downloading => (
        Icons.downloading,
        color,
        l10n.downloadPercent(percent),
        color,
        l10n.cancelDownload,
        l10n.downloadingPercent(percent),
        onCancel,
      ),
      DownloadStatus.complete => (
        Icons.download_done,
        color,
        sizeText,
        colors.pencil,
        l10n.lessonOptions,
        '${l10n.lessonStateDownloaded}, $sizeText',
        onOptions,
      ),
      DownloadStatus.failed => (
        Icons.error_outline,
        colors.alert,
        l10n.downloadFailed,
        colors.alert,
        l10n.lessonOptions,
        l10n.downloadFailed,
        onOptions,
      ),
    };

    return Semantics(
      button: true,
      label: action,
      value: state,
      excludeSemantics: true,
      child: InkWell(
        onTap: onTap,
        child: SizedBox(
          width: width,
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, color: iconColor),
              const SizedBox(height: 2),
              Text(
                caption,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: Theme.of(context).textTheme.labelSmall
                    ?.copyWith(color: captionColor),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
