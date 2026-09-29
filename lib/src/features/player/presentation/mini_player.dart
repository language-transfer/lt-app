import 'dart:async';

import 'package:audio_service/audio_service.dart';
import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:flutter/semantics.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:languagetransfer/src/core/theme/course_colors.dart';
import 'package:languagetransfer/src/core/theme/motion.dart';
import 'package:languagetransfer/src/features/catalog/domain/course.dart';
import 'package:languagetransfer/src/features/catalog/presentation/course_cover.dart';
import 'package:languagetransfer/src/features/player/application/player_providers.dart';
import 'package:languagetransfer/src/features/player/data/lesson_audio_handler.dart';
import 'package:languagetransfer/src/features/player/presentation/play_pause_button.dart';
import 'package:languagetransfer/src/features/player/presentation/player_sheet.dart';
import 'package:languagetransfer/src/l10n/app_localizations.dart';

/// The playing lesson at the bottom of every other screen, so listening
/// continues while browsing.
class MiniPlayer extends ConsumerWidget {
  const MiniPlayer({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final item = ref.watch(activeLessonProvider);
    final visible = item != null;
    // Slides up from the bottom edge when playback starts, and back down
    // when it stops.
    return AnimatedSwitcher(
      duration: Motion.of(context, Motion.standard),
      switchInCurve: Motion.enter,
      switchOutCurve: Motion.exit,
      transitionBuilder: (child, animation) => SizeTransition(
        sizeFactor: animation,
        alignment: Alignment.bottomCenter,
        child: child,
      ),
      child: visible
          ? _Band(key: const ValueKey('band'), item: item)
          : const SizedBox.shrink(),
    );
  }
}

/// The mini-player itself: the course cover, the lesson and play/pause,
/// between equal margins.
class _Band extends ConsumerWidget {
  const _Band({required this.item, super.key});

  final MediaItem item;

  static const _margin = 20.0;
  static const _gap = 12.0;
  static const _square = 48.0;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final status = ref.watch(playerStatusProvider);
    final l10n = AppLocalizations.of(context);
    final text = Theme.of(context).textTheme;
    final colors = CourseColors.resolve(context, item.courseId);
    final handler = ref.watch(audioHandlerProvider);
    final cover = Courses.byId(item.courseId)?.cover;
    final failed = status.processing == AudioProcessingState.error;
    // After a failure the course gives way to what happened; the player
    // explains more.
    final detail = failed ? l10n.playbackFailedTitle : item.artist ?? '';
    final queueIndex = status.queueIndex;
    final onNext =
        queueIndex != null && queueIndex < handler.queue.value.length - 1
        ? handler.skipToNext
        : null;
    final onPrevious = queueIndex != null && queueIndex > 0
        ? handler.skipToPrevious
        : null;

    return _SwipeUpToOpen(
      child: Material(
        color: colors.tint,
        child: SafeArea(
          top: false,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              _Progress(
                duration: item.duration ?? Duration.zero,
                color: colors.ink,
              ),
              Row(
                children: [
                  Expanded(
                    child: Semantics(
                      button: true,
                      label: '${l10n.openPlayer}, ${item.title}, $detail',
                      excludeSemantics: true,
                      // What the sideways swipe does.
                      customSemanticsActions: {
                        CustomSemanticsAction(label: l10n.nextLesson): ?onNext,
                        CustomSemanticsAction(label: l10n.previousLesson):
                            ?onPrevious,
                      },
                      child: InkWell(
                        onTap: () => showPlayer(context),
                        child: Padding(
                          padding: const EdgeInsets.fromLTRB(
                            _margin,
                            10,
                            _gap,
                            10,
                          ),
                          child: Row(
                            children: [
                              if (cover != null) ...[
                                CourseCover(
                                  asset: cover,
                                  size: _square,
                                  radius: PlayPauseButton.radiusFor(_square),
                                ),
                                const SizedBox(width: _gap),
                              ],
                              Expanded(
                                child: _SwipeToSkip(
                                  lessonId: item.lessonId,
                                  onNext: onNext,
                                  onPrevious: onPrevious,
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        item.title,
                                        style: text.titleSmall?.copyWith(
                                          color: colors.ink,
                                        ),
                                      ),
                                      Text(
                                        detail,
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                        style: text.bodySmall?.copyWith(
                                          color: colors.ink,
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
                  ),
                  Padding(
                    padding: const EdgeInsetsDirectional.only(end: _margin),
                    child: PlayPauseButton(
                      status: status,
                      background: colors.ink,
                      foreground: colors.tint,
                      onPlay: handler.play,
                      onPause: handler.pause,
                      onRetry: () => unawaited(
                        ref.read(playerControllerProvider.notifier).retry(),
                      ),
                      size: _square,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// The lesson in the mini-player, swiped sideways to skip, as in other
/// audio apps: left to the next lesson, right to the one before. It follows
/// the finger; the new lesson slides in from the other side. Without a
/// lesson that way it only gives a little and springs back.
class _SwipeToSkip extends StatefulWidget {
  const _SwipeToSkip({
    required this.lessonId,
    required this.onNext,
    required this.onPrevious,
    required this.child,
  });

  final String lessonId;

  /// `null` at the end of the course.
  final VoidCallback? onNext;

  /// `null` at the start of the course.
  final VoidCallback? onPrevious;

  final Widget child;

  @override
  State<_SwipeToSkip> createState() => _SwipeToSkipState();
}

class _SwipeToSkipState extends State<_SwipeToSkip>
    with SingleTickerProviderStateMixin {
  /// How far the lesson is moved sideways, in logical pixels.
  late final _offset = AnimationController.unbounded(vsync: this);

  /// The way the lesson left after a swipe (-1 left, 1 right), until the
  /// next one arrives; 0 otherwise.
  int _leaving = 0;

  /// The width at the last swipe, for bringing the next lesson in.
  double _width = 0;

  /// Brings the lesson back if the skip does not happen.
  Timer? _giveUp;

  /// How much a swipe towards no lesson moves it.
  static const _resistance = 0.3;

  void _update(DragUpdateDetails details) {
    final delta = details.primaryDelta ?? 0;
    final towards = _offset.value + delta;
    final possible = towards < 0
        ? widget.onNext != null
        : widget.onPrevious != null;
    _offset.value += possible ? delta : delta * _resistance;
  }

  void _end(double velocity) {
    _width = context.size?.width ?? 0;
    final offset = _offset.value;
    final next = velocity.abs() > Motion.flickVelocity
        ? velocity < 0
        : offset < -_width / 3;
    final previous = velocity.abs() > Motion.flickVelocity
        ? velocity > 0
        : offset > _width / 3;
    final skip = next
        ? widget.onNext
        : previous
        ? widget.onPrevious
        : null;
    if (skip == null) {
      _settle();
      return;
    }
    _leaving = next ? -1 : 1;
    unawaited(HapticFeedback.selectionClick());
    _offset.animateTo(
      _leaving * _width,
      duration: Motion.of(context, Motion.quick),
      curve: Motion.exit,
    );
    skip();
    _giveUp?.cancel();
    _giveUp = Timer(const Duration(seconds: 2), () {
      if (!mounted || _leaving == 0) return;
      _leaving = 0;
      _settle();
    });
  }

  void _settle() => _offset.animateTo(
    0,
    duration: Motion.of(context, Motion.standard),
    curve: Motion.enter,
  );

  @override
  void didUpdateWidget(_SwipeToSkip oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.lessonId != widget.lessonId && _leaving != 0) {
      _giveUp?.cancel();
      _offset.value = -_leaving * _width;
      _leaving = 0;
      _settle();
    }
  }

  @override
  void dispose() {
    _giveUp?.cancel();
    _offset.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => GestureDetector(
    onHorizontalDragUpdate: _update,
    onHorizontalDragEnd: (details) => _end(details.primaryVelocity ?? 0),
    onHorizontalDragCancel: _settle,
    child: ClipRect(
      child: LayoutBuilder(
        builder: (context, constraints) => AnimatedBuilder(
          animation: _offset,
          builder: (context, child) {
            final width = constraints.maxWidth;
            final gone = width > 0
                ? (_offset.value.abs() / width).clamp(0.0, 1.0)
                : 0.0;
            return Transform.translate(
              offset: Offset(_offset.value, 0),
              child: Opacity(opacity: 1 - gone, child: child),
            );
          },
          child: widget.child,
        ),
      ),
    ),
  );
}

/// Opens the player when swiped up, as in other audio apps, with the
/// sheet following the finger.
class _SwipeUpToOpen extends StatefulWidget {
  const _SwipeUpToOpen({required this.child});

  final Widget child;

  @override
  State<_SwipeUpToOpen> createState() => _SwipeUpToOpenState();
}

class _SwipeUpToOpenState extends State<_SwipeUpToOpen> {
  /// The sheet this swipe moves, once it has gone up.
  PlayerSheetDrag? _sheet;

  /// Whether this swipe went down first, which does nothing.
  bool _ignored = false;

  void _update(DragUpdateDetails details) {
    final delta = details.primaryDelta ?? 0;
    if (_ignored || delta == 0) return;
    if (_sheet == null && delta > 0) {
      _ignored = true;
      return;
    }
    (_sheet ??= dragPlayerOpen(context)).update(delta);
  }

  void _end(double velocity) {
    _sheet?.end(velocity);
    _sheet = null;
    _ignored = false;
  }

  @override
  void dispose() {
    // Gone mid-swipe, for example when playback stops.
    _sheet?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => GestureDetector(
    // From where the finger went down, so the sheet stays under it.
    dragStartBehavior: DragStartBehavior.down,
    onVerticalDragUpdate: _update,
    onVerticalDragEnd: (details) => _end(details.primaryVelocity ?? 0),
    onVerticalDragCancel: () => _end(0),
    child: widget.child,
  );
}

/// The line along the top edge. Watches the position itself, so only the
/// line follows playback.
class _Progress extends ConsumerWidget {
  const _Progress({required this.duration, required this.color});

  final Duration duration;
  final Color color;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Under the open player it stays on screen, unseen; it catches up when
    // its page is on top again.
    final onTop = ModalRoute.isCurrentOf(context) ?? true;
    final position =
        (onTop
                ? ref.watch(playbackPositionProvider)
                : ref.read(playbackPositionProvider))
            .value ??
        Duration.zero;
    final fraction = duration.inMilliseconds <= 0
        ? 0.0
        : (position.inMilliseconds / duration.inMilliseconds).clamp(0.0, 1.0);
    return ExcludeSemantics(
      child: LinearProgressIndicator(
        value: fraction,
        minHeight: 2,
        color: color,
        backgroundColor: color.withValues(alpha: 0.2),
      ),
    );
  }
}
