import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:languagetransfer/src/core/storage/atomic_write.dart';
import 'package:path/path.dart' as p;

void main() {
  late Directory temp;

  setUp(() => temp = Directory.systemTemp.createTempSync('atomic_write'));
  tearDown(() => temp.deleteSync(recursive: true));

  test('writes the file and leaves no partial one', () async {
    final file = File(p.join(temp.path, 'cover.jpg'));

    final written = await writeAtomically(file, [1, 2, 3]);

    expect(written.path, file.path);
    expect(file.readAsBytesSync(), [1, 2, 3]);
    expect(temp.listSync().map((entry) => p.basename(entry.path)), [
      'cover.jpg',
    ]);
  });

  test('deletes the partial file when the write fails', () async {
    // A directory that is not empty cannot be replaced by a file.
    final target = Directory(p.join(temp.path, 'cover.jpg'))..createSync();
    File(p.join(target.path, 'inside')).writeAsBytesSync([0]);

    await expectLater(
      writeAtomically(File(target.path), [1, 2, 3]),
      throwsA(isA<FileSystemException>()),
    );
    expect(File('${target.path}$partialFileSuffix').existsSync(), isFalse);
  });
}
