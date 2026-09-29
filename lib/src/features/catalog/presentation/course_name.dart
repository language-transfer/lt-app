import 'package:flutter/material.dart';
import 'package:languagetransfer/src/core/widgets/construction.dart';
import 'package:languagetransfer/src/features/catalog/domain/course.dart';

/// The taught language's own name in its own script, or the staff mark for
/// the music course. Decorative: screen readers get the English title from
/// the surrounding widget.
class CourseName extends StatelessWidget {
  const CourseName({
    required this.course,
    required this.style,
    required this.color,
    super.key,
  });

  final Course course;
  final TextStyle style;
  final Color color;

  @override
  Widget build(BuildContext context) {
    final endonym = course.endonym;
    if (endonym == null) {
      return StaffMark(color: color, height: (style.fontSize ?? 36) * 0.9);
    }
    return ExcludeSemantics(
      // Shaped right to left, but placed at the left edge like every other
      // name, so the bands keep one alignment.
      child: Align(
        alignment: Alignment.centerLeft,
        // One word in display size: with large text on a small screen it
        // shrinks to fit instead of breaking in the middle of the word.
        child: FittedBox(
          fit: BoxFit.scaleDown,
          alignment: Alignment.centerLeft,
          child: Text(
            endonym,
            maxLines: 1,
            textDirection: course.endonymIsRightToLeft
                ? TextDirection.rtl
                : TextDirection.ltr,
            style: style.copyWith(color: color),
          ),
        ),
      ),
    );
  }
}
