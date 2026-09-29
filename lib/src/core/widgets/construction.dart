import 'package:flutter/material.dart';

/// Drawing pieces from Language Transfer's course covers: thin lines joined
/// by small square nodes. Used only for sequences and positions, so they
/// keep that meaning.

/// How far a lesson got, drawn as its node.
enum NodeState { notStarted, inProgress, finished }

/// A course's progress: a line from start to end, heavier up to [fraction],
/// with a square node where finished turns into not finished.
class ProgressLine extends StatelessWidget {
  const ProgressLine({required this.fraction, required this.color, super.key});

  /// 0 to 1.
  final double fraction;
  final Color color;

  @override
  Widget build(BuildContext context) => ExcludeSemantics(
    child: SizedBox(
      height: 12,
      width: double.infinity,
      child: CustomPaint(
        painter: _ProgressLinePainter(fraction.clamp(0, 1), color),
      ),
    ),
  );
}

class _ProgressLinePainter extends CustomPainter {
  _ProgressLinePainter(this.fraction, this.color);

  final double fraction;
  final Color color;

  @override
  void paint(Canvas canvas, Size size) {
    final y = size.height / 2;
    const node = 8.0;
    final x = node / 2 + (size.width - node) * fraction;
    canvas
      ..drawLine(
        Offset(0, y),
        Offset(size.width, y),
        Paint()
          ..color = color.withValues(alpha: 0.35)
          ..strokeWidth = 1,
      )
      ..drawLine(
        Offset(0, y),
        Offset(x, y),
        Paint()
          ..color = color
          ..strokeWidth = 3,
      )
      ..drawRect(
        Rect.fromCenter(center: Offset(x, y), width: node, height: node),
        Paint()..color = color,
      );
  }

  @override
  bool shouldRepaint(_ProgressLinePainter old) =>
      old.fraction != fraction || old.color != color;
}

/// One lesson's node on the vertical line that joins a course's lessons.
class LessonNode extends StatelessWidget {
  const LessonNode({
    required this.state,
    required this.color,
    required this.isFirst,
    required this.isLast,
    this.emphasised = false,
    super.key,
  });

  final NodeState state;
  final Color color;
  final bool isFirst;
  final bool isLast;

  /// Drawn larger, for the lesson "continue" leads to.
  final bool emphasised;

  @override
  Widget build(BuildContext context) => ExcludeSemantics(
    child: CustomPaint(
      painter: _LessonNodePainter(
        state: state,
        color: color,
        isFirst: isFirst,
        isLast: isLast,
        emphasised: emphasised,
      ),
      size: Size.infinite,
    ),
  );
}

class _LessonNodePainter extends CustomPainter {
  _LessonNodePainter({
    required this.state,
    required this.color,
    required this.isFirst,
    required this.isLast,
    required this.emphasised,
  });

  final NodeState state;
  final Color color;
  final bool isFirst;
  final bool isLast;
  final bool emphasised;

  @override
  void paint(Canvas canvas, Size size) {
    final center = size.center(Offset.zero);
    final side = emphasised ? 16.0 : 12.0;
    final line = Paint()
      ..color = color
      ..strokeWidth = 2;
    if (!isFirst) {
      canvas.drawLine(
        Offset(center.dx, 0),
        Offset(center.dx, center.dy - side / 2),
        line,
      );
    }
    if (!isLast) {
      canvas.drawLine(
        Offset(center.dx, center.dy + side / 2),
        Offset(center.dx, size.height),
        line,
      );
    }
    final square = Rect.fromCenter(center: center, width: side, height: side);
    final fill = Paint()..color = color;
    switch (state) {
      case NodeState.finished:
        canvas.drawRect(square, fill);
      case NodeState.inProgress:
        canvas
          ..drawRect(
            Rect.fromLTRB(square.left, center.dy, square.right, square.bottom),
            fill,
          )
          ..drawRect(square.deflate(1), line..style = PaintingStyle.stroke);
      case NodeState.notStarted:
        canvas.drawRect(square.deflate(1), line..style = PaintingStyle.stroke);
    }
  }

  @override
  bool shouldRepaint(_LessonNodePainter old) =>
      old.state != state ||
      old.color != color ||
      old.isFirst != isFirst ||
      old.isLast != isLast ||
      old.emphasised != emphasised;
}

/// The music course's mark in place of a language name: a staff of five
/// lines with a few square nodes as notes.
class StaffMark extends StatelessWidget {
  const StaffMark({required this.color, this.height = 40, super.key});

  final Color color;
  final double height;

  @override
  Widget build(BuildContext context) => ExcludeSemantics(
    child: SizedBox(
      height: height,
      width: height * 4,
      child: CustomPaint(painter: _StaffPainter(color)),
    ),
  );
}

class _StaffPainter extends CustomPainter {
  _StaffPainter(this.color);

  final Color color;

  @override
  void paint(Canvas canvas, Size size) {
    final gap = size.height / 5;
    final line = Paint()
      ..color = color
      ..strokeWidth = 1.5;
    for (var i = 0; i < 5; i++) {
      final y = gap / 2 + i * gap;
      canvas.drawLine(Offset(0, y), Offset(size.width, y), line);
    }
    // A rising phrase: notes on lines and spaces.
    const steps = [4.0, 3.5, 3.0, 2.0, 1.5];
    final fill = Paint()..color = color;
    for (var i = 0; i < steps.length; i++) {
      final center = Offset(
        size.width * (0.14 + i * 0.18),
        gap / 2 + steps[i] * gap,
      );
      canvas.drawRect(
        Rect.fromCenter(center: center, width: gap * 1.1, height: gap * 1.1),
        fill,
      );
    }
  }

  @override
  bool shouldRepaint(_StaffPainter old) => old.color != color;
}
