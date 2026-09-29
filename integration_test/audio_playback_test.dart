// Checks which lesson files the platform player can actually play, against
// the real backend. Run on a simulator, emulator or device:
//   fvm flutter test integration_test/audio_playback_test.dart -d <device>
//
// Background: lesson files have no extension and are served as
// application/octet-stream; low quality is AAC in MP4, high quality is MP3 in
// MP4, and "hq-mov" is the same MP3 in a QuickTime container for Apple's
// player (see the catalog domain models).

import 'dart:async';
import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:integration_test/integration_test.dart';
import 'package:just_audio/just_audio.dart';
import 'package:languagetransfer/src/core/storage/integrity.dart';
import 'package:languagetransfer/src/features/catalog/domain/course_index.dart';
import 'package:languagetransfer/src/features/catalog/domain/lesson.dart';
import 'package:languagetransfer/src/features/player/data/typed_remote_audio_source.dart';

import 'support.dart';

/// What happened when a file was loaded and played.
class Outcome {
  Outcome.played(this.duration) : error = null;
  Outcome.failed(this.error) : duration = null;

  final Duration? duration;
  final String? error;

  bool get played => error == null;

  @override
  String toString() =>
      played ? 'played (duration $duration)' : 'FAILED: $error';
}

Future<Outcome> _loadAndPlay(
  Future<Duration?> Function(AudioPlayer) load,
) async {
  final player = AudioPlayer();
  try {
    final duration = await load(player).timeout(const Duration(seconds: 30));
    const from = Duration(seconds: 120);
    await player.seek(from);
    unawaited(player.play());
    await player.positionStream
        .firstWhere((position) => position >= from + const Duration(seconds: 1))
        .timeout(const Duration(seconds: 20));
    return Outcome.played(duration);
  } on PlayerException catch (error) {
    return Outcome.failed('PlayerException ${error.code}: ${error.message}');
  } on TimeoutException {
    return Outcome.failed('timed out (no progress)');
  } finally {
    await player.dispose();
  }
}

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  late CourseIndex index;
  late Lesson lesson;
  late Directory temp;
  final client = http.Client();
  final results = <String, Outcome>{};

  setUpAll(() async {
    final spanish = await fetchSpanish(client);
    index = spanish.index;
    lesson = spanish.lessons.first;
    temp = Directory.systemTemp.createTempSync('audio_playback_test');
  });

  tearDownAll(() {
    client.close();
    temp.deleteSync(recursive: true);
    // One summary line per case, easy to find in the device log.
    for (final MapEntry(:key, :value) in results.entries) {
      debugPrint('PLAYBACK ${defaultTargetPlatform.name} | $key | $value');
    }
  });

  Future<File> download(AudioVariant variant, String fileName) async {
    final pointer = switch (variant) {
      AudioVariant.low => lesson.variants.low,
      AudioVariant.high => lesson.variants.high,
      AudioVariant.highApple => lesson.variants.highApple!,
    };
    final response = await client.get(index.urlFor(pointer));
    verifyBytes(pointer, response.bodyBytes);
    return File('${temp.path}/$fileName')..writeAsBytesSync(response.bodyBytes);
  }

  Future<Outcome> check(
    String name,
    Future<Duration?> Function(AudioPlayer) load,
  ) async {
    final outcome = await _loadAndPlay(load);
    results[name] = outcome;
    return outcome;
  }

  final isApple =
      defaultTargetPlatform == TargetPlatform.iOS ||
      defaultTargetPlatform == TargetPlatform.macOS;

  testWidgets('streams low quality (AAC, no extension, octet-stream)', (
    _,
  ) async {
    final outcome = await check(
      'stream low',
      (player) => player.setUrl(index.urlFor(lesson.variants.low).toString()),
    );
    // Android plays it; Apple's player fails with -11828 "Cannot Open". If
    // this changes, revisit TypedRemoteAudioSource.
    expect(outcome.played, !isApple, reason: '$outcome');
    if (outcome.played) {
      expect(
        outcome.duration!.inSeconds,
        closeTo(lesson.duration.inSeconds, 1),
      );
    }
  });

  testWidgets(
    'streams low quality with the correct media type on Apple platforms',
    (_) async {
      final outcome = await check(
        'stream low typed',
        (player) => player.setAudioSource(
          TypedRemoteAudioSource(
            url: index.urlFor(lesson.variants.low),
            length: lesson.variants.low.size,
            contentType: AudioVariant.low.contentType,
            client: client,
          ),
        ),
      );
      expect(outcome.played, isTrue, reason: '$outcome');
      expect(
        outcome.duration!.inSeconds,
        closeTo(lesson.duration.inSeconds, 1),
      );
    },
    // Android streams directly and never uses this source.
    skip: !isApple,
  );

  testWidgets('plays a downloaded low-quality file with .m4a', (_) async {
    final file = await download(AudioVariant.low, 'low.m4a');
    final outcome = await check(
      'local low .m4a',
      (p) => p.setFilePath(file.path),
    );
    expect(outcome.played, isTrue, reason: '$outcome');
  });

  testWidgets('downloaded low-quality file without extension', (_) async {
    final file = await download(AudioVariant.low, 'low-no-extension');
    final outcome = await check(
      'local low (no ext)',
      (p) => p.setFilePath(file.path),
    );
    // Apple's player needs the extension; this is why downloads get one.
    expect(outcome.played, !isApple, reason: '$outcome');
  });

  testWidgets('high quality (MP3 in MP4): streaming', (_) async {
    final outcome = await check(
      'stream high',
      (player) => player.setUrl(index.urlFor(lesson.variants.high).toString()),
    );
    expect(outcome.played, !isApple, reason: '$outcome');
  });

  testWidgets('high quality (MP3 in MP4): downloaded with .mp4', (_) async {
    final file = await download(AudioVariant.high, 'high.mp4');
    final outcome = await check(
      'local high .mp4',
      (p) => p.setFilePath(file.path),
    );
    // Apple's player loads MP3 in MP4 but never plays it (hence hq-mov).
    expect(outcome.played, !isApple, reason: '$outcome');
  });

  group('high quality for Apple (MP3 in QuickTime, "hq-mov")', () {
    setUp(() {
      expect(
        lesson.variants.highApple,
        isNotNull,
        reason: 'The server no longer offers hq-mov.',
      );
    });

    testWidgets(
      'streams with the correct media type',
      (_) async {
        final file = lesson.variants.highApple!;
        final outcome = await check(
          'stream hq-mov typed',
          (player) => player.setAudioSource(
            TypedRemoteAudioSource(
              url: index.urlFor(file),
              length: file.size,
              contentType: AudioVariant.highApple.contentType,
              client: client,
            ),
          ),
        );
        expect(outcome.played, isTrue, reason: '$outcome');
        expect(
          outcome.duration!.inSeconds,
          closeTo(lesson.duration.inSeconds, 1),
        );
      },
      // Only Apple devices use this variant.
      skip: !isApple,
    );

    testWidgets('plays a downloaded file with .mov', (_) async {
      final file = await download(AudioVariant.highApple, 'high.mov');
      final outcome = await check(
        'local hq-mov .mov',
        (p) => p.setFilePath(file.path),
      );
      expect(outcome.played, isTrue, reason: '$outcome');
    }, skip: !isApple);
  });
}
