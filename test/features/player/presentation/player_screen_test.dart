import 'dart:async';
import 'dart:io';

import 'package:audio_service/audio_service.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter/material.dart';
import 'package:flutter/semantics.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:languagetransfer/src/core/routing/app_routes.dart';
import 'package:languagetransfer/src/core/theme/course_colors.dart';
import 'package:languagetransfer/src/features/course_home/presentation/course_screen.dart';
import 'package:languagetransfer/src/features/player/application/player_providers.dart';
import 'package:languagetransfer/src/features/player/domain/sleep_timer.dart';
import 'package:languagetransfer/src/features/player/presentation/mini_player.dart';
import 'package:languagetransfer/src/features/player/presentation/play_pause_button.dart';
import 'package:languagetransfer/src/features/player/presentation/player_screen.dart';
import 'package:languagetransfer/src/features/player/presentation/player_sheet.dart';
import 'package:languagetransfer/src/features/player/presentation/seek_line.dart';

import '../../../helpers/app_fonts.dart';
import '../../../helpers/app_harness.dart';

void main() {
  setUpAll(loadAppFonts);

  /// The app, and Complete Greek's lessons as the player's queue.
  (TestApp, List<MediaItem>) create() {
    final app = TestApp.create();
    return (app, app.queueFor('greek'));
  }

  /// Only what the player shows: the mini-player stays in the tree under it.
  Finder inPlayer(Finder finder) =>
      find.descendant(of: find.byType(PlayerScreen), matching: finder);

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
    showPlayer(tester.element(find.byType(MiniPlayer)));
    // The spinner never settles.
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 500));
    expect(find.byType(CircularProgressIndicator), findsOneWidget);

    await tester.tap(find.byTooltip('Close player'));
    await tester.pump();
    // Longer than the spring takes to close the sheet.
    await tester.pump(const Duration(seconds: 1));

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

  testWidgets('shows the lesson asked for at once, not the one before', (
    tester,
  ) async {
    final semantics = tester.ensureSemantics();
    final (app, items) = create();
    await app.seedListening(tester);
    app.handler.startGate = Completer<void>();
    await app.pump(tester, location: AppRoutes.course('greek'));

    await tester.tap(find.text('Lesson 5'));
    await tester.pump();
    await tester.pump(const Duration(seconds: 1));
    expect(inPlayer(find.text('Lesson 5')), findsOneWidget);
    expect(inPlayer(find.text('Lesson 3')), findsNothing);
    expect(inPlayer(find.bySemanticsLabel('Loading')), findsOneWidget);
    expect(button(tester, 'Next lesson').onPressed, isNull);

    // The player takes the lesson.
    app.handler.show(item: items[4], queueItems: items);
    app.handler.startGate!.complete();
    await tester.pumpAndSettle();
    expect(inPlayer(find.text('Lesson 5')), findsOneWidget);
    expect(button(tester, 'Next lesson').onPressed, isNotNull);

    // Autoplay moves on, and the screen follows: the request is done with.
    app.handler.show(item: items[5], queueItems: items);
    await tester.pumpAndSettle();
    expect(inPlayer(find.text('Lesson 6')), findsOneWidget);
    await app.dispose(tester);
    semantics.dispose();
  });

  testWidgets('a lesson asked for while another is on its way wins', (
    tester,
  ) async {
    final (app, items) = create();
    await app.seedListening(tester);
    final first = app.handler.startGate = Completer<void>();
    await app.pump(tester, location: AppRoutes.course('greek'));
    await tester.tap(find.text('Lesson 5'));
    await tester.pump();
    await tester.pump(const Duration(seconds: 1));

    // Lesson 7, before lesson 5 is in the player.
    final second = app.handler.startGate = Completer<void>();
    final controller = ProviderScope.containerOf(
      tester.element(find.byType(PlayerScreen)),
    ).read(playerControllerProvider.notifier);
    unawaited(controller.playLesson('greek', 6));
    await tester.pump();
    expect(inPlayer(find.text('Lesson 7')), findsOneWidget);

    // Lesson 5's start ends first; lesson 7 is still the one on its way.
    first.complete();
    await tester.pump();
    await tester.pump(const Duration(seconds: 1));
    expect(inPlayer(find.text('Lesson 7')), findsOneWidget);
    expect(inPlayer(find.text('Lesson 3')), findsNothing);

    app.handler.show(item: items[6], queueItems: items);
    second.complete();
    await tester.pumpAndSettle();
    expect(app.handler.played, [
      (courseId: 'greek', startIndex: 4),
      (courseId: 'greek', startIndex: 6),
    ]);
    expect(button(tester, 'Next lesson').onPressed, isNotNull);

    app.handler.show(item: items[7], queueItems: items);
    await tester.pumpAndSettle();
    expect(inPlayer(find.text('Lesson 8')), findsOneWidget);
    await app.dispose(tester);
  });

  testWidgets('says when the lesson asked for cannot be started', (
    tester,
  ) async {
    final app = TestApp.create();
    await app.seedListening(tester);
    app.handler.playError = const FileSystemException('No space left');
    await app.pump(tester, location: AppRoutes.course('greek'));

    await tester.tap(find.text('Lesson 5'));
    await tester.pumpAndSettle();
    expect(inPlayer(find.text('Lesson 5')), findsOneWidget);
    expect(inPlayer(find.text('This lesson can’t be played')), findsOneWidget);

    // Trying again starts that lesson, not lesson 3, still in the player.
    final items = app.queueFor('greek');
    app.handler
      ..playError = null
      ..startGate = Completer<void>();
    await tester.tap(inPlayer(find.text('Try again')));
    await tester.pump();
    expect(inPlayer(find.text('This lesson can’t be played')), findsNothing);
    expect(inPlayer(find.text('Lesson 5')), findsOneWidget);

    app.handler.show(item: items[4], queueItems: items);
    app.handler.startGate!.complete();
    await tester.pumpAndSettle();
    expect(app.handler.played, [(courseId: 'greek', startIndex: 4)]);
    expect(inPlayer(find.text('This lesson can’t be played')), findsNothing);
    expect(button(tester, 'Next lesson').onPressed, isNotNull);
    await app.dispose(tester);
  });

  testWidgets('the next lesson slides in from the end, an earlier one from '
      'the start', (tester) async {
    final (app, items) = create();
    app.handler.show(item: items[1], queueItems: items);
    await app.pump(tester, openPlayer: true);
    double titleX(String title) =>
        tester.getTopLeft(inPlayer(find.text(title))).dx;
    final settled = titleX('Lesson 2');

    Future<void> midway() async {
      // The lesson reaches the player with the next frame.
      await tester.pump(const Duration(milliseconds: 16));
      await tester.pump(const Duration(milliseconds: 50));
    }

    app.handler.show(item: items[2], queueItems: items);
    await midway();
    expect(titleX('Lesson 3'), greaterThan(settled));
    await tester.pumpAndSettle();
    expect(titleX('Lesson 3'), settled);

    app.handler.show(item: items[1], queueItems: items);
    await midway();
    expect(titleX('Lesson 2'), lessThan(settled));
    await tester.pumpAndSettle();
    expect(titleX('Lesson 2'), settled);
    await app.dispose(tester);
  });

  testWidgets('opens by swiping up the mini-player, closes swiped down', (
    tester,
  ) async {
    final app = TestApp.create();
    await app.seedListening(tester);
    await app.pump(tester, location: AppRoutes.course('greek'));

    await tester.fling(find.byType(MiniPlayer), const Offset(0, -200), 1000);
    await tester.pumpAndSettle();
    expect(find.byType(PlayerScreen), findsOneWidget);

    await tester.fling(find.text('Lesson 3').last, const Offset(0, 400), 1500);
    await tester.pumpAndSettle();
    expect(find.byType(PlayerScreen), findsNothing);
    expect(find.byType(MiniPlayer), findsOneWidget);
    await app.dispose(tester);
  });

  group('shows the course cover', () {
    Finder cover() => find.descendant(
      of: find.byType(PlayerScreen),
      matching: find.byType(Image),
    );

    Future<void> showOn(
      WidgetTester tester,
      TestApp app, {
      required Size size,
      double textScale = 1,
    }) async {
      final items = app.queueFor('greek');
      app.handler.show(item: items[0], queueItems: items);
      await app.pump(
        tester,
        size: size,
        textScale: textScale,
        openPlayer: true,
      );
    }

    testWidgets('on a phone with room for it', (tester) async {
      final app = TestApp.create();
      await showOn(tester, app, size: const Size(393, 852));

      expect(cover(), findsOneWidget);
      expect(tester.getSize(cover()).width, greaterThanOrEqualTo(200));
      await app.dispose(tester);
    });

    testWidgets('not when the controls need the room', (tester) async {
      final app = TestApp.create();
      await showOn(tester, app, size: const Size(320, 568), textScale: 2);

      expect(cover(), findsNothing);
      await app.dispose(tester);
    });

    testWidgets('not on a phone held sideways', (tester) async {
      final app = TestApp.create();
      await showOn(tester, app, size: const Size(852, 393));

      expect(cover(), findsNothing);
      await app.dispose(tester);
    });
  });

  testWidgets('the mini-player stops following playback under the player', (
    tester,
  ) async {
    final app = TestApp.create();
    await app.seedListening(tester);
    await app.pump(tester, location: AppRoutes.course('greek'));
    double progress() => tester
        .widget<LinearProgressIndicator>(
          find.descendant(
            of: find.byType(MiniPlayer),
            matching: find.byType(LinearProgressIndicator),
          ),
        )
        .value!;
    final before = progress();

    await tester.tap(miniPlayerBand);
    await tester.pumpAndSettle();
    app.handler.movePosition(const Duration(minutes: 4));
    // The new position reaches the widgets with the next frame.
    await tester.pump(const Duration(milliseconds: 100));
    expect(progress(), before);

    await tester.tap(find.byTooltip('Close player'));
    await tester.pumpAndSettle();
    expect(progress(), greaterThan(before));
    await app.dispose(tester);
  });

  group('the lesson options', () {
    Future<void> openOptions(WidgetTester tester) async {
      await tester.tap(find.byTooltip('Lesson options'));
      await tester.pumpAndSettle();
    }

    testWidgets('know that the lesson is finished', (tester) async {
      final (app, items) = create();
      await tester.runAsync(
        () => app.progress.markPlayedThrough('greek', 'greek3'),
      );
      app.handler.show(item: items[2], queueItems: items);
      // Over the course list, where nothing else follows Greek's progress.
      await app.pump(tester, openPlayer: true);

      await openOptions(tester);

      expect(find.text('Mark as not finished'), findsOneWidget);
      await app.dispose(tester);
    });

    testWidgets('mark the lesson finished', (tester) async {
      final (app, items) = create();
      app.handler.show(item: items[2], queueItems: items);
      await app.pump(tester, openPlayer: true);

      await openOptions(tester);
      await tester.tap(find.text('Mark as finished'));
      await tester.pumpAndSettle();

      final progress = (await tester.runAsync(
        () => app.progress.loadCourse('greek'),
      ))!;
      expect(progress['greek3']?.finished, isTrue);
      await app.dispose(tester);
    });

    testWidgets('lead to the course, closing the player', (tester) async {
      final (app, items) = create();
      app.handler.show(item: items[2], queueItems: items);
      await app.pump(tester, openPlayer: true);

      await openOptions(tester);
      Finder inSheet(Finder finder) =>
          find.descendant(of: find.byType(BottomSheet), matching: finder);
      expect(inSheet(find.text('Download')), findsOneWidget);
      await tester.tap(inSheet(find.text('Complete Greek')));
      await tester.pumpAndSettle();

      expect(find.byType(PlayerScreen), findsNothing);
      expect(find.byType(CourseScreen), findsOneWidget);
      await app.dispose(tester);
    });
  });

  Finder option<T>(String label) =>
      find.widgetWithText(RadioListTile<T>, label);

  testWidgets('offers the speeds and applies the chosen one', (tester) async {
    final semantics = tester.ensureSemantics();
    final (app, items) = create();
    app.handler.show(item: items[0], queueItems: items);
    await app.pump(tester, openPlayer: true);

    await tester.tap(find.text('1×'));
    await tester.pumpAndSettle();
    for (final label in ['0.75×', '1×', '1.25×', '1.5×', '1.75×', '2×']) {
      expect(find.text(label), findsWidgets, reason: label);
    }
    // The speed it plays at is the one chosen.
    expect(
      tester.getSemantics(option<double>('1×')),
      isSemantics(isChecked: true),
    );
    expect(
      tester.getSemantics(option<double>('1.25×')),
      isSemantics(isChecked: false),
    );
    await tester.tap(find.text('1.25×'));
    await tester.pumpAndSettle();

    expect(app.handler.speeds, [1.25]);
    await app.dispose(tester);
    semantics.dispose();
  });

  testWidgets('sets the sleep timer and shows it', (tester) async {
    final (app, items) = create();
    app.handler.show(item: items[0], queueItems: items);
    await app.pump(tester, openPlayer: true);
    final sleep = find.bySemanticsLabel(RegExp('^Sleep timer, '));

    Future<void> choose(String option) async {
      await tester.tap(sleep);
      await tester.pumpAndSettle();
      await tester.tap(find.text(option));
      await tester.pumpAndSettle();
    }

    /// Opens the options, checks that [label] is the one chosen, and
    /// closes them again.
    Future<void> expectChosen(String label) async {
      await tester.tap(sleep);
      await tester.pumpAndSettle();
      expect(
        tester.getSemantics(option<SleepTimer?>(label)),
        isSemantics(isChecked: true),
        reason: label,
      );
      await tester.tapAt(const Offset(20, 20));
      await tester.pumpAndSettle();
    }

    await expectChosen('Off');

    await choose('15 min');
    expect(app.handler.sleepTimer, const SleepAfter(Duration(minutes: 15)));
    expect(inPlayer(find.text('15 min')), findsOneWidget);

    // It counts down.
    app.handler.setSleepTimer(
      const SleepAfter(Duration(minutes: 9, seconds: 10)),
    );
    await tester.pumpAndSettle();
    expect(inPlayer(find.text('10 min')), findsOneWidget);

    await choose('End of lesson');
    expect(app.handler.sleepTimer, const SleepAtLessonEnd());
    expect(inPlayer(find.text('End of lesson')), findsOneWidget);
    await expectChosen('End of lesson');

    await choose('Off');
    expect(app.handler.sleepTimer, isNull);
    expect(inPlayer(find.text('End of lesson')), findsNothing);
    await app.dispose(tester);
  });

  testWidgets('fits a set sleep timer on a small phone with large text', (
    tester,
  ) async {
    final (app, items) = create();
    app.handler
      ..show(item: items[0], queueItems: items)
      ..setSleepTimer(const SleepAtLessonEnd());
    await app.pump(
      tester,
      size: const Size(320, 568),
      textScale: 2,
      openPlayer: true,
    );
    // An overflow would have failed the test by now.
    expect(find.bySemanticsLabel(RegExp('^Sleep timer, ')), findsOneWidget);
    await app.dispose(tester);
  });

  group('the controls', () {
    testWidgets('play, skip back and forward, and change lessons', (
      tester,
    ) async {
      final (app, items) = create();
      app.handler.show(item: items[2], queueItems: items);
      await app.pump(tester, openPlayer: true);

      await tester.tap(inPlayer(find.byType(PlayPauseButton)));
      for (final tooltip in [
        'Back 10 seconds',
        'Forward 10 seconds',
        'Previous lesson',
        'Next lesson',
      ]) {
        await tester.tap(inPlayer(find.byTooltip(tooltip)));
      }
      await tester.pump();

      expect(app.handler.transport, ['play', 'rewind', 'fastForward']);
      expect(app.handler.skips, ['previous', 'next']);
      await app.dispose(tester);
    });

    testWidgets('pause a lesson that plays', (tester) async {
      final (app, items) = create();
      app.handler.show(item: items[2], queueItems: items, playing: true);
      await app.pump(tester, openPlayer: true);

      await tester.tap(inPlayer(find.byType(PlayPauseButton)));
      await tester.pump();

      expect(app.handler.transport, ['pause']);
      await app.dispose(tester);
    });
  });

  group('the seek line', () {
    Finder track() => inPlayer(
      find.descendant(
        of: find.byType(SeekLine),
        matching: find.byType(GestureDetector),
      ),
    ).first;

    /// The point [fraction] along the line, as the handle travels it.
    Offset along(WidgetTester tester, double fraction) {
      final box = tester.getRect(track());
      // The handle's travel stops half a held handle short of each end.
      const inset = 12.0;
      return Offset(
        box.left + inset + (box.width - 2 * inset) * fraction,
        box.center.dy,
      );
    }

    void expectSeeks(TestApp app, List<Duration> expected) {
      expect(app.handler.seeks, hasLength(expected.length));
      for (final (i, seek) in app.handler.seeks.indexed) {
        expect(seek.inMilliseconds, closeTo(expected[i].inMilliseconds, 5));
      }
    }

    testWidgets('seeks where it is tapped', (tester) async {
      final (app, items) = create();
      app.handler.show(item: items[2], queueItems: items);
      await app.pump(tester, openPlayer: true);

      await tester.tapAt(along(tester, 0.5));
      await tester.pump();

      expectSeeks(app, [items[2].duration! * 0.5]);
      await app.dispose(tester);
    });

    testWidgets('seeks once, where the handle is let go', (tester) async {
      final (app, items) = create();
      app.handler.show(item: items[2], queueItems: items);
      await app.pump(tester, openPlayer: true);

      final gesture = await tester.startGesture(along(tester, 0.25));
      for (final fraction in [0.4, 0.6, 0.75]) {
        await gesture.moveTo(along(tester, fraction));
        await tester.pump();
      }
      expect(app.handler.seeks, isEmpty, reason: 'not while dragging');
      await gesture.up();
      await tester.pump();

      expectSeeks(app, [items[2].duration! * 0.75]);
      await app.dispose(tester);
    });

    testWidgets('screen readers move it by ten seconds', (tester) async {
      final semantics = tester.ensureSemantics();
      final (app, items) = create();
      app.handler.show(
        item: items[2],
        queueItems: items,
        position: const Duration(minutes: 1),
      );
      await app.pump(tester, openPlayer: true);
      final line = find.semantics.byLabel('Position in lesson');

      tester.semantics
        ..performAction(line, SemanticsAction.increase)
        ..performAction(line, SemanticsAction.decrease);
      await tester.pump();

      expect(app.handler.seeks, [
        const Duration(minutes: 1, seconds: 10),
        const Duration(seconds: 50),
      ]);
      await app.dispose(tester);
      semantics.dispose();
    });
  });

  group('on iOS', () {
    /// Stands in for the platform's views; returns what was created.
    List<Map<Object?, Object?>> fakePlatformViews(WidgetTester tester) {
      final created = <Map<Object?, Object?>>[];
      final messenger = tester.binding.defaultBinaryMessenger
        ..setMockMethodCallHandler(SystemChannels.platform_views, (call) async {
          if (call.method == 'create') {
            created.add(call.arguments as Map<Object?, Object?>);
          }
          return null;
        });
      addTearDown(
        () => messenger.setMockMethodCallHandler(
          SystemChannels.platform_views,
          null,
        ),
      );
      return created;
    }

    testWidgets('offers the system output picker between speed and sleep', (
      tester,
    ) async {
      final created = fakePlatformViews(tester);
      final (app, items) = create();
      app.handler.show(item: items[0], queueItems: items);
      await app.pump(tester, openPlayer: true);

      final picker = inPlayer(find.byType(UiKitView));
      expect(picker, findsOneWidget);
      final view = created.single;
      expect(view['viewType'], 'languagetransfer/route-picker');
      final ink = CourseColors.resolve(
        tester.element(find.byType(PlayerScreen)),
        'greek',
      ).ink;
      expect(
        const StandardMessageCodec().decodeMessage(
          ByteData.sublistView(view['params']! as Uint8List),
        ),
        {'color': ink.toARGB32()},
      );
      // In the middle of the row, between the two buttons.
      final speed = tester.getCenter(inPlayer(find.text('1×'))).dx;
      final sleep = tester
          .getCenter(inPlayer(find.bySemanticsLabel(RegExp('^Sleep timer'))))
          .dx;
      final middle = tester.getCenter(picker).dx;
      expect(speed, lessThan(middle));
      expect(sleep, greaterThan(middle));
      final screen = tester.view.physicalSize / tester.view.devicePixelRatio;
      expect(middle, moreOrLessEquals(screen.width / 2, epsilon: 1));
      await app.dispose(tester);
    }, variant: TargetPlatformVariant.only(TargetPlatform.iOS));

    testWidgets('leaves the picker out of the sheet a swipe pulls up', (
      tester,
    ) async {
      fakePlatformViews(tester);
      final app = TestApp.create();
      await app.seedListening(tester);
      await app.pump(tester, location: AppRoutes.course('greek'));

      final gesture = await tester.startGesture(
        tester.getCenter(find.byType(MiniPlayer)),
      );
      for (var i = 0; i < 5; i++) {
        await gesture.moveBy(const Offset(0, -40));
        await tester.pump();
      }
      expect(find.byType(PlayerScreen), findsOneWidget);
      expect(find.byType(UiKitView), findsNothing);
      await gesture.up();
      await tester.pumpAndSettle();
      await app.dispose(tester);
    }, variant: TargetPlatformVariant.only(TargetPlatform.iOS));
  });

  testWidgets('has no previous lesson at the start of the course', (
    tester,
  ) async {
    final (app, items) = create();
    app.handler.show(item: items.first, queueItems: items);
    await app.pump(tester, openPlayer: true);

    expect(button(tester, 'Previous lesson').onPressed, isNull);
    expect(button(tester, 'Next lesson').onPressed, isNotNull);
    await app.dispose(tester);
  });

  testWidgets('has no next lesson at the end of the course', (tester) async {
    final (app, items) = create();
    app.handler.show(item: items.last, queueItems: items);
    await app.pump(tester, openPlayer: true);

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
    await app.pump(tester, openPlayer: true);

    expect(inPlayer(find.text('This lesson can’t be played')), findsOneWidget);
    expect(inPlayer(find.text('Try again')), findsOneWidget);
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
      await app.pump(tester, openPlayer: true);

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
      await app.pump(tester, openPlayer: true);

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
