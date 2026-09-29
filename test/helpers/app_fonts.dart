import 'dart:io';

import 'package:flutter/services.dart';
import 'package:languagetransfer/src/core/theme/app_theme.dart';

var _loaded = false;

/// Loads the bundled fonts under the names the theme uses, so layouts in
/// widget tests have the real text metrics instead of the test font's
/// square glyphs.
Future<void> loadAppFonts() async {
  if (_loaded) return;
  Future<void> load(String family, String path) async {
    final bytes = File(path).readAsBytesSync();
    await (FontLoader(
      family,
    )..addFont(Future.value(ByteData.sublistView(bytes)))).load();
  }

  await load(AppTheme.fontFamily, 'assets/fonts/YsabeauOffice-Variable.ttf');
  await load(
    AppTheme.fontFamilyFallback.single,
    'assets/fonts/NotoNaskhArabic-Variable.ttf',
  );
  _loaded = true;
}
