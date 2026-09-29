// Walks through the app and takes a screenshot of each screen, in light and
// dark mode. Uses the real backend, plays a real lesson and downloads
// another. Run with test_driver/screenshots.dart (see there); screenshots
// land in build/screenshots/<platform>/.

import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:languagetransfer/main.dart' as app;
import 'package:languagetransfer/src/features/courses/presentation/course_list_screen.dart';
import 'package:languagetransfer/src/features/downloads/presentation/lesson_download_button.dart';
import 'package:languagetransfer/src/features/player/presentation/mini_player.dart';

void main() {
  final binding = IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  /// Pumps frames for [milliseconds], letting network and audio work
  /// progress.
  Future<void> wait(WidgetTester tester, [int milliseconds = 1500]) async {
    final end = DateTime.now().add(Duration(milliseconds: milliseconds));
    while (DateTime.now().isBefore(end)) {
      await tester.pump(const Duration(milliseconds: 100));
    }
  }

  Future<void> waitFor(WidgetTester tester, Finder finder) async {
    final end = DateTime.now().add(const Duration(seconds: 30));
    while (finder.evaluate().isEmpty) {
      if (DateTime.now().isAfter(end)) fail('Not found: $finder');
      await tester.pump(const Duration(milliseconds: 100));
    }
  }

  var surfaceConverted = false;
  Future<void> shot(WidgetTester tester, String name) async {
    if (Platform.isAndroid && !surfaceConverted) {
      await binding.convertFlutterSurfaceToImage();
      surfaceConverted = true;
    }
    await wait(tester, 600);
    await binding.takeScreenshot('${Platform.operatingSystem}/$name');
  }

  /// The menu sits in the course list's header; the list keeps its scroll
  /// position, so scroll back to the top first.
  Future<void> openMenuItem(WidgetTester tester, String item) async {
    await tester.fling(
      find.byType(CustomScrollView),
      const Offset(0, 3000),
      3000,
    );
    await wait(tester);
    await tester.tap(find.byTooltip('Menu'));
    await wait(tester, 800);
    await tester.tap(find.text(item));
    await wait(tester);
  }

  /// Scrolls the course's band into view (the mini-player can cover the
  /// bottom of the list) and opens it.
  Future<void> openCourse(WidgetTester tester, String title) async {
    final band = find.descendant(
      of: find.byType(CourseBand),
      matching: find.text(title),
    );
    await tester.ensureVisible(band);
    await wait(tester, 800);
    await tester.tap(band);
  }

  testWidgets('screenshot tour', (tester) async {
    await app.main();
    await waitFor(tester, find.text('120 lessons'));

    await shot(tester, '01-courses');
    await tester.drag(find.byType(CustomScrollView), const Offset(0, -2000));
    await wait(tester);
    await shot(tester, '02-courses-end');
    await tester.drag(find.byType(CustomScrollView), const Offset(0, 2000));
    await wait(tester);

    await openCourse(tester, 'Complete Greek');
    await waitFor(tester, find.text('Lessons'));
    await wait(tester);
    await shot(tester, '03-course');

    await tester.tap(find.text('Lesson 1').first);
    await waitFor(tester, find.byIcon(Icons.pause_rounded));
    await wait(tester, 3000);
    await shot(tester, '04-player');

    await tester.tap(find.byTooltip('Close player'));
    await wait(tester);
    await shot(tester, '05-course-mini-player');

    // Download lesson 2 and wait until it is verified on the device.
    await tester.tap(find.byType(LessonDownloadButton).at(1));
    await waitFor(tester, find.byIcon(Icons.download_done));
    await wait(tester);
    await shot(tester, '06-course-downloaded');

    await tester.tap(find.byTooltip('Course options'));
    await wait(tester, 800);
    await tester.tap(find.text('Downloads and progress'));
    await wait(tester);
    await shot(tester, '07-manage-course');
    await tester.pageBack();
    await wait(tester);

    await tester.tap(find.byType(BackButton));
    await wait(tester);
    await shot(tester, '08-courses-mini-player');

    await openMenuItem(tester, 'Settings');
    await shot(tester, '09-settings');
    await tester.drag(find.byType(ListView), const Offset(0, -2000));
    await wait(tester);
    await shot(tester, '10-settings-downloads');
    await tester.pageBack();
    await wait(tester);

    await openMenuItem(tester, 'About');
    await shot(tester, '11-about');
    await tester.pageBack();
    await wait(tester);

    tester.platformDispatcher.platformBrightnessTestValue = Brightness.dark;
    await wait(tester);
    await shot(tester, '12-courses-dark');
    await openCourse(tester, 'Complete Greek');
    await waitFor(tester, find.text('Lessons'));
    await wait(tester);
    await shot(tester, '13-course-dark');
    await tester.tap(
      find
          .descendant(
            of: find.byType(MiniPlayer),
            matching: find.byType(InkWell),
          )
          .first,
    );
    await wait(tester);
    await shot(tester, '14-player-dark');

    await tester.tap(find.byIcon(Icons.pause_rounded));
    await wait(tester, 500);
    tester.platformDispatcher.clearPlatformBrightnessTestValue();
  });
}
