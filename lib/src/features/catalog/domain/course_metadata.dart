import 'package:flutter/foundation.dart';
import 'package:languagetransfer/src/core/json/json_reader.dart';
import 'package:languagetransfer/src/features/catalog/domain/lesson.dart';

/// The lessons of one course, loaded from the course's metadata object.
@immutable
class CourseMetadata {
  const CourseMetadata({required this.lessons});

  /// Parses `{"buildVersion": 2, "lessons": [...]}`
  /// (upstream `src/data/courseSchemas.ts`, `courseMetaSchema`).
  factory CourseMetadata.fromJson(Object? decoded) {
    final json = JsonObject(decoded, '')
      ..expectInteger('buildVersion', supportedBuildVersion);
    return CourseMetadata(
      lessons: List.unmodifiable(json.objects('lessons').map(Lesson.fromJson)),
    );
  }

  factory CourseMetadata.parse(String source) =>
      CourseMetadata.fromJson(decodeJson(source, 'course metadata'));

  static const supportedBuildVersion = 2;

  /// In course order; a lesson's position in this list is its number minus
  /// one.
  final List<Lesson> lessons;

  /// The position of the lesson with [id], or `null`.
  int? indexOf(String id) {
    final index = lessons.indexWhere((lesson) => lesson.id == id);
    return index == -1 ? null : index;
  }
}
