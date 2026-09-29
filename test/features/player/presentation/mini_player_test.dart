import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:languagetransfer/src/core/routing/app_routes.dart';
import 'package:languagetransfer/src/features/player/presentation/mini_player.dart';
import 'package:languagetransfer/src/features/player/presentation/play_pause_button.dart';

import '../../../helpers/app_fonts.dart';
import '../../../helpers/app_harness.dart';

void main() {
  setUpAll(loadAppFonts);

  final miniPlayer = find.byType(MiniPlayer);

  testWidgets('shows the course cover, with equal margins on both sides', (
    tester,
  ) async {
    final app = TestApp.create();
    await app.seedListening(tester);
    await app.pump(tester, location: AppRoutes.course('greek'));

    final cover = find.descendant(of: miniPlayer, matching: find.byType(Image));
    final play = find.descendant(
      of: miniPlayer,
      matching: find.byType(PlayPauseButton),
    );
    expect(cover, findsOneWidget);
    final screen = tester.view.physicalSize / tester.view.devicePixelRatio;
    expect(tester.getTopLeft(cover).dx, 20);
    expect(screen.width - tester.getTopRight(play).dx, 20);
    expect(tester.getSize(cover), tester.getSize(play));
    await app.dispose(tester);
  });

  testWidgets('a swipe to the left plays the next lesson, to the right the '
      'one before', (tester) async {
    final semantics = tester.ensureSemantics();
    final app = TestApp.create();
    // Lesson 3 of 120 plays.
    await app.seedListening(tester);
    await app.pump(tester, location: AppRoutes.course('greek'));
    final lesson = find.descendant(
      of: miniPlayer,
      matching: find.text('Lesson 3'),
    );

    await tester.drag(lesson, const Offset(-200, 0));
    await tester.pumpAndSettle();
    expect(app.handler.skips, ['next']);

    // The fake player stays on lesson 3, which comes back into place.
    await tester.pump(const Duration(seconds: 3));
    await tester.pumpAndSettle();
    await tester.drag(lesson, const Offset(200, 0));
    await tester.pumpAndSettle();
    expect(app.handler.skips, ['next', 'previous']);

    // Screen readers get both as actions.
    final node = tester.getSemantics(
      find.bySemanticsLabel(RegExp('^Open player')),
    );
    expect(node.getSemanticsData().customSemanticsActionIds, hasLength(2));
    await tester.pump(const Duration(seconds: 3));
    await app.dispose(tester);
    semantics.dispose();
  });

  testWidgets('the first lesson has nothing before it', (tester) async {
    final app = TestApp.create();
    final items = app.queueFor('greek');
    app.handler.show(item: items[0], queueItems: items);
    await app.pump(tester, location: AppRoutes.course('greek'));
    final lesson = find.descendant(
      of: miniPlayer,
      matching: find.text('Lesson 1'),
    );
    final before = tester.getTopLeft(lesson);

    await tester.drag(lesson, const Offset(200, 0));
    await tester.pumpAndSettle();

    expect(app.handler.skips, isEmpty);
    expect(tester.getTopLeft(lesson), before);
    await app.dispose(tester);
  });

  testWidgets('the next lesson slides in from the end once it plays', (
    tester,
  ) async {
    final app = TestApp.create();
    final items = app.queueFor('greek');
    app.handler.show(item: items[2], queueItems: items);
    await app.pump(tester, location: AppRoutes.course('greek'));
    Finder title(String text) =>
        find.descendant(of: miniPlayer, matching: find.text(text));
    final place = tester.getTopLeft(title('Lesson 3'));

    await tester.drag(title('Lesson 3'), const Offset(-200, 0));
    await tester.pumpAndSettle();
    expect(app.handler.skips, ['next']);

    app.handler.show(item: items[3], queueItems: items);
    // The lesson arrives with the next frame.
    await tester.pump(const Duration(milliseconds: 16));
    await tester.pump(const Duration(milliseconds: 16));
    expect(tester.getTopLeft(title('Lesson 4')).dx, greaterThan(place.dx));
    await tester.pumpAndSettle();
    expect(tester.getTopLeft(title('Lesson 4')), place);
    await app.dispose(tester);
  });

  testWidgets('the last lesson has nothing after it', (tester) async {
    final app = TestApp.create();
    final items = app.queueFor('greek');
    app.handler.show(item: items.last, queueItems: items);
    await app.pump(tester, location: AppRoutes.course('greek'));
    final lesson = find.descendant(
      of: miniPlayer,
      matching: find.text(items.last.title),
    );
    final before = tester.getTopLeft(lesson);

    await tester.drag(lesson, const Offset(-200, 0));
    await tester.pumpAndSettle();

    expect(app.handler.skips, isEmpty);
    expect(tester.getTopLeft(lesson), before);
    await app.dispose(tester);
  });

  testWidgets('a short swipe skips only when it is quick', (tester) async {
    final app = TestApp.create();
    await app.seedListening(tester);
    await app.pump(tester, location: AppRoutes.course('greek'));
    final lesson = find.descendant(
      of: miniPlayer,
      matching: find.text('Lesson 3'),
    );

    await tester.timedDrag(
      lesson,
      const Offset(-60, 0),
      const Duration(seconds: 1),
    );
    await tester.pumpAndSettle();
    expect(app.handler.skips, isEmpty, reason: 'slow');

    await tester.fling(lesson, const Offset(-60, 0), 1500);
    await tester.pumpAndSettle();
    expect(app.handler.skips, ['next'], reason: 'flicked');
    // Past the time the fake player has to take the next lesson.
    await tester.pump(const Duration(seconds: 3));
    await app.dispose(tester);
  });

  testWidgets('slides in when playback starts', (tester) async {
    final app = TestApp.create();
    await app.pump(tester, location: AppRoutes.course('greek'));
    expect(tester.getSize(miniPlayer).height, 0);

    final items = app.queueFor('greek');
    app.handler.show(item: items[0], queueItems: items);
    // The lesson reaches the mini-player with the next frame.
    await tester.pump(const Duration(milliseconds: 16));
    await tester.pump(const Duration(milliseconds: 50));
    final midway = tester.getSize(miniPlayer).height;
    await tester.pumpAndSettle();
    final shown = tester.getSize(miniPlayer).height;

    expect(midway, inExclusiveRange(0, shown));
    await app.dispose(tester);
  });

  for (final (setting, features) in reducedMotionSettings) {
    testWidgets('with $setting, appears at once', (tester) async {
      reduceMotion(tester, features);
      final app = TestApp.create();
      await app.pump(tester, location: AppRoutes.course('greek'));

      final items = app.queueFor('greek');
      app.handler.show(item: items[0], queueItems: items);
      // The lesson reaches the mini-player with the next frame.
      await tester.pump(const Duration(milliseconds: 16));
      await tester.pump(const Duration(milliseconds: 16));
      final first = tester.getSize(miniPlayer).height;
      await tester.pumpAndSettle();

      expect(first, greaterThan(0));
      expect(tester.getSize(miniPlayer).height, first);
      await app.dispose(tester);
    });
  }
}
