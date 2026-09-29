import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:languagetransfer/src/core/routing/app_routes.dart';
import 'package:languagetransfer/src/features/catalog/domain/lesson.dart';

import '../../../helpers/app_fonts.dart';
import '../../../helpers/app_harness.dart';

void main() {
  setUpAll(loadAppFonts);

  Finder toggle(String title) => find.widgetWithText(SwitchListTile, title);

  /// The segment [label] of the quality setting titled [title].
  Finder segment(String title, String label) => find.descendant(
    of: find
        .ancestor(of: find.text(title), matching: find.byType(Column))
        .first,
    matching: find.text(label),
  );

  Set<AudioQuality> selected(WidgetTester tester, String title) => tester
      .widget<SegmentedButton<AudioQuality>>(
        find.descendant(
          of: find
              .ancestor(of: find.text(title), matching: find.byType(Column))
              .first,
          matching: find.byType(SegmentedButton<AudioQuality>),
        ),
      )
      .selected;

  testWidgets('changes each setting, keeps it and shows it', (tester) async {
    final app = TestApp.create();
    await app.pump(tester, location: AppRoutes.settings);

    // Quickly, one after the other: none of the changes is lost.
    for (final finder in [
      toggle('Play the next lesson automatically'),
      segment('Streaming quality', 'High'),
      toggle('Download only on Wi-Fi'),
      toggle('Delete lessons after finishing'),
      segment('Download quality', 'Low'),
    ]) {
      await tester.ensureVisible(finder);
      await tester.tap(finder);
    }
    await tester.pumpAndSettle();

    final stored = (await tester.runAsync(app.settings.load))!;
    expect(stored.autoplay, isFalse);
    expect(stored.streamQuality, AudioQuality.high);
    expect(stored.downloadOnlyOnWifi, isFalse);
    expect(stored.autoDeleteFinished, isTrue);
    expect(stored.downloadQuality, AudioQuality.low);

    SwitchListTile tile(String title) =>
        tester.widget<SwitchListTile>(toggle(title));
    expect(tile('Play the next lesson automatically').value, isFalse);
    expect(tile('Download only on Wi-Fi').value, isFalse);
    expect(tile('Delete lessons after finishing').value, isTrue);
    expect(selected(tester, 'Streaming quality'), {AudioQuality.high});
    expect(selected(tester, 'Download quality'), {AudioQuality.low});
    await app.dispose(tester);
  });
}
