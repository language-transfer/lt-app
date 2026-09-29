import 'dart:io';

import 'package:audio_service/audio_service.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:languagetransfer/src/core/routing/app_routes.dart';
import 'package:languagetransfer/src/features/player/presentation/mini_player.dart';

import '../../../helpers/app_fonts.dart';
import '../../../helpers/app_harness.dart';

void main() {
  setUpAll(loadAppFonts);

  /// The app, and Complete Greek's lessons as the player's queue.
  (TestApp, List<MediaItem>) create() {
    final app = TestApp.create();
    return (
      app,
      [
        for (final lesson in app.metadataFor('greek').lessons)
          MediaItem(
            id: 'greek/${lesson.id}',
            title: lesson.title,
            artist: 'Complete Greek',
            duration: lesson.duration,
            extras: {'courseId': 'greek', 'lessonId': lesson.id},
          ),
      ],
    );
  }

  IconButton button(WidgetTester tester, String tooltip) =>
      tester.widget<IconButton>(
        find.ancestor(
          of: find.byTooltip(tooltip),
          matching: find.byType(IconButton),
        ),
      );

  testWidgets('can be closed before the first lesson has loaded', (
    tester,
  ) async {
    final (app, _) = create();
    await app.pump(tester);
    GoRouter.of(tester.element(find.byType(Scaffold).first))
        .push<void>(AppRoutes.player)
        .ignore();
    // The spinner never settles.
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 500));
    expect(find.byType(CircularProgressIndicator), findsOneWidget);

    await tester.tap(find.byTooltip('Close player'));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 500));

    expect(find.byType(CircularProgressIndicator), findsNothing);
    await app.dispose(tester);
  });

  testWidgets('says when a lesson cannot even be started, and tries again', (
    tester,
  ) async {
    final app = TestApp.create();
    app.handler.playError = const FileSystemException('No space left');
    await app.pump(tester, location: AppRoutes.course('greek'));

    await tester.tap(find.text('Lesson 5'));
    await tester.pumpAndSettle();
    expect(find.text('This lesson can’t be played'), findsOneWidget);
    expect(app.handler.played, isEmpty);

    app.handler.playError = null;
    await tester.tap(find.text('Try again'));
    // The fake player shows no lesson, so the spinner never settles.
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 500));
    expect(app.handler.played, [(courseId: 'greek', startIndex: 4)]);
    await app.dispose(tester);
  });

  testWidgets('offers the speeds and applies the chosen one', (tester) async {
    final (app, items) = create();
    app.handler.show(item: items[0], queueItems: items);
    await app.pump(tester, location: AppRoutes.player);

    await tester.tap(find.text('1×'));
    await tester.pumpAndSettle();
    for (final label in ['0.75×', '1×', '1.25×', '1.5×', '1.75×', '2×']) {
      expect(find.text(label), findsWidgets, reason: label);
    }
    await tester.tap(find.text('1.25×'));
    await tester.pumpAndSettle();

    expect(app.handler.speeds, [1.25]);
    await app.dispose(tester);
  });

  testWidgets('has no previous lesson at the start of the course', (
    tester,
  ) async {
    final (app, items) = create();
    app.handler.show(item: items.first, queueItems: items);
    await app.pump(tester, location: AppRoutes.player);

    expect(button(tester, 'Previous lesson').onPressed, isNull);
    expect(button(tester, 'Next lesson').onPressed, isNotNull);
    await app.dispose(tester);
  });

  testWidgets('has no next lesson at the end of the course', (tester) async {
    final (app, items) = create();
    app.handler.show(item: items.last, queueItems: items);
    await app.pump(tester, location: AppRoutes.player);

    expect(button(tester, 'Previous lesson').onPressed, isNotNull);
    expect(button(tester, 'Next lesson').onPressed, isNull);
    await app.dispose(tester);
  });

  testWidgets('says when a lesson cannot be played', (tester) async {
    final (app, items) = create();
    app.handler.show(
      item: items[0],
      queueItems: items,
      processingState: AudioProcessingState.error,
      errorMessage: 'Source error',
    );
    await app.pump(tester, location: AppRoutes.player);

    expect(find.text('This lesson can’t be played'), findsOneWidget);
    expect(find.text('Try again'), findsOneWidget);
    expect(find.byTooltip('Previous lesson'), findsNothing);
    await app.dispose(tester);
  });

  group('when a lesson cannot be loaded', () {
    void fail(TestApp app, List<MediaItem> items) => app.handler.show(
      item: items[0],
      queueItems: items,
      processingState: AudioProcessingState.error,
      errorMessage: 'Source error',
    );

    testWidgets('without a connection, says to check it', (tester) async {
      final (app, items) = create();
      app.connectivity = const [ConnectivityResult.none];
      fail(app, items);
      await app.pump(tester, location: AppRoutes.player);

      expect(
        find.text('Check your internet connection and try again.'),
        findsOneWidget,
      );
      await app.dispose(tester);
    });

    testWidgets('a downloaded lesson is not blamed on the connection', (
      tester,
    ) async {
      final (app, items) = create();
      app.connectivity = const [ConnectivityResult.none];
      await app.seedListening(tester, playing: false);
      fail(app, items);
      await app.pump(tester, location: AppRoutes.player);

      expect(find.text('Something went wrong. Try again.'), findsOneWidget);
      await app.dispose(tester);
    });

    testWidgets('the mini-player says so and tries again', (tester) async {
      final (app, items) = create();
      fail(app, items);
      await app.pump(tester, location: AppRoutes.course('greek'));

      final miniPlayer = find.byType(MiniPlayer);
      expect(
        find.descendant(
          of: miniPlayer,
          matching: find.text('This lesson can’t be played'),
        ),
        findsOneWidget,
      );
      await tester.tap(
        find.descendant(
          of: miniPlayer,
          matching: find.bySemanticsLabel('Try again'),
        ),
      );
      await tester.pumpAndSettle();

      expect(app.handler.played, [(courseId: 'greek', startIndex: 0)]);
      // The course's cover goes to the lock screen.
      expect(
        app.handler.artUri,
        Uri.file(
          '/artwork/assets/courses/images/greek-cover-stylized-with-text.png',
        ),
      );
      await app.dispose(tester);
    });
  });
}
