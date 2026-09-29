// Checks the playback rules of LessonAudioHandler with the real player and
// the real backend. Run on a simulator, emulator or device:
//   fvm flutter test integration_test/lesson_audio_handler_test.dart -d <device>

import 'dart:async';
import 'dart:io';

import 'package:audio_service/audio_service.dart';
import 'package:drift/native.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:integration_test/integration_test.dart';
import 'package:just_audio/just_audio.dart';
import 'package:languagetransfer/src/core/storage/database.dart';
import 'package:languagetransfer/src/core/storage/object_store.dart';
import 'package:languagetransfer/src/features/catalog/domain/course_index.dart';
import 'package:languagetransfer/src/features/catalog/domain/lesson.dart';
import 'package:languagetransfer/src/features/player/data/lesson_audio_handler.dart';
import 'package:languagetransfer/src/features/player/data/lesson_sources.dart';
import 'package:languagetransfer/src/features/player/domain/sleep_timer.dart';
import 'package:languagetransfer/src/features/progress/application/lesson_completion.dart';
import 'package:languagetransfer/src/features/progress/data/progress_repository.dart';
import 'package:languagetransfer/src/features/settings/data/settings_repository.dart';

import 'support.dart';

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  final client = http.Client();
  late CourseIndex index;
  late List<Lesson> lessons;

  late AppDatabase database;
  late ProgressRepository progress;
  late SettingsRepository settings;
  late LessonAudioHandler handler;

  setUpAll(() async {
    final spanish = await fetchSpanish(client);
    index = spanish.index;
    lessons = spanish.lessons.sublist(0, 3);
  });

  // The client is not closed: streams of the last test may still have
  // connection attempts in flight, which a forced close turns into errors
  // after the tests are done. The app never closes its client either.

  setUp(() async {
    database = AppDatabase(NativeDatabase.memory());
    progress = ProgressRepository(database: database);
    settings = SettingsRepository(database: database);
    handler = LessonAudioHandler(
      player: AudioPlayer.new,
      progress: progress,
      playedThrough: LessonCompletion(
        progress: progress,
        settings: settings,
        deleteDownload: (_, _) async {},
      ).playedThrough,
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
    await eventually(
      () => handler.player.playing && handler.player.position > Duration.zero,
    );

    expect(handler.player.currentIndex, 0);
    expect(
      handler.player.position.inSeconds,
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
      () => handler.player.currentIndex == 1 && handler.player.playing,
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
    await eventually(
      () => handler.player.currentIndex == 1,
      reason: 'advanced',
    );
    await eventually(() => !handler.player.playing, reason: 'paused');
    await Future<void>.delayed(const Duration(seconds: 1));

    expect(handler.player.position, lessThan(const Duration(seconds: 1)));
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
    await eventually(() => handler.player.playing, reason: 'playing');
    await eventually(
      () =>
          !handler.player.playing &&
          handler.player.position < const Duration(seconds: 1),
      reason: 'stopped at the start',
    );

    expect(await finished('spanish3'), isTrue);
    expect(handler.player.currentIndex, 2);
  });

  testWidgets('skipping within the last seconds counts as finishing', (
    _,
  ) async {
    await playSpanish(0);
    await eventually(
      () => handler.player.playing && handler.player.position > Duration.zero,
    );
    await handler.seek(lessons[0].duration - const Duration(seconds: 3));

    await handler.skipToNext();

    expect(handler.player.currentIndex, 1);
    expect(await finished('spanish1'), isTrue);
  });

  testWidgets('skipping earlier does not', (_) async {
    await playSpanish(0);
    await eventually(
      () => handler.player.playing && handler.player.position > Duration.zero,
    );

    await handler.skipToNext();

    expect(handler.player.currentIndex, 1);
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
      () => handler.player.position > const Duration(seconds: 61),
      reason: 'playing past the resume position',
    );

    await playSpanish(2);
    await eventually(
      () =>
          handler.player.playing &&
          handler.mediaItem.value?.lessonId == 'spanish3',
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
    await eventually(
      () => handler.player.playing && handler.player.position > Duration.zero,
    );
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
    await eventually(
      () => handler.player.playing && handler.player.position > Duration.zero,
    );

    await playSpanish(2);
    await eventually(
      () =>
          handler.player.playing &&
          handler.mediaItem.value?.lessonId == 'spanish3',
      reason: 'playing lesson 3',
    );
    await Future<void>.delayed(const Duration(seconds: 2));

    expect(handler.player.playing, isTrue);
  });

  testWidgets('stopping while a lesson loads keeps it stopped', (_) async {
    final starting = playSpanish(0);
    await handler.stop();
    await starting;
    await Future<void>.delayed(const Duration(seconds: 2));

    expect(handler.player.playing, isFalse);
  });

  testWidgets('a lesson requested while another loads wins', (_) async {
    final first = playSpanish(0);
    final second = playSpanish(2);
    await (first, second).wait;
    await eventually(() => handler.player.playing, reason: 'playing');
    await Future<void>.delayed(const Duration(seconds: 1));

    expect(handler.mediaItem.value?.lessonId, 'spanish3');
    expect(handler.player.currentIndex, 2);
  });

  testWidgets('a pause by the player itself saves the position', (_) async {
    await progress.savePosition(
      'spanish',
      'spanish2',
      const Duration(minutes: 1),
    );
    await playSpanish(1);
    await eventually(
      () => handler.player.position > const Duration(seconds: 65),
      reason: 'playing on',
    );

    // As for unplugged headphones or a call: not through the handler.
    await handler.player.pause();
    await Future<void>.delayed(const Duration(milliseconds: 500));

    final saved = (await progress.loadCourse('spanish'))['spanish2']!.position!;
    expect(
      (saved - handler.player.position).abs(),
      lessThan(const Duration(milliseconds: 300)),
    );
  });

  testWidgets('a sleep timer set to the end of the lesson stops there, even '
      'with autoplay on', (_) async {
    await progress.savePosition('spanish', 'spanish1', lessons[0].duration);
    await settings.update((s) => s.copyWith(playbackSpeed: 2));
    handler.setSleepTimer(const SleepAtLessonEnd());

    await playSpanish(0);
    await eventually(
      () => handler.player.currentIndex == 1,
      reason: 'advanced',
    );
    await eventually(() => !handler.player.playing, reason: 'stopped');
    await Future<void>.delayed(const Duration(seconds: 1));

    expect(handler.player.position, lessThan(const Duration(seconds: 1)));
    expect(await handler.sleepTimerStream.first, isNull);
    expect(await finished('spanish1'), isTrue);
  });

  testWidgets('a sleep timer that runs out fades out, pauses and leaves the '
      'volume as it was', (_) async {
    await playSpanish(0);
    await eventually(
      () => handler.player.playing && handler.player.position > Duration.zero,
    );
    handler.setSleepTimer(const SleepAfter(Duration(seconds: 7)));

    await Future<void>.delayed(const Duration(seconds: 4));
    expect(handler.player.volume, lessThan(1), reason: 'fading out');
    await eventually(() => !handler.player.playing, reason: 'paused');
    await eventually(() => handler.player.volume == 1, reason: 'volume back');
    expect(await handler.sleepTimerStream.first, isNull);
  });

  testWidgets('turning the sleep timer off while it fades brings the volume '
      'back', (_) async {
    await playSpanish(0);
    await eventually(
      () => handler.player.playing && handler.player.position > Duration.zero,
    );
    handler.setSleepTimer(const SleepAfter(Duration(seconds: 4)));
    await Future<void>.delayed(const Duration(seconds: 2));
    expect(handler.player.volume, lessThan(1), reason: 'fading out');

    handler.setSleepTimer(null);
    await eventually(() => handler.player.volume == 1, reason: 'volume back');
    await Future<void>.delayed(const Duration(seconds: 3));
    expect(handler.player.playing, isTrue);
  });

  testWidgets('a paused lesson does not use up the sleep timer', (_) async {
    await playSpanish(0);
    await eventually(
      () => handler.player.playing && handler.player.position > Duration.zero,
    );
    handler.setSleepTimer(const SleepAfter(Duration(minutes: 1)));
    await handler.pause();

    await Future<void>.delayed(const Duration(seconds: 3));
    final timer = await handler.sleepTimerStream.first;
    expect(
      (timer! as SleepAfter).left,
      greaterThan(const Duration(seconds: 59)),
    );
  });

  testWidgets('stopping turns the sleep timer off', (_) async {
    await playSpanish(0);
    await eventually(() => handler.player.playing);
    handler.setSleepTimer(const SleepAfter(Duration(minutes: 5)));

    await handler.stop();

    expect(await handler.sleepTimerStream.first, isNull);
  });

  group('a deleted download', () {
    late Directory temp;
    late File file;
    late _TestDownloads downloads;
    late LessonAudioHandler withDownload;

    bool playsFile(int index) => switch (withDownload.player.sequence[index]) {
      UriAudioSource(:final uri) => uri.isScheme('file'),
      _ => false,
    };

    Future<void> play(int startIndex) => withDownload.playCourse(
      courseId: 'spanish',
      courseTitle: 'Complete Spanish',
      index: index,
      lessons: lessons,
      startIndex: startIndex,
    );

    setUp(() async {
      temp = Directory.systemTemp.createTempSync('lesson_audio_handler_test');
      // Lesson 2 is downloaded, stored as the app stores it.
      final audio = lessons[1].variants.low;
      file = ObjectStore(temp)
          .fileFor(audio, extension: AudioVariant.low.fileExtension);
      await file.parent.create(recursive: true);
      await file.writeAsBytes(
        (await client.get(index.urlFor(audio))).bodyBytes,
      );
      downloads = _TestDownloads({lessons[1].id: file});
      withDownload = LessonAudioHandler(
        player: AudioPlayer.new,
        progress: progress,
        playedThrough: (_, _) async {},
        settings: settings,
        sources: LessonSources(
          applePlayer: defaultTargetPlatform == TargetPlatform.iOS,
          client: client,
          downloads: downloads,
        ),
      );
      await withDownload.init();
    });

    tearDown(() async {
      await withDownload.dispose();
      await downloads.close();
      temp.deleteSync(recursive: true);
    });

    testWidgets('is streamed from then on, and its file let go', (_) async {
      await play(0);
      await eventually(() => withDownload.player.playing, reason: 'playing');
      expect(playsFile(1), isTrue);

      downloads.release({file.path});
      await eventually(
        () => downloads.used.lastOrNull?.isEmpty ?? false,
        reason: 'file let go',
      );
      expect(playsFile(1), isFalse);
      expect(withDownload.player.currentIndex, 0);

      await withDownload.skipToNext();
      await eventually(
        () =>
            withDownload.player.currentIndex == 1 &&
            withDownload.player.playing &&
            withDownload.player.position > Duration.zero,
        reason: 'lesson 2 streams',
      );
    });

    testWidgets('that is playing keeps its file until the player moves on', (
      _,
    ) async {
      await play(1);
      await eventually(
        () =>
            withDownload.player.playing &&
            withDownload.player.position > Duration.zero,
        reason: 'playing lesson 2',
      );

      downloads.release({file.path});
      await Future<void>.delayed(const Duration(seconds: 2));
      expect(downloads.used, isEmpty, reason: 'still played from its file');
      expect(playsFile(1), isTrue);

      await withDownload.skipToNext();
      await eventually(
        () => downloads.used.lastOrNull?.isEmpty ?? false,
        reason: 'file let go',
      );
      expect(playsFile(1), isFalse);
    });

    testWidgets('that is playing is let go when playback stops', (_) async {
      await play(1);
      await eventually(
        () =>
            withDownload.player.playing &&
            withDownload.player.position > Duration.zero,
        reason: 'playing lesson 2',
      );
      downloads.release({file.path});
      await Future<void>.delayed(const Duration(milliseconds: 500));
      expect(downloads.used, isEmpty, reason: 'still played from its file');

      await withDownload.stop();
      await eventually(
        () => downloads.used.lastOrNull?.isEmpty ?? false,
        reason: 'file let go',
      );
      expect(playsFile(1), isFalse);
      expect(withDownload.player.currentIndex, 1, reason: 'still lesson 2');

      // Played again, as with a headset's button: lesson 2 streams.
      unawaited(withDownload.play());
      await eventually(
        () =>
            withDownload.player.currentIndex == 1 &&
            withDownload.player.playing &&
            withDownload.player.position > Duration.zero,
        reason: 'lesson 2 streams',
      );
    });
  });

  testWidgets('back and forward skip ten seconds', (_) async {
    await progress.savePosition(
      'spanish',
      'spanish2',
      const Duration(minutes: 1),
    );
    await playSpanish(1);
    await eventually(
      () => handler.player.playing && handler.player.position > Duration.zero,
    );
    await handler.pause();

    final start = handler.player.position;
    await handler.rewind();
    expect(
      (start - handler.player.position).inMilliseconds,
      closeTo(10000, 300),
    );
    await handler.fastForward();
    await handler.fastForward();
    expect(
      (handler.player.position - start).inMilliseconds,
      closeTo(10000, 300),
    );
  });

  testWidgets('speed is applied and remembered', (_) async {
    await playSpanish(0);
    await handler.setSpeed(1.5);

    expect(handler.player.speed, 1.5);
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
      () => handler.player.position > const Duration(seconds: 31),
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
    await eventually(() => handler.player.playing, reason: 'playing again');
    expect(handler.playbackState.value.errorMessage, isNull);
  });

  testWidgets(
    'a lesson that could not load plays when tried again online',
    // Only Apple's player reads the streams through the app's client.
    skip: defaultTargetPlatform != TargetPlatform.iOS,
    (_) async {
      final connection = _Connection(client)..offline = true;
      final offlineHandler = LessonAudioHandler(
        player: AudioPlayer.new,
        progress: progress,
        playedThrough: LessonCompletion(
          progress: progress,
          settings: settings,
          deleteDownload: (_, _) async {},
        ).playedThrough,
        settings: settings,
        sources: LessonSources(
          applePlayer: true,
          client: connection,
          downloads: const _NoDownloads(),
        ),
      );
      await offlineHandler.init();
      Future<void> play() => offlineHandler.playCourse(
        courseId: 'spanish',
        courseTitle: 'Complete Spanish',
        index: index,
        lessons: lessons,
        startIndex: 0,
      );

      await play();
      await eventually(
        () =>
            offlineHandler.playbackState.value.processingState ==
            AudioProcessingState.error,
        reason: 'failure shown',
      );

      // The same lesson and address again, as "Try again" does.
      connection.offline = false;
      await play();
      await eventually(
        () =>
            offlineHandler.playbackState.value.playing &&
            offlineHandler.playbackState.value.processingState ==
                AudioProcessingState.ready,
        reason: 'playing again',
      );
      await offlineHandler.dispose();
    },
  );

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

/// A network connection that can be cut, for the streams Apple's player
/// reads through the app.
class _Connection extends http.BaseClient {
  _Connection(this._inner);

  final http.Client _inner;
  bool offline = false;

  @override
  Future<http.StreamedResponse> send(http.BaseRequest request) {
    if (offline) throw http.ClientException('offline', request.url);
    return _inner.send(request);
  }
}

/// Lessons downloaded as the test says, and what the handler tells about
/// their files.
class _TestDownloads implements DownloadedLessons {
  _TestDownloads(this.files);

  final Map<String, File> files;
  final _released = StreamController<Set<String>>.broadcast();

  /// The paths the handler said its queue plays, call by call.
  final used = <Set<String>>[];

  /// Deletes the downloads of [paths], which the queue plays.
  void release(Set<String> paths) => _released.add(paths);

  Future<void> close() => _released.close();

  @override
  Future<Map<String, File>> filesForQueue(String courseId) async => files;

  @override
  Stream<Set<String>> get released => _released.stream;

  @override
  Future<void> useFiles(Set<String> paths) async => used.add(paths);
}

class _NoDownloads implements DownloadedLessons {
  const _NoDownloads();

  @override
  Future<Map<String, File>> filesForQueue(String courseId) async => const {};

  @override
  Stream<Set<String>> get released => const Stream.empty();

  @override
  Future<void> useFiles(Set<String> paths) async {}
}
