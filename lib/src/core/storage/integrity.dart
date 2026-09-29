import 'dart:io';
import 'dart:isolate';

import 'package:crypto/crypto.dart';
import 'package:languagetransfer/src/core/storage/file_pointer.dart';

/// Thrown when downloaded or stored bytes do not match their [FilePointer].
class CorruptObjectException implements Exception {
  const CorruptObjectException(this.pointer, this.reason);

  final FilePointer pointer;
  final String reason;

  @override
  String toString() => 'CorruptObjectException: ${pointer.object} ($reason)';
}

/// Checks [bytes] against the size and SHA-256 recorded in [pointer].
void verifyBytes(FilePointer pointer, List<int> bytes) {
  if (bytes.length != pointer.size) {
    throw CorruptObjectException(
      pointer,
      'expected ${pointer.size} bytes, got ${bytes.length}',
    );
  }
  final digest = sha256.convert(bytes).toString();
  if (digest != pointer.object) {
    throw CorruptObjectException(pointer, 'SHA-256 is $digest');
  }
}

/// Checks [file] against [pointer] in a background isolate, since hashing a
/// lesson takes long enough to drop frames. Reads the file in chunks rather
/// than into memory at once.
Future<void> verifyFile(FilePointer pointer, File file) =>
    Isolate.run(() => _verifyFile(pointer, file));

Future<void> _verifyFile(FilePointer pointer, File file) async {
  final length = await file.length();
  if (length != pointer.size) {
    throw CorruptObjectException(
      pointer,
      'expected ${pointer.size} bytes, file has $length',
    );
  }
  final digest = (await sha256.bind(file.openRead()).single).toString();
  if (digest != pointer.object) {
    throw CorruptObjectException(pointer, 'SHA-256 is $digest');
  }
}
