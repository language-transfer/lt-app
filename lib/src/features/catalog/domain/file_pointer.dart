import 'package:flutter/foundation.dart';
import 'package:languagetransfer/src/core/json/json_reader.dart';

/// A file in Language Transfer's content-addressed store (CAS).
///
/// [object] is the SHA-256 of the file's content, which makes every object
/// immutable and lets a download be verified.
@immutable
class FilePointer {
  const FilePointer({required this.object, required this.size});

  /// Parses `{"_type": "file", "object", "filesize"}` (upstream
  /// `src/data/courseSchemas.ts`, `filePointerSchema`). The pointer's
  /// `mimeType` is not needed: every variant has one known format.
  factory FilePointer.fromJson(JsonObject json) {
    final type = json.string('_type');
    if (type != 'file') {
      throw FormatException('Expected _type "file" at ${json.path}');
    }
    final object = json.string('object');
    // The id becomes a file path on the device, so anything other than a
    // SHA-256 hex digest is rejected.
    if (!_sha256Hex.hasMatch(object)) {
      throw FormatException('Invalid object id at ${json.path}.object');
    }
    final size = json.integer('filesize');
    if (size < 0) {
      throw FormatException('Negative filesize at ${json.path}.filesize');
    }
    return FilePointer(object: object, size: size);
  }

  static final _sha256Hex = RegExp(r'^[0-9a-f]{64}$');

  final String object;

  /// Size in bytes.
  final int size;

  @override
  bool operator ==(Object other) =>
      other is FilePointer && other.object == object && other.size == size;

  @override
  int get hashCode => Object.hash(object, size);

  @override
  String toString() => 'FilePointer($object, $size bytes)';
}
