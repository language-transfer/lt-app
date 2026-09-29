import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:languagetransfer/src/features/catalog/domain/course_index.dart';

import '../../../helpers/fixtures.dart';

void main() {
  group('CourseIndex', () {
    test('parses the live index format', () {
      final index = CourseIndex.parse(fixture('all_courses.json'));

      expect(
        index.casBaseUrl.toString(),
        'https://downloads.languagetransfer.org/cas',
      );
      expect(index.courses, hasLength(11));
      final spanish = index.entryFor('spanish')!;
      expect(spanish.lessonCount, 90);
      expect(
        spanish.metadata.object,
        '9773c7bf7e7648c77ab7b13a8d31642985c57c5f1a0c55756b12834642ed9ee5',
      );
      expect(spanish.metadata.size, 48359);
      expect(index.entryFor('ingles_completo')!.lessonCount, 71);
    });

    test('builds object URLs from the CAS base', () {
      final index = CourseIndex.parse(fixture('all_courses.json'));
      final pointer = index.entryFor('greek')!.metadata;
      expect(
        index.urlFor(pointer).toString(),
        'https://downloads.languagetransfer.org/cas/${pointer.object}',
      );
    });

    test('strips a trailing slash from the CAS base', () {
      final index = CourseIndex.fromJson(const {
        'buildVersion': 2,
        'casBaseURL': 'https://example.org/cas/',
        'courses': <Object?>[],
      });
      expect(index.casBaseUrl.toString(), 'https://example.org/cas');
    });

    test('keeps courses this app version does not know', () {
      final json =
          jsonDecode(fixture('all_courses.json')) as Map<String, Object?>;
      final courses = json['courses']! as List<Object?>;
      final first = courses.first! as Map<String, Object?>;
      courses.add({...first, 'id': 'japanese'});

      final index = CourseIndex.fromJson(json);
      expect(index.entryFor('japanese'), isNotNull);
    });

    test('rejects another build version', () {
      expect(
        () => CourseIndex.fromJson(const {
          'buildVersion': 3,
          'casBaseURL': 'https://example.org/cas',
          'courses': <Object?>[],
        }),
        throwsFormatException,
      );
    });

    test('rejects a CAS base that is not https', () {
      expect(
        () => CourseIndex.fromJson(const {
          'buildVersion': 2,
          'casBaseURL': 'http://example.org/cas',
          'courses': <Object?>[],
        }),
        throwsFormatException,
      );
    });

    test('rejects object ids that could escape the object store', () {
      final json =
          jsonDecode(fixture('all_courses.json')) as Map<String, Object?>;
      final courses = json['courses']! as List<Object?>;
      final first = courses.first! as Map<String, Object?>;
      final meta = first['meta']! as Map<String, Object?>;
      meta['object'] = '../../etc/passwd';

      expect(
        () => CourseIndex.fromJson(json),
        throwsA(
          isA<FormatException>().having(
            (e) => e.message,
            'message',
            'Invalid object id at courses[0].meta.object',
          ),
        ),
      );
    });

    test('reports invalid JSON', () {
      expect(() => CourseIndex.parse('<html>'), throwsFormatException);
    });
  });
}
