import 'package:audio_service/audio_service.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:languagetransfer/src/features/player/presentation/play_pause_button.dart';
import 'package:languagetransfer/src/l10n/app_localizations.dart';

void main() {
  /// Shows the button for [processing] and [playing], taps it, and returns
  /// the callbacks called.
  Future<List<String>> showAndTap(
    WidgetTester tester, {
    required AudioProcessingState processing,
    required bool playing,
    bool canRetry = true,
  }) async {
    final calls = <String>[];
    await tester.pumpWidget(
      MaterialApp(
        localizationsDelegates: AppLocalizations.localizationsDelegates,
        supportedLocales: AppLocalizations.supportedLocales,
        home: Scaffold(
          body: PlayPauseButton(
            status: (
              playing: playing,
              processing: processing,
              queueIndex: 0,
              speed: 1,
              error: null,
            ),
            background: Colors.black,
            foreground: Colors.white,
            size: 96,
            onPlay: () => calls.add('play'),
            onPause: () => calls.add('pause'),
            onRetry: canRetry ? () => calls.add('retry') : null,
          ),
        ),
      ),
    );
    await tester.tap(find.byType(PlayPauseButton));
    // The loading indicator never settles.
    await tester.pump(const Duration(seconds: 1));
    return calls;
  }

  for (final (state, processing, playing, label, icon, call) in [
    (
      'paused',
      AudioProcessingState.ready,
      false,
      'Play',
      Icons.play_arrow_rounded,
      'play',
    ),
    (
      'playing',
      AudioProcessingState.ready,
      true,
      'Pause',
      Icons.pause_rounded,
      'pause',
    ),
    ('loading', AudioProcessingState.loading, false, 'Loading', null, 'play'),
    (
      'buffering while playing',
      AudioProcessingState.buffering,
      true,
      'Loading',
      Icons.pause_rounded,
      'pause',
    ),
    (
      'failed',
      AudioProcessingState.error,
      false,
      'Try again',
      Icons.refresh_rounded,
      'retry',
    ),
  ]) {
    testWidgets('$state: says "$label" and a tap calls $call', (tester) async {
      final calls = await showAndTap(
        tester,
        processing: processing,
        playing: playing,
      );

      expect(find.bySemanticsLabel(label), findsOneWidget);
      if (icon == null) {
        expect(find.byType(CircularProgressIndicator), findsOneWidget);
        expect(find.byType(Icon), findsNothing);
      } else {
        expect(find.byIcon(icon), findsOneWidget);
      }
      expect(calls, [call]);
    });
  }

  testWidgets('a failure that cannot be tried again offers play', (
    tester,
  ) async {
    final calls = await showAndTap(
      tester,
      processing: AudioProcessingState.error,
      playing: false,
      canRetry: false,
    );

    expect(find.bySemanticsLabel('Play'), findsOneWidget);
    expect(calls, ['play']);
  });
}
