import 'package:audio_service/audio_service.dart';
import 'package:languagetransfer/src/core/network/network_exception.dart';
import 'package:languagetransfer/src/features/player/domain/sleep_timer.dart';

import 'app_harness.dart';

/// States beyond the everyday ones, for the tests that check every screen
/// (test/app). Each is applied after [TestApp.seedListening] and before
/// [TestApp.pump].
typedef AppState = void Function(TestApp app);

final _offline = NetworkException(
  Uri.parse('https://downloads.languagetransfer.org/cas/index'),
  'offline',
);

/// The course index cannot be loaded.
void noCourses(TestApp app) => app.indexError = _offline;

/// A course's lessons cannot be loaded.
void noLessons(TestApp app) => app.metadataError = _offline;

/// The lesson in the player could not be loaded.
void failedLesson(TestApp app) => _showLesson(
  app,
  processingState: AudioProcessingState.error,
  errorMessage: 'Cannot Open',
);

/// The lesson in the player is loading; its spinner never settles.
void loadingLesson(TestApp app) =>
    _showLesson(app, processingState: AudioProcessingState.loading);

/// A sleep timer counts down.
void sleepTimerSet(TestApp app) =>
    app.handler.setSleepTimer(const SleepAfter(Duration(minutes: 15)));

void _showLesson(
  TestApp app, {
  required AudioProcessingState processingState,
  String? errorMessage,
}) {
  final items = app.queueFor('greek');
  app.handler.show(
    item: items[2],
    queueItems: items,
    processingState: processingState,
    errorMessage: errorMessage,
  );
}
