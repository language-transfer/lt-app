import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:languagetransfer/src/core/routing/app_routes.dart';
import 'package:languagetransfer/src/features/downloads/data/download_repository.dart';
import 'package:languagetransfer/src/features/downloads/domain/lesson_download.dart';
import 'package:languagetransfer/src/features/downloads/presentation/lesson_download_button.dart';

import '../../../helpers/app_fonts.dart';
import '../../../helpers/app_harness.dart';

void main() {
  setUpAll(loadAppFonts);

  Finder downloadButton(int row) => find.byType(LessonDownloadButton).at(row);

  testWidgets('a failed download says why and can be tried again', (
    tester,
  ) async {
    final app = TestApp.create();
    await app.seedListening(tester, playing: false);
    final lesson4 = app.metadataFor('greek').lessons[3];
    await tester.runAsync(
      () => DownloadRepository(database: app.database).setStatus(
        lesson4.variants.high.object,
        DownloadStatus.failed,
        failure: DownloadFailure.storage,
      ),
    );
    await app.pump(tester, location: AppRoutes.course('greek'));

    await tester.tap(downloadButton(3));
    await tester.pumpAndSettle();
    expect(
      find.text(
        'The lesson couldn’t be saved. Free up some space on this device '
        'and try again.',
      ),
      findsOneWidget,
    );
    await tester.tap(find.text('Try downloading again'));
    await tester.pumpAndSettle();

    expect(app.backend.enqueued.map((request) => request.taskId), [
      lesson4.variants.high.object,
    ]);
    await app.dispose(tester);
  });

  testWidgets('marking a later lesson finished keeps "continue" in place', (
    tester,
  ) async {
    final semantics = tester.ensureSemantics();
    final app = TestApp.create();
    await app.seedListening(tester, playing: false);
    await app.pump(tester, location: AppRoutes.course('greek'));
    final continueLesson3 = find.bySemanticsLabel(
      RegExp('^Continue, Lesson 3,'),
    );
    expect(continueLesson3, findsOneWidget);

    await tester.longPress(find.text('Lesson 5'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Mark as finished'));
    await tester.pumpAndSettle();

    final lesson5 = (await tester.runAsync(
      () => app.progress.loadCourse('greek'),
    ))!['greek5']!;
    expect(lesson5.finished, isTrue);
    expect(lesson5.listenedAt, isNull);
    expect(continueLesson3, findsOneWidget);
    await app.dispose(tester);
    semantics.dispose();
  });

  testWidgets('starts a download on Wi-Fi without a word', (tester) async {
    final app = TestApp.create();
    await app.pump(tester, location: AppRoutes.course('greek'));

    await tester.tap(downloadButton(0));
    await tester.pumpAndSettle();

    expect(app.backend.enqueued, hasLength(1));
    expect(find.byType(SnackBar), findsNothing);
    expect(find.text('Downloads wait for Wi-Fi.'), findsNothing);
    await app.dispose(tester);
  });

  testWidgets('says when downloads wait for Wi-Fi', (tester) async {
    final app = TestApp.create()
      ..connectivity = const [ConnectivityResult.mobile];
    await app.pump(tester, location: AppRoutes.course('greek'));

    await tester.tap(downloadButton(0));
    await tester.pumpAndSettle();

    expect(
      find.text('The download starts when you’re on Wi-Fi.'),
      findsOneWidget,
    );
    expect(find.text('Downloads wait for Wi-Fi.'), findsOneWidget);
    await app.dispose(tester);
  });

  testWidgets('a downloaded or failed lesson offers its options', (
    tester,
  ) async {
    final semantics = tester.ensureSemantics();
    final app = TestApp.create();
    await app.seedListening(tester, playing: false);
    await app.pump(tester, location: AppRoutes.course('greek'));

    // Lesson 1 is downloaded, lesson 4 failed.
    expect(find.bySemanticsLabel('Lesson options'), findsNWidgets(2));
    await tester.tap(downloadButton(0));
    await tester.pumpAndSettle();
    expect(find.text('Delete download'), findsOneWidget);
    await app.dispose(tester);
    semantics.dispose();
  });

  testWidgets('downloads all lessons from the one "continue" leads to', (
    tester,
  ) async {
    final app = TestApp.create();
    await app.seedListening(tester, playing: false);
    await app.pump(tester, location: AppRoutes.course('greek'));

    await tester.tap(find.text('Download all'));
    await tester.pumpAndSettle();
    // Lessons 1 to 3 are downloaded or on their way; lesson 4 failed.
    expect(find.text('Download 117 lessons?'), findsOneWidget);
    await tester.tap(find.text('Download'));
    await tester.pumpAndSettle();

    final lessons = app.metadataFor('greek').lessons;
    final requested = app.backend.enqueued.map((request) => request.taskId);
    expect(requested, hasLength(117));
    expect(requested.take(2), [
      lessons[3].variants.high.object,
      lessons[4].variants.high.object,
    ]);
    expect(requested.last, lessons.last.variants.high.object);
    await app.dispose(tester);
  });

  testWidgets('downloads all lessons after asking', (tester) async {
    final app = TestApp.create();
    await app.pump(tester, location: AppRoutes.course('greek'));

    await tester.tap(find.text('Download all'));
    await tester.pumpAndSettle();
    expect(find.text('Download 120 lessons?'), findsOneWidget);
    await tester.tap(find.text('Download'));
    await tester.pumpAndSettle();

    expect(app.backend.enqueued, hasLength(120));
    expect(find.text('Download all'), findsNothing);
    await app.dispose(tester);
  });
}
