import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:languagetransfer/src/core/routing/app_routes.dart';

import '../../helpers/app_fonts.dart';
import '../../helpers/app_harness.dart';

void main() {
  setUpAll(loadAppFonts);

  final bar = find.byType(AppBar);

  /// The title in the bar, and how visible it is.
  double barTitleOpacity(WidgetTester tester) => tester
      .widget<AnimatedOpacity>(
        find.descendant(of: bar, matching: find.byType(AnimatedOpacity)),
      )
      .opacity;

  testWidgets('lines the title up with the content, and shows it in the bar '
      'once it has scrolled away', (tester) async {
    final app = TestApp.create();
    // Small enough for the settings to scroll.
    await app.pump(
      tester,
      location: AppRoutes.settings,
      size: const Size(360, 640),
    );

    final title = find.descendant(
      of: find.byType(SliverToBoxAdapter),
      matching: find.text('Settings'),
    );
    expect(tester.getTopLeft(title).dx, 20);
    expect(tester.getTopLeft(find.text('Playback')).dx, 20);
    expect(barTitleOpacity(tester), 0);

    // A little: the large title is still partly in view.
    await tester.drag(find.byType(CustomScrollView), const Offset(0, -40));
    await tester.pumpAndSettle();
    expect(barTitleOpacity(tester), 0);

    await tester.drag(find.byType(CustomScrollView), const Offset(0, -300));
    await tester.pumpAndSettle();
    expect(barTitleOpacity(tester), 1);
    await app.dispose(tester);
  });

  testWidgets('keeps the way back at hand on a long course', (tester) async {
    final app = TestApp.create();
    await app.pump(tester, location: AppRoutes.course('greek'));
    expect(barTitleOpacity(tester), 0);

    await tester.fling(
      find.byType(CustomScrollView),
      const Offset(0, -3000),
      3000,
    );
    await tester.pumpAndSettle();

    expect(barTitleOpacity(tester), 1);
    expect(
      find.descendant(of: bar, matching: find.text('Complete Greek')),
      findsOneWidget,
    );
    await tester.tap(find.byType(BackButton));
    await tester.pumpAndSettle();
    expect(find.text('Language courses'), findsOneWidget);
    await app.dispose(tester);
  });
}
