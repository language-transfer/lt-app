// Checks the parsers against the real backend. Skipped by default; run with
// `fvm flutter test --tags live --run-skipped`.
@Tags(['live'])
library;

import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:languagetransfer/src/features/catalog/data/catalog_api.dart';
import 'package:languagetransfer/src/features/catalog/domain/course.dart';
import 'package:languagetransfer/src/features/catalog/domain/course_index.dart';
import 'package:languagetransfer/src/features/catalog/domain/course_metadata.dart';

void main() {
  late http.Client client;
  late CatalogApi api;

  setUp(() {
    client = http.Client();
    api = CatalogApi(
      client,
      userAgent: 'LanguageTransfer-Flutter/contract-test',
    );
  });

  tearDown(() => client.close());

  test('every course in the live index parses and verifies', () async {
    final index = CourseIndex.parse(await api.fetchIndexJson());
    expect(index.courses, isNotEmpty);

    for (final entry in index.courses) {
      expect(
        Courses.byId(entry.id),
        isNotNull,
        reason: 'new course on the server: ${entry.id}',
      );
      // fetchObject checks size and SHA-256.
      final bytes = await api.fetchObject(index, entry.metadata);
      final metadata = CourseMetadata.parse(utf8.decode(bytes));

      expect(metadata.lessons, hasLength(entry.lessonCount), reason: entry.id);
      final ids = metadata.lessons.map((lesson) => lesson.id).toSet();
      expect(ids, hasLength(metadata.lessons.length), reason: entry.id);
      for (final lesson in metadata.lessons) {
        expect(lesson.duration, greaterThan(Duration.zero), reason: lesson.id);
      }
    }
  }, timeout: const Timeout(Duration(minutes: 2)));
}
