import 'package:flutter_test/flutter_test.dart';
import 'package:languagetransfer/src/core/routing/app_routes.dart';
import 'package:languagetransfer/src/features/course_home/presentation/course_screen.dart';
import 'package:languagetransfer/src/features/courses/presentation/course_list_screen.dart';

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

  testWidgets('an unknown course opens the course list', (tester) async {
    final app = TestApp.create();
    await app.pump(tester, location: AppRoutes.course('klingon'));

    expect(find.byType(CourseListScreen), findsOneWidget);
    expect(find.byType(CourseScreen), findsNothing);
    await app.dispose(tester);
  });
}
