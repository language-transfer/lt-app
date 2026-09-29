import 'dart:async';
import 'dart:math' as math;

import 'package:audio_service/audio_service.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:languagetransfer/src/core/errors/error_kind.dart';
import 'package:languagetransfer/src/core/network/connectivity.dart';
import 'package:languagetransfer/src/core/providers.dart';
import 'package:languagetransfer/src/core/routing/app_routes.dart';
import 'package:languagetransfer/src/core/theme/course_colors.dart';
import 'package:languagetransfer/src/core/widgets/error_view.dart';
import 'package:languagetransfer/src/features/catalog/application/catalog_providers.dart';
import 'package:languagetransfer/src/features/catalog/domain/course.dart';
import 'package:languagetransfer/src/features/downloads/application/download_providers.dart';
import 'package:languagetransfer/src/features/downloads/presentation/lesson_download_tile.dart';
import 'package:languagetransfer/src/features/player/application/player_providers.dart';
import 'package:languagetransfer/src/features/player/data/lesson_audio_handler.dart';
import 'package:languagetransfer/src/features/player/presentation/play_pause_button.dart';
import 'package:languagetransfer/src/features/player/presentation/seek_line.dart';
import 'package:languagetransfer/src/features/progress/application/progress_providers.dart';
import 'package:languagetransfer/src/features/settings/domain/app_settings.dart';
import 'package:languagetransfer/src/l10n/app_localizations.dart';

/// The lesson being played, filling the screen in the course's tint.
class PlayerScreen extends ConsumerWidget {
  const PlayerScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context);
    final text = Theme.of(context).textTheme;
    final item = ref.watch(nowPlayingProvider).value;
    final status = ref.watch(playerStatusProvider);
    final handler = ref.watch(audioHandlerProvider);

    if (item == null) {
      // The first lesson is on its way, or could not even be started.
      final start = ref.watch(playerControllerProvider);
      return Scaffold(
        body: SafeArea(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Padding(
                padding: EdgeInsets.fromLTRB(8, 4, 8, 0),
                child: _CloseButton(),
              ),
              Expanded(
                child: Center(
                  child: start.hasError
                      ? Padding(
                          padding: const EdgeInsets.all(20),
                          child: ErrorView(
                            title: l10n.playbackFailedTitle,
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
    final colors = CourseColors.resolve(context, item.courseId);
    final duration = item.duration ?? Duration.zero;
    final queueIndex = status.queueIndex ?? 0;
    final queueLength = handler.queue.value.length;
    final failed = status.processing == AudioProcessingState.error;
    // The player's message does not say why loading failed. With no
    // connection and no download of the lesson, that is the reason.
    final downloaded =
        ref
            .watch(courseDownloadsProvider(item.courseId))
            .value?[item.lessonId]
            ?.isComplete ??
        false;
    final offline = ref.watch(onlineProvider) == false && !downloaded;

    final title = Semantics(
      header: true,
      child: Text(
        item.title,
        style: text.displayMedium?.copyWith(color: colors.ink),
      ),
    );
    final course = Text(
      item.artist ?? '',
      style: text.titleMedium?.copyWith(color: colors.ink),
    );
    final error = ErrorView(
      title: l10n.playbackFailedTitle,
      error: status.error ?? '',
      kind: offline ? ErrorKind.offline : null,
      color: colors.ink,
      onRetry: () => ref.read(playerControllerProvider.notifier).retry(),
    );
    // Watches the position itself, so only the line follows playback.
    final seekLine = Consumer(
      builder: (context, ref, _) => SeekLine(
        position: ref.watch(playbackPositionProvider).value ?? Duration.zero,
        duration: duration,
        color: colors.ink,
        onSeek: handler.seek,
      ),
    );
    Widget controls(double width) => Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        _Controls(
          width: width,
          status: status,
          color: colors.ink,
          background: colors.tint,
          handler: handler,
          hasPrevious: queueIndex > 0,
          hasNext: queueIndex < queueLength - 1,
        ),
        const SizedBox(height: 20),
        _SpeedButton(
          speed: status.speed,
          color: colors.ink,
          onSelected: handler.setSpeed,
        ),
      ],
    );

    return Scaffold(
      backgroundColor: colors.tint,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(8, 4, 8, 16),
          child: Column(
            children: [
              Row(
                children: [
                  _CloseButton(color: colors.ink),
                  const Spacer(),
                  IconButton(
                    tooltip: l10n.courseOptions,
                    color: colors.ink,
                    icon: const Icon(Icons.more_horiz),
                    onPressed: () => _showOptions(context, ref, item),
                  ),
                ],
              ),
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
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                title,
                                const SizedBox(height: 4),
                                course,
                                if (!failed) ...[
                                  const SizedBox(height: 20),
                                  seekLine,
                                ],
                              ],
                            ),
                          ),
                          const SizedBox(width: 32),
                          SizedBox(
                            width: side,
                            child: Center(
                              child: failed ? error : controls(side),
                            ),
                          ),
                        ],
                      );
                    } else {
                      body = Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Spacer(flex: 2),
                          title,
                          const SizedBox(height: 4),
                          course,
                          const Spacer(flex: 3),
                          if (failed)
                            error
                          else ...[
                            seekLine,
                            const SizedBox(height: 28),
                            controls(inner),
                          ],
                          const Spacer(),
                        ],
                      );
                    }
                    // At least as tall as the space, so the spacers can
                    // spread the content; with very large text it scrolls
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

  /// Horizontal inset of the lesson and controls, inside the screen padding.
  static const _inset = 12.0;

  /// Widest the single column gets.
  static const _maxColumnWidth = 560.0;

  /// Below this height, a landscape screen uses two columns.
  static const _sidewaysMaxHeight = 480.0;

  void _showOptions(BuildContext context, WidgetRef ref, MediaItem item) {
    final l10n = AppLocalizations.of(context);
    final progress = ref.read(courseProgressProvider(item.courseId)).value;
    final finished = progress?[item.lessonId]?.finished ?? false;
    final metadata = ref.read(courseMetadataProvider(item.courseId)).value;
    final lessonIndex = metadata?.indexOf(item.lessonId);
    unawaited(
      showModalBottomSheet<void>(
        context: context,
        builder: (sheetContext) => SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ListTile(
                leading: Icon(finished ? Icons.remove_done : Icons.done),
                title: Text(
                  finished ? l10n.markNotFinished : l10n.markFinished,
                ),
                onTap: () {
                  Navigator.of(sheetContext).pop();
                  unawaited(
                    ref
                        .read(lessonCompletionProvider)
                        .setFinished(
                          item.courseId,
                          item.lessonId,
                          finished: !finished,
                        ),
                  );
                },
              ),
              if (lessonIndex != null)
                LessonDownloadTile(
                  courseId: item.courseId,
                  lesson: metadata!.lessons[lessonIndex],
                  onDone: () => Navigator.of(sheetContext).pop(),
                ),
              ListTile(
                leading: const Icon(Icons.list),
                title: Text(Courses.byId(item.courseId)?.fullTitle ?? ''),
                onTap: () {
                  Navigator.of(sheetContext).pop();
                  // Replaces the stack, which also closes the player.
                  context.go(AppRoutes.course(item.courseId));
                },
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _CloseButton extends StatelessWidget {
  const _CloseButton({this.color});

  final Color? color;

  @override
  Widget build(BuildContext context) => IconButton(
    tooltip: AppLocalizations.of(context).closePlayer,
    color: color,
    icon: const Icon(Icons.keyboard_arrow_down, size: 32),
    onPressed: () => context.pop(),
  );
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
  static const _playFull = 120.0;
  static const _playMin = 80.0;

  final double width;
  final PlayerStatus status;
  final Color color;
  final Color background;
  final LessonAudioHandler handler;
  final bool hasPrevious;
  final bool hasNext;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
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
            onPressed: hasPrevious ? handler.skipToPrevious : null,
          ),
          _ControlButton(
            icon: Icons.replay_10_rounded,
            label: l10n.back10,
            color: color,
            extent: side,
            iconSize: 40,
            onPressed: handler.rewind,
          ),
          PlayPauseButton(
            status: status,
            background: color,
            foreground: background,
            onPlay: handler.play,
            onPause: handler.pause,
            size: play,
          ),
          _ControlButton(
            icon: Icons.forward_10_rounded,
            label: l10n.forward10,
            color: color,
            extent: side,
            iconSize: 40,
            onPressed: handler.fastForward,
          ),
          _ControlButton(
            icon: Icons.skip_next_rounded,
            label: l10n.nextLesson,
            color: color,
            extent: side,
            onPressed: hasNext ? handler.skipToNext : null,
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

class _SpeedButton extends StatelessWidget {
  const _SpeedButton({
    required this.speed,
    required this.color,
    required this.onSelected,
  });

  final double speed;
  final Color color;
  final ValueChanged<double> onSelected;

  /// "1", "1.25", or "1,25" where the comma is the decimal separator.
  static String _format(double speed, String locale) =>
      NumberFormat.decimalPattern(locale).format(speed);

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final value = l10n.speedValue(_format(speed, l10n.localeName));
    // Outlined, so it reads as a control rather than a label.
    return OutlinedButton(
      style: OutlinedButton.styleFrom(
        foregroundColor: color,
        side: BorderSide(color: color.withValues(alpha: 0.5)),
        minimumSize: const Size(72, 44),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
      ),
      onPressed: () => showModalBottomSheet<void>(
        context: context,
        builder: (sheetContext) => SafeArea(
          child: RadioGroup<double>(
            groupValue: speed,
            onChanged: (selected) {
              Navigator.of(sheetContext).pop();
              if (selected != null) onSelected(selected);
            },
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                ListTile(
                  title: Text(
                    l10n.speed,
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                ),
                for (final option in AppSettings.speeds)
                  RadioListTile<double>(
                    value: option,
                    title: Text(
                      l10n.speedValue(_format(option, l10n.localeName)),
                    ),
                  ),
              ],
            ),
          ),
        ),
      ),
      child: Semantics(
        label: '${l10n.speed}, $value',
        excludeSemantics: true,
        child: Text(value),
      ),
    );
  }
}
