import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';

import 'package:crypto/crypto.dart';
import 'package:languagetransfer/src/core/storage/file_pointer.dart';

/// Reads a file from `test/fixtures/`.
String fixture(String name) => File('test/fixtures/$name').readAsStringSync();

/// A pointer that matches [bytes], as the server would publish it.
FilePointer pointerFor(List<int> bytes) =>
    FilePointer(object: sha256.convert(bytes).toString(), size: bytes.length);

Uint8List utf8Bytes(String text) => Uint8List.fromList(utf8.encode(text));

/// A syntactically valid object id for tests that never touch its content.
String fakeObjectId(int seed) => seed.toRadixString(16).padLeft(64, '0');
