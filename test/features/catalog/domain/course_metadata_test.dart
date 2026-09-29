import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:languagetransfer/src/core/storage/file_pointer.dart';
import 'package:languagetransfer/src/features/catalog/domain/course_metadata.dart';
import 'package:languagetransfer/src/features/catalog/domain/lesson.dart';

import '../../../helpers/fixtures.dart';

Map<String, Object?> _fixtureJson() =>
    jsonDecode(fixture('spanish_metadata_3_lessons.json'))
        as Map<String, Object?>;

Map<String, Object?> _variantsOfFirstLesson(Map<String, Object?> json) {
  final lessons = json['lessons']! as List<Object?>;
  final first = lessons.first! as Map<String, Object?>;
  return first['variants']! as Map<String, Object?>;
}

void main() {
  group('CourseMetadata', () {
    test('parses the live metadata format', () {
      final metadata = CourseMetadata.parse(
        fixture('spanish_metadata_3_lessons.json'),
      );

      expect(metadata.lessons.map((lesson) => lesson.id), [
        'spanish1',
        'spanish2',
        'spanish3',
      ]);
      final first = metadata.lessons.first;
      expect(first.title, 'Lesson 1');
      expect(first.duration, const Duration(microseconds: 334080998));
      expect(first.variants.low.size, 2784246);
      expect(first.variants.high.size, 5397643);
      expect(first.variants.highApple, isNull);
      expect(metadata.indexOf('spanish3'), 2);
      expect(metadata.indexOf('spanish99'), isNull);
    });

    test('reads the announced hq-mov variant', () {
      final json = _fixtureJson();
      final variants = _variantsOfFirstLesson(json);
      variants['hq-mov'] = {
        ...variants['hq']! as Map<String, Object?>,
        'object': fakeObjectId(7),
        'mimeType': 'video/quicktime',
      };

      final lesson = CourseMetadata.fromJson(json).lessons.first;
      expect(lesson.variants.highApple?.object, fakeObjectId(7));
    });

    test('ignores variants it does not know', () {
      final json = _fixtureJson();
      _variantsOfFirstLesson(json)['opus'] = {'anything': true};

      expect(() => CourseMetadata.fromJson(json), returnsNormally);
    });

    test('requires the hq and lq variants', () {
      final json = _fixtureJson();
      _variantsOfFirstLesson(json).remove('lq');

      expect(
        () => CourseMetadata.fromJson(json),
        throwsA(
          isA<FormatException>().having(
            (e) => e.message,
            'message',
            'Missing lessons[0].variants.lq',
          ),
        ),
      );
    });

    test('rejects another build version', () {
      final json = _fixtureJson()..['buildVersion'] = 3;
      expect(() => CourseMetadata.fromJson(json), throwsFormatException);
    });
  });

  group('LessonVariants.select', () {
    FilePointer pointer(int seed) =>
        FilePointer(object: fakeObjectId(seed), size: seed);
    final withApple = LessonVariants(
      low: pointer(1),
      high: pointer(2),
      highApple: pointer(3),
    );
    final withoutApple = LessonVariants(low: pointer(1), high: pointer(2));

    test('low quality is the same everywhere', () {
      for (final apple in [true, false]) {
        expect(
          withApple.select(AudioQuality.low, applePlayer: apple),
          AudioFile(AudioVariant.low, pointer(1)),
        );
      }
    });

    test('high quality uses hq outside Apple platforms', () {
      expect(
        withApple.select(AudioQuality.high, applePlayer: false),
        AudioFile(AudioVariant.high, pointer(2)),
      );
    });

    test('high quality uses hq-mov on Apple platforms', () {
      expect(
        withApple.select(AudioQuality.high, applePlayer: true),
        AudioFile(AudioVariant.highApple, pointer(3)),
      );
    });

    test('Apple platforms fall back to low quality without hq-mov', () {
      expect(
        withoutApple.select(AudioQuality.high, applePlayer: true),
        AudioFile(AudioVariant.low, pointer(1)),
      );
    });
  });
}
