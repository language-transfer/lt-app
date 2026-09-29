import 'package:flutter/foundation.dart';
import 'package:languagetransfer/src/core/storage/file_pointer.dart';
import 'package:languagetransfer/src/features/catalog/domain/lesson.dart';

enum DownloadStatus {
  /// Waiting to start: behind other downloads, for Wi-Fi, or for a retry.
  queued,

  downloading,

  /// The file is on the device and matches its SHA-256.
  complete,

  /// The download failed and will not be retried automatically.
  failed,
}

/// Why a download failed, as far as can be told.
enum DownloadFailure {
  /// The file could not be written, usually for lack of space.
  storage,

  /// The connection broke off, after the automatic retries.
  connection,

  /// The server answered with an error.
  server,

  /// The file arrived but does not match its SHA-256.
  damaged,

  other,
}

/// A lesson the listener asked to keep on the device.
@immutable
class LessonDownload {
  const LessonDownload({
    required this.courseId,
    required this.lessonId,
    required this.objectId,
    required this.variant,
    required this.size,
    required this.url,
    required this.status,
    required this.requestedAt,
    this.failure,
  });

  final String courseId;
  final String lessonId;

  /// SHA-256 of the file, which names it in the object store.
  final String objectId;

  final AudioVariant variant;

  /// Size in bytes.
  final int size;

  final Uri url;
  final DownloadStatus status;
  final DateTime requestedAt;

  /// Set when [status] is [DownloadStatus.failed].
  final DownloadFailure? failure;

  /// For locating and verifying the file.
  FilePointer get pointer => FilePointer(object: objectId, size: size);

  bool get isComplete => status == DownloadStatus.complete;

  /// Queued or downloading.
  bool get isPending =>
      status == DownloadStatus.queued || status == DownloadStatus.downloading;

  @override
  bool operator ==(Object other) =>
      other is LessonDownload &&
      other.courseId == courseId &&
      other.lessonId == lessonId &&
      other.objectId == objectId &&
      other.variant == variant &&
      other.size == size &&
      other.url == url &&
      other.status == status &&
      other.requestedAt == requestedAt &&
      other.failure == failure;

  @override
  int get hashCode => Object.hash(
    courseId,
    lessonId,
    objectId,
    variant,
    size,
    url,
    status,
    requestedAt,
    failure,
  );

  @override
  String toString() =>
      'LessonDownload($courseId/$lessonId, ${variant.key}, ${status.name})';
}
