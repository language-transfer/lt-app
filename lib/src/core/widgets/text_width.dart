import 'dart:math' as math;

import 'package:flutter/widgets.dart';

/// Width of the widest of [texts] drawn on one line in [style], at the
/// system text size.
double widestTextWidth(
  BuildContext context,
  Iterable<String> texts,
  TextStyle? style,
) {
  var widest = 0.0;
  for (final text in texts) {
    final painter = TextPainter(
      text: TextSpan(text: text, style: style),
      textDirection: Directionality.of(context),
      textScaler: MediaQuery.textScalerOf(context),
      maxLines: 1,
    )..layout();
    widest = math.max(widest, painter.width);
    painter.dispose();
  }
  return widest;
}
