import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:languagetransfer/src/core/routing/app_routes.dart';
import 'package:languagetransfer/src/features/player/presentation/mini_player.dart';

import '../../helpers/app_fonts.dart';
import '../../helpers/app_harness.dart';

void main() {
  setUpAll(loadAppFonts);

  testWidgets('rises from the bottom of the screen, over the mini-player', (
    tester,
  ) async {
    final app = TestApp.create();
    await app.seedListening(tester);
    await app.pump(tester, location: AppRoutes.course('greek'));
    expect(find.byType(MiniPlayer), findsOneWidget);

    await tester.tap(find.byTooltip('Course options'));
    await tester.pumpAndSettle();

    final screen = tester.view.physicalSize / tester.view.devicePixelRatio;
    expect(tester.getBottomLeft(find.byType(BottomSheet)).dy, screen.height);
    await app.dispose(tester);
  });

  testWidgets('scrolls when large text makes its actions too tall', (
    tester,
  ) async {
    final app = TestApp.create();
    await app.seedListening(tester);
    await app.pump(
      tester,
      size: const Size(320, 568),
      textScale: 2,
      openPlayer: true,
    );

    // The player scrolls too, with text this large.
    final speed = find.bySemanticsLabel(RegExp('^Speed, '));
    await tester.ensureVisible(speed);
    await tester.pumpAndSettle();
    await tester.tap(speed);
    await tester.pumpAndSettle();
    // An overflow would have failed the test by now.
    final fastest = find.text('2×');
    await tester.ensureVisible(fastest);
    await tester.pumpAndSettle();
    await tester.tap(fastest);
    await tester.pumpAndSettle();

    expect(app.handler.speeds, [2]);
    await app.dispose(tester);
  });
}
