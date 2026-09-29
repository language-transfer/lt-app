import 'dart:io';

import 'package:audio_service/audio_service.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:just_audio/just_audio.dart';
import 'package:languagetransfer/src/features/catalog/domain/course_index.dart';
import 'package:languagetransfer/src/features/catalog/domain/file_pointer.dart';
import 'package:languagetransfer/src/features/catalog/domain/lesson.dart';
import 'package:languagetransfer/src/features/player/data/lesson_sources.dart';
import 'package:languagetransfer/src/features/player/data/typed_remote_audio_source.dart';

import '../../../helpers/fixtures.dart';

class _Downloads implements DownloadedLessons {
  _Downloads(this.files);

  final Map<String, File> files;

  @override
  Future<Map<String, File>> filesForQueue(String courseId) async => files;
}

void main() {
  final index = CourseIndex.parse(fixture('all_courses.json'));
  final client = MockClient((_) async => http.Response('', 404));
  final low = FilePointer(object: fakeObjectId(1), size: 100);
  final high = FilePointer(object: fakeObjectId(2), size: 200);
  final highApple = FilePointer(object: fakeObjectId(3), size: 300);
  final withApple = Lesson(
    id: 'spanish1',
    title: 'Lesson 1',
    duration: const Duration(minutes: 5),
    variants: LessonVariants(low: low, high: high, highApple: highApple),
  );
  final withoutApple = Lesson(
    id: 'spanish2',
    title: 'Lesson 2',
    duration: const Duration(minutes: 5),
    variants: LessonVariants(low: low, high: high),
  );
  final lessons = [withApple, withoutApple];
  final tags = [
    for (final lesson in lessons) MediaItem(id: lesson.id, title: lesson.title),
  ];

  Future<List<AudioSource>> sources({
    required bool applePlayer,
    AudioQuality quality = AudioQuality.high,
    Map<String, File> downloaded = const {},
  }) =>
      LessonSources(
        applePlayer: applePlayer,
        client: client,
        downloads: _Downloads(downloaded),
      ).forQueue(
        courseId: 'spanish',
        index: index,
        lessons: lessons,
        streamQuality: quality,
        tags: tags,
      );

  test('plays a downloaded lesson from its file', () async {
    final file = File('/data/objects/ab/cd.m4a');

    final result = await sources(
      applePlayer: true,
      downloaded: {withApple.id: file},
    );

    final source = result.first as UriAudioSource;
    expect(source.uri, Uri.file(file.path));
    expect(result[1], isA<TypedRemoteAudioSource>());
  });

  test('streams directly on Android', () async {
    final result = await sources(applePlayer: false);

    expect(result.map((source) => (source as UriAudioSource).uri), [
      index.urlFor(high),
      index.urlFor(high),
    ]);
    expect(
      (await sources(
        applePlayer: false,
        quality: AudioQuality.low,
      )).map((source) => (source as UriAudioSource).uri),
      [index.urlFor(low), index.urlFor(low)],
    );
  });

  test('streams typed on Apple platforms, hq-mov for high quality', () async {
    final result = (await sources(applePlayer: true))
        .cast<TypedRemoteAudioSource>();

    expect(result[0].url, index.urlFor(highApple));
    expect(result[0].contentType, 'video/quicktime');
    expect(result[0].length, 300);
    // No hq-mov: low quality, since Apple's player cannot play hq.
    expect(result[1].url, index.urlFor(low));
    expect(result[1].contentType, 'audio/mp4');
    expect(result[1].length, 100);
  });

  test('tags every source with its lesson', () async {
    final result = await sources(applePlayer: false);

    expect(result.map((source) => (source as UriAudioSource).tag), tags);
  });
}
