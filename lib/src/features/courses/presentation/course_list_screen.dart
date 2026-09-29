import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:languagetransfer/src/core/routing/app_routes.dart';
import 'package:languagetransfer/src/core/theme/course_colors.dart';
import 'package:languagetransfer/src/core/theme/lt_colors.dart';
import 'package:languagetransfer/src/core/widgets/action_sheet.dart';
import 'package:languagetransfer/src/core/widgets/construction.dart';
import 'package:languagetransfer/src/core/widgets/error_view.dart';
import 'package:languagetransfer/src/core/widgets/section_heading.dart';
import 'package:languagetransfer/src/core/widgets/text_width.dart';
import 'package:languagetransfer/src/features/catalog/application/catalog_providers.dart';
import 'package:languagetransfer/src/features/catalog/domain/course.dart';
import 'package:languagetransfer/src/features/catalog/domain/course_index.dart';
import 'package:languagetransfer/src/features/catalog/presentation/course_name.dart';
import 'package:languagetransfer/src/features/progress/application/progress_providers.dart';
import 'package:languagetransfer/src/l10n/app_localizations.dart';

/// All courses as bands in their colours.
class CourseListScreen extends ConsumerWidget {
  const CourseListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context);
    final index = ref.watch(courseIndexProvider);
    final finished = ref.watch(finishedCountsProvider).value ?? const {};
    final lessonCounts = {
      for (final entry
          in index.value?.index.courses ?? const <CourseIndexEntry>[])
        entry.id: entry.lessonCount,
    };

    return Scaffold(
      body: CustomScrollView(
        slivers: [
          const SliverSafeArea(
            bottom: false,
            sliver: SliverToBoxAdapter(child: _Header()),
          ),
          if (index.hasError && !index.hasValue)
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
              sliver: SliverToBoxAdapter(
                child: ErrorView(
                  title: l10n.coursesUnavailableTitle,
                  error: index.error!,
                  onRetry: () => ref.invalidate(courseIndexProvider),
                ),
              ),
            ),
          for (final section in CourseSection.values) ...[
            SliverToBoxAdapter(
              child: SectionHeading(
                _sectionLabel(l10n, section),
                // Bands, unlike rows, need some air below the heading.
                padding: const EdgeInsets.fromLTRB(20, 20, 20, 10),
              ),
            ),
            SliverList.list(
              children: [
                for (final course in Courses.listed.where(
                  (c) => c.section == section,
                ))
                  CourseBand(
                    course: course,
                    lessonCount: lessonCounts[course.id],
                    finished: finished[course.id] ?? 0,
                    onTap: () => unawaited(
                      context.push<void>(AppRoutes.course(course.id)),
                    ),
                  ),
              ],
            ),
          ],
          const SliverSafeArea(
            top: false,
            sliver: SliverToBoxAdapter(child: SizedBox(height: 24)),
          ),
        ],
      ),
    );
  }
}

class _Header extends StatelessWidget {
  const _Header();

  static const _logoHeight = 44.0;
  static const _logoGap = 12.0;

  /// An [IconButton]'s minimum touch target.
  static const _menuWidth = 48.0;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final colors = LtColors.of(context);
    final style = Theme.of(context).textTheme.titleLarge!;
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 12, 8, 20),
      child: LayoutBuilder(
        builder: (context, constraints) {
          // The logo is decorative. With large text on a small screen it
          // makes room, so the title's words need not break in the middle.
          final titleWidth =
              constraints.maxWidth - _menuWidth - _logoHeight - _logoGap;
          final showLogo =
              widestTextWidth(
                context,
                l10n.appTitle.split(RegExp(r'\s+')),
                style,
              ) <=
              titleWidth;
          return Row(
            children: [
              if (showLogo) ...[
                Image.asset(
                  'assets/images/lt-logo-mark.png',
                  height: _logoHeight,
                  color: colors.ink,
                  excludeFromSemantics: true,
                ),
                const SizedBox(width: _logoGap),
              ],
              Expanded(
                child: Semantics(
                  header: true,
                  child: Text(l10n.appTitle, style: style),
                ),
              ),
              IconButton(
                tooltip: l10n.menu,
                icon: const Icon(Icons.more_horiz),
                onPressed: () => _showMenu(context),
              ),
            ],
          );
        },
      ),
    );
  }

  void _showMenu(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    unawaited(
      showActionSheet(
        context,
        actions: [
          SheetAction(
            icon: Icons.tune,
            label: l10n.settings,
            onSelected: () => unawaited(context.push<void>(AppRoutes.settings)),
          ),
          SheetAction(
            icon: Icons.info_outline,
            label: l10n.about,
            onSelected: () => unawaited(context.push<void>(AppRoutes.about)),
          ),
        ],
      ),
    );
  }
}

String _sectionLabel(AppLocalizations l10n, CourseSection section) =>
    switch (section) {
      CourseSection.languages => l10n.sectionLanguages,
      CourseSection.forSpanishSpeakers => l10n.sectionForSpanishSpeakers,
      CourseSection.other => l10n.sectionOther,
    };

/// One course on the course list.
class CourseBand extends StatelessWidget {
  const CourseBand({
    required this.course,
    required this.finished,
    required this.onTap,
    this.lessonCount,
    super.key,
  });

  final Course course;

  /// `null` while the course index is loading.
  final int? lessonCount;

  final int finished;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final text = Theme.of(context).textTheme;
    final colors = CourseColors.resolve(context, course.id);
    final total = lessonCount;
    final details = total == null
        ? null
        : finished > 0
        ? l10n.lessonsFinished(finished, total)
        : l10n.lessonCount(total);

    return Semantics(
      button: true,
      label: [course.fullTitle, ?details].join(', '),
      excludeSemantics: true,
      child: Material(
        color: colors.tint,
        child: InkWell(
          onTap: onTap,
          splashColor: colors.ink.withValues(alpha: 0.12),
          highlightColor: colors.ink.withValues(alpha: 0.06),
          child: Padding(
            padding: const EdgeInsets.fromLTRB(20, 18, 20, 20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                CourseName(
                  course: course,
                  style: text.headlineLarge!,
                  color: colors.ink,
                ),
                const SizedBox(height: 6),
                Text(
                  course.fullTitle,
                  style: text.titleSmall?.copyWith(color: colors.ink),
                ),
                if (details != null)
                  Text(
                    details,
                    style: text.bodyMedium?.copyWith(color: colors.ink),
                  ),
                if (total != null && finished > 0) ...[
                  const SizedBox(height: 12),
                  ProgressLine(fraction: finished / total, color: colors.ink),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}
