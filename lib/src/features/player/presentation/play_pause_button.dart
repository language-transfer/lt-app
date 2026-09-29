import 'package:audio_service/audio_service.dart';
import 'package:flutter/material.dart';
import 'package:languagetransfer/src/core/theme/motion.dart';
import 'package:languagetransfer/src/features/player/application/player_providers.dart';
import 'package:languagetransfer/src/l10n/app_localizations.dart';

/// The square play/pause control, echoing the covers' square nodes. Among
/// the player's controls it is by far the largest: pausing is the most
/// frequent action in a Thinking Method lesson.
class PlayPauseButton extends StatelessWidget {
  const PlayPauseButton({
    required this.status,
    required this.background,
    required this.foreground,
    required this.size,
    this.onPlay,
    this.onPause,
    this.onRetry,
    super.key,
  });

  final PlayerStatus status;
  final Color background;
  final Color foreground;

  /// `null` while there is nothing to play yet, such as before the lesson
  /// is in the player.
  final VoidCallback? onPlay;
  final VoidCallback? onPause;

  /// Loads the lesson again after a failure. Without it, a failed lesson
  /// shows the play control.
  final VoidCallback? onRetry;

  final double size;

  /// The corner radius of a square of [size], for things that sit beside
  /// it.
  static double radiusFor(double size) => size / 12;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final loading =
        status.processing == AudioProcessingState.loading ||
        status.processing == AudioProcessingState.buffering;
    final retry = status.processing == AudioProcessingState.error
        ? onRetry
        : null;
    // No icon: the loading indicator.
    final (String label, IconData? icon, VoidCallback? onTap) = switch ((
      retry,
      loading,
      status.playing,
    )) {
      (final retry?, _, _) => (l10n.tryAgain, Icons.refresh_rounded, retry),
      // Plays on from what is buffered, so it can be paused.
      (null, true, true) => (l10n.loading, Icons.pause_rounded, onPause),
      (null, true, false) => (l10n.loading, null, onPlay),
      (null, false, true) => (l10n.pause, Icons.pause_rounded, onPause),
      (null, false, false) => (l10n.play, Icons.play_arrow_rounded, onPlay),
    };

    return Semantics(
      button: true,
      label: label,
      excludeSemantics: true,
      child: Material(
        color: background,
        borderRadius: BorderRadius.circular(radiusFor(size)),
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: onTap,
          splashColor: foreground.withValues(alpha: 0.2),
          child: SizedBox.square(
            dimension: size,
            // Play, pause and loading give way to each other rather than
            // swapping in a frame.
            child: AnimatedSwitcher(
              duration: Motion.of(context, Motion.quick),
              switchInCurve: Motion.change,
              switchOutCurve: Motion.change,
              transitionBuilder: (child, animation) => FadeTransition(
                opacity: animation,
                child: ScaleTransition(
                  scale: animation.drive(Tween(begin: 0.7, end: 1)),
                  child: child,
                ),
              ),
              child: icon == null
                  ? SizedBox.square(
                      key: const ValueKey('loading'),
                      dimension: size * 0.3,
                      child: CircularProgressIndicator(
                        color: foreground,
                        strokeWidth: size / 30,
                      ),
                    )
                  : Icon(
                      key: ValueKey(icon),
                      icon,
                      color: foreground,
                      size: size * 0.55,
                    ),
            ),
          ),
        ),
      ),
    );
  }
}
