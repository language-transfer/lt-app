import 'package:audio_service/audio_service.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:languagetransfer/src/core/routing/app_routes.dart';
import 'package:languagetransfer/src/features/player/presentation/mini_player.dart';
import 'package:languagetransfer/src/features/player/presentation/player_screen.dart';

import '../../../helpers/app_fonts.dart';
import '../../../helpers/app_harness.dart';

void main() {
  setUpAll(loadAppFonts);

  final player = find.byType(PlayerScreen);
  double sheetTop(WidgetTester tester) => tester.getTopLeft(player).dy;

  /// The course page with a lesson playing, and where the mini-player's top
  /// edge is.
  Future<(TestApp, double)> listening(WidgetTester tester) async {
    final app = TestApp.create();
    await app.seedListening(tester);
    await app.pump(tester, location: AppRoutes.course('greek'));
    return (app, tester.getTopLeft(find.byType(MiniPlayer)).dy);
  }

  /// Moves [gesture] by [dy] in steps, as a finger does, [at] and after.
  Future<Duration> move(
    WidgetTester tester,
    TestGesture gesture,
    double dy,
    Duration at,
  ) async {
    var time = at;
    for (var i = 0; i < 5; i++) {
      time += const Duration(milliseconds: 16);
      await gesture.moveBy(Offset(0, dy / 5), timeStamp: time);
    }
    await tester.pump();
    return time;
  }

  /// Lets go after holding still, so the sheet decides by where it is. The
  /// velocity comes from the last moves, so the finger moves once more, by
  /// nothing, after the pause.
  Future<void> letGo(
    WidgetTester tester,
    TestGesture gesture,
    Duration at,
  ) async {
    final later = at + const Duration(milliseconds: 300);
    await gesture.moveBy(Offset.zero, timeStamp: later);
    await gesture.up(timeStamp: later);
    await tester.pumpAndSettle();
  }

  testWidgets('follows the finger up from the mini-player', (tester) async {
    final (app, dockTop) = await listening(tester);

    final gesture = await tester.startGesture(
      tester.getCenter(find.byType(MiniPlayer)),
    );
    var time = await move(tester, gesture, -100, Duration.zero);
    expect(sheetTop(tester), moreOrLessEquals(dockTop - 100, epsilon: 0.5));
    time = await move(tester, gesture, -200, time);
    expect(sheetTop(tester), moreOrLessEquals(dockTop - 300, epsilon: 0.5));

    // Past half of the way up, it opens.
    time = await move(tester, gesture, -dockTop / 2 + 280, time);
    await letGo(tester, gesture, time);
    expect(sheetTop(tester), 0);
    await app.dispose(tester);
  });

  testWidgets('closes again when let go below half of the way up', (
    tester,
  ) async {
    final (app, _) = await listening(tester);

    final gesture = await tester.startGesture(
      tester.getCenter(find.byType(MiniPlayer)),
    );
    final time = await move(tester, gesture, -150, Duration.zero);
    expect(player, findsOneWidget);
    await letGo(tester, gesture, time);

    expect(player, findsNothing);
    await app.dispose(tester);
  });

  testWidgets('a swipe that starts down does nothing, even turning up', (
    tester,
  ) async {
    final (app, _) = await listening(tester);

    final gesture = await tester.startGesture(
      tester.getCenter(find.byType(MiniPlayer)),
    );
    var time = await move(tester, gesture, 60, Duration.zero);
    expect(player, findsNothing, reason: 'no sheet under a finger going down');
    time = await move(tester, gesture, -300, time);
    expect(player, findsNothing, reason: 'nor once it turns up');
    await letGo(tester, gesture, time);

    expect(player, findsNothing);
    await app.dispose(tester);
  });

  testWidgets('hands the sheet over without a jump when let go', (
    tester,
  ) async {
    final (app, dockTop) = await listening(tester);

    final gesture = await tester.startGesture(
      tester.getCenter(find.byType(MiniPlayer)),
    );
    final time = await move(tester, gesture, -dockTop * 0.7, Duration.zero);
    final before = sheetTop(tester);
    final later = time + const Duration(milliseconds: 300);
    await gesture.moveBy(Offset.zero, timeStamp: later);
    await gesture.up(timeStamp: later);
    await tester.pump();
    expect(sheetTop(tester), moreOrLessEquals(before, epsilon: 1));

    await tester.pump(const Duration(milliseconds: 16));
    expect(sheetTop(tester), lessThan(before), reason: 'on its way up');
    await tester.pumpAndSettle();
    expect(sheetTop(tester), 0);
    await app.dispose(tester);
  });

  testWidgets('a swipe cut short by playback stopping leaves no sheet', (
    tester,
  ) async {
    final (app, _) = await listening(tester);
    final gesture = await tester.startGesture(
      tester.getCenter(find.byType(MiniPlayer)),
    );
    await move(tester, gesture, -150, Duration.zero);
    expect(player, findsOneWidget);

    // The notification is swiped away: the mini-player goes.
    final items = app.handler.queue.value;
    app.handler.show(
      item: items[2],
      queueItems: items,
      processingState: AudioProcessingState.idle,
    );
    await tester.pumpAndSettle();

    expect(find.byType(MiniPlayer), findsOneWidget);
    expect(player, findsNothing);
    await gesture.up();
    await tester.pumpAndSettle();
    expect(player, findsNothing);
    await app.dispose(tester);
  });

  testWidgets('follows the finger down, and stays open when let go early', (
    tester,
  ) async {
    final (app, _) = await listening(tester);
    await tester.tap(miniPlayerBand);
    await tester.pumpAndSettle();
    expect(sheetTop(tester), 0);

    final gesture = await tester.startGesture(tester.getCenter(player));
    final time = await move(tester, gesture, 120, Duration.zero);
    expect(sheetTop(tester), moreOrLessEquals(120, epsilon: 0.5));
    await letGo(tester, gesture, time);

    expect(sheetTop(tester), 0);
    await app.dispose(tester);
  });

  testWidgets('closes onto the mini-player, which shows through at the end', (
    tester,
  ) async {
    final (app, dockTop) = await listening(tester);
    await tester.tap(miniPlayerBand);
    await tester.pumpAndSettle();

    await tester.tap(find.byTooltip('Close player'));
    final tops = <double>[];
    var mirrored = false;
    for (var frame = 0; frame < 120 && player.evaluate().isNotEmpty; frame++) {
      tops.add(sheetTop(tester));
      // The sheet shows the mini-player as it comes down onto it.
      if (find.byType(MiniPlayer).evaluate().length > 1) mirrored = true;
      await tester.pump(const Duration(milliseconds: 16));
    }

    expect(player, findsNothing);
    expect(tops.last, moreOrLessEquals(dockTop, epsilon: 2));
    expect(tops.every((top) => top <= dockTop + 0.5), isTrue);
    expect(mirrored, isTrue);
    await app.dispose(tester);
  });

  for (final (setting, features) in reducedMotionSettings) {
    testWidgets('with $setting, fades in place instead of sliding', (
      tester,
    ) async {
      reduceMotion(tester, features);
      final (app, _) = await listening(tester);

      await tester.tap(miniPlayerBand);
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 60));

      expect(sheetTop(tester), 0);
      final fade = tester.widget<Opacity>(
        find.ancestor(of: player, matching: find.byType(Opacity)).first,
      );
      expect(fade.opacity, inExclusiveRange(0, 1));
      await tester.pumpAndSettle();
      await app.dispose(tester);
    });
  }
}
