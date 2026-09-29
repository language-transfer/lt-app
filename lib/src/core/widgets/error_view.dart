import 'package:flutter/material.dart';
import 'package:languagetransfer/src/core/errors/error_kind.dart';
import 'package:languagetransfer/src/l10n/app_localizations.dart';

/// Says what went wrong and what to do about it, with a way to try again.
class ErrorView extends StatelessWidget {
  const ErrorView({
    required this.title,
    required this.error,
    required this.onRetry,
    this.color,
    this.kind,
    super.key,
  });

  final String title;
  final Object error;
  final VoidCallback onRetry;

  /// Text colour, for use on a course tint.
  final Color? color;

  /// The cause, when the caller knows it better than [error] tells, such as
  /// a player message that does not say the device is offline.
  final ErrorKind? kind;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final text = Theme.of(context).textTheme;
    final body = (kind ?? ErrorKind.of(error)).body(l10n);
    return Semantics(
      liveRegion: true,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(title, style: text.titleMedium?.copyWith(color: color)),
          const SizedBox(height: 6),
          Text(body, style: text.bodyLarge?.copyWith(color: color)),
          const SizedBox(height: 16),
          OutlinedButton(
            onPressed: onRetry,
            style: OutlinedButton.styleFrom(
              foregroundColor: color,
              side: BorderSide(color: color ?? text.bodyLarge!.color!),
              minimumSize: const Size(48, 48),
              textStyle: text.labelLarge,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(4),
              ),
            ),
            child: Text(l10n.tryAgain),
          ),
        ],
      ),
    );
  }
}
