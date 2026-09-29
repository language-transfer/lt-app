import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:languagetransfer/src/core/theme/course_colors.dart';
import 'package:languagetransfer/src/core/theme/lt_colors.dart';
import 'package:languagetransfer/src/features/catalog/domain/course.dart';

/// WCAG 2 contrast ratio.
double contrast(Color a, Color b) {
  final la = a.computeLuminance();
  final lb = b.computeLuminance();
  final (lighter, darker) = la > lb ? (la, lb) : (lb, la);
  return (lighter + 0.05) / (darker + 0.05);
}

void main() {
  for (final brightness in Brightness.values) {
    group(brightness.name, () {
      test('course ink on course tint passes AAA (7:1)', () {
        for (final course in Courses.all) {
          final colors = CourseColors.of(course.id, brightness);
          expect(
            contrast(colors.ink, colors.tint),
            greaterThanOrEqualTo(7),
            reason: course.id,
          );
        }
      });

      test('course ink on paper passes AA (4.5:1)', () {
        // Lesson nodes, "Now playing" and "Download all" on the course page.
        final paper = brightness == Brightness.light
            ? LtColors.light.paper
            : LtColors.dark.paper;
        for (final course in Courses.all) {
          expect(
            contrast(CourseColors.of(course.id, brightness).ink, paper),
            greaterThanOrEqualTo(4.5),
            reason: course.id,
          );
        }
      });

      test('base colours meet their roles', () {
        final c = brightness == Brightness.light
            ? LtColors.light
            : LtColors.dark;
        expect(contrast(c.ink, c.paper), greaterThanOrEqualTo(7));
        expect(contrast(c.pencil, c.paper), greaterThanOrEqualTo(4.5));
        expect(contrast(c.alert, c.paper), greaterThanOrEqualTo(4.5));
        // Outlines that carry meaning (WCAG 1.4.11).
        expect(contrast(c.rule, c.paper), greaterThanOrEqualTo(3));
      });
    });
  }
}
