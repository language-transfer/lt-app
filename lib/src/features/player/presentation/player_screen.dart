import 'dart:math' as math;

import 'package:audio_service/audio_service.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:languagetransfer/src/core/errors/error_kind.dart';
import 'package:languagetransfer/src/core/network/connectivity.dart';
import 'package:languagetransfer/src/core/routing/app_routes.dart';
import 'package:languagetransfer/src/core/theme/course_colors.dart';
import 'package:languagetransfer/src/core/theme/lt_colors.dart';
import 'package:languagetransfer/src/core/theme/motion.dart';
import 'package:languagetransfer/src/core/widgets/action_sheet.dart';
import 'package:languagetransfer/src/core/widgets/error_view.dart';
import 'package:languagetransfer/src/features/catalog/application/catalog_providers.dart';
import 'package:languagetransfer/src/features/catalog/domain/course.dart';
import 'package:languagetransfer/src/features/catalog/domain/lesson.dart';
import 'package:languagetransfer/src/features/catalog/presentation/course_cover.dart';
import 'package:languagetransfer/src/features/course_home/presentation/lesson_options.dart';
import 'package:languagetransfer/src/features/downloads/application/download_providers.dart';
import 'package:languagetransfer/src/features/player/application/player_providers.dart';
import 'package:languagetransfer/src/features/player/data/lesson_audio_handler.dart';
import 'package:languagetransfer/src/features/player/presentation/play_pause_button.dart';
import 'package:languagetransfer/src/features/player/presentation/player_extras.dart';
import 'package:languagetransfer/src/features/player/presentation/seek_line.dart';
import 'package:languagetransfer/src/features/progress/application/progress_providers.dart';
import 'package:languagetransfer/src/l10n/app_localizations.dart';

/// The lesson being played, filling the screen in the course's tint: the
/// lesson just asked for from the first frame, before the player has it.
class PlayerScreen extends ConsumerWidget {
  const PlayerScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final item = ref.watch(nowPlayingProvider).value;
    if (ref.watch(requestedLessonProvider) case final request?) {
      final lesson = ref
          .watch(courseMetadataProvider(request.courseId))
          .value
          ?.lessons
          .elementAtOrNull(request.lessonIndex);
      final inPlayer =
          item != null &&
          item.courseId == request.courseId &&
          item.lessonId == lesson?.id;
      if (!inPlayer) {
        return _RequestedLesson(
          courseId: request.courseId,
          lessonIndex: request.lessonIndex,
          lesson: lesson,
        );
      }
    }
    if (item == null) return const _NoLesson();
    return _LessonInPlayer(item: item);
  }
}

/// Nothing asked for and nothing in the player: the first lesson is on its
/// way, or could not even be started.
class _NoLesson extends ConsumerWidget {
  const _NoLesson();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final start = ref.watch(playerControllerProvider);
    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            const _Grabber(),
            Expanded(
              child: Center(
                child: start.hasError
                    ? Padding(
                        padding: const EdgeInsets.all(20),
                        child: ErrorView(
                          title: AppLocalizations.of(context)
                              .playbackFailedTitle,
                          error: start.error!,
                          onRetry: () => ref
                              .read(playerControllerProvider.notifier)
                              .retry(),
                        ),
                      )
                    : const CircularProgressIndicator(),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// The lesson just asked for, while it is on its way to the player or if it
/// could not be started: the same screen as when it plays, with the controls
/// waiting.
class _RequestedLesson extends ConsumerWidget {
  const _RequestedLesson({
    required this.courseId,
    required this.lessonIndex,
    required this.lesson,
  });

  final String courseId;
  final int lessonIndex;

  /// `null` while the course's lessons are loading.
  final Lesson? lesson;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final start = ref.watch(playerControllerProvider);
    final speed = ref.watch(playerStatusProvider).speed;
    final colors = CourseColors.resolve(context, courseId);
    final course = Courses.byId(courseId);
    final PlayerStatus waiting = (
      playing: false,
      processing: AudioProcessingState.loading,
      queueIndex: null,
      speed: speed,
      error: null,
    );

    return _PlayerLayout(
      colors: colors,
      cover: course?.cover,
      title: lesson?.title ?? '',
      course: course?.fullTitle ?? '',
      order: lesson == null ? null : lessonIndex,
      seekLine: SeekLine(
        position: Duration.zero,
        duration: lesson?.duration ?? Duration.zero,
        color: colors.ink,
      ),
      controls: (width) =>
          _ControlsAndExtras(width: width, status: waiting, colors: colors),
      error: start.hasError
          ? ErrorView(
              title: AppLocalizations.of(context).playbackFailedTitle,
              error: start.error!,
              color: colors.ink,
              onRetry: () =>
                  ref.read(playerControllerProvider.notifier).retry(),
            )
          : null,
    );
  }
}

/// The lesson in the player.
class _LessonInPlayer extends ConsumerWidget {
  const _LessonInPlayer({required this.item});

  final MediaItem item;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context);
    final status = ref.watch(playerStatusProvider);
    final handler = ref.watch(audioHandlerProvider);
    final colors = CourseColors.resolve(context, item.courseId);
    final duration = item.duration ?? Duration.zero;
    final queueIndex = status.queueIndex ?? 0;
    final queueLength = handler.queue.value.length;
    final failed = status.processing == AudioProcessingState.error;
    // The player's message does not say why loading failed. With no
    // connection and no download of the lesson, that is the reason.
    final downloaded = ref.watch(
      courseDownloadsProvider(item.courseId).select(
        (downloads) => downloads.value?[item.lessonId]?.isComplete ?? false,
      ),
    );
    final offline = ref.watch(onlineProvider) == false && !downloaded;
    // Watched for the lesson options.
    final finished = ref.watch(
      courseProgressProvider(
        item.courseId,
      ).select((progress) => progress.value?[item.lessonId]?.finished ?? false),
    );
    // In the course's metadata, which starting the lesson loaded.
    final lesson = ref.watch(
      courseMetadataProvider(item.courseId).select((metadata) {
        final index = metadata.value?.indexOf(item.lessonId);
        return index == null ? null : metadata.value!.lessons[index];
      }),
    );

    return _PlayerLayout(
      colors: colors,
      cover: Courses.byId(item.courseId)?.cover,
      title: item.title,
      course: item.artist ?? '',
      order: status.queueIndex,
      options: lesson == null
          ? null
          : IconButton(
              tooltip: l10n.lessonOptions,
              color: colors.ink,
              // The dots line up with the end of the seek line below.
              alignment: AlignmentDirectional.centerEnd,
              padding: EdgeInsets.zero,
              constraints: const BoxConstraints.tightFor(width: 48, height: 48),
              icon: const Icon(Icons.more_horiz),
              onPressed: () => _showOptions(
                context,
                ref,
                lesson: lesson,
                finished: finished,
              ),
            ),
      // Watches the position itself, so only the line follows playback.
      seekLine: Consumer(
        builder: (context, ref, _) => SeekLine(
          position: ref.watch(playbackPositionProvider).value ?? Duration.zero,
          duration: duration,
          color: colors.ink,
          onSeek: handler.seek,
        ),
      ),
      controls: (width) => _ControlsAndExtras(
        width: width,
        status: status,
        colors: colors,
        handler: handler,
        hasPrevious: queueIndex > 0,
        hasNext: queueIndex < queueLength - 1,
      ),
      error: failed
          ? ErrorView(
              title: l10n.playbackFailedTitle,
              error: status.error ?? '',
              kind: offline ? ErrorKind.offline : null,
              color: colors.ink,
              onRetry: () =>
                  ref.read(playerControllerProvider.notifier).retry(),
            )
          : null,
    );
  }

  void _showOptions(
    BuildContext context,
    WidgetRef ref, {
    required Lesson lesson,
    required bool finished,
  }) => showLessonOptions(
    context,
    ref,
    courseId: item.courseId,
    lesson: lesson,
    finished: finished,
    more: [
      SheetAction(
        icon: Icons.list,
        label: Courses.byId(item.courseId)?.fullTitle ?? '',
        onSelected: () {
          final router = GoRouter.of(context);
          Navigator.of(context).pop();
          router.go(AppRoutes.course(item.courseId));
        },
      ),
    ],
  );
}

/// The player's screen: the grabber, the course cover, the lesson with
/// [options], and the seek line and [controls], or [error] in their place.
class _PlayerLayout extends StatelessWidget {
  const _PlayerLayout({
    required this.colors,
    required this.cover,
    required this.title,
    required this.course,
    required this.seekLine,
    required this.controls,
    this.order,
    this.options,
    this.error,
  });

  final CourseColors colors;

  /// The course cover's asset; `null` for a course this version does not
  /// know.
  final String? cover;

  final String title;
  final String course;

  /// Where the lesson is in its course, so a change of lesson moves the
  /// right way.
  final int? order;

  final Widget seekLine;

  /// The controls, fitted to the width they get.
  final Widget Function(double width) controls;

  final Widget? options;
  final Widget? error;

  /// Horizontal inset of the lesson and controls, inside the screen padding.
  static const _inset = 12.0;

  /// Widest the single column gets.
  static const _maxColumnWidth = 560.0;

  /// Below this height, a landscape screen uses two columns.
  static const _sidewaysMaxHeight = 480.0;

  @override
  Widget build(BuildContext context) {
    final lesson = Row(
      children: [
        Expanded(
          child: _LessonTitle(
            title: title,
            course: course,
            order: order,
            color: colors.ink,
          ),
        ),
        ?options,
      ],
    );

    return Scaffold(
      backgroundColor: colors.tint,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(8, 0, 8, 16),
          child: Column(
            children: [
              _Grabber(color: colors.ink),
              Expanded(
                child: LayoutBuilder(
                  builder: (context, constraints) {
                    // A phone on its side is too short for one column:
                    // the lesson goes left, the controls right.
                    final sideways =
                        constraints.maxWidth > constraints.maxHeight &&
                        constraints.maxHeight < _sidewaysMaxHeight;
                    // Tablets: one comfortable column instead of controls
                    // spread across the whole screen.
                    final width = sideways
                        ? constraints.maxWidth
                        : math.min(constraints.maxWidth, _maxColumnWidth);
                    final inner = width - 2 * _inset;
                    final Widget body;
                    if (sideways) {
                      final side = math.min(_Controls.fullWidth, inner / 2);
                      body = Row(
                        children: [
                          Expanded(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                lesson,
                                if (error == null) ...[
                                  const SizedBox(height: 20),
                                  seekLine,
                                ],
                              ],
                            ),
                          ),
                          const SizedBox(width: 32),
                          SizedBox(
                            width: side,
                            child: Center(child: error ?? controls(side)),
                          ),
                        ],
                      );
                    } else {
                      final cover = this.cover;
                      body = Column(
                        children: [
                          // The cover takes the room the rest leaves, or
                          // the room stays empty above the lesson.
                          if (cover == null)
                            const Spacer()
                          else
                            Expanded(child: _Cover(asset: cover)),
                          lesson,
                          const SizedBox(height: 16),
                          if (error case final error?)
                            error
                          else ...[
                            seekLine,
                            const SizedBox(height: 16),
                            controls(inner),
                          ],
                        ],
                      );
                    }
                    // At least as tall as the space, so the cover can fill
                    // what is left; with very large text it scrolls
                    // instead of overflowing.
                    return SingleChildScrollView(
                      child: ConstrainedBox(
                        constraints: BoxConstraints(
                          minHeight: constraints.maxHeight,
                        ),
                        child: IntrinsicHeight(
                          child: Center(
                            child: SizedBox(
                              width: width,
                              child: Padding(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: _inset,
                                ),
                                child: body,
                              ),
                            ),
                          ),
                        ),
                      ),
                    );
                  },
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// The lesson's title and course. When the lesson changes, the new one
/// slides in from the side it comes from: from the end for the next lesson,
/// from the start for an earlier one.
class _LessonTitle extends StatefulWidget {
  const _LessonTitle({
    required this.title,
    required this.course,
    required this.order,
    required this.color,
  });

  final String title;
  final String course;
  final int? order;
  final Color color;

  @override
  State<_LessonTitle> createState() => _LessonTitleState();
}

class _LessonTitleState extends State<_LessonTitle> {
  bool _forward = true;

  /// How far a title moves, as a share of its width.
  static const _shift = 0.12;

  @override
  void didUpdateWidget(_LessonTitle oldWidget) {
    super.didUpdateWidget(oldWidget);
    final (before, now) = (oldWidget.order, widget.order);
    if (before != null && now != null && before != now) {
      _forward = now > before;
    }
  }

  @override
  Widget build(BuildContext context) {
    final text = Theme.of(context).textTheme;
    final key = ValueKey('${widget.course}/${widget.title}');
    final towardsEnd =
        _forward == (Directionality.of(context) == TextDirection.ltr);
    return AnimatedSwitcher(
      duration: Motion.of(context, Motion.standard),
      switchInCurve: Motion.enter,
      switchOutCurve: Motion.exit,
      layoutBuilder: (current, previous) => Stack(
        alignment: AlignmentDirectional.centerStart,
        children: [...previous, ?current],
      ),
      transitionBuilder: (child, animation) {
        // The new title comes in from one side, the old one leaves to the
        // other.
        final incoming = child.key == key;
        final from = (incoming == towardsEnd) ? _shift : -_shift;
        return FadeTransition(
          opacity: animation,
          child: SlideTransition(
            position: animation.drive(
              Tween(begin: Offset(from, 0), end: Offset.zero),
            ),
            child: child,
          ),
        );
      },
      child: Column(
        key: key,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Semantics(
            header: true,
            child: Text(
              widget.title,
              style: text.titleLarge?.copyWith(color: widget.color),
            ),
          ),
          Text(
            widget.course,
            style: text.bodyLarge?.copyWith(color: widget.color),
          ),
        ],
      ),
    );
  }
}

/// The course cover, as on the lock screen, centred in the room the column
/// leaves above the lesson: as wide as the column where the height allows,
/// smaller where it does not, and left out when too little is left, so it
/// never pushes the controls off the screen.
class _Cover extends StatelessWidget {
  const _Cover({required this.asset});

  final String asset;

  static const _gap = 24.0;
  static const _minSize = 120.0;

  @override
  Widget build(BuildContext context) => CustomSingleChildLayout(
    delegate: const _LeftoverRoom(),
    child: LayoutBuilder(
      builder: (context, room) {
        final size = math.min(room.maxWidth, room.maxHeight - _gap);
        if (size < _minSize) return const SizedBox.shrink();
        return Padding(
          padding: const EdgeInsets.only(bottom: _gap),
          child: Center(
            child: CourseCover(asset: asset, size: size, radius: 8),
          ),
        );
      },
    ),
  );
}

/// Takes the room the column gives it without asking for any: its intrinsic
/// height is zero, so it never makes the player scroll.
class _LeftoverRoom extends SingleChildLayoutDelegate {
  const _LeftoverRoom();

  @override
  BoxConstraints getConstraintsForChild(BoxConstraints constraints) =>
      BoxConstraints.loose(constraints.biggest);

  @override
  bool shouldRelayout(_LeftoverRoom oldDelegate) => false;
}

/// The handle along the top: the player is a sheet that is swiped down to
/// close. Tapping the handle closes it too, which is how screen readers
/// close it.
class _Grabber extends StatelessWidget {
  const _Grabber({this.color});

  final Color? color;

  @override
  Widget build(BuildContext context) {
    final ink = color ?? LtColors.of(context).ink;
    return Tooltip(
      message: AppLocalizations.of(context).closePlayer,
      child: Semantics(
        button: true,
        child: GestureDetector(
          behavior: HitTestBehavior.opaque,
          onTap: () => Navigator.of(context).pop(),
          child: SizedBox(
            width: 96,
            height: 48,
            child: Align(
              alignment: Alignment.topCenter,
              child: Container(
                margin: const EdgeInsets.only(top: 10),
                width: 36,
                height: 4,
                decoration: BoxDecoration(
                  color: ink.withValues(alpha: 0.4),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// The transport controls, and [PlayerExtras] below them. Without a
/// [handler] they wait for the lesson: disabled, with play/pause showing
/// [status].
class _ControlsAndExtras extends StatelessWidget {
  const _ControlsAndExtras({
    required this.width,
    required this.status,
    required this.colors,
    this.handler,
    this.hasPrevious = false,
    this.hasNext = false,
  });

  final double width;
  final PlayerStatus status;
  final CourseColors colors;
  final LessonAudioHandler? handler;
  final bool hasPrevious;
  final bool hasNext;

  @override
  Widget build(BuildContext context) {
    final handler = this.handler;
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        _Controls(
          width: width,
          status: status,
          color: colors.ink,
          background: colors.tint,
          handler: handler,
          hasPrevious: hasPrevious,
          hasNext: hasNext,
        ),
        const SizedBox(height: 16),
        SizedBox(
          width: width,
          child: PlayerExtras(
            speed: status.speed,
            color: colors.ink,
            onSpeed: handler?.setSpeed,
            onSleepTimer: handler?.setSleepTimer,
          ),
        ),
      ],
    );
  }
}

/// Previous, back 10 s, play/pause, forward 10 s, next, fitted to [width]:
/// on narrow screens the side buttons shrink to the 48 dp minimum touch
/// target first, then play/pause gives up some of its size.
class _Controls extends StatelessWidget {
  const _Controls({
    required this.width,
    required this.status,
    required this.color,
    required this.background,
    required this.handler,
    required this.hasPrevious,
    required this.hasNext,
  });

  /// Room for everything at full size.
  static const double fullWidth = 4 * _sideFull + _playFull;

  static const _sideFull = 56.0;
  static const _sideMin = 48.0;
  static const _playFull = 96.0;
  static const _playMin = 80.0;

  final double width;
  final PlayerStatus status;
  final Color color;
  final Color background;

  /// `null` while the lesson is not in the player yet.
  final LessonAudioHandler? handler;

  final bool hasPrevious;
  final bool hasNext;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final handler = this.handler;
    final side = width >= fullWidth ? _sideFull : _sideMin;
    final play = (width - 4 * side).clamp(_playMin, _playFull);
    return SizedBox(
      width: width,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          _ControlButton(
            icon: Icons.skip_previous_rounded,
            label: l10n.previousLesson,
            color: color,
            extent: side,
            onPressed: hasPrevious ? handler?.skipToPrevious : null,
          ),
          _ControlButton(
            icon: Icons.replay_10_rounded,
            label: l10n.back10,
            color: color,
            extent: side,
            iconSize: 40,
            onPressed: handler?.rewind,
          ),
          PlayPauseButton(
            status: status,
            background: color,
            foreground: background,
            onPlay: handler?.play,
            onPause: handler?.pause,
            size: play,
          ),
          _ControlButton(
            icon: Icons.forward_10_rounded,
            label: l10n.forward10,
            color: color,
            extent: side,
            iconSize: 40,
            onPressed: handler?.fastForward,
          ),
          _ControlButton(
            icon: Icons.skip_next_rounded,
            label: l10n.nextLesson,
            color: color,
            extent: side,
            onPressed: hasNext ? handler?.skipToNext : null,
          ),
        ],
      ),
    );
  }
}

class _ControlButton extends StatelessWidget {
  const _ControlButton({
    required this.icon,
    required this.label,
    required this.color,
    required this.extent,
    required this.onPressed,
    this.iconSize = 32,
  });

  final IconData icon;
  final String label;
  final Color color;

  /// Width and height of the touch target.
  final double extent;

  final VoidCallback? onPressed;
  final double iconSize;

  @override
  Widget build(BuildContext context) => IconButton(
    tooltip: label,
    iconSize: iconSize,
    color: color,
    disabledColor: color.withValues(alpha: 0.35),
    padding: EdgeInsets.zero,
    constraints: BoxConstraints.tightFor(width: extent, height: extent),
    icon: Icon(icon),
    onPressed: onPressed,
  );
}
