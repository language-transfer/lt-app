import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/semantics.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:languagetransfer/src/core/format/duration_text.dart';
import 'package:languagetransfer/src/core/routing/app_routes.dart';
import 'package:languagetransfer/src/core/theme/course_colors.dart';
import 'package:languagetransfer/src/core/theme/lt_colors.dart';
import 'package:languagetransfer/src/core/widgets/construction.dart';
import 'package:languagetransfer/src/core/widgets/error_view.dart';
import 'package:languagetransfer/src/features/catalog/application/catalog_providers.dart';
import 'package:languagetransfer/src/features/catalog/domain/course.dart';
import 'package:languagetransfer/src/features/catalog/domain/course_metadata.dart';
import 'package:languagetransfer/src/features/catalog/domain/lesson.dart';
import 'package:languagetransfer/src/features/catalog/presentation/course_name.dart';
import 'package:languagetransfer/src/features/downloads/application/download_controller.dart';
import 'package:languagetransfer/src/features/downloads/application/download_providers.dart';
import 'package:languagetransfer/src/features/downloads/domain/lesson_download.dart';
import 'package:languagetransfer/src/features/downloads/presentation/download_actions.dart';
import 'package:languagetransfer/src/features/downloads/presentation/lesson_download_button.dart';
import 'package:languagetransfer/src/features/downloads/presentation/lesson_download_tile.dart';
import 'package:languagetransfer/src/features/player/application/player_providers.dart';
import 'package:languagetransfer/src/features/player/data/lesson_audio_handler.dart';
import 'package:languagetransfer/src/features/progress/application/progress_providers.dart';
import 'package:languagetransfer/src/features/progress/domain/lesson_progress.dart';
import 'package:languagetransfer/src/features/progress/domain/playback_rules.dart';
import 'package:languagetransfer/src/l10n/app_localizations.dart';
import 'package:url_launcher/url_launcher.dart';

/// One course: where to continue and all its lessons, so every lesson is one
/// tap away.
class CourseScreen extends ConsumerWidget {
  const CourseScreen({required this.course, super.key});

  final Course course;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context);
    final colors = CourseColors.resolve(context, course.id);
    final metadata = ref.watch(courseMetadataProvider(course.id));
    final progress =
        ref.watch(courseProgressProvider(course.id)).value ?? const {};
    final playing = ref.watch(nowPlayingProvider).value;
    final playingLessonId = playing?.courseId == course.id
        ? playing?.lessonId
        : null;
    final downloads =
        ref.watch(courseDownloadsProvider(course.id)).value ??
        const <String, LessonDownload>{};
    final waitsForWifi = downloadsWaitForWifi(ref);
    final continueIndex = switch (metadata.value) {
      final value? => PlaybackRules.continueIndex(
        value.lessons,
        progress.values,
      ),
      null => null,
    };

    /// Plays lesson [index] and opens the player. The lesson that is already
    /// playing just opens the player.
    void openLesson(int index) {
      final lessons = metadata.value?.lessons;
      final alreadyPlaying =
          lessons != null && lessons[index].id == playingLessonId;
      if (!alreadyPlaying) {
        unawaited(
          ref
              .read(playerControllerProvider.notifier)
              .playLesson(course.id, index),
        );
      }
      unawaited(context.push<void>(AppRoutes.player));
    }

    return Scaffold(
      body: CustomScrollView(
        slivers: [
          SliverToBoxAdapter(
            child: _Header(
              course: course,
              colors: colors,
              metadata: metadata.value,
              progress: progress,
              playingLessonId: playingLessonId,
              continueIndex: continueIndex,
              onContinue: openLesson,
            ),
          ),
          switch (metadata) {
            AsyncData(:final value) => _LessonList(
              courseId: course.id,
              metadata: value,
              progress: progress,
              downloads: downloads,
              waitsForWifi: waitsForWifi,
              color: colors.ink,
              playingLessonId: playingLessonId,
              continueIndex: continueIndex,
              onOpen: openLesson,
              onToggleFinished: (lesson, {required finished}) => unawaited(
                ref
                    .read(lessonCompletionProvider)
                    .setFinished(course.id, lesson.id, finished: finished),
              ),
            ),
            AsyncError(:final error) => SliverPadding(
              padding: const EdgeInsets.all(20),
              sliver: SliverToBoxAdapter(
                child: ErrorView(
                  title: l10n.courseUnavailableTitle,
                  error: error,
                  onRetry: () {
                    ref
                      ..invalidate(courseIndexProvider)
                      ..invalidate(courseMetadataProvider(course.id));
                  },
                ),
              ),
            ),
            _ => const SliverPadding(
              padding: EdgeInsets.all(32),
              sliver: SliverToBoxAdapter(
                child: Center(child: CircularProgressIndicator()),
              ),
            ),
          },
          const SliverSafeArea(
            top: false,
            sliver: SliverToBoxAdapter(child: SizedBox(height: 16)),
          ),
        ],
      ),
    );
  }
}

class _Header extends StatelessWidget {
  const _Header({
    required this.course,
    required this.colors,
    required this.metadata,
    required this.progress,
    required this.playingLessonId,
    required this.continueIndex,
    required this.onContinue,
  });

  final Course course;
  final CourseColors colors;
  final CourseMetadata? metadata;
  final Map<String, LessonProgress> progress;
  final String? playingLessonId;
  final int? continueIndex;
  final void Function(int index) onContinue;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final text = Theme.of(context).textTheme;
    final lessons = metadata?.lessons;
    final finished = lessons == null
        ? 0
        : lessons
              .where((lesson) => progress[lesson.id]?.finished ?? false)
              .length;
    final continueIndex = this.continueIndex;

    return Material(
      color: colors.tint,
      child: SafeArea(
        bottom: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(8, 4, 8, 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  BackButton(color: colors.ink),
                  const Spacer(),
                  IconButton(
                    tooltip: l10n.courseOptions,
                    color: colors.ink,
                    icon: const Icon(Icons.more_horiz),
                    onPressed: () => _showOptions(context),
                  ),
                ],
              ),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const SizedBox(height: 8),
                    CourseName(
                      course: course,
                      style: text.displayLarge!,
                      color: colors.ink,
                    ),
                    const SizedBox(height: 8),
                    Semantics(
                      header: true,
                      child: Text(
                        course.fullTitle,
                        style: text.titleMedium?.copyWith(color: colors.ink),
                      ),
                    ),
                    if (lessons != null)
                      Text(
                        finished > 0
                            ? l10n.lessonsFinished(finished, lessons.length)
                            : l10n.lessonCount(lessons.length),
                        style: text.bodyLarge?.copyWith(color: colors.ink),
                      ),
                    if (lessons != null && continueIndex != null) ...[
                      const SizedBox(height: 20),
                      _ContinueBlock(
                        lesson: lessons[continueIndex],
                        progress: progress[lessons[continueIndex].id],
                        isPlaying: playingLessonId == lessons[continueIndex].id,
                        colors: colors,
                        onTap: () => onContinue(continueIndex),
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showOptions(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    unawaited(
      showModalBottomSheet<void>(
        context: context,
        builder: (sheetContext) => SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ListTile(
                leading: const Icon(Icons.tune),
                title: Text(l10n.manageCourse),
                onTap: () {
                  Navigator.of(sheetContext).pop();
                  unawaited(
                    context.push<void>(AppRoutes.manageCourse(course.id)),
                  );
                },
              ),
              ListTile(
                leading: const Icon(Icons.open_in_new),
                title: Text(l10n.visitWebsite),
                onTap: () {
                  Navigator.of(sheetContext).pop();
                  unawaited(
                    launchUrl(Uri.parse('https://www.languagetransfer.org/')),
                  );
                },
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// The lesson "continue" leads to, in course ink on the tint.
class _ContinueBlock extends StatelessWidget {
  const _ContinueBlock({
    required this.lesson,
    required this.progress,
    required this.isPlaying,
    required this.colors,
    required this.onTap,
  });

  final Lesson lesson;
  final LessonProgress? progress;
  final bool isPlaying;
  final CourseColors colors;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final text = Theme.of(context).textTheme;
    final started = progress?.started ?? false;
    final label = isPlaying
        ? l10n.nowPlaying
        : started
        ? l10n.continueLesson
        : l10n.startLesson;
    final left = started
        ? DurationText.remaining(progress!.position!, lesson.duration)
        : lesson.duration;
    final detail = started
        ? l10n.timeLeft(DurationText.clock(left))
        : DurationText.clock(left);
    final spokenDetail = started
        ? l10n.timeLeft(DurationText.spoken(l10n, left))
        : DurationText.spoken(l10n, left);

    return Semantics(
      button: true,
      label: '$label, ${lesson.title}, $spokenDetail',
      excludeSemantics: true,
      child: Material(
        color: colors.ink,
        borderRadius: BorderRadius.circular(6),
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: onTap,
          splashColor: colors.tint.withValues(alpha: 0.16),
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 20, 16),
            child: Row(
              children: [
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    color: colors.tint,
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Icon(
                    isPlaying ? Icons.graphic_eq : Icons.play_arrow_rounded,
                    color: colors.ink,
                    size: 30,
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        label,
                        style: text.labelMedium?.copyWith(color: colors.tint),
                      ),
                      Text(
                        lesson.title,
                        style: text.titleLarge?.copyWith(color: colors.tint),
                      ),
                      Text(
                        detail,
                        style: text.bodyMedium?.copyWith(color: colors.tint),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _LessonList extends ConsumerWidget {
  const _LessonList({
    required this.courseId,
    required this.metadata,
    required this.progress,
    required this.downloads,
    required this.waitsForWifi,
    required this.color,
    required this.playingLessonId,
    required this.continueIndex,
    required this.onOpen,
    required this.onToggleFinished,
  });

  final String courseId;
  final CourseMetadata metadata;
  final Map<String, LessonProgress> progress;
  final Map<String, LessonDownload> downloads;
  final bool waitsForWifi;

  /// Course ink; passes AA on paper in both themes.
  final Color color;

  final String? playingLessonId;
  final int? continueIndex;
  final void Function(int index) onOpen;
  final void Function(Lesson lesson, {required bool finished}) onToggleFinished;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context);
    final text = Theme.of(context).textTheme;
    final lessons = metadata.lessons;

    final remaining = lessonsToDownload(lessons, downloads, continueIndex);
    final pending = downloads.values.where((d) => d.isPending).length;
    final downloadColumnWidth = LessonDownloadButton.widthFor(context);

    return SliverMainAxisGroup(
      slivers: [
        SliverPadding(
          padding: const EdgeInsets.fromLTRB(20, 16, 8, 4),
          sliver: SliverToBoxAdapter(
            child: ConstrainedBox(
              constraints: const BoxConstraints(minHeight: 48),
              child: Row(
                children: [
                  Expanded(
                    child: Semantics(
                      header: true,
                      child: Text(l10n.lessons, style: text.bodyMedium),
                    ),
                  ),
                  if (remaining.isNotEmpty)
                    TextButton.icon(
                      style: TextButton.styleFrom(foregroundColor: color),
                      icon: const Icon(Icons.download),
                      label: Text(l10n.downloadAll),
                      onPressed: () => confirmDownloadAll(
                        context,
                        ref,
                        courseId: courseId,
                        lessons: remaining,
                      ),
                    )
                  else
                    Padding(
                      padding: const EdgeInsets.only(right: 12),
                      child: Text(
                        pending > 0
                            ? l10n.downloadsLeft(pending)
                            : l10n.allDownloaded,
                        style: text.bodySmall,
                      ),
                    ),
                ],
              ),
            ),
          ),
        ),
        if (waitsForWifi && pending > 0)
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(20, 0, 8, 8),
            sliver: SliverToBoxAdapter(
              child: Row(
                children: [
                  Icon(
                    Icons.wifi_off,
                    size: 20,
                    color: LtColors.of(context).pencil,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(l10n.waitingForWifi, style: text.bodyMedium),
                  ),
                  TextButton(
                    style: TextButton.styleFrom(foregroundColor: color),
                    onPressed: () => context.push<void>(AppRoutes.settings),
                    child: Text(l10n.settings),
                  ),
                ],
              ),
            ),
          ),
        SliverList.builder(
          itemCount: lessons.length,
          itemBuilder: (context, index) {
            final lesson = lessons[index];
            final download = downloads[lesson.id];
            return _LessonRow(
              courseId: courseId,
              lesson: lesson,
              progress: progress[lesson.id],
              download: download,
              downloadSize: downloadSize(ref, lesson, download),
              downloadColumnWidth: downloadColumnWidth,
              color: color,
              isFirst: index == 0,
              isLast: index == lessons.length - 1,
              isNext: index == continueIndex,
              isPlaying: lesson.id == playingLessonId,
              onTap: () => onOpen(index),
              onToggleFinished: (finished) =>
                  onToggleFinished(lesson, finished: finished),
              onDownload: () =>
                  startLessonDownload(context, ref, courseId, lesson),
              onCancelDownload: () => runDownloadAction(
                ref.read(downloadControllerProvider).delete(courseId, [
                  lesson.id,
                ]),
              ),
            );
          },
        ),
      ],
    );
  }
}

class _LessonRow extends StatelessWidget {
  const _LessonRow({
    required this.courseId,
    required this.lesson,
    required this.progress,
    required this.download,
    required this.downloadSize,
    required this.downloadColumnWidth,
    required this.color,
    required this.isFirst,
    required this.isLast,
    required this.isNext,
    required this.isPlaying,
    required this.onTap,
    required this.onToggleFinished,
    required this.onDownload,
    required this.onCancelDownload,
  });

  final String courseId;
  final Lesson lesson;
  final LessonProgress? progress;
  final LessonDownload? download;
  final int downloadSize;
  final double downloadColumnWidth;
  final Color color;
  final bool isFirst;
  final bool isLast;
  final bool isNext;
  final bool isPlaying;
  final VoidCallback onTap;
  final ValueChanged<bool> onToggleFinished;
  final VoidCallback onDownload;
  final VoidCallback onCancelDownload;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final text = Theme.of(context).textTheme;
    final finished = progress?.finished ?? false;
    final started = !finished && (progress?.started ?? false);
    final downloaded = download?.isComplete ?? false;
    final state = finished
        ? NodeState.finished
        : started
        ? NodeState.inProgress
        : NodeState.notStarted;
    final left = started
        ? DurationText.remaining(progress!.position!, lesson.duration)
        : lesson.duration;
    final detail = isPlaying
        ? l10n.nowPlaying
        : finished
        ? l10n.lessonFinished
        : started
        ? l10n.timeLeft(DurationText.clock(left))
        : DurationText.clock(lesson.duration);
    final spoken = [
      lesson.title,
      if (isPlaying) l10n.lessonStatePlaying,
      if (finished) l10n.lessonStateFinished,
      if (started) l10n.timeLeft(DurationText.spoken(l10n, left)),
      if (!finished && !started) DurationText.spoken(l10n, lesson.duration),
      if (downloaded) l10n.lessonStateDownloaded,
    ].join(', ');
    final toggleLabel = finished ? l10n.markNotFinished : l10n.markFinished;

    void showActions() =>
        _showActions(context, finished: finished, toggleLabel: toggleLabel);

    // Grows with the text size instead of clipping it.
    return ConstrainedBox(
      constraints: const BoxConstraints(minHeight: 68),
      child: IntrinsicHeight(
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Expanded(
              child: Semantics(
                button: true,
                label: spoken,
                excludeSemantics: true,
                customSemanticsActions: {
                  CustomSemanticsAction(label: toggleLabel): () =>
                      onToggleFinished(!finished),
                },
                child: InkWell(
                  onTap: onTap,
                  onLongPress: showActions,
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      SizedBox(
                        width: 56,
                        child: LessonNode(
                          state: state,
                          color: color,
                          isFirst: isFirst,
                          isLast: isLast,
                          emphasised: isNext || isPlaying,
                        ),
                      ),
                      Expanded(
                        child: Padding(
                          padding: const EdgeInsets.symmetric(vertical: 10),
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(lesson.title, style: text.titleSmall),
                              Text(
                                detail,
                                style: text.bodyMedium?.copyWith(
                                  color: isPlaying
                                      ? color
                                      : LtColors.of(context).pencil,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            // Watches the progress itself, so only the button follows a
            // running download.
            Consumer(
              builder: (context, ref, _) {
                final objectId = download?.objectId;
                return LessonDownloadButton(
                  download: download,
                  progress: objectId == null
                      ? null
                      : ref.watch(
                          downloadProgressProvider.select(
                            (progress) => progress.value?[objectId],
                          ),
                        ),
                  size: downloadSize,
                  color: color,
                  width: downloadColumnWidth,
                  onDownload: onDownload,
                  onCancel: onCancelDownload,
                  onOptions: showActions,
                );
              },
            ),
            const SizedBox(width: 8),
          ],
        ),
      ),
    );
  }

  void _showActions(
    BuildContext context, {
    required bool finished,
    required String toggleLabel,
  }) {
    unawaited(
      showModalBottomSheet<void>(
        context: context,
        builder: (sheetContext) => SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ListTile(
                title: Text(
                  lesson.title,
                  style: Theme.of(context).textTheme.titleMedium,
                ),
              ),
              ListTile(
                leading: Icon(finished ? Icons.remove_done : Icons.done),
                title: Text(toggleLabel),
                onTap: () {
                  Navigator.of(sheetContext).pop();
                  onToggleFinished(!finished);
                },
              ),
              LessonDownloadTile(
                courseId: courseId,
                lesson: lesson,
                onDone: () => Navigator.of(sheetContext).pop(),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
