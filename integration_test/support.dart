// What the on-device tests share: the real backend's lessons, and waiting
// for the real player or downloader.

import 'dart:async';
import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:languagetransfer/src/features/catalog/data/catalog_api.dart';
import 'package:languagetransfer/src/features/catalog/domain/course_index.dart';
import 'package:languagetransfer/src/features/catalog/domain/course_metadata.dart';
import 'package:languagetransfer/src/features/catalog/domain/lesson.dart';

/// How the tests introduce themselves to the backend.
const userAgent = 'LanguageTransfer-Flutter/test';

/// The course index and the lessons of Complete Spanish, from the real
/// backend.
Future<({CourseIndex index, List<Lesson> lessons})> fetchSpanish(
  http.Client client,
) async {
  final api = CatalogApi(client, userAgent: userAgent);
  final index = CourseIndex.parse(await api.fetchIndexJson());
  final bytes = await api.fetchObject(
    index,
    index.entryFor('spanish')!.metadata,
  );
  return (
    index: index,
    lessons: CourseMetadata.parse(utf8.decode(bytes)).lessons,
  );
}

/// Waits until [condition] holds, checking every [interval], and fails with
/// [reason] after [timeout].
Future<void> eventually(
  FutureOr<bool> Function() condition, {
  String? reason,
  Duration timeout = const Duration(seconds: 30),
  Duration interval = const Duration(milliseconds: 100),
}) async {
  final deadline = DateTime.now().add(timeout);
  while (!await condition()) {
    if (DateTime.now().isAfter(deadline)) {
      fail('Timed out waiting: ${reason ?? 'condition'}');
    }
    await Future<void>.delayed(interval);
  }
}
