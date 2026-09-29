import 'package:audio_service/audio_service.dart';
import 'package:flutter/material.dart';
import 'package:languagetransfer/src/features/player/application/player_providers.dart';
import 'package:languagetransfer/src/l10n/app_localizations.dart';

/// The square play/pause control, echoing the covers' square nodes.
/// The largest control wherever it appears: pausing is the most frequent
/// action in a Thinking Method lesson.
class PlayPauseButton extends StatelessWidget {
  const PlayPauseButton({
    required this.status,
    required this.background,
    required this.foreground,
    required this.onPlay,
    required this.onPause,
    this.onRetry,
    this.size = 120,
    super.key,
  });

  final PlayerStatus status;
  final Color background;
  final Color foreground;
  final VoidCallback onPlay;
  final VoidCallback onPause;

  /// Loads the lesson again after a failure. Without it, a failed lesson
  /// shows the play control.
  final VoidCallback? onRetry;

  final double size;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final loading =
        status.processing == AudioProcessingState.loading ||
        status.processing == AudioProcessingState.buffering;
    final playing = status.playing;
    final retry = status.processing == AudioProcessingState.error
        ? onRetry
        : null;

    return Semantics(
      button: true,
      label: retry != null
          ? l10n.tryAgain
          : loading
          ? l10n.loading
          : playing
          ? l10n.pause
          : l10n.play,
      excludeSemantics: true,
      child: Material(
        color: background,
        borderRadius: BorderRadius.circular(size / 12),
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: retry ?? (playing ? onPause : onPlay),
          splashColor: foreground.withValues(alpha: 0.2),
          child: SizedBox.square(
            dimension: size,
            child: Center(
              child: loading && !playing
                  ? SizedBox.square(
                      dimension: size * 0.3,
                      child: CircularProgressIndicator(
                        color: foreground,
                        strokeWidth: size / 30,
                      ),
                    )
                  : Icon(
                      retry != null
                          ? Icons.refresh_rounded
                          : playing
                          ? Icons.pause_rounded
                          : Icons.play_arrow_rounded,
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
