import 'package:drift/drift.dart';
import 'package:languagetransfer/src/core/logging.dart';
import 'package:languagetransfer/src/core/storage/database.dart';
import 'package:languagetransfer/src/features/catalog/domain/lesson.dart';
import 'package:languagetransfer/src/features/downloads/domain/lesson_download.dart';

/// Stores which lessons should be kept on the device and how far each
/// download is. Reads are streams, so lesson lists update as downloads
/// progress.
class DownloadRepository {
  DownloadRepository({required this._database});

  final AppDatabase _database;

  $DownloadsTableTable get _table => _database.downloadsTable;

  /// Downloads of [courseId] by lesson id.
  Stream<Map<String, LessonDownload>> watchCourse(String courseId) =>
      (_database.select(_table)..where((row) => row.courseId.equals(courseId)))
          .watch()
          .map(_byLessonId);

  Future<Map<String, LessonDownload>> loadCourse(String courseId) async =>
      _byLessonId(
        await (_database.select(
          _table,
        )..where((row) => row.courseId.equals(courseId))).get(),
      );

  Future<List<LessonDownload>> loadAll() async =>
      _fromRows(await _database.select(_table).get());

  /// Every lesson whose audio is the object [objectId].
  Future<List<LessonDownload>> loadByObject(String objectId) async => _fromRows(
    await (_database.select(
      _table,
    )..where((row) => row.objectId.equals(objectId))).get(),
  );

  /// Adds [downloads], replacing earlier rows of the same lessons.
  Future<void> putAll(Iterable<LessonDownload> downloads) =>
      _database.batch((batch) {
        batch.insertAllOnConflictUpdate(_table, [
          for (final download in downloads)
            DownloadsTableCompanion.insert(
              courseId: download.courseId,
              lessonId: download.lessonId,
              objectId: download.objectId,
              variant: download.variant.key,
              size: download.size,
              url: download.url.toString(),
              status: download.status.name,
              requestedAt: download.requestedAt,
              failure: Value(download.failure?.name),
            ),
        ]);
      });

  /// Sets the status of every lesson using the object [objectId], with
  /// [failure] for a failed download; any other status clears it.
  Future<void> setStatus(
    String objectId,
    DownloadStatus status, {
    DownloadFailure? failure,
  }) {
    final reason = status == DownloadStatus.failed
        ? (failure ?? DownloadFailure.other).name
        : null;
    // Rows already in this state are left alone: every write makes the
    // screens that watch downloads read them again.
    return (_database.update(_table)..where(
          (row) =>
              row.objectId.equals(objectId) &
              (row.status.isNotValue(status.name) |
                  (reason == null
                      ? row.failure.isNotNull()
                      : row.failure.isNotValue(reason))),
        ))
        .write(
          DownloadsTableCompanion(
            status: Value(status.name),
            failure: Value(reason),
          ),
        );
  }

  /// Removes the downloads of [lessonIds] and returns what was removed.
  Future<List<LessonDownload>> remove(
    String courseId,
    Iterable<String> lessonIds,
  ) => _database.transaction(() async {
    final ids = lessonIds.toList();
    final query = _database.select(_table)
      ..where((row) => row.courseId.equals(courseId) & row.lessonId.isIn(ids));
    final removed = _fromRows(await query.get());
    await (_database.delete(_table)..where(
          (row) => row.courseId.equals(courseId) & row.lessonId.isIn(ids),
        ))
        .go();
    return removed;
  });

  /// The ids of [objectIds] that some lesson still uses.
  Future<Set<String>> referenced(Iterable<String> objectIds) async {
    final ids = objectIds.toSet();
    if (ids.isEmpty) return const {};
    final query = _database.selectOnly(_table, distinct: true)
      ..addColumns([_table.objectId])
      ..where(_table.objectId.isIn(ids));
    return {for (final row in await query.get()) row.read(_table.objectId)!};
  }

  static Map<String, LessonDownload> _byLessonId(List<DownloadRow> rows) => {
    for (final download in _fromRows(rows)) download.lessonId: download,
  };

  static List<LessonDownload> _fromRows(List<DownloadRow> rows) => [
    for (final row in rows) ?_fromRow(row),
  ];

  /// Rows written by a future version with values this one does not know
  /// are skipped rather than failing every read.
  static LessonDownload? _fromRow(DownloadRow row) {
    final variant = AudioVariant.values
        .where((variant) => variant.key == row.variant)
        .firstOrNull;
    final status = DownloadStatus.values.asNameMap()[row.status];
    final url = Uri.tryParse(row.url);
    if (variant == null || status == null || url == null) {
      logRecoverable(
        'Skipping unreadable download row',
        FormatException('${row.courseId}/${row.lessonId}'),
      );
      return null;
    }
    return LessonDownload(
      courseId: row.courseId,
      lessonId: row.lessonId,
      objectId: row.objectId,
      variant: variant,
      size: row.size,
      url: url,
      status: status,
      requestedAt: row.requestedAt,
      // A reason from a newer version reads as "other".
      failure: status == DownloadStatus.failed
          ? DownloadFailure.values.asNameMap()[row.failure] ??
                DownloadFailure.other
          : null,
    );
  }
}
