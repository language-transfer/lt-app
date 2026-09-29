import 'dart:async';

import 'package:audio_service/audio_service.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:languagetransfer/src/core/providers.dart';
import 'package:languagetransfer/src/core/routing/app_routes.dart';
import 'package:languagetransfer/src/core/theme/course_colors.dart';
import 'package:languagetransfer/src/features/player/application/player_providers.dart';
import 'package:languagetransfer/src/features/player/data/lesson_audio_handler.dart';
import 'package:languagetransfer/src/features/player/presentation/play_pause_button.dart';
import 'package:languagetransfer/src/l10n/app_localizations.dart';

/// The playing lesson at the bottom of every other screen, so listening
/// continues while browsing.
class MiniPlayer extends ConsumerWidget {
  const MiniPlayer({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final item = ref.watch(nowPlayingProvider).value;
    if (item == null || !ref.watch(miniPlayerVisibleProvider)) {
      return const SizedBox.shrink();
    }
    final status = ref.watch(playerStatusProvider);
    final l10n = AppLocalizations.of(context);
    final text = Theme.of(context).textTheme;
    final colors = CourseColors.resolve(context, item.courseId);
    final handler = ref.watch(audioHandlerProvider);
    final failed = status.processing == AudioProcessingState.error;
    // After a failure the course gives way to what happened; the player
    // explains more.
    final detail = failed ? l10n.playbackFailedTitle : item.artist ?? '';

    return Material(
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
                    child: InkWell(
                      onTap: () => context.push(AppRoutes.player),
                      child: Padding(
                        padding: const EdgeInsets.fromLTRB(20, 10, 12, 10),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
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
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.only(right: 12),
                  child: PlayPauseButton(
                    status: status,
                    background: colors.ink,
                    foreground: colors.tint,
                    onPlay: handler.play,
                    onPause: handler.pause,
                    onRetry: () => unawaited(
                      ref.read(playerControllerProvider.notifier).retry(),
                    ),
                    size: 48,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

/// The line along the top edge. Watches the position itself, so only the
/// line follows playback.
class _Progress extends ConsumerWidget {
  const _Progress({required this.duration, required this.color});

  final Duration duration;
  final Color color;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final position = ref.watch(playbackPositionProvider).value ?? Duration.zero;
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
