import 'package:flutter_test/flutter_test.dart';
import 'package:languagetransfer/src/core/routing/app_routes.dart';
import 'package:languagetransfer/src/features/course_home/presentation/manage_course_screen.dart';
import 'package:languagetransfer/src/features/courses/presentation/course_list_screen.dart';

import '../../../helpers/app_fonts.dart';
import '../../../helpers/app_harness.dart';

void main() {
  setUpAll(loadAppFonts);

  /// Pumps until the app is idle, letting the real file operations of the
  /// deletion complete in between; they cannot run in the fake time of a
  /// widget test.
  Future<void> settleWithFiles(WidgetTester tester) async {
    for (var i = 0; i < 10; i++) {
      await tester.runAsync(() => Future<void>.delayed(Duration.zero));
      await tester.pumpAndSettle();
    }
  }

  Future<void> askToDeleteEverything(WidgetTester tester) async {
    final action = find.text('Delete all course data');
    await tester.scrollUntilVisible(action, 200);
    await tester.tap(action);
    await tester.pumpAndSettle();
    expect(find.text('Delete all data of Complete Greek?'), findsOneWidget);
  }

  testWidgets('deletes all course data after asking', (tester) async {
    final app = TestApp.create();
    await app.seedListening(tester, playing: false);
    await app.pump(tester, location: AppRoutes.manageCourse('greek'));

    await askToDeleteEverything(tester);
    await tester.tap(find.text('Delete'));
    await settleWithFiles(tester);

    expect(find.byType(CourseListScreen), findsOneWidget);
    final (progress, downloads) = (await tester.runAsync(
      () async => (
        await app.progress.loadCourse('greek'),
        await app.downloadRepository.loadCourse('greek'),
      ),
    ))!;
    expect(progress, isEmpty);
    expect(downloads, isEmpty);
    await app.dispose(tester);
  });

  testWidgets('keeps everything when the question is cancelled', (
    tester,
  ) async {
    final app = TestApp.create();
    await app.seedListening(tester, playing: false);
    await app.pump(tester, location: AppRoutes.manageCourse('greek'));

    await askToDeleteEverything(tester);
    await tester.tap(find.text('Cancel'));
    await tester.pumpAndSettle();

    expect(find.byType(ManageCourseScreen), findsOneWidget);
    final progress = (await tester.runAsync(
      () => app.progress.loadCourse('greek'),
    ))!;
    expect(progress, hasLength(3));
    await app.dispose(tester);
  });
}
