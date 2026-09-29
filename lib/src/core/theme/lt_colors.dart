import 'package:flutter/material.dart';

/// The base palette: ink on paper.
///
/// Contrast on paper: ink 21 / 18.8, pencil 6.7 / 9.1, rule 3.5 / 4.9,
/// alert 7.8 / 8.8 (light / dark).
@immutable
class LtColors extends ThemeExtension<LtColors> {
  const LtColors({
    required this.paper,
    required this.ink,
    required this.pencil,
    required this.rule,
    required this.hairline,
    required this.alert,
  });

  static const light = LtColors(
    paper: Color(0xFFFFFFFF),
    ink: Color(0xFF000000),
    pencil: Color(0xFF5C5C5C),
    rule: Color(0xFF8A8A8A),
    hairline: Color(0xFFE6E6E6),
    alert: Color(0xFFA4161A),
  );

  /// True black paper saves battery on the OLED screens common in low-end
  /// phones.
  static const dark = LtColors(
    paper: Color(0xFF000000),
    ink: Color(0xFFF2F2F2),
    pencil: Color(0xFFABABAB),
    rule: Color(0xFF7A7A7A),
    hairline: Color(0xFF262626),
    alert: Color(0xFFF28B82),
  );

  /// Background.
  final Color paper;

  /// Text and icons.
  final Color ink;

  /// Secondary text.
  final Color pencil;

  /// Outlines that carry meaning, such as an unfinished lesson's node.
  final Color rule;

  /// Decorative dividers only.
  final Color hairline;

  /// Errors on paper.
  final Color alert;

  static LtColors of(BuildContext context) =>
      Theme.of(context).extension<LtColors>()!;

  @override
  LtColors copyWith({
    Color? paper,
    Color? ink,
    Color? pencil,
    Color? rule,
    Color? hairline,
    Color? alert,
  }) => LtColors(
    paper: paper ?? this.paper,
    ink: ink ?? this.ink,
    pencil: pencil ?? this.pencil,
    rule: rule ?? this.rule,
    hairline: hairline ?? this.hairline,
    alert: alert ?? this.alert,
  );

  @override
  LtColors lerp(covariant LtColors? other, double t) {
    if (other == null) return this;
    return LtColors(
      paper: Color.lerp(paper, other.paper, t)!,
      ink: Color.lerp(ink, other.ink, t)!,
      pencil: Color.lerp(pencil, other.pencil, t)!,
      rule: Color.lerp(rule, other.rule, t)!,
      hairline: Color.lerp(hairline, other.hairline, t)!,
      alert: Color.lerp(alert, other.alert, t)!,
    );
  }
}
