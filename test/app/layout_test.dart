// Renders every screen on small, typical and landscape screens with the
// system text size at 100 %, 150 % and 200 %, and fails on any layout
// overflow. The text uses the app's real fonts (see helpers/app_fonts.dart).

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:languagetransfer/src/core/routing/app_routes.dart';

import '../helpers/app_fonts.dart';
import '../helpers/app_harness.dart';

const _sizes = {
  'small phone 320x568': Size(320, 568),
  'budget phone 360x640': Size(360, 640),
  'phone 411x891': Size(411, 891),
  // Tall enough that whole lists are laid out, not only the first rows.
  'narrow and tall 320x2400': Size(320, 2400),
  'landscape 640x360': Size(640, 360),
};

const _textScales = [1.0, 1.5, 2.0];

final Map<String, String> _screens = {
  'course list': AppRoutes.courses,
  'course page': AppRoutes.course('greek'),
  'course page, right-to-left name': AppRoutes.course('arabic'),
  'course page, music': AppRoutes.course('music'),
  'player': AppRoutes.player,
  'settings': AppRoutes.settings,
  'manage course': AppRoutes.manageCourse('greek'),
  'about': AppRoutes.about,
};

void main() {
  setUpAll(loadAppFonts);

  for (final MapEntry(key: screen, value: location) in _screens.entries) {
    group(screen, () {
      for (final MapEntry(key: sizeName, value: size) in _sizes.entries) {
        for (final textScale in _textScales) {
          testWidgets('fits on $sizeName with text at ${textScale * 100} %', (
            tester,
          ) async {
            final app = TestApp.create();
            await app.seedListening(tester);
            await app.pump(
              tester,
              location: location,
              size: size,
              textScale: textScale,
            );
            // Overflows are reported as exceptions and fail the test.
            await app.dispose(tester);
          });
        }
      }
    });
  }
}
