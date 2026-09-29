import 'package:flutter/material.dart';

/// A course's colours: a pale [tint] for the space the course fills and a
/// deep [ink] for text and marks on it.
///
/// Each keeps the hue of Language Transfer's colour for the course and passes
/// WCAG AAA (7:1) for ink on tint in both themes.
@immutable
class CourseColors {
  const CourseColors({required this.tint, required this.ink});

  final Color tint;
  final Color ink;

  static CourseColors of(String courseId, Brightness brightness) {
    final pair = _palettes[courseId] ?? _neutral;
    return brightness == Brightness.light ? pair.$1 : pair.$2;
  }

  static CourseColors resolve(BuildContext context, String courseId) =>
      of(courseId, Theme.of(context).brightness);

  static const _spanish = (
    CourseColors(tint: Color(0xFFEBF0FF), ink: Color(0xFF3A4B8F)),
    CourseColors(tint: Color(0xFF192141), ink: Color(0xFFA6BBFF)),
  );

  static const _palettes = <String, (CourseColors, CourseColors)>{
    'spanish': _spanish,
    'arabic': (
      CourseColors(tint: Color(0xFFFBEFD6), ink: Color(0xFF674C02)),
      CourseColors(tint: Color(0xFF2F2201), ink: Color(0xFFDBB970)),
    ),
    'turkish': (
      CourseColors(tint: Color(0xFFFEEBEC), ink: Color(0xFF9F0539)),
      CourseColors(tint: Color(0xFF3C161C), ink: Color(0xFFF7A3AC)),
    ),
    'german': (
      CourseColors(tint: Color(0xFFE3F7E1), ink: Color(0xFF025F02)),
      CourseColors(tint: Color(0xFF102B0F), ink: Color(0xFF98CF93)),
    ),
    'greek': (
      CourseColors(tint: Color(0xFFFFECDF), ink: Color(0xFF7C4102)),
      CourseColors(tint: Color(0xFF391B02), ink: Color(0xFFEFAE7D)),
    ),
    'italian': (
      CourseColors(tint: Color(0xFFFEE9F5), ink: Color(0xFF970372)),
      CourseColors(tint: Color(0xFF37172B), ink: Color(0xFFECA4CF)),
    ),
    'swahili': (
      CourseColors(tint: Color(0xFFD7F8F4), ink: Color(0xFF025B54)),
      CourseColors(tint: Color(0xFF022B27), ink: Color(0xFF69D3C7)),
    ),
    'french': (
      CourseColors(tint: Color(0xFFE1F4FF), ink: Color(0xFF045778)),
      CourseColors(tint: Color(0xFF022839), ink: Color(0xFF78C9F4)),
    ),
    // Both English courses for Spanish speakers share Spanish's palette, as
    // in the Expo app.
    'ingles_completo': _spanish,
    'ingles': _spanish,
    'music': (
      CourseColors(tint: Color(0xFFFDEED6), ink: Color(0xFF5C4D36)),
      CourseColors(tint: Color(0xFF2E220B), ink: Color(0xFFCCBBA1)),
    ),
  };

  /// For a course this app version does not know; such courses are not
  /// listed, so this should not normally be seen.
  static const _neutral = (
    CourseColors(tint: Color(0xFFF2F2F2), ink: Color(0xFF000000)),
    CourseColors(tint: Color(0xFF1A1A1A), ink: Color(0xFFF2F2F2)),
  );
}
