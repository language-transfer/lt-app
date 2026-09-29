import 'dart:async';
import 'dart:convert';

import 'package:drift/drift.dart' hide isNotNull, isNull;
import 'package:drift/native.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:languagetransfer/src/core/network/network_exception.dart';
import 'package:languagetransfer/src/core/storage/database.dart';
import 'package:languagetransfer/src/features/catalog/data/catalog_api.dart';
import 'package:languagetransfer/src/features/catalog/data/course_index_repository.dart';

import '../../../helpers/fixtures.dart';

/// The live fixture with Spanish's lesson count changed, to tell versions
/// apart.
String _indexWithSpanishLessons(int count) {
  final json = jsonDecode(fixture('all_courses.json')) as Map<String, Object?>;
  final courses = json['courses']! as List<Object?>;
  (courses.first! as Map<String, Object?>)['lessons'] = count;
  return jsonEncode(json);
}

void main() {
  late AppDatabase database;
  late DateTime now;
  late int requests;
  late FutureOr<http.Response> Function() respond;

  CourseIndexRepository repository() => CourseIndexRepository(
    api: CatalogApi(
      MockClient((_) async {
        requests++;
        return await respond();
      }),
      userAgent: 'test',
    ),
    database: database,
    now: () => now,
  );

  Future<void> storeCachedIndex(String json, DateTime fetchedAt) => database
      .into(database.cachedCourseIndex)
      .insert(
        CachedCourseIndexCompanion.insert(
          id: const Value(CachedCourseIndex.singleRowId),
          json: json,
          fetchedAt: fetchedAt,
        ),
      );

  Future<String?> storedJson() async =>
      (await database.select(database.cachedCourseIndex).getSingleOrNull())
          ?.json;

  setUp(() {
    database = AppDatabase(NativeDatabase.memory());
    // Whole seconds: drift stores DateTime with second precision.
    now = DateTime(2026, 9, 28, 12);
    requests = 0;
    respond = () => http.Response(_indexWithSpanishLessons(90), 200);
  });

  tearDown(() => database.close());

  test('fetches and stores the index when nothing is cached', () async {
    final repo = repository();

    final loaded = await repo.load();

    expect(loaded.index.entryFor('spanish')!.lessonCount, 90);
    expect(loaded.fetchedAt, now);
    expect(requests, 1);
    expect(await storedJson(), _indexWithSpanishLessons(90));

    await repo.load();
    expect(requests, 1, reason: 'served from memory');
  });

  test('uses a fresh cached index without the network', () async {
    await storeCachedIndex(
      _indexWithSpanishLessons(90),
      now.subtract(const Duration(hours: 11)),
    );

    final loaded = await repository().load();

    expect(loaded.index.entryFor('spanish')!.lessonCount, 90);
    expect(requests, 0);
  });

  test(
    'returns a stale index at once and refreshes in the background',
    () async {
      await storeCachedIndex(
        _indexWithSpanishLessons(89),
        now.subtract(const Duration(hours: 13)),
      );
      final response = Completer<http.Response>();
      respond = () => response.future;
      final repo = repository();
      final update = repo.updates.first;

      final loaded = await repo.load();

      expect(loaded.index.entryFor('spanish')!.lessonCount, 89);
      // load() returns before the request goes out; let it start.
      await pumpEventQueue();
      expect(requests, 1, reason: 'refresh started, not awaited');

      response.complete(http.Response(_indexWithSpanishLessons(90), 200));
      final refreshed = await update;
      expect(refreshed.index.entryFor('spanish')!.lessonCount, 90);
      expect((await repo.load()).index.entryFor('spanish')!.lessonCount, 90);
      expect(await storedJson(), _indexWithSpanishLessons(90));
    },
  );

  test('keeps the cached index when a background refresh fails, and waits '
      'before retrying', () async {
    await storeCachedIndex(
      _indexWithSpanishLessons(89),
      now.subtract(const Duration(days: 3)),
    );
    respond = () => throw http.ClientException('offline');
    final repo = repository();

    expect((await repo.load()).index.entryFor('spanish')!.lessonCount, 89);
    await pumpEventQueue();
    expect(requests, 1);

    await repo.load();
    await pumpEventQueue();
    expect(requests, 1, reason: 'within the retry delay');

    now = now.add(const Duration(minutes: 2));
    await repo.load();
    await pumpEventQueue();
    expect(requests, 2, reason: 'retry delay passed');
    expect(await storedJson(), _indexWithSpanishLessons(89));
  });

  test('throws when nothing is cached and the network fails', () async {
    respond = () => throw http.ClientException('offline');

    await expectLater(repository().load(), throwsA(isA<NetworkException>()));
  });

  test('refresh always fetches and reports failures', () async {
    await storeCachedIndex(_indexWithSpanishLessons(89), now);
    final repo = repository();

    expect((await repo.refresh()).index.entryFor('spanish')!.lessonCount, 90);
    expect(requests, 1);

    respond = () => http.Response('Bad gateway', 502);
    await expectLater(repo.refresh(), throwsA(isA<NetworkException>()));
  });

  test('concurrent loads share one request', () async {
    final response = Completer<http.Response>();
    respond = () => response.future;
    final repo = repository();

    final first = repo.load();
    final second = repo.load();
    await pumpEventQueue();
    response.complete(http.Response(_indexWithSpanishLessons(90), 200));

    await Future.wait([first, second]);
    expect(requests, 1);
  });

  test('an invalid response never replaces a good cached index', () async {
    await storeCachedIndex(
      _indexWithSpanishLessons(89),
      now.subtract(const Duration(hours: 13)),
    );
    respond = () => http.Response('{"buildVersion": 3}', 200);
    final repo = repository();

    await repo.load();
    await pumpEventQueue();

    expect(requests, 1);
    expect(await storedJson(), _indexWithSpanishLessons(89));
  });

  test('treats a fetch time in the future as stale', () async {
    await storeCachedIndex(
      _indexWithSpanishLessons(89),
      now.add(const Duration(days: 30)),
    );
    final repo = repository();
    final update = repo.updates.first;

    await repo.load();

    expect((await update).index.entryFor('spanish')!.lessonCount, 90);
  });

  test('ignores a cached index it cannot read', () async {
    await storeCachedIndex('{"buildVersion": 3}', now);

    final loaded = await repository().load();

    expect(loaded.index.entryFor('spanish')!.lessonCount, 90);
    expect(requests, 1);
  });

  test('reports when the index should be checked again', () async {
    final repo = repository();
    expect(repo.timeUntilStale, Duration.zero);

    await repo.load();
    now = now.add(const Duration(hours: 5));
    expect(repo.timeUntilStale, const Duration(hours: 7));

    now = now.add(const Duration(hours: 8));
    expect(repo.timeUntilStale, Duration.zero, reason: 'overdue');

    now = now.subtract(const Duration(days: 2));
    expect(repo.timeUntilStale, Duration.zero, reason: 'clock set back');
  });
}
