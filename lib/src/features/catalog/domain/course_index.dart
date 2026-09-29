import 'package:flutter/foundation.dart';
import 'package:languagetransfer/src/core/json/json_reader.dart';
import 'package:languagetransfer/src/core/storage/file_pointer.dart';

/// A course was requested that is not in the server's index, or that this
/// app does not know.
class UnknownCourseException implements Exception {
  const UnknownCourseException(this.courseId);

  final String courseId;

  @override
  String toString() => 'UnknownCourseException: $courseId';
}

/// One course as listed in the course index.
@immutable
class CourseIndexEntry {
  const CourseIndexEntry({
    required this.id,
    required this.lessonCount,
    required this.metadata,
  });

  factory CourseIndexEntry.fromJson(JsonObject json) {
    final lessonCount = json.integer('lessons');
    if (lessonCount < 0) {
      throw FormatException('Negative lesson count at ${json.path}.lessons');
    }
    return CourseIndexEntry(
      id: json.string('id'),
      lessonCount: lessonCount,
      metadata: FilePointer.fromJson(json.object('meta')),
    );
  }

  /// Course id such as `spanish`. Deliberately a plain string: the server may
  /// list courses this app version does not know yet.
  final String id;

  final int lessonCount;

  /// Pointer to the course's metadata object in the CAS.
  final FilePointer metadata;
}

/// The list of all courses and where their files are stored.
@immutable
class CourseIndex {
  const CourseIndex({required this.casBaseUrl, required this.courses});

  /// Parses `{"buildVersion": 2, "casBaseURL", "courses": [...]}`
  /// (upstream `src/data/courseSchemas.ts`, `allCoursesSchema`).
  factory CourseIndex.fromJson(Object? decoded) {
    final json = JsonObject(decoded, '')
      ..expectInteger('buildVersion', supportedBuildVersion);
    final base = Uri.tryParse(json.string('casBaseURL'));
    if (base == null || !base.isScheme('https') || base.host.isEmpty) {
      throw const FormatException('casBaseURL must be an https URL');
    }
    return CourseIndex(
      // Upstream strips one trailing slash (`normalizeCASBaseURL`).
      casBaseUrl: base.replace(
        path: base.path.endsWith('/')
            ? base.path.substring(0, base.path.length - 1)
            : base.path,
      ),
      courses: List.unmodifiable(
        json.objects('courses').map(CourseIndexEntry.fromJson),
      ),
    );
  }

  factory CourseIndex.parse(String source) =>
      CourseIndex.fromJson(decodeJson(source, 'course index'));

  static const supportedBuildVersion = 2;

  /// Base URL of the content-addressed store, without a trailing slash.
  final Uri casBaseUrl;

  final List<CourseIndexEntry> courses;

  CourseIndexEntry? entryFor(String courseId) {
    for (final entry in courses) {
      if (entry.id == courseId) return entry;
    }
    return null;
  }

  /// Download URL of [pointer]'s object.
  Uri urlFor(FilePointer pointer) =>
      casBaseUrl.replace(path: '${casBaseUrl.path}/${pointer.object}');
}
