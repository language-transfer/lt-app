import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart' show NumberFormat;
import 'package:languagetransfer/src/core/format/duration_text.dart';
import 'package:languagetransfer/src/core/widgets/action_sheet.dart';
import 'package:languagetransfer/src/features/player/application/player_providers.dart';
import 'package:languagetransfer/src/features/player/domain/sleep_timer.dart';
import 'package:languagetransfer/src/features/player/presentation/player_dock.dart';
import 'package:languagetransfer/src/features/settings/domain/app_settings.dart';
import 'package:languagetransfer/src/l10n/app_localizations.dart';

/// The row under the player's controls: the speed at the start, the sleep
/// timer at the end, and on iOS the output picker between them.
class PlayerExtras extends StatelessWidget {
  const PlayerExtras({
    required this.speed,
    required this.color,
    required this.onSpeed,
    required this.onSleepTimer,
    super.key,
  });

  final double speed;
  final Color color;

  /// `null` while the lesson is not in the player yet, as [onSleepTimer].
  final ValueChanged<double>? onSpeed;
  final ValueChanged<SleepTimer?>? onSleepTimer;

  @override
  Widget build(BuildContext context) => Row(
    // Equal halves, so the output picker sits in the middle.
    children: [
      Expanded(
        child: Align(
          alignment: AlignmentDirectional.centerStart,
          child: _SpeedButton(speed: speed, color: color, onSelected: onSpeed),
        ),
      ),
      if (defaultTargetPlatform == TargetPlatform.iOS)
        _OutputPicker(color: color),
      Expanded(
        child: Align(
          alignment: AlignmentDirectional.centerEnd,
          child: _SleepButton(color: color, onSelected: onSleepTimer),
        ),
      ),
    ],
  );
}

/// Where the audio plays (AirPlay, Bluetooth, the phone): the system's own
/// picker, a native view (`RoutePickerFactory` in ios/Runner/AppDelegate.swift).
class _OutputPicker extends StatelessWidget {
  const _OutputPicker({required this.color});

  final Color color;

  static const _size = 48.0;

  @override
  Widget build(BuildContext context) => SizedBox.square(
    dimension: _size,
    child: PlayerPreview.of(context)
        ? null
        : UiKitView(
            // The colour is set when the view is made.
            key: ValueKey(color),
            viewType: 'languagetransfer/route-picker',
            creationParams: {'color': color.toARGB32()},
            creationParamsCodec: const StandardMessageCodec(),
          ),
  );
}

/// A quiet button in the row under the controls, lined up with the column's
/// edge on its side.
ButtonStyle _extraStyle(Color color, AlignmentGeometry alignment) =>
    TextButton.styleFrom(
      foregroundColor: color,
      disabledForegroundColor: color.withValues(alpha: 0.35),
      minimumSize: const Size(48, 48),
      padding: EdgeInsets.zero,
      alignment: alignment,
    );

class _SpeedButton extends StatelessWidget {
  const _SpeedButton({
    required this.speed,
    required this.color,
    required this.onSelected,
  });

  final double speed;
  final Color color;

  /// `null` while the lesson is not in the player yet.
  final ValueChanged<double>? onSelected;

  /// "1", "1.25", or "1,25" where the comma is the decimal separator.
  static String _format(double speed, String locale) =>
      NumberFormat.decimalPattern(locale).format(speed);

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final value = l10n.speedValue(_format(speed, l10n.localeName));
    final onSelected = this.onSelected;
    return TextButton(
      style: _extraStyle(color, AlignmentDirectional.centerStart),
      onPressed: onSelected == null
          ? null
          : () => showActionSheet(
              context,
              title: l10n.speed,
              actions: [_SpeedOptions(speed: speed, onSelected: onSelected)],
            ),
      child: Semantics(
        label: '${l10n.speed}, $value',
        excludeSemantics: true,
        child: Text(value),
      ),
    );
  }
}

/// The speeds, with [speed] selected. Choosing one closes the sheet.
class _SpeedOptions extends StatelessWidget {
  const _SpeedOptions({required this.speed, required this.onSelected});

  final double speed;
  final ValueChanged<double> onSelected;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return RadioGroup<double>(
      groupValue: speed,
      onChanged: (selected) {
        Navigator.of(context).pop();
        if (selected != null) onSelected(selected);
      },
      child: Column(
        children: [
          for (final option in AppSettings.speeds)
            RadioListTile<double>(
              value: option,
              title: Text(
                l10n.speedValue(_SpeedButton._format(option, l10n.localeName)),
              ),
            ),
        ],
      ),
    );
  }
}

/// The sleep timer: a moon, with the time left or "End of lesson" beside
/// it while it is set.
class _SleepButton extends ConsumerWidget {
  const _SleepButton({required this.color, required this.onSelected});

  final Color color;

  /// `null` while the lesson is not in the player yet.
  final ValueChanged<SleepTimer?>? onSelected;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context);
    final timer = ref.watch(sleepTimerProvider).value;
    final onSelected = this.onSelected;
    final shown = switch (timer) {
      null => null,
      SleepAtLessonEnd() => l10n.sleepTimerEndOfLesson,
      final SleepAfter after => l10n.sleepTimerMinutes(after.minutesLeft),
    };
    final spoken = switch (timer) {
      null => l10n.sleepTimerOff,
      SleepAtLessonEnd() => l10n.sleepTimerEndOfLesson,
      final SleepAfter after => l10n.timeLeft(
        DurationText.spoken(l10n, Duration(minutes: after.minutesLeft)),
      ),
    };
    return TextButton(
      style: _extraStyle(color, AlignmentDirectional.centerEnd),
      onPressed: onSelected == null
          ? null
          : () => showActionSheet(
              context,
              title: l10n.sleepTimer,
              actions: [_SleepOptions(timer: timer, onSelected: onSelected)],
            ),
      child: Semantics(
        label: '${l10n.sleepTimer}, $spoken',
        excludeSemantics: true,
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (shown != null) ...[
              Flexible(
                child: Text(
                  shown,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              const SizedBox(width: 8),
            ],
            Icon(timer == null ? Icons.bedtime_outlined : Icons.bedtime),
          ],
        ),
      ),
    );
  }
}

/// Off, the end of the lesson, and the times on offer, with [timer]
/// selected; a countdown under way matches none of them. Choosing one closes
/// the sheet.
class _SleepOptions extends StatelessWidget {
  const _SleepOptions({required this.timer, required this.onSelected});

  final SleepTimer? timer;
  final ValueChanged<SleepTimer?> onSelected;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return RadioGroup<SleepTimer?>(
      groupValue: timer,
      onChanged: (selected) {
        Navigator.of(context).pop();
        onSelected(selected);
      },
      child: Column(
        children: [
          RadioListTile<SleepTimer?>(
            value: null,
            title: Text(l10n.sleepTimerOff),
          ),
          RadioListTile<SleepTimer?>(
            value: const SleepAtLessonEnd(),
            title: Text(l10n.sleepTimerEndOfLesson),
          ),
          for (final minutes in SleepAfter.choices)
            RadioListTile<SleepTimer?>(
              value: SleepAfter(Duration(minutes: minutes)),
              title: Text(l10n.sleepTimerMinutes(minutes)),
            ),
        ],
      ),
    );
  }
}
