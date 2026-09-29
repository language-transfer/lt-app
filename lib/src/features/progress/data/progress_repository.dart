import 'package:drift/drift.dart';
import 'package:flutter/foundation.dart';
import 'package:languagetransfer/src/core/storage/database.dart';
import 'package:languagetransfer/src/features/progress/domain/lesson_progress.dart';

/// Stores listening progress. Reads are streams, so every screen showing
/// progress updates when the player saves. They emit only when their result
/// changes: drift runs a query again after every write to its table, and
/// the player saves the position every few seconds.
class ProgressRepository {
  ProgressRepository({required this._database, this._now = DateTime.now});

  final AppDatabase _database;
  final DateTime Function() _now;

  $LessonProgressTableTable get _table => _database.lessonProgressTable;

  /// Progress of every lesson in [courseId] that has any, by lesson id.
  Stream<Map<String, LessonProgress>> watchCourse(String courseId) =>
      (_database.select(_table)..where((row) => row.courseId.equals(courseId)))
          .watch()
          .map(_byLessonId)
          .distinct(mapEquals);

  Future<Map<String, LessonProgress>> loadCourse(String courseId) async =>
      _byLessonId(
        await (_database.select(
          _table,
        )..where((row) => row.courseId.equals(courseId))).get(),
      );

  /// Number of finished lessons per course id, for the course list.
  Stream<Map<String, int>> watchFinishedCounts() {
    final count = _table.lessonId.count();
    final query = _database.selectOnly(_table)
      ..addColumns([_table.courseId, count])
      ..where(_table.finished.equals(true))
      ..groupBy([_table.courseId]);
    return query
        .watch()
        .map(
          (rows) => {
            for (final row in rows)
              row.read(_table.courseId)!: row.read(count)!,
          },
        )
        .distinct(mapEquals);
  }

  /// The course listened to most recently, if any.
  Future<String?> mostRecentCourseId() async {
    final row =
        await (_database.select(_table)
              ..where((row) => row.listenedAt.isNotNull())
              ..orderBy([(row) => OrderingTerm.desc(row.listenedAt)])
              ..limit(1))
            .getSingleOrNull();
    return row?.courseId;
  }

  /// Saves where playback is. Does not change whether the lesson is
  /// finished.
  Future<void> savePosition(
    String courseId,
    String lessonId,
    Duration position,
  ) {
    final now = _now();
    return _database
        .into(_table)
        .insert(
          LessonProgressTableCompanion.insert(
            courseId: courseId,
            lessonId: lessonId,
            positionMs: Value(position.inMilliseconds),
            listenedAt: Value(now),
          ),
          onConflict: DoUpdate(
            (_) => LessonProgressTableCompanion(
              positionMs: Value(position.inMilliseconds),
              listenedAt: Value(now),
            ),
          ),
        );
  }

  /// The lesson was played through: it is finished, replays from the start,
  /// and is the lesson listened to last.
  Future<void> markPlayedThrough(String courseId, String lessonId) {
    final now = _now();
    return _database
        .into(_table)
        .insert(
          LessonProgressTableCompanion.insert(
            courseId: courseId,
            lessonId: lessonId,
            finished: const Value(true),
            listenedAt: Value(now),
          ),
          onConflict: DoUpdate(
            (_) => LessonProgressTableCompanion(
              positionMs: const Value(null),
              finished: const Value(true),
              listenedAt: Value(now),
            ),
          ),
        );
  }

  /// Marks a lesson finished by hand. Keeps its position and when it was
  /// last played.
  Future<void> markFinished(String courseId, String lessonId) => _database
      .into(_table)
      .insert(
        LessonProgressTableCompanion.insert(
          courseId: courseId,
          lessonId: lessonId,
          finished: const Value(true),
        ),
        onConflict: DoUpdate(
          (_) => const LessonProgressTableCompanion(finished: Value(true)),
        ),
      );

  /// Marks a lesson as not finished. Keeps its position and when it was last
  /// played.
  Future<void> markUnfinished(String courseId, String lessonId) =>
      (_database.update(_table)..where(
            (row) =>
                row.courseId.equals(courseId) & row.lessonId.equals(lessonId),
          ))
          .write(const LessonProgressTableCompanion(finished: Value(false)));

  /// Forgets all progress in [courseId] (data management, "Clear progress").
  Future<void> clearCourse(String courseId) => (_database.delete(
    _table,
  )..where((row) => row.courseId.equals(courseId))).go();

  static Map<String, LessonProgress> _byLessonId(
    List<LessonProgressRow> rows,
  ) => {
    for (final row in rows)
      row.lessonId: LessonProgress(
        lessonId: row.lessonId,
        position: row.positionMs == null
            ? null
            : Duration(milliseconds: row.positionMs!),
        finished: row.finished,
        listenedAt: row.listenedAt,
      ),
  };
}
