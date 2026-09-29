import 'dart:async';

import 'package:audio_service/audio_service.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:languagetransfer/src/core/format/duration_text.dart';
import 'package:languagetransfer/src/core/network/network_exception.dart';
import 'package:languagetransfer/src/core/routing/app_routes.dart';
import 'package:languagetransfer/src/features/catalog/presentation/course_name.dart';
import 'package:languagetransfer/src/features/downloads/data/download_backend.dart';
import 'package:languagetransfer/src/features/downloads/data/download_repository.dart';
import 'package:languagetransfer/src/features/downloads/domain/lesson_download.dart';
import 'package:languagetransfer/src/features/downloads/presentation/lesson_download_button.dart';
import 'package:languagetransfer/src/features/player/presentation/player_screen.dart';

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

  /// Pumps until the app is idle, letting the download manager's real file
  /// operations complete in between.
  Future<void> settleWithFiles(WidgetTester tester) async {
    for (var i = 0; i < 10; i++) {
      await tester.runAsync(() => Future<void>.delayed(Duration.zero));
      await tester.pumpAndSettle();
    }
  }

  Future<Set<String>> downloadedLessons(
    WidgetTester tester,
    TestApp app,
  ) async =>
      (await tester.runAsync(() => app.downloadRepository.loadCourse('greek')))!
          .keys
          .toSet();

  testWidgets('a download on its way shows how far it got, and can be '
      'cancelled', (tester) async {
    final app = TestApp.create();
    // Lesson 2 is downloading.
    await app.seedListening(tester, playing: false);
    final lesson2 = app.metadataFor('greek').lessons[1];
    await app.pump(tester, location: AppRoutes.course('greek'));
    // In the test's fake time, like the database it uses.
    unawaited(app.downloads.start());
    await settleWithFiles(tester);

    // Requested again at start, as the fake downloader had lost it.
    final task = lesson2.variants.high.object;
    app.backend
      ..emit(DownloadStateChanged(task, DownloadTaskState.running))
      ..emit(DownloadProgressed(task, 0.42));
    await settleWithFiles(tester);
    expect(
      find.descendant(of: downloadButton(1), matching: find.text('42%')),
      findsOneWidget,
    );

    await tester.tap(downloadButton(1));
    await settleWithFiles(tester);

    expect(app.backend.canceled, contains(task));
    expect(await downloadedLessons(tester, app), isNot(contains('greek2')));
    await app.dispose(tester);
  });

  testWidgets('a downloaded lesson can be deleted from its options', (
    tester,
  ) async {
    final app = TestApp.create();
    await app.seedListening(tester, playing: false);
    await app.pump(tester, location: AppRoutes.course('greek'));

    await tester.tap(downloadButton(0));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Delete download'));
    await settleWithFiles(tester);

    expect(await downloadedLessons(tester, app), {
      'greek2',
      'greek3',
      'greek4',
    });
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

  for (final (state, playing, icon) in [
    ('to start', false, Icons.play_arrow_rounded),
    ('playing', true, Icons.graphic_eq),
  ]) {
    testWidgets('the lesson $state has its icon in the middle of its square', (
      tester,
    ) async {
      final app = TestApp.create();
      await app.seedListening(tester, playing: playing);
      await app.pump(tester, location: AppRoutes.course('greek'));

      final glyph = find.byIcon(icon).first;
      final square = find
          .ancestor(of: glyph, matching: find.byType(Container))
          .first;
      expect(tester.getCenter(glyph), tester.getCenter(square));
      await app.dispose(tester);
    });
  }

  testWidgets('says when the lessons cannot be loaded, and tries again', (
    tester,
  ) async {
    final app = TestApp.create()
      ..metadataError = NetworkException(
        Uri.parse('https://downloads.languagetransfer.org/cas/greek'),
        'offline',
      );
    await app.pump(tester, location: AppRoutes.course('greek'));

    expect(find.text('This course can’t be loaded'), findsOneWidget);
    expect(
      find.text('Check your internet connection and try again.'),
      findsOneWidget,
    );
    expect(find.text('Lesson 1'), findsNothing);

    app.metadataError = null;
    await tester.tap(find.text('Try again'));
    await tester.pumpAndSettle();

    expect(find.text('This course can’t be loaded'), findsNothing);
    expect(find.text('Lesson 1'), findsWidgets);
    await app.dispose(tester);
  });

  testWidgets('a saved position updates only its lesson', (tester) async {
    final app = TestApp.create();
    await app.seedListening(tester, playing: false);
    await app.pump(tester, location: AppRoutes.course('greek'));
    final lesson3 = app.metadataFor('greek').lessons[2];
    final list = tester.widget(find.byType(SliverMainAxisGroup));
    final name = tester.widget(find.byType(CourseName));

    // As the player saves it every few seconds.
    await tester.runAsync(
      () => app.progress.savePosition(
        'greek',
        lesson3.id,
        const Duration(minutes: 4),
      ),
    );
    await tester.pumpAndSettle();

    final left = DurationText.remaining(
      const Duration(minutes: 4),
      lesson3.duration,
    );
    expect(
      find.text('${DurationText.clock(left)} left'),
      findsNWidgets(2),
      reason: '"continue" and the row of lesson 3',
    );
    expect(
      tester.widget(find.byType(SliverMainAxisGroup)),
      same(list),
      reason: 'the list was not built again',
    );
    expect(
      tester.widget(find.byType(CourseName)),
      same(name),
      reason: 'nor the header',
    );
    await app.dispose(tester);
  });

  testWidgets('tapping the lesson playing only opens the player', (
    tester,
  ) async {
    final semantics = tester.ensureSemantics();
    final app = TestApp.create();
    await app.seedListening(tester);
    await app.pump(tester, location: AppRoutes.course('greek'));

    await tester.tap(find.bySemanticsLabel(RegExp('^Lesson 3, playing')));
    await tester.pumpAndSettle();

    expect(find.byType(PlayerScreen), findsOneWidget);
    expect(app.handler.played, isEmpty);
    await app.dispose(tester);
    semantics.dispose();
  });

  testWidgets('a lesson whose playback was stopped starts again when tapped', (
    tester,
  ) async {
    final semantics = tester.ensureSemantics();
    final app = TestApp.create();
    await app.seedListening(tester);
    // The notification was swiped away: stopped, with the lesson still in
    // the player.
    final items = app.handler.queue.value;
    app.handler.show(
      item: items[2],
      queueItems: items,
      processingState: AudioProcessingState.idle,
    );
    await app.pump(tester, location: AppRoutes.course('greek'));
    expect(find.bySemanticsLabel(RegExp('^Now playing')), findsNothing);

    await tester.tap(find.bySemanticsLabel(RegExp('^Continue, Lesson 3')));
    await tester.pumpAndSettle();

    expect(app.handler.played, [(courseId: 'greek', startIndex: 2)]);
    await app.dispose(tester);
    semantics.dispose();
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
