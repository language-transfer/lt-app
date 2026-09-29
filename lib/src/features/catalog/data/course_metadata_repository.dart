import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';

import 'package:languagetransfer/src/core/logging.dart';
import 'package:languagetransfer/src/core/storage/object_store.dart';
import 'package:languagetransfer/src/features/catalog/data/catalog_api.dart';
import 'package:languagetransfer/src/features/catalog/domain/course_index.dart';
import 'package:languagetransfer/src/features/catalog/domain/course_metadata.dart';

/// Loads a course's metadata from memory, the object store or the network.
///
/// Metadata objects are content-addressed and never change, so a copy is
/// kept by its hash for good; a new version of a course arrives as a new
/// object through the course index (upstream `src/data/courseData.ts`,
/// `loadCourseMetadata`).
class CourseMetadataRepository {
  CourseMetadataRepository({required this._api, required this._store});

  final CatalogApi _api;
  final ObjectStore _store;
  final _memory = <String, CourseMetadata>{};
  final _pending = <String, Future<CourseMetadata>>{};

  /// Throws `NetworkException` if the metadata is neither stored nor
  /// reachable, `CorruptObjectException` if the download does not match its
  /// hash, and [FormatException] if its content cannot be read.
  Future<CourseMetadata> load(CourseIndex index, CourseIndexEntry entry) {
    final object = entry.metadata.object;
    final cached = _memory[object];
    if (cached != null) return Future.value(cached);
    // Concurrent callers share one load.
    return _pending[object] ??= _loadObject(index, entry).whenComplete(() {
      unawaited(_pending.remove(object));
    });
  }

  /// Removes the stored copy for [entry], for "delete all course data".
  Future<void> deleteLocalCopy(CourseIndexEntry entry) async {
    _memory.remove(entry.metadata.object);
    await _store.delete(entry.metadata);
  }

  Future<CourseMetadata> _loadObject(
    CourseIndex index,
    CourseIndexEntry entry,
  ) async {
    final pointer = entry.metadata;
    final bytes =
        await _store.readVerified(pointer) ?? await _download(index, entry);
    final metadata = CourseMetadata.parse(_decodeUtf8(bytes, entry.id));
    _memory[pointer.object] = metadata;
    return metadata;
  }

  Future<Uint8List> _download(CourseIndex index, CourseIndexEntry entry) async {
    final bytes = await _api.fetchObject(index, entry.metadata);
    try {
      await _store.write(entry.metadata, bytes);
    } on FileSystemException catch (error, stackTrace) {
      // For example a full device: the lessons still show, and are
      // downloaded again next time.
      logRecoverable(
        'Could not store the lessons of ${entry.id}',
        error,
        stackTrace,
      );
    }
    return bytes;
  }

  static String _decodeUtf8(Uint8List bytes, String courseId) {
    try {
      return utf8.decode(bytes);
    } on FormatException catch (error) {
      throw FormatException(
        'Metadata for $courseId is not UTF-8: ${error.message}',
      );
    }
  }
}
