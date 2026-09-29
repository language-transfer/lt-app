// Checks the playback rules of LessonAudioHandler with the real player and
// the real backend. Run on a simulator, emulator or device:
//   fvm flutter test integration_test/lesson_audio_handler_test.dart -d <device>

import 'dart:convert';
import 'dart:io';

import 'package:audio_service/audio_service.dart';
import 'package:drift/native.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:integration_test/integration_test.dart';
import 'package:just_audio/just_audio.dart';
import 'package:languagetransfer/src/core/storage/database.dart';
import 'package:languagetransfer/src/features/catalog/data/catalog_api.dart';
import 'package:languagetransfer/src/features/catalog/domain/course_index.dart';
import 'package:languagetransfer/src/features/catalog/domain/course_metadata.dart';
import 'package:languagetransfer/src/features/catalog/domain/lesson.dart';
import 'package:languagetransfer/src/features/player/data/lesson_audio_handler.dart';
import 'package:languagetransfer/src/features/player/data/lesson_sources.dart';
import 'package:languagetransfer/src/features/progress/application/lesson_completion.dart';
import 'package:languagetransfer/src/features/progress/data/progress_repository.dart';
import 'package:languagetransfer/src/features/settings/data/settings_repository.dart';

/// Waits until [condition] holds, checking every 100 ms.
Future<void> eventually(
  bool Function() condition, {
  Duration timeout = const Duration(seconds: 30),
  String? reason,
}) async {
  final deadline = DateTime.now().add(timeout);
  while (!condition()) {
    if (DateTime.now().isAfter(deadline)) {
      fail('Timed out waiting: ${reason ?? 'condition'}');
    }
    await Future<void>.delayed(const Duration(milliseconds: 100));
  }
}

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  final client = http.Client();
  late CourseIndex index;
  late List<Lesson> lessons;

  late AppDatabase database;
  late ProgressRepository progress;
  late SettingsRepository settings;
  late AudioPlayer player;
  late LessonAudioHandler handler;

  setUpAll(() async {
    final api = CatalogApi(client, userAgent: 'LanguageTransfer-Flutter/test');
    index = CourseIndex.parse(await api.fetchIndexJson());
    final entry = index.entryFor('spanish')!;
    final bytes = await api.fetchObject(index, entry.metadata);
    lessons = CourseMetadata.parse(utf8.decode(bytes)).lessons.sublist(0, 3);
  });

  // The client is not closed: streams of the last test may still have
  // connection attempts in flight, which a forced close turns into errors
  // after the tests are done. The app never closes its client either.

  setUp(() async {
    database = AppDatabase(NativeDatabase.memory());
    progress = ProgressRepository(database: database);
    settings = SettingsRepository(database: database);
    player = AudioPlayer();
    handler = LessonAudioHandler(
      player: player,
      progress: progress,
      completion: LessonCompletion(
        progress: progress,
        settings: settings,
        deleteDownload: (_, _) async {},
      ),
      settings: settings,
      sources: LessonSources(
        applePlayer: defaultTargetPlatform == TargetPlatform.iOS,
        client: client,
        downloads: const _NoDownloads(),
      ),
    );
    await handler.init();
  });

  tearDown(() async {
    await handler.dispose();
    await database.close();
  });

  Future<void> playSpanish(int startIndex) => handler.playCourse(
    courseId: 'spanish',
    courseTitle: 'Complete Spanish',
    index: index,
    lessons: lessons,
    startIndex: startIndex,
  );

  Future<bool?> finished(String lessonId) async =>
      (await progress.loadCourse('spanish'))[lessonId]?.finished;

  testWidgets('resumes at the saved position', (_) async {
    await progress.savePosition(
      'spanish',
      'spanish1',
      const Duration(minutes: 2),
    );

    await playSpanish(0);
    await eventually(() => player.playing && player.position > Duration.zero);

    expect(player.currentIndex, 0);
    expect(
      player.position.inSeconds,
      inInclusiveRange(119, 125),
      reason: 'started at 2:00',
    );
    expect(handler.mediaItem.value?.lessonId, 'spanish1');
  });

  testWidgets('playing to the end finishes the lesson and continues', (
    _,
  ) async {
    // Resumes 10 s before the end (the margin), at double speed.
    await progress.savePosition('spanish', 'spanish1', lessons[0].duration);
    await settings.update((s) => s.copyWith(playbackSpeed: 2));

    await playSpanish(0);
    await eventually(
      () => player.currentIndex == 1 && player.playing,
      reason: 'advanced to lesson 2',
    );

    await eventually(() => handler.mediaItem.value?.lessonId == 'spanish2');
    expect(await finished('spanish1'), isTrue);
  });

  testWidgets('with autoplay off, stops at the start of the next lesson', (
    _,
  ) async {
    await progress.savePosition('spanish', 'spanish1', lessons[0].duration);
    await settings.update((s) => s.copyWith(playbackSpeed: 2, autoplay: false));

    await playSpanish(0);
    await eventually(() => player.currentIndex == 1, reason: 'advanced');
    await eventually(() => !player.playing, reason: 'paused');
    await Future<void>.delayed(const Duration(seconds: 1));

    expect(player.position, lessThan(const Duration(seconds: 1)));
    expect(await finished('spanish1'), isTrue);
    // Waits at the very start, so it reads as not started.
    final next = (await progress.loadCourse('spanish'))['spanish2']!;
    expect(next.position, Duration.zero);
    expect(next.started, isFalse);
  });

  testWidgets('the last lesson finishes the course', (_) async {
    await progress.savePosition('spanish', 'spanish3', lessons[2].duration);
    await settings.update((s) => s.copyWith(playbackSpeed: 2));

    await playSpanish(2);
    await eventually(() => player.playing, reason: 'playing');
    await eventually(
      () => !player.playing && player.position < const Duration(seconds: 1),
      reason: 'stopped at the start',
    );

    expect(await finished('spanish3'), isTrue);
    expect(player.currentIndex, 2);
  });

  testWidgets('skipping within the last seconds counts as finishing', (
    _,
  ) async {
    await playSpanish(0);
    await eventually(() => player.playing && player.position > Duration.zero);
    await handler.seek(lessons[0].duration - const Duration(seconds: 3));

    await handler.skipToNext();

    expect(player.currentIndex, 1);
    expect(await finished('spanish1'), isTrue);
  });

  testWidgets('skipping earlier does not', (_) async {
    await playSpanish(0);
    await eventually(() => player.playing && player.position > Duration.zero);

    await handler.skipToNext();

    expect(player.currentIndex, 1);
    expect(await finished('spanish1'), isNot(isTrue));
  });

  testWidgets('starting another lesson finishes none and keeps the place', (
    _,
  ) async {
    await progress.savePosition(
      'spanish',
      'spanish2',
      const Duration(minutes: 1),
    );
    await playSpanish(1);
    await eventually(
      () => player.position > const Duration(seconds: 61),
      reason: 'playing past the resume position',
    );

    await playSpanish(2);
    await eventually(
      () => player.playing && handler.mediaItem.value?.lessonId == 'spanish3',
      reason: 'playing lesson 3',
    );

    final saved = await progress.loadCourse('spanish');
    expect(saved.values.where((lesson) => lesson.finished), isEmpty);
    // Not reset. (On iOS a stream just resumed may not have moved on yet,
    // though the player's extrapolated position says so.)
    expect(
      saved['spanish2']!.position,
      greaterThanOrEqualTo(const Duration(minutes: 1)),
    );
  });

  testWidgets('starting another lesson within the last seconds finishes it', (
    _,
  ) async {
    await playSpanish(0);
    await eventually(() => player.playing && player.position > Duration.zero);
    await handler.seek(lessons[0].duration - const Duration(seconds: 3));
    await handler.pause();

    // A queue whose indexes point at other lessons than the one before.
    await handler.playCourse(
      courseId: 'spanish',
      courseTitle: 'Complete Spanish',
      index: index,
      lessons: lessons.sublist(1),
      startIndex: 1,
    );

    expect(await finished('spanish1'), isTrue);
    expect(await finished('spanish2'), isNot(isTrue));
    expect(await finished('spanish3'), isNot(isTrue));
  });

  testWidgets('with autoplay off, a newly started lesson plays on', (_) async {
    await settings.update((s) => s.copyWith(autoplay: false));
    await playSpanish(0);
    await eventually(() => player.playing && player.position > Duration.zero);

    await playSpanish(2);
    await eventually(
      () => player.playing && handler.mediaItem.value?.lessonId == 'spanish3',
      reason: 'playing lesson 3',
    );
    await Future<void>.delayed(const Duration(seconds: 2));

    expect(player.playing, isTrue);
  });

  testWidgets('stopping while a lesson loads keeps it stopped', (_) async {
    final starting = playSpanish(0);
    await handler.stop();
    await starting;
    await Future<void>.delayed(const Duration(seconds: 2));

    expect(player.playing, isFalse);
  });

  testWidgets('a lesson requested while another loads wins', (_) async {
    final first = playSpanish(0);
    final second = playSpanish(2);
    await (first, second).wait;
    await eventually(() => player.playing, reason: 'playing');
    await Future<void>.delayed(const Duration(seconds: 1));

    expect(handler.mediaItem.value?.lessonId, 'spanish3');
    expect(player.currentIndex, 2);
  });

  testWidgets('a pause by the player itself saves the position', (_) async {
    await progress.savePosition(
      'spanish',
      'spanish2',
      const Duration(minutes: 1),
    );
    await playSpanish(1);
    await eventually(
      () => player.position > const Duration(seconds: 65),
      reason: 'playing on',
    );

    // As for unplugged headphones or a call: not through the handler.
    await player.pause();
    await Future<void>.delayed(const Duration(milliseconds: 500));

    final saved = (await progress.loadCourse('spanish'))['spanish2']!.position!;
    expect(
      (saved - player.position).abs(),
      lessThan(const Duration(milliseconds: 300)),
    );
  });

  testWidgets('back and forward skip ten seconds', (_) async {
    await progress.savePosition(
      'spanish',
      'spanish2',
      const Duration(minutes: 1),
    );
    await playSpanish(1);
    await eventually(() => player.playing && player.position > Duration.zero);
    await handler.pause();

    final start = player.position;
    await handler.rewind();
    expect((start - player.position).inMilliseconds, closeTo(10000, 300));
    await handler.fastForward();
    await handler.fastForward();
    expect((player.position - start).inMilliseconds, closeTo(10000, 300));
  });

  testWidgets('speed is applied and remembered', (_) async {
    await playSpanish(0);
    await handler.setSpeed(1.5);

    expect(player.speed, 1.5);
    expect((await settings.load()).playbackSpeed, 1.5);
  });

  testWidgets('saves the position while playing', (_) async {
    await progress.savePosition(
      'spanish',
      'spanish3',
      const Duration(seconds: 30),
    );
    await playSpanish(2);
    // Resuming puts the position at 30 s before anything plays, so wait
    // until playback really moves on; streaming may buffer a while first.
    await eventually(
      () => player.position > const Duration(seconds: 31),
      reason: 'playing past the resume position',
    );

    // The periodic save runs every 3 s.
    await Future<void>.delayed(const Duration(seconds: 4));
    final saved = (await progress.loadCourse('spanish'))['spanish3']!.position!;

    expect(saved.inSeconds, greaterThan(30));
  });

  testWidgets('a lesson that cannot be loaded stays failed', (_) async {
    // .invalid never resolves (RFC 2606), like a device without a network.
    final unreachable = CourseIndex(
      casBaseUrl: Uri.parse('https://unreachable.invalid/cas'),
      courses: index.courses,
    );
    await handler.playCourse(
      courseId: 'spanish',
      courseTitle: 'Complete Spanish',
      index: unreachable,
      lessons: lessons,
      startIndex: 0,
    );
    await eventually(
      () =>
          handler.playbackState.value.processingState ==
          AudioProcessingState.error,
      reason: 'failure shown',
    );

    // The player turns idle after a failure; the failure must not vanish
    // with it, or the player looks paused and nothing happens.
    await Future<void>.delayed(const Duration(seconds: 3));
    expect(
      handler.playbackState.value.processingState,
      AudioProcessingState.error,
    );
    expect(handler.playbackState.value.errorMessage, isNotNull);

    // A new attempt clears it.
    await playSpanish(0);
    await eventually(() => player.playing, reason: 'playing again');
    expect(handler.playbackState.value.errorMessage, isNull);
  });

  testWidgets('a lesson that failed to load keeps its saved position', (
    _,
  ) async {
    await progress.savePosition(
      'spanish',
      'spanish1',
      const Duration(minutes: 2),
    );
    await handler.playCourse(
      courseId: 'spanish',
      courseTitle: 'Complete Spanish',
      index: CourseIndex(
        casBaseUrl: Uri.parse('https://unreachable.invalid/cas'),
        courses: index.courses,
      ),
      lessons: lessons,
      startIndex: 0,
    );
    await eventually(
      () =>
          handler.playbackState.value.processingState ==
          AudioProcessingState.error,
      reason: 'failure shown',
    );

    await handler.stop();

    final saved = (await progress.loadCourse('spanish'))['spanish1']!;
    expect(saved.position, const Duration(minutes: 2));
  });
}

class _NoDownloads implements DownloadedLessons {
  const _NoDownloads();

  @override
  Future<Map<String, File>> filesForQueue(String courseId) async => const {};
}
