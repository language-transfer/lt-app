import 'dart:async';
import 'dart:io';

import 'package:audio_service/audio_service.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:languagetransfer/src/core/network/network_exception.dart';
import 'package:languagetransfer/src/core/routing/app_routes.dart';
import 'package:languagetransfer/src/core/storage/object_store.dart';
import 'package:languagetransfer/src/features/course_home/presentation/manage_course_screen.dart';
import 'package:languagetransfer/src/features/courses/presentation/course_list_screen.dart';
import 'package:languagetransfer/src/features/player/application/player_providers.dart';

import 'package:path/path.dart' as p;

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

  Future<void> clearProgress(WidgetTester tester) async {
    final action = find.text('Clear progress');
    await tester.scrollUntilVisible(action, 200);
    await tester.tap(action);
    await tester.pumpAndSettle();
    await tester.tap(
      find.descendant(
        of: find.byType(AlertDialog),
        matching: find.text('Clear progress'),
      ),
    );
    await settleWithFiles(tester);
  }

  AudioProcessingState processing(TestApp app) =>
      app.handler.playbackState.value.processingState;

  testWidgets('stops the course playing before clearing its progress', (
    tester,
  ) async {
    final app = TestApp.create();
    await app.seedListening(tester);
    // As the real player does.
    app.handler.onStop = () => app.progress.savePosition(
      'greek',
      'greek3',
      const Duration(minutes: 3),
    );
    await app.pump(tester, location: AppRoutes.manageCourse('greek'));

    await clearProgress(tester);

    expect(find.text('Progress cleared.'), findsOneWidget);
    expect(processing(app), AudioProcessingState.idle);
    final progress = (await tester.runAsync(
      () => app.progress.loadCourse('greek'),
    ))!;
    expect(progress, isEmpty);
    await app.dispose(tester);
  });

  testWidgets('stops a lesson of the course that is on its way', (
    tester,
  ) async {
    final app = TestApp.create();
    await app.seedListening(tester, playing: false);
    var stops = 0;
    app.handler
      ..startGate = Completer<void>()
      ..onStop = () async => stops++;
    await app.pump(tester, location: AppRoutes.manageCourse('greek'));
    final container = ProviderScope.containerOf(
      tester.element(find.byType(ManageCourseScreen)),
    );
    unawaited(
      container.read(playerControllerProvider.notifier).playLesson('greek', 4),
    );
    await tester.pump();

    await clearProgress(tester);

    expect(stops, 1);
    expect(container.read(requestedLessonProvider), isNull);
    app.handler.startGate!.complete();
    await tester.pumpAndSettle();
    expect(container.read(requestedLessonProvider), isNull);
    await app.dispose(tester);
  });

  testWidgets('clearing the progress of another course keeps playing', (
    tester,
  ) async {
    final app = TestApp.create();
    await app.seedListening(tester);
    await app.pump(tester, location: AppRoutes.manageCourse('spanish'));

    await clearProgress(tester);

    expect(find.text('Progress cleared.'), findsOneWidget);
    expect(processing(app), AudioProcessingState.ready);
    final progress = (await tester.runAsync(
      () => app.progress.loadCourse('greek'),
    ))!;
    expect(progress, hasLength(3));
    await app.dispose(tester);
  });

  testWidgets('stops the course playing before deleting its data', (
    tester,
  ) async {
    final app = TestApp.create();
    await app.seedListening(tester);
    app.handler.onStop = () => app.progress.savePosition(
      'greek',
      'greek3',
      const Duration(minutes: 3),
    );
    await app.pump(tester, location: AppRoutes.manageCourse('greek'));

    await askToDeleteEverything(tester);
    await tester.tap(find.text('Delete'));
    await settleWithFiles(tester);

    expect(find.byType(CourseListScreen), findsOneWidget);
    expect(processing(app), AudioProcessingState.idle);
    final progress = (await tester.runAsync(
      () => app.progress.loadCourse('greek'),
    ))!;
    expect(progress, isEmpty);
    await app.dispose(tester);
  });

  testWidgets('deletes all course data after asking', (tester) async {
    final app = TestApp.create();
    await app.seedListening(tester, playing: false);
    // The course's lessons as stored on the device.
    final metadata =
        ObjectStore(Directory(p.join(app.root.path, 'objects')))
            .fileFor(app.index.entryFor('greek')!.metadata)
          ..createSync(recursive: true);
    await app.pump(tester, location: AppRoutes.manageCourse('greek'));

    await askToDeleteEverything(tester);
    await tester.tap(find.text('Delete'));
    await settleWithFiles(tester);

    expect(find.byType(CourseListScreen), findsOneWidget);
    expect(find.text('Course data deleted.'), findsOneWidget);
    final (progress, downloads) = (await tester.runAsync(
      () async => (
        await app.progress.loadCourse('greek'),
        await app.downloadRepository.loadCourse('greek'),
      ),
    ))!;
    expect(progress, isEmpty);
    expect(downloads, isEmpty);
    expect(metadata.existsSync(), isFalse);
    await app.dispose(tester);
  });

  testWidgets('deletes the rest of the data without a course index', (
    tester,
  ) async {
    final app = TestApp.create()
      ..indexError = NetworkException(
        Uri.parse('https://downloads.languagetransfer.org/cas/index'),
        'offline',
      );
    await app.seedListening(tester, playing: false);
    await app.pump(tester, location: AppRoutes.manageCourse('greek'));

    await askToDeleteEverything(tester);
    await tester.tap(find.text('Delete'));
    await settleWithFiles(tester);

    expect(find.byType(CourseListScreen), findsOneWidget);
    expect(find.text('Course data deleted.'), findsOneWidget);
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

  Future<Set<String>> downloadedLessons(
    WidgetTester tester,
    TestApp app,
  ) async =>
      (await tester.runAsync(() => app.downloadRepository.loadCourse('greek')))!
          .keys
          .toSet();

  Future<void> tapAction(WidgetTester tester, String title) async {
    final action = find.text(title);
    await tester.scrollUntilVisible(action, 200);
    await tester.tap(action);
    await tester.pumpAndSettle();
  }

  testWidgets('deletes the downloads of finished lessons', (tester) async {
    final app = TestApp.create();
    // Lessons 1 and 2 finished; downloads of lessons 1 to 4.
    await app.seedListening(tester, playing: false);
    await app.pump(tester, location: AppRoutes.manageCourse('greek'));

    await tapAction(tester, 'Delete finished downloads');
    await settleWithFiles(tester);

    expect(find.text('Finished downloads deleted.'), findsOneWidget);
    expect(await downloadedLessons(tester, app), {'greek3', 'greek4'});
    await app.dispose(tester);
  });

  testWidgets('deletes all downloads after asking, and keeps the progress', (
    tester,
  ) async {
    final app = TestApp.create();
    await app.seedListening(tester, playing: false);
    await app.pump(tester, location: AppRoutes.manageCourse('greek'));

    await tapAction(tester, 'Delete all downloads');
    await tester.tap(
      find.descendant(
        of: find.byType(AlertDialog),
        matching: find.text('Delete'),
      ),
    );
    await settleWithFiles(tester);

    expect(find.text('Downloads deleted.'), findsOneWidget);
    expect(await downloadedLessons(tester, app), isEmpty);
    final progress = (await tester.runAsync(
      () => app.progress.loadCourse('greek'),
    ))!;
    expect(progress, hasLength(3));
    await app.dispose(tester);
  });

  testWidgets('downloads the remaining lessons after asking', (tester) async {
    final app = TestApp.create();
    await app.seedListening(tester, playing: false);
    await app.pump(tester, location: AppRoutes.manageCourse('greek'));

    await tapAction(tester, 'Download all lessons');
    await tester.tap(
      find.descendant(
        of: find.byType(AlertDialog),
        matching: find.text('Download'),
      ),
    );
    await settleWithFiles(tester);

    expect(await downloadedLessons(tester, app), {
      for (final lesson in app.metadataFor('greek').lessons) lesson.id,
    });
    await app.dispose(tester);
  });

  testWidgets('says when the course cannot be checked for new lessons', (
    tester,
  ) async {
    final app = TestApp.create();
    // The harness's network answers every request with 503.
    await app.pump(tester, location: AppRoutes.manageCourse('greek'));

    await tapAction(tester, 'Check for new lessons');
    await settleWithFiles(tester);

    expect(
      find.text(
        'Language Transfer’s server sent something unexpected. '
        'Try again later.',
      ),
      findsOneWidget,
    );
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
