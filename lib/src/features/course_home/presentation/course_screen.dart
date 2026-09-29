import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/semantics.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:languagetransfer/src/core/format/duration_text.dart';
import 'package:languagetransfer/src/core/routing/app_routes.dart';
import 'package:languagetransfer/src/core/theme/course_colors.dart';
import 'package:languagetransfer/src/core/theme/lt_colors.dart';
import 'package:languagetransfer/src/core/theme/motion.dart';
import 'package:languagetransfer/src/core/widgets/action_sheet.dart';
import 'package:languagetransfer/src/core/widgets/construction.dart';
import 'package:languagetransfer/src/core/widgets/error_view.dart';
import 'package:languagetransfer/src/core/widgets/section_heading.dart';
import 'package:languagetransfer/src/core/widgets/titled_page.dart';
import 'package:languagetransfer/src/features/catalog/application/catalog_providers.dart';
import 'package:languagetransfer/src/features/catalog/domain/course.dart';
import 'package:languagetransfer/src/features/catalog/domain/lesson.dart';
import 'package:languagetransfer/src/features/catalog/presentation/course_name.dart';
import 'package:languagetransfer/src/features/course_home/presentation/lesson_options.dart';
import 'package:languagetransfer/src/features/downloads/application/download_controller.dart';
import 'package:languagetransfer/src/features/downloads/application/download_providers.dart';
import 'package:languagetransfer/src/features/downloads/domain/download_rules.dart';
import 'package:languagetransfer/src/features/downloads/domain/lesson_download.dart';
import 'package:languagetransfer/src/features/downloads/presentation/download_actions.dart';
import 'package:languagetransfer/src/features/downloads/presentation/lesson_download_button.dart';
import 'package:languagetransfer/src/features/player/application/player_providers.dart';
import 'package:languagetransfer/src/features/player/data/lesson_audio_handler.dart';
import 'package:languagetransfer/src/features/player/presentation/player_sheet.dart';
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
    final lessons = metadata.value?.lessons;
    // Only what the whole page depends on: the progress of the lesson
    // playing changes every few seconds, and only it follows that.
    final continueIndex = lessons == null
        ? null
        : ref.watch(
            courseProgressProvider(course.id).select(
              (progress) => PlaybackRules.continueIndex(
                lessons,
                progress.value?.values ?? const [],
              ),
            ),
          );
    final playingLessonId = ref.watch(
      activeLessonProvider.select(
        (item) => item?.courseId == course.id ? item?.lessonId : null,
      ),
    );

    /// Plays lesson [index] and opens the player. The lesson that is already
    /// playing just opens the player.
    void openLesson(int index) {
      final alreadyPlaying =
          lessons != null && lessons[index].id == playingLessonId;
      if (!alreadyPlaying) {
        unawaited(
          ref
              .read(playerControllerProvider.notifier)
              .playLesson(course.id, index),
        );
      }
      showPlayer(context);
    }

    return TitledPage(
      title: course.fullTitle,
      barColor: colors.tint,
      barForeground: colors.ink,
      actions: [
        IconButton(
          tooltip: l10n.courseOptions,
          icon: const Icon(Icons.more_horiz),
          onPressed: () => _showOptions(context),
        ),
      ],
      header: _Header(
        course: course,
        colors: colors,
        lessons: lessons,
        playingLessonId: playingLessonId,
        continueIndex: continueIndex,
        onContinue: openLesson,
      ),
      slivers: [
        switch (metadata) {
          AsyncData(:final value) => _LessonList(
            courseId: course.id,
            lessons: value.lessons,
            color: colors.ink,
            playingLessonId: playingLessonId,
            continueIndex: continueIndex,
            onOpen: openLesson,
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
      ],
    );
  }

  void _showOptions(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    unawaited(
      showActionSheet(
        context,
        title: course.fullTitle,
        actions: [
          SheetAction(
            icon: Icons.tune,
            label: l10n.manageCourse,
            onSelected: () => unawaited(
              context.push<void>(AppRoutes.manageCourse(course.id)),
            ),
          ),
          SheetAction(
            icon: Icons.open_in_new,
            label: l10n.visitWebsite,
            onSelected: () => unawaited(
              launchUrl(Uri.parse('https://www.languagetransfer.org/')),
            ),
          ),
        ],
      ),
    );
  }
}

class _Header extends ConsumerWidget {
  const _Header({
    required this.course,
    required this.colors,
    required this.lessons,
    required this.playingLessonId,
    required this.continueIndex,
    required this.onContinue,
  });

  final Course course;
  final CourseColors colors;
  final List<Lesson>? lessons;
  final String? playingLessonId;
  final int? continueIndex;
  final void Function(int index) onContinue;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context);
    final text = Theme.of(context).textTheme;
    final lessons = this.lessons;
    final finished = lessons == null
        ? 0
        : ref.watch(
            courseProgressProvider(course.id).select((progress) {
              final byLesson = progress.value ?? const {};
              return lessons
                  .where((lesson) => byLesson[lesson.id]?.finished ?? false)
                  .length;
            }),
          );
    final continueIndex = this.continueIndex;

    return Material(
      color: colors.tint,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
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
                courseId: course.id,
                lesson: lessons[continueIndex],
                isPlaying: playingLessonId == lessons[continueIndex].id,
                colors: colors,
                onTap: () => onContinue(continueIndex),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

/// How long [lesson] takes, as shown and as spoken: the time left once
/// started, otherwise its length.
({String shown, String spoken}) _timeText(
  AppLocalizations l10n,
  Lesson lesson,
  LessonProgress? progress,
) {
  if (progress case LessonProgress(started: true, :final position?)) {
    final left = DurationText.remaining(position, lesson.duration);
    return (
      shown: l10n.timeLeft(DurationText.clock(left)),
      spoken: l10n.timeLeft(DurationText.spoken(l10n, left)),
    );
  }
  return (
    shown: DurationText.clock(lesson.duration),
    spoken: DurationText.spoken(l10n, lesson.duration),
  );
}

/// The lesson "continue" leads to, in course ink on the tint.
class _ContinueBlock extends ConsumerWidget {
  const _ContinueBlock({
    required this.courseId,
    required this.lesson,
    required this.isPlaying,
    required this.colors,
    required this.onTap,
  });

  final String courseId;
  final Lesson lesson;
  final bool isPlaying;
  final CourseColors colors;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context);
    final text = Theme.of(context).textTheme;
    final progress = ref.watch(
      courseProgressProvider(courseId)
          .select((progress) => progress.value?[lesson.id]),
    );
    final label = switch (progress) {
      _ when isPlaying => l10n.nowPlaying,
      LessonProgress(started: true) => l10n.continueLesson,
      _ => l10n.startLesson,
    };
    final time = _timeText(l10n, lesson, progress);

    return Semantics(
      button: true,
      label: '$label, ${lesson.title}, ${time.spoken}',
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
                  child: _Crossfade(
                    alignment: Alignment.center,
                    child: Icon(
                      isPlaying ? Icons.graphic_eq : Icons.play_arrow_rounded,
                      key: ValueKey(isPlaying),
                      color: colors.ink,
                      size: 30,
                    ),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  // A lesson that starts playing, or the next one to
                  // continue with, fades in.
                  child: _Crossfade(
                    child: Column(
                      key: ValueKey((label, lesson.id)),
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
                          time.shown,
                          style: text.bodyMedium?.copyWith(color: colors.tint),
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
    );
  }
}

class _LessonList extends ConsumerWidget {
  const _LessonList({
    required this.courseId,
    required this.lessons,
    required this.color,
    required this.playingLessonId,
    required this.continueIndex,
    required this.onOpen,
  });

  final String courseId;
  final List<Lesson> lessons;

  /// Course ink; passes AA on paper in both themes.
  final Color color;

  final String? playingLessonId;
  final int? continueIndex;
  final void Function(int index) onOpen;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context);
    final text = Theme.of(context).textTheme;
    final downloads =
        ref.watch(courseDownloadsProvider(courseId)).value ??
        const <String, LessonDownload>{};
    final remaining = DownloadRules.lessonsToDownload(
      lessons,
      downloads,
      continueIndex,
    );
    final pending = downloads.values.where((d) => d.isPending).length;
    final waitsForWifi = downloadsWaitForWifi(ref);
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
                    child: SectionHeading(
                      l10n.lessons,
                      padding: EdgeInsets.zero,
                    ),
                  ),
                  if (remaining.isNotEmpty)
                    TextButton.icon(
                      // As large as the heading it belongs to, not louder.
                      style: TextButton.styleFrom(
                        foregroundColor: color,
                        textStyle: text.labelMedium,
                      ),
                      icon: const Icon(Icons.download, size: 20),
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
            return _LessonRow(
              courseId: courseId,
              lesson: lesson,
              isFirst: index == 0,
              isLast: index == lessons.length - 1,
              isNext: index == continueIndex,
              isPlaying: lesson.id == playingLessonId,
              color: color,
              downloadColumnWidth: downloadColumnWidth,
              onTap: () => onOpen(index),
            );
          },
        ),
      ],
    );
  }
}

/// One lesson of the list. Watches its own progress and download, so a
/// change to one lesson rebuilds only its row.
class _LessonRow extends ConsumerWidget {
  const _LessonRow({
    required this.courseId,
    required this.lesson,
    required this.isFirst,
    required this.isLast,
    required this.isNext,
    required this.isPlaying,
    required this.color,
    required this.downloadColumnWidth,
    required this.onTap,
  });

  final String courseId;
  final Lesson lesson;
  final bool isFirst;
  final bool isLast;
  final bool isNext;
  final bool isPlaying;
  final Color color;

  /// From [LessonDownloadButton.widthFor], the same for every row.
  final double downloadColumnWidth;

  final VoidCallback onTap;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context);
    final text = Theme.of(context).textTheme;
    final progress = ref.watch(
      courseProgressProvider(courseId)
          .select((progress) => progress.value?[lesson.id]),
    );
    final download = ref.watch(
      courseDownloadsProvider(courseId)
          .select((downloads) => downloads.value?[lesson.id]),
    );
    final finished = progress?.finished ?? false;
    final downloaded = download?.isComplete ?? false;
    final state = switch (progress) {
      _ when finished => NodeState.finished,
      LessonProgress(started: true) => NodeState.inProgress,
      _ => NodeState.notStarted,
    };
    final time = _timeText(l10n, lesson, progress);
    final detail = switch (state) {
      _ when isPlaying => l10n.nowPlaying,
      NodeState.finished => l10n.lessonFinished,
      NodeState.inProgress || NodeState.notStarted => time.shown,
    };
    final spoken = [
      lesson.title,
      if (isPlaying) l10n.lessonStatePlaying,
      if (finished) l10n.lessonStateFinished else time.spoken,
      if (downloaded) l10n.lessonStateDownloaded,
    ].join(', ');
    final toggleLabel = finished ? l10n.markNotFinished : l10n.markFinished;

    void toggleFinished() => unawaited(
      ref
          .read(lessonCompletionProvider)
          .setFinished(courseId, lesson.id, finished: !finished),
    );
    void showOptions() => showLessonOptions(
      context,
      ref,
      courseId: courseId,
      lesson: lesson,
      finished: finished,
    );

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
                  CustomSemanticsAction(label: toggleLabel): toggleFinished,
                },
                child: InkWell(
                  onTap: onTap,
                  onLongPress: showOptions,
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
                              _Crossfade(
                                child: Text(
                                  detail,
                                  key: ValueKey(detail),
                                  style: text.bodyMedium?.copyWith(
                                    color: isPlaying
                                        ? color
                                        : LtColors.of(context).pencil,
                                  ),
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
                  size: downloadSize(ref, lesson, download),
                  color: color,
                  width: downloadColumnWidth,
                  onDownload: () =>
                      startLessonDownload(context, ref, courseId, lesson),
                  onCancel: () => runDownloadAction(
                    ref.read(downloadControllerProvider).delete(courseId, [
                      lesson.id,
                    ]),
                  ),
                  onOptions: showOptions,
                );
              },
            ),
            const SizedBox(width: 8),
          ],
        ),
      ),
    );
  }
}

/// Fades from one [child] to the next when its key changes, in place at
/// [alignment]: the start for text, the centre for an icon in a square.
class _Crossfade extends StatelessWidget {
  const _Crossfade({
    required this.child,
    this.alignment = AlignmentDirectional.centerStart,
  });

  final Widget child;
  final AlignmentGeometry alignment;

  @override
  Widget build(BuildContext context) => AnimatedSwitcher(
    duration: Motion.of(context, Motion.quick),
    switchInCurve: Motion.change,
    switchOutCurve: Motion.change,
    layoutBuilder: (current, previous) =>
        Stack(alignment: alignment, children: [...previous, ?current]),
    child: child,
  );
}
