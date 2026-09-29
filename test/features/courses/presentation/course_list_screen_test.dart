import 'package:flutter_test/flutter_test.dart';
import 'package:languagetransfer/src/core/network/network_exception.dart';

import '../../../helpers/app_fonts.dart';
import '../../../helpers/app_harness.dart';

void main() {
  setUpAll(loadAppFonts);

  testWidgets('says when the courses cannot be loaded, and tries again', (
    tester,
  ) async {
    final app = TestApp.create()
      ..indexError = NetworkException(
        Uri.parse('https://downloads.languagetransfer.org/cas/index'),
        'offline',
      );
    await app.pump(tester);

    expect(find.text('Courses can’t be loaded'), findsOneWidget);
    expect(
      find.text('Check your internet connection and try again.'),
      findsOneWidget,
    );

    app.indexError = null;
    await tester.tap(find.text('Try again'));
    await tester.pumpAndSettle();

    expect(find.text('Courses can’t be loaded'), findsNothing);
    expect(find.text('120 lessons'), findsOneWidget);
    await app.dispose(tester);
  });
}
