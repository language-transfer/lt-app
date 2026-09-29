import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:languagetransfer/src/core/storage/integrity.dart';
import 'package:languagetransfer/src/core/storage/object_store.dart';
import 'package:path/path.dart' as p;

import '../../helpers/fixtures.dart';

void main() {
  late Directory root;
  late ObjectStore store;

  setUp(() {
    root = Directory.systemTemp.createTempSync('object_store_test');
    store = ObjectStore(root);
  });

  tearDown(() => root.deleteSync(recursive: true));

  test('uses the server layout: 2-digit folder, rest as file name', () {
    final pointer = pointerFor(utf8Bytes('x'));
    final hash = pointer.object;

    expect(
      store.fileFor(pointer).path,
      p.join(root.path, hash.substring(0, 2), hash.substring(2)),
    );
    expect(
      store.fileFor(pointer, extension: 'm4a').path,
      p.join(root.path, hash.substring(0, 2), '${hash.substring(2)}.m4a'),
    );
  });

  test('writes and reads back verified content', () async {
    final bytes = utf8Bytes('{"buildVersion":2}');
    final pointer = pointerFor(bytes);

    final file = await store.write(pointer, bytes);

    expect(file.path, store.fileFor(pointer).path);
    expect(await store.readVerified(pointer), bytes);
    expect(File('${file.path}.part').existsSync(), isFalse);
  });

  test('returns null for a missing object', () async {
    expect(await store.readVerified(pointerFor(utf8Bytes('none'))), isNull);
  });

  test('refuses to store bytes that do not match the pointer', () async {
    final pointer = pointerFor(utf8Bytes('expected'));

    await expectLater(
      store.write(pointer, utf8Bytes('tampered')),
      throwsA(isA<CorruptObjectException>()),
    );
    expect(store.fileFor(pointer).existsSync(), isFalse);
  });

  test('deletes a corrupted copy so it can be downloaded again', () async {
    final bytes = utf8Bytes('original');
    final pointer = pointerFor(bytes);
    final file = await store.write(pointer, bytes);
    file.writeAsStringSync('corrupted');

    expect(await store.readVerified(pointer), isNull);
    expect(file.existsSync(), isFalse);
  });

  test('delete tolerates a missing object', () async {
    final bytes = utf8Bytes('gone');
    final pointer = pointerFor(bytes);
    await store.write(pointer, bytes);

    await store.delete(pointer);
    await store.delete(pointer);
    expect(store.fileFor(pointer).existsSync(), isFalse);
  });

  test('verifyFile checks large files by streaming', () async {
    final bytes = utf8Bytes('a' * 200000);
    final pointer = pointerFor(bytes);
    final file = await store.write(pointer, bytes);

    await expectLater(verifyFile(pointer, file), completes);
    file.writeAsStringSync('b' * 200000);
    await expectLater(
      verifyFile(pointer, file),
      throwsA(isA<CorruptObjectException>()),
    );
  });

  test(
    'lists stored files and partial writes, ignoring anything else',
    () async {
      final audio = pointerFor(utf8Bytes('audio'));
      final metadata = pointerFor(utf8Bytes('{}'));
      final audioFile = store.fileFor(audio, extension: 'm4a');
      final metadataFile = store.fileFor(metadata);
      for (final file in [audioFile, metadataFile]) {
        file.parent.createSync(recursive: true);
        file.writeAsStringSync('x');
      }
      File('${metadataFile.path}.part').writeAsStringSync('x');
      File(p.join(audioFile.parent.path, 'notes.txt')).writeAsStringSync('x');
      Directory(p.join(root.path, 'staging')).createSync();

      final listed = {
        for (final stored in await store.list())
          (stored.objectId, stored.extension, stored.partial),
      };

      expect(listed, {
        (audio.object, 'm4a', false),
        (metadata.object, null, false),
        (metadata.object, null, true),
      });
    },
  );

  test('lists nothing before anything was stored', () async {
    root.deleteSync(recursive: true);

    expect(await store.list(), isEmpty);

    root.createSync();
  });
}
