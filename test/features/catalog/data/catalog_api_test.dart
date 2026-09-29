import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:languagetransfer/src/core/network/network_exception.dart';
import 'package:languagetransfer/src/core/storage/integrity.dart';
import 'package:languagetransfer/src/features/catalog/data/catalog_api.dart';
import 'package:languagetransfer/src/features/catalog/domain/course_index.dart';

import '../../../helpers/fixtures.dart';

void main() {
  final index = CourseIndex.parse(fixture('all_courses.json'));

  test('fetches the index with the app user agent', () async {
    late http.Request seen;
    final api = CatalogApi(
      MockClient((request) async {
        seen = request;
        return http.Response.bytes(utf8Bytes(fixture('all_courses.json')), 200);
      }),
      userAgent: 'LanguageTransfer-Flutter/test',
    );

    final json = await api.fetchIndexJson();

    expect(seen.method, 'GET');
    expect(seen.url, CatalogApi.indexUrl);
    expect(
      seen.headers[HttpHeaders.userAgentHeader],
      'LanguageTransfer-Flutter/test',
    );
    expect(CourseIndex.parse(json).courses, hasLength(11));
  });

  test('fetches and verifies an object from the CAS', () async {
    final bytes = utf8Bytes(fixture('spanish_metadata_3_lessons.json'));
    final pointer = pointerFor(bytes);
    late Uri requested;
    final api = CatalogApi(
      MockClient((request) async {
        requested = request.url;
        return http.Response.bytes(bytes, 200);
      }),
      userAgent: 'test',
    );

    expect(await api.fetchObject(index, pointer), bytes);
    expect(requested, index.urlFor(pointer));
  });

  test('rejects an object whose content does not match its hash', () async {
    final pointer = pointerFor(utf8Bytes('expected'));
    final api = CatalogApi(
      MockClient((_) async => http.Response('tampered', 200)),
      userAgent: 'test',
    );

    await expectLater(
      api.fetchObject(index, pointer),
      throwsA(isA<CorruptObjectException>()),
    );
  });

  test('reports an unexpected status as a network error', () async {
    final api = CatalogApi(
      MockClient((_) async => http.Response('Forbidden', 403)),
      userAgent: 'test',
    );

    await expectLater(
      api.fetchIndexJson(),
      throwsA(
        isA<NetworkException>().having((e) => e.statusCode, 'statusCode', 403),
      ),
    );
  });

  test('reports a failed connection as a network error', () async {
    final api = CatalogApi(
      MockClient((_) async => throw http.ClientException('no route to host')),
      userAgent: 'test',
    );

    await expectLater(api.fetchIndexJson(), throwsA(isA<NetworkException>()));
  });

  test('reports a timeout as a network error', () async {
    final api = CatalogApi(
      MockClient((_) async {
        await Future<void>.delayed(const Duration(seconds: 1));
        return http.Response('{}', 200);
      }),
      userAgent: 'test',
      timeout: const Duration(milliseconds: 10),
    );

    await expectLater(
      api.fetchIndexJson(),
      throwsA(
        isA<NetworkException>().having(
          (e) => e.reason,
          'reason',
          contains('timed out'),
        ),
      ),
    );
  });
}
