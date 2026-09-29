import 'package:flutter/material.dart';
import 'package:languagetransfer/src/core/format/duration_text.dart';
import 'package:languagetransfer/src/core/theme/motion.dart';
import 'package:languagetransfer/src/features/progress/domain/playback_rules.dart';
import 'package:languagetransfer/src/l10n/app_localizations.dart';

/// The playback position as a construction line with a square handle, and
/// the elapsed and remaining time below it.
///
/// Tap anywhere on the line or drag the handle.
/// Screen readers get an adjustable control that moves in ten-second steps.
class SeekLine extends StatefulWidget {
  const SeekLine({
    required this.position,
    required this.duration,
    required this.color,
    this.onSeek,
    super.key,
  });

  final Duration position;
  final Duration duration;
  final Color color;

  /// `null` while there is nothing to seek in, such as before the lesson is
  /// in the player.
  final ValueChanged<Duration>? onSeek;

  /// The handle's side, and while it is held.
  static const _handle = 18.0;
  static const _heldHandle = 24.0;

  /// Space at both ends of the line: half the largest handle, so the handle
  /// stays inside and a tap maps to the point the handle is drawn at.
  static const double _trackInset = _heldHandle / 2;

  @override
  State<SeekLine> createState() => _SeekLineState();
}

class _SeekLineState extends State<SeekLine> {
  /// Where the handle is while dragging, as a fraction of the duration.
  double? _dragFraction;

  double get _fraction {
    final duration = widget.duration.inMilliseconds;
    if (_dragFraction != null) return _dragFraction!;
    if (duration <= 0) return 0;
    return (widget.position.inMilliseconds / duration).clamp(0, 1);
  }

  Duration _at(double fraction) => widget.duration * fraction.clamp(0, 1);

  double _fractionAt(Offset local) {
    final track = (context.size?.width ?? 0) - 2 * SeekLine._trackInset;
    if (track <= 0) return 0;
    return ((local.dx - SeekLine._trackInset) / track).clamp(0, 1);
  }

  Duration _clamped(Duration target) => target.isNegative
      ? Duration.zero
      : target > widget.duration
      ? widget.duration
      : target;

  void _seekBy(Duration delta) =>
      widget.onSeek?.call(_clamped(widget.position + delta));

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final text = Theme.of(context).textTheme;
    final onSeek = widget.onSeek;
    final shown = _dragFraction == null ? widget.position : _at(_fraction);
    final remaining = DurationText.remaining(shown, widget.duration);
    String spoken(Duration value) => l10n.positionOf(
      DurationText.spoken(l10n, value),
      DurationText.spoken(l10n, widget.duration),
    );

    return Column(
      children: [
        Semantics(
          slider: true,
          label: l10n.positionInLesson,
          value: spoken(widget.position),
          increasedValue: onSeek == null
              ? null
              : spoken(_clamped(widget.position + PlaybackRules.skipInterval)),
          decreasedValue: onSeek == null
              ? null
              : spoken(_clamped(widget.position - PlaybackRules.skipInterval)),
          onIncrease: onSeek == null
              ? null
              : () => _seekBy(PlaybackRules.skipInterval),
          onDecrease: onSeek == null
              ? null
              : () => _seekBy(-PlaybackRules.skipInterval),
          // No LayoutBuilder: the player measures its content's intrinsic
          // height, which LayoutBuilder does not support. The line is as
          // wide as this widget, so gestures use its size.
          child: GestureDetector(
            behavior: HitTestBehavior.opaque,
            onTapUp: onSeek == null
                ? null
                : (details) => onSeek(_at(_fractionAt(details.localPosition))),
            onHorizontalDragStart: onSeek == null
                ? null
                : (details) => setState(
                    () => _dragFraction = _fractionAt(details.localPosition),
                  ),
            onHorizontalDragUpdate: onSeek == null
                ? null
                : (details) => setState(
                    () => _dragFraction = _fractionAt(details.localPosition),
                  ),
            onHorizontalDragEnd: onSeek == null
                ? null
                : (_) {
                    onSeek(_at(_fraction));
                    setState(() => _dragFraction = null);
                  },
            onHorizontalDragCancel: () => setState(() => _dragFraction = null),
            child: SizedBox(
              height: 48,
              width: double.infinity,
              // The handle grows under the finger while it is held.
              child: TweenAnimationBuilder<double>(
                tween: Tween(
                  end: _dragFraction == null
                      ? SeekLine._handle
                      : SeekLine._heldHandle,
                ),
                duration: Motion.of(context, Motion.quick),
                curve: Motion.change,
                builder: (context, handle, _) => CustomPaint(
                  painter: _SeekLinePainter(
                    fraction: _fraction,
                    color: widget.color,
                    handle: handle,
                  ),
                ),
              ),
            ),
          ),
        ),
        ExcludeSemantics(
          child: Row(
            children: [
              Text(
                DurationText.clock(shown),
                style: text.bodyMedium?.copyWith(color: widget.color),
              ),
              const Spacer(),
              Text(
                '−${DurationText.clock(remaining)}',
                style: text.bodyMedium?.copyWith(color: widget.color),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _SeekLinePainter extends CustomPainter {
  _SeekLinePainter({
    required this.fraction,
    required this.color,
    required this.handle,
  });

  final double fraction;
  final Color color;

  /// The handle's side.
  final double handle;

  @override
  void paint(Canvas canvas, Size size) {
    final y = size.height / 2;
    const inset = SeekLine._trackInset;
    final x = inset + (size.width - 2 * inset) * fraction;
    canvas
      ..drawLine(
        Offset(0, y),
        Offset(size.width, y),
        Paint()
          ..color = color.withValues(alpha: 0.35)
          ..strokeWidth = 2,
      )
      ..drawLine(
        Offset(0, y),
        Offset(x, y),
        Paint()
          ..color = color
          ..strokeWidth = 4,
      )
      ..drawRect(
        Rect.fromCenter(center: Offset(x, y), width: handle, height: handle),
        Paint()..color = color,
      );
  }

  @override
  bool shouldRepaint(_SeekLinePainter old) =>
      old.fraction != fraction || old.color != color || old.handle != handle;
}
