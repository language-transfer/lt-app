import 'dart:async';
import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:languagetransfer/src/core/network/network_exception.dart';
import 'package:languagetransfer/src/core/storage/object_store.dart';
import 'package:languagetransfer/src/features/catalog/data/catalog_api.dart';
import 'package:languagetransfer/src/features/catalog/data/course_metadata_repository.dart';
import 'package:languagetransfer/src/features/catalog/domain/course_index.dart';

import '../../../helpers/fixtures.dart';

void main() {
  final metadataBytes = utf8Bytes(fixture('spanish_metadata_3_lessons.json'));
  final pointer = pointerFor(metadataBytes);
  final index = CourseIndex(
    casBaseUrl: Uri.parse('https://example.org/cas'),
    courses: [
      CourseIndexEntry(id: 'spanish', lessonCount: 3, metadata: pointer),
    ],
  );
  final entry = index.entryFor('spanish')!;

  late Directory root;
  late ObjectStore store;
  late int requests;
  late FutureOr<http.Response> Function() respond;

  CourseMetadataRepository repository() => CourseMetadataRepository(
    api: CatalogApi(
      MockClient((request) async {
        requests++;
        expect(request.url, index.urlFor(pointer));
        return await respond();
      }),
      userAgent: 'test',
    ),
    store: store,
  );

  setUp(() {
    root = Directory.systemTemp.createTempSync('metadata_repository_test');
    store = ObjectStore(root);
    requests = 0;
    respond = () => http.Response.bytes(metadataBytes, 200);
  });

  tearDown(() => root.deleteSync(recursive: true));

  test('downloads, stores and parses metadata', () async {
    final repo = repository();

    final metadata = await repo.load(index, entry);

    expect(metadata.lessons, hasLength(3));
    expect(requests, 1);
    expect(store.fileFor(pointer).readAsBytesSync(), metadataBytes);

    await repo.load(index, entry);
    expect(requests, 1, reason: 'served from memory');
  });

  test('reads a stored copy without the network', () async {
    await repository().load(index, entry);
    respond = () => throw http.ClientException('offline');

    final metadata = await repository().load(index, entry);

    expect(metadata.lessons.first.id, 'spanish1');
    expect(requests, 1);
  });

  test('downloads again when the stored copy is corrupted', () async {
    await repository().load(index, entry);
    store.fileFor(pointer).writeAsStringSync('corrupted');

    await repository().load(index, entry);

    expect(requests, 2);
    expect(store.fileFor(pointer).readAsBytesSync(), metadataBytes);
  });

  test('concurrent loads share one download', () async {
    final response = Completer<http.Response>();
    respond = () => response.future;
    final repo = repository();

    final first = repo.load(index, entry);
    final second = repo.load(index, entry);
    await pumpEventQueue();
    response.complete(http.Response.bytes(metadataBytes, 200));

    expect(identical(await first, await second), isTrue);
    expect(requests, 1);
  });

  test('throws when nothing is stored and the network fails', () async {
    respond = () => throw http.ClientException('offline');

    await expectLater(
      repository().load(index, entry),
      throwsA(isA<NetworkException>()),
    );
  });

  test('deleteLocalCopy removes the stored copy', () async {
    final repo = repository();
    await repo.load(index, entry);

    await repo.deleteLocalCopy(entry);

    expect(store.fileFor(pointer).existsSync(), isFalse);
    await repo.load(index, entry);
    expect(requests, 2, reason: 'memory copy was dropped too');
  });
}
