import 'package:flutter/foundation.dart';

/// How far the listener got in one lesson.
@immutable
class LessonProgress {
  const LessonProgress({
    required this.lessonId,
    required this.finished,
    this.position,
    this.listenedAt,
  });

  final String lessonId;

  /// Where to resume; `null` if never started or reset after playing
  /// through.
  final Duration? position;

  final bool finished;

  /// Last time the lesson was played; `null` if it was only marked finished.
  /// Marking lessons finished or unfinished does not change it, so
  /// "continue" stays where the listener is.
  final DateTime? listenedAt;

  bool get started => position != null && position! > Duration.zero;

  @override
  bool operator ==(Object other) =>
      other is LessonProgress &&
      other.lessonId == lessonId &&
      other.position == position &&
      other.finished == finished &&
      other.listenedAt == listenedAt;

  @override
  int get hashCode => Object.hash(lessonId, position, finished, listenedAt);
}
