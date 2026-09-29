import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:languagetransfer/src/core/errors/error_kind.dart';
import 'package:languagetransfer/src/core/format/byte_text.dart';
import 'package:languagetransfer/src/core/routing/app_routes.dart';
import 'package:languagetransfer/src/core/theme/lt_colors.dart';
import 'package:languagetransfer/src/core/widgets/confirm_dialog.dart';
import 'package:languagetransfer/src/core/widgets/section_heading.dart';
import 'package:languagetransfer/src/features/catalog/application/catalog_providers.dart';
import 'package:languagetransfer/src/features/catalog/domain/course.dart';
import 'package:languagetransfer/src/features/downloads/application/download_controller.dart';
import 'package:languagetransfer/src/features/downloads/application/download_providers.dart';
import 'package:languagetransfer/src/features/downloads/domain/lesson_download.dart';
import 'package:languagetransfer/src/features/downloads/presentation/download_actions.dart';
import 'package:languagetransfer/src/features/progress/application/progress_providers.dart';
import 'package:languagetransfer/src/features/progress/domain/playback_rules.dart';
import 'package:languagetransfer/src/l10n/app_localizations.dart';

/// Per-course data management (upstream
/// `src/components/data-management/DataManagementScreen.tsx`).
class ManageCourseScreen extends ConsumerWidget {
  const ManageCourseScreen({required this.course, super.key});

  final Course course;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context);
    final text = Theme.of(context).textTheme;
    final messenger = ScaffoldMessenger.of(context);
    final lessons = ref.watch(courseMetadataProvider(course.id)).value?.lessons;
    final progress =
        ref.watch(courseProgressProvider(course.id)).value ?? const {};
    final downloads =
        ref.watch(courseDownloadsProvider(course.id)).value ??
        const <String, LessonDownload>{};
    final downloaded = downloads.values.where((d) => d.isComplete).toList();
    final downloadedBytes = downloaded.fold(0, (sum, d) => sum + d.size);
    final remaining = lessons == null
        ? null
        : lessonsToDownload(
            lessons,
            downloads,
            PlaybackRules.continueIndex(lessons, progress.values),
          );

    Future<bool> confirm(String title, String body, String action) =>
        showConfirmDialog(context, title: title, body: body, action: action);

    void say(String message) =>
        messenger.showSnackBar(SnackBar(content: Text(message)));

    Future<void> refresh() async {
      try {
        await ref.read(courseIndexRepositoryProvider).refresh();
        if (!context.mounted) return;
        ref.invalidate(courseMetadataProvider(course.id));
        await ref.read(courseMetadataProvider(course.id).future);
        say(l10n.courseUpToDate);
      } on Exception catch (error) {
        say(ErrorKind.of(error).body(l10n));
      }
    }

    Future<void> deleteFinished() async {
      await ref.read(downloadControllerProvider).deleteFinished(course.id);
      say(l10n.finishedDownloadsDeleted);
    }

    Future<void> deleteAllDownloads() async {
      final downloadController = ref.read(downloadControllerProvider);
      if (!await confirm(
        l10n.deleteAllDownloadsQuestion(course.fullTitle),
        l10n.deleteAllDownloadsBody,
        l10n.delete,
      )) {
        return;
      }
      await downloadController.deleteAll(course.id);
      say(l10n.downloadsDeleted);
    }

    Future<void> clearProgress() async {
      final progressRepository = ref.read(progressRepositoryProvider);
      if (!await confirm(
        l10n.clearProgressQuestion(course.fullTitle),
        l10n.clearProgressBody,
        l10n.clearProgress,
      )) {
        return;
      }
      await progressRepository.clearCourse(course.id);
      say(l10n.progressCleared);
    }

    Future<void> deleteCourseData() async {
      // Read before the first gap, in case the screen closes meanwhile.
      final progressRepository = ref.read(progressRepositoryProvider);
      final downloadController = ref.read(downloadControllerProvider);
      final metadataRepository = ref.read(courseMetadataRepositoryProvider);
      final entry = ref
          .read(courseIndexProvider)
          .value
          ?.index
          .entryFor(course.id);
      if (!await confirm(
        l10n.deleteCourseDataQuestion(course.fullTitle),
        l10n.deleteCourseDataBody,
        l10n.delete,
      )) {
        return;
      }
      await progressRepository.clearCourse(course.id);
      await downloadController.deleteAll(course.id);
      if (entry != null) await metadataRepository.deleteLocalCopy(entry);
      if (!context.mounted) return;
      say(l10n.courseDataDeleted);
      // Back to the course list, as upstream.
      context.go(AppRoutes.courses);
    }

    ListTile action({
      required IconData icon,
      required String title,
      required String body,
      required VoidCallback onTap,
      Color? color,
    }) => ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: 20),
      leading: Icon(icon, color: color),
      title: Text(
        title,
        style: color == null ? null : text.titleSmall?.copyWith(color: color),
      ),
      subtitle: Text(body),
      onTap: onTap,
    );

    return Scaffold(
      appBar: AppBar(title: Text(l10n.manageCourse)),
      body: ListView(
        padding: const EdgeInsets.only(bottom: 24),
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 0, 20, 8),
            child: Text(course.fullTitle, style: text.bodyMedium),
          ),
          action(
            icon: Icons.refresh,
            title: l10n.refreshCourse,
            body: l10n.refreshCourseBody,
            onTap: refresh,
          ),
          SectionHeading(l10n.downloads),
          if (lessons != null)
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 8),
              child: Text(
                downloaded.isEmpty
                    ? l10n.noneDownloaded
                    : l10n.downloadedSummary(
                        downloaded.length,
                        lessons.length,
                        ByteText.size(l10n, downloadedBytes),
                      ),
                style: text.bodyLarge,
              ),
            ),
          if (remaining != null && remaining.isNotEmpty)
            action(
              icon: Icons.download,
              title: l10n.downloadAllLessons,
              body: l10n.downloadAllLessonsBody,
              onTap: () => confirmDownloadAll(
                context,
                ref,
                courseId: course.id,
                lessons: remaining,
              ),
            ),
          if (downloads.isNotEmpty) ...[
            action(
              icon: Icons.delete_sweep_outlined,
              title: l10n.deleteFinishedDownloads,
              body: l10n.deleteFinishedDownloadsBody,
              onTap: deleteFinished,
            ),
            action(
              icon: Icons.delete_outline,
              title: l10n.deleteAllDownloads,
              body: l10n.deleteAllDownloadsBody,
              onTap: deleteAllDownloads,
            ),
          ],
          SectionHeading(l10n.progress),
          action(
            icon: Icons.restart_alt,
            title: l10n.clearProgress,
            body: l10n.clearProgressBody,
            onTap: clearProgress,
          ),
          const Divider(indent: 20, endIndent: 20),
          action(
            icon: Icons.delete_forever_outlined,
            title: l10n.deleteCourseData,
            body: l10n.deleteCourseDataBody,
            color: LtColors.of(context).alert,
            onTap: deleteCourseData,
          ),
        ],
      ),
    );
  }
}
