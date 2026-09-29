import 'dart:io';
import 'dart:typed_data';

import 'package:languagetransfer/src/core/storage/integrity.dart';
import 'package:languagetransfer/src/features/catalog/domain/file_pointer.dart';
import 'package:path/path.dart' as p;

/// A file found in the [ObjectStore]; `partial` marks an unfinished write.
typedef StoredFile = ({
  File file,
  String objectId,
  String? extension,
  bool partial,
});

/// Local copies of CAS objects, stored by content hash.
///
/// Layout: `<root>/<first 2 hex digits>/<remaining 62>[.<extension>]`, the
/// same split as the server and the Expo app. Audio files get an extension
/// (see `AudioVariant.fileExtension`); metadata JSON does not.
class ObjectStore {
  ObjectStore(this.root);

  final Directory root;

  static final _prefix = RegExp(r'^[0-9a-f]{2}$');
  static final _name = RegExp(r'^([0-9a-f]{62})(?:\.([a-z0-9]+))?$');
  static const _partialSuffix = '.part';

  File fileFor(FilePointer pointer, {String? extension}) =>
      fileForId(pointer.object, extension: extension);

  /// Like [fileFor], for an object id that is known to be a SHA-256 digest.
  File fileForId(String objectId, {String? extension}) {
    final name = extension == null
        ? objectId.substring(2)
        : '${objectId.substring(2)}.$extension';
    return File(p.join(root.path, objectId.substring(0, 2), name));
  }

  /// Every file in the store, including partial writes left behind by a
  /// crash. Files that do not follow the layout are left out.
  Future<List<StoredFile>> list() async {
    if (!root.existsSync()) return const [];
    final found = <StoredFile>[];
    await for (final directory in root.list()) {
      final prefix = p.basename(directory.path);
      if (directory is! Directory || !_prefix.hasMatch(prefix)) continue;
      await for (final entry in directory.list()) {
        if (entry is! File) continue;
        var name = p.basename(entry.path);
        final partial = name.endsWith(_partialSuffix);
        if (partial) {
          name = name.substring(0, name.length - _partialSuffix.length);
        }
        final match = _name.firstMatch(name);
        if (match == null) continue;
        found.add((
          file: entry,
          objectId: '$prefix${match[1]}',
          extension: match[2],
          partial: partial,
        ));
      }
    }
    return found;
  }

  /// Returns the stored bytes if they are present and intact.
  ///
  /// A copy that fails verification is deleted, so the caller downloads it
  /// again instead of failing on it forever.
  Future<Uint8List?> readVerified(
    FilePointer pointer, {
    String? extension,
  }) async {
    final file = fileFor(pointer, extension: extension);
    final Uint8List bytes;
    try {
      bytes = await file.readAsBytes();
    } on PathNotFoundException {
      return null;
    }
    try {
      verifyBytes(pointer, bytes);
    } on CorruptObjectException {
      await deleteFile(file);
      return null;
    }
    return bytes;
  }

  /// Verifies [bytes] and stores them. Throws [CorruptObjectException] if
  /// they do not match [pointer].
  Future<File> write(
    FilePointer pointer,
    Uint8List bytes, {
    String? extension,
  }) async {
    verifyBytes(pointer, bytes);
    final file = fileFor(pointer, extension: extension);
    await file.parent.create(recursive: true);
    // Write next to the target and rename, so a crash never leaves a
    // half-written file under the final name.
    final partial = File('${file.path}$_partialSuffix');
    try {
      await partial.writeAsBytes(bytes, flush: true);
      return await partial.rename(file.path);
    } on FileSystemException {
      await deleteFile(partial);
      rethrow;
    }
  }

  Future<void> delete(FilePointer pointer, {String? extension}) =>
      deleteFile(fileFor(pointer, extension: extension));

  /// Deletes [file] from the store; one that is already gone is fine.
  Future<void> deleteFile(File file) async {
    try {
      await file.delete();
    } on PathNotFoundException {
      // Already gone.
    }
  }
}
