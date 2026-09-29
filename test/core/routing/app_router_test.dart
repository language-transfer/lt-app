import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:languagetransfer/src/core/routing/app_routes.dart';
import 'package:languagetransfer/src/features/about/presentation/about_screen.dart';
import 'package:languagetransfer/src/features/course_home/presentation/course_screen.dart';
import 'package:languagetransfer/src/features/course_home/presentation/manage_course_screen.dart';
import 'package:languagetransfer/src/features/courses/presentation/course_list_screen.dart';
import 'package:languagetransfer/src/features/player/presentation/player_screen.dart';
import 'package:languagetransfer/src/features/settings/presentation/settings_screen.dart';

import '../../helpers/app_fonts.dart';
import '../../helpers/app_harness.dart';

void main() {
  setUpAll(loadAppFonts);

  testWidgets('a retired course opens its successor', (tester) async {
    final app = TestApp.create();
    await app.pump(tester, location: AppRoutes.course('ingles'));

    final screen = tester.widget<CourseScreen>(find.byType(CourseScreen));
    expect(screen.course.id, 'ingles_completo');
    await app.dispose(tester);
  });

  for (final (location, screen) in [
    (AppRoutes.course('greek'), CourseScreen),
    (AppRoutes.settings, SettingsScreen),
  ]) {
    testWidgets('on iOS, $location swipes back to the course list', (
      tester,
    ) async {
      final app = TestApp.create();
      await app.pump(tester);
      GoRouter.of(tester.element(find.byType(CourseListScreen)))
          .push<void>(location)
          .ignore();
      await tester.pumpAndSettle();
      expect(find.byType(screen), findsOneWidget);

      // From the left edge, as on iOS.
      await tester.dragFrom(const Offset(5, 450), const Offset(350, 0));
      await tester.pumpAndSettle();

      expect(find.byType(screen), findsNothing);
      expect(find.byType(CourseListScreen), findsOneWidget);
      await app.dispose(tester);
    }, variant: TargetPlatformVariant.only(TargetPlatform.iOS));
  }

  group('leads', () {
    testWidgets('from a course on the list to its page', (tester) async {
      final app = TestApp.create();
      await app.pump(tester);

      final greek = find.text('Complete Greek');
      await tester.scrollUntilVisible(greek, 200);
      await tester.tap(greek);
      await tester.pumpAndSettle();

      final screen = tester.widget<CourseScreen>(find.byType(CourseScreen));
      expect(screen.course.id, 'greek');
      await app.dispose(tester);
    });

    testWidgets('from the menu to the settings and to about', (tester) async {
      final app = TestApp.create();
      await app.pump(tester);

      for (final (label, screen) in [
        ('Settings', SettingsScreen),
        ('About', AboutScreen),
      ]) {
        await tester.tap(find.byTooltip('Menu'));
        await tester.pumpAndSettle();
        await tester.tap(find.text(label));
        await tester.pumpAndSettle();
        expect(find.byType(screen), findsOneWidget, reason: label);

        await tester.pageBack();
        await tester.pumpAndSettle();
        expect(find.byType(CourseListScreen), findsOneWidget);
      }
      await app.dispose(tester);
    });

    testWidgets("from a course's options to its downloads and progress", (
      tester,
    ) async {
      final app = TestApp.create();
      await app.pump(tester, location: AppRoutes.course('greek'));

      await tester.tap(find.byTooltip('Course options'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Downloads and progress'));
      await tester.pumpAndSettle();

      final screen = tester.widget<ManageCourseScreen>(
        find.byType(ManageCourseScreen),
      );
      expect(screen.course.id, 'greek');
      await app.dispose(tester);
    });

    testWidgets('from the mini-player to the player', (tester) async {
      final app = TestApp.create();
      await app.seedListening(tester);
      await app.pump(tester);

      await tester.tap(miniPlayerBand);
      await tester.pumpAndSettle();

      expect(find.byType(PlayerScreen), findsOneWidget);
      await app.dispose(tester);
    });
  });

  testWidgets('an unknown course opens the course list', (tester) async {
    final app = TestApp.create();
    await app.pump(tester, location: AppRoutes.course('klingon'));

    expect(find.byType(CourseListScreen), findsOneWidget);
    expect(find.byType(CourseScreen), findsNothing);
    await app.dispose(tester);
  });
}
