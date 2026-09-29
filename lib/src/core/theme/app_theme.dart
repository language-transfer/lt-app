import 'package:flutter/material.dart';
import 'package:languagetransfer/src/core/theme/lt_colors.dart';

/// Builds the app's light and dark themes.
abstract final class AppTheme {
  /// Latin and Greek.
  static const fontFamily = 'YsabeauOffice';

  /// Arabic script, used for glyphs the main family lacks.
  static const fontFamilyFallback = ['NotoNaskhArabic'];

  static ThemeData light() => _build(Brightness.light, LtColors.light);

  static ThemeData dark() => _build(Brightness.dark, LtColors.dark);

  /// The type scale. Ysabeau has a small x-height, so sizes sit a step above
  /// the usual Material scale. Weights are plain [FontWeight]s, which Flutter
  /// applies to the variable font's weight axis; that keeps the system's
  /// bold-text setting working (guarded by test/core/theme).
  static TextTheme _textTheme(Color ink, Color pencil) {
    TextStyle style(
      double size,
      FontWeight weight, {
      double height = 1.45,
      Color? color,
    }) => TextStyle(
      fontFamily: fontFamily,
      fontFamilyFallback: fontFamilyFallback,
      fontSize: size,
      fontWeight: weight,
      height: height,
      // Material's defaults add tracking tuned for Roboto; Ysabeau's own
      // spacing is used instead.
      letterSpacing: 0,
      color: color ?? ink,
      leadingDistribution: TextLeadingDistribution.even,
    );

    return TextTheme(
      // Language name on the course page.
      displayLarge: style(60, FontWeight.w500, height: 1.1),
      // Lesson title in the player.
      displayMedium: style(48, FontWeight.w500, height: 1.1),
      // Language name on the course list.
      headlineLarge: style(36, FontWeight.w500, height: 1.15),
      titleLarge: style(24, FontWeight.w600, height: 1.25),
      titleMedium: style(21, FontWeight.w600, height: 1.3),
      titleSmall: style(18, FontWeight.w600, height: 1.35),
      bodyLarge: style(18, FontWeight.w400),
      bodyMedium: style(16, FontWeight.w400, color: pencil),
      bodySmall: style(14, FontWeight.w500, height: 1.4, color: pencil),
      labelLarge: style(18, FontWeight.w600, height: 1.2),
      labelMedium: style(16, FontWeight.w600, height: 1.2),
      labelSmall: style(14, FontWeight.w500, height: 1.2, color: pencil),
    );
  }

  static ThemeData _build(Brightness brightness, LtColors c) {
    final scheme = ColorScheme(
      brightness: brightness,
      primary: c.ink,
      onPrimary: c.paper,
      secondary: c.ink,
      onSecondary: c.paper,
      error: c.alert,
      onError: c.paper,
      surface: c.paper,
      onSurface: c.ink,
      onSurfaceVariant: c.pencil,
      outline: c.rule,
      outlineVariant: c.hairline,
      // Material 3 tints raised surfaces; the design has no elevation.
      surfaceTint: Colors.transparent,
      surfaceContainerLowest: c.paper,
      surfaceContainerLow: c.paper,
      surfaceContainer: c.paper,
      surfaceContainerHigh: c.paper,
      surfaceContainerHighest: c.hairline,
    );
    final text = _textTheme(c.ink, c.pencil);

    return ThemeData(
      useMaterial3: true,
      brightness: brightness,
      colorScheme: scheme,
      scaffoldBackgroundColor: c.paper,
      canvasColor: c.paper,
      fontFamily: fontFamily,
      fontFamilyFallback: fontFamilyFallback,
      textTheme: text,
      extensions: [c],
      iconTheme: IconThemeData(color: c.ink, size: 24),
      dividerTheme: DividerThemeData(color: c.hairline, thickness: 1, space: 1),
      appBarTheme: AppBarTheme(
        backgroundColor: c.paper,
        foregroundColor: c.ink,
        elevation: 0,
        scrolledUnderElevation: 0,
        centerTitle: false,
        titleTextStyle: text.titleLarge,
      ),
      listTileTheme: ListTileThemeData(
        iconColor: c.ink,
        // No textColor: ListTile would apply it to the subtitle too, which
        // should keep the pencil colour of secondary text.
        titleTextStyle: text.titleSmall,
        subtitleTextStyle: text.bodyMedium,
        minVerticalPadding: 12,
        // Same inset as the rest of the content.
        contentPadding: const EdgeInsets.symmetric(horizontal: 20),
      ),
      switchTheme: SwitchThemeData(
        thumbColor: WidgetStateProperty.resolveWith(
          (states) => states.contains(WidgetState.selected) ? c.paper : c.rule,
        ),
        trackColor: WidgetStateProperty.resolveWith(
          (states) => states.contains(WidgetState.selected) ? c.ink : c.paper,
        ),
        trackOutlineColor: WidgetStatePropertyAll(c.rule),
      ),
      bottomSheetTheme: BottomSheetThemeData(
        backgroundColor: c.paper,
        modalBackgroundColor: c.paper,
        elevation: 0,
        modalElevation: 0,
        showDragHandle: true,
        dragHandleColor: c.rule,
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(12)),
        ),
      ),
      dialogTheme: DialogThemeData(
        backgroundColor: c.paper,
        elevation: 0,
        titleTextStyle: text.titleLarge,
        contentTextStyle: text.bodyLarge,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(8),
          side: BorderSide(color: c.hairline),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: c.ink,
          textStyle: text.labelLarge,
          minimumSize: const Size(48, 48),
        ),
      ),
      snackBarTheme: SnackBarThemeData(
        backgroundColor: c.ink,
        contentTextStyle: text.bodyLarge?.copyWith(color: c.paper),
        actionTextColor: c.paper,
        behavior: SnackBarBehavior.floating,
        elevation: 0,
      ),
      progressIndicatorTheme: ProgressIndicatorThemeData(
        color: c.ink,
        linearTrackColor: c.hairline,
      ),
    );
  }
}
