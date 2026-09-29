// Checks every screen, in light and dark mode, against Flutter's
// accessibility guidelines: touch targets of at least 48 dp (Android) and
// 44 pt (iOS), a label on everything that can be tapped, and text contrast
// measured on the rendered pixels.
//
// The screen is tall, so short screens are seen whole. The contrast check
// measures a text's whole area even where a list clips it, so the two long
// lists run without the mini-player: otherwise the row it cuts off would be
// measured against the mini-player's colours. The mini-player is checked
// on the other screens.

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:languagetransfer/src/core/routing/app_routes.dart';

import '../helpers/app_fonts.dart';
import '../helpers/app_harness.dart';
import '../helpers/app_states.dart';

/// Screens, whether something is playing, whether the player is open over
/// the screen, and the state it is in beyond the everyday one.
final Map<String, (String, bool, bool, AppState?)> _screens = {
  'course list': (AppRoutes.courses, false, false, null),
  'course list, courses cannot be loaded': (
    AppRoutes.courses,
    false,
    false,
    noCourses,
  ),
  'course page': (AppRoutes.course('greek'), false, false, null),
  'course page, lessons cannot be loaded': (
    AppRoutes.course('greek'),
    false,
    false,
    noLessons,
  ),
  'player': (AppRoutes.courses, true, true, null),
  'player, lesson failed': (AppRoutes.courses, true, true, failedLesson),
  'player, lesson loading': (AppRoutes.courses, true, true, loadingLesson),
  'player, sleep timer set': (AppRoutes.courses, true, true, sleepTimerSet),
  'settings': (AppRoutes.settings, true, false, null),
  'manage course': (AppRoutes.manageCourse('greek'), true, false, null),
  'about': (AppRoutes.about, true, false, null),
};

void main() {
  setUpAll(loadAppFonts);

  for (final MapEntry(key: screen, value: (location, playing, player, state))
      in _screens.entries) {
    for (final brightness in Brightness.values) {
      testWidgets('$screen meets the guidelines in ${brightness.name} mode', (
        tester,
      ) async {
        final semantics = tester.ensureSemantics();
        final app = TestApp.create();
        await app.seedListening(tester, playing: playing);
        state?.call(app);
        await app.pump(
          tester,
          location: location,
          size: const Size(411, 2400),
          brightness: brightness,
          openPlayer: player,
          settle: state != loadingLesson,
        );

        await expectLater(tester, meetsGuideline(androidTapTargetGuideline));
        await expectLater(tester, meetsGuideline(iOSTapTargetGuideline));
        await expectLater(tester, meetsGuideline(labeledTapTargetGuideline));
        await expectLater(tester, meetsGuideline(textContrastGuideline));

        await app.dispose(tester);
        semantics.dispose();
      });
    }
  }
}
