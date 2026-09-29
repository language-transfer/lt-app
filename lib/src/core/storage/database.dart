import 'package:drift/drift.dart';

part 'database.g.dart';

/// The last course index fetched from the server. Holds at most one row.
///
/// Stored as the raw JSON, so a cached copy is validated by exactly the same
/// parser as a fresh one.
class CachedCourseIndex extends Table {
  IntColumn get id =>
      integer().withDefault(const Constant(CachedCourseIndex.singleRowId))();
  TextColumn get json => text()();
  DateTimeColumn get fetchedAt => dateTime()();

  @override
  Set<Column<Object>> get primaryKey => {id};

  static const singleRowId = 1;
}

/// Listening progress per lesson.
///
/// Keyed by lesson id rather than by position in the course (the Expo app
/// uses the position), so lessons added in the middle of a course do not
/// shift anyone's progress.
@DataClassName('LessonProgressRow')
class LessonProgressTable extends Table {
  @override
  String get tableName => 'lesson_progress';

  TextColumn get courseId => text()();
  TextColumn get lessonId => text()();

  /// Where to resume, in milliseconds; `null` if never started or reset
  /// after finishing.
  IntColumn get positionMs => integer().nullable()();

  BoolColumn get finished => boolean().withDefault(const Constant(false))();

  /// Last time this lesson was played; "continue" picks the most recent.
  /// `null` for a lesson that was only marked finished.
  DateTimeColumn get listenedAt => dateTime().nullable()();

  @override
  Set<Column<Object>> get primaryKey => {courseId, lessonId};
}

/// User preferences as key-value pairs; typed access lives in
/// `SettingsRepository`.
@DataClassName('SettingRow')
class SettingsTable extends Table {
  @override
  String get tableName => 'settings';

  TextColumn get key => text()();
  TextColumn get value => text()();

  @override
  Set<Column<Object>> get primaryKey => {key};
}

/// Lessons the listener asked to keep on the device, one row per lesson.
///
/// A row is the intent to keep the lesson; its file lives in the object store
/// and counts as downloaded only once it has been verified. The object id
/// (SHA-256) is also the background download's task id. Lessons with
/// identical audio share one object, so it is not unique here.
@DataClassName('DownloadRow')
@TableIndex(name: 'downloads_object_id', columns: {#objectId})
class DownloadsTable extends Table {
  @override
  String get tableName => 'downloads';

  TextColumn get courseId => text()();
  TextColumn get lessonId => text()();
  TextColumn get objectId => text()();

  /// `AudioVariant.key`, which also decides the file extension.
  TextColumn get variant => text()();

  /// Expected size in bytes, from the lesson metadata.
  IntColumn get size => integer()();

  /// Where to download from. Objects never change, so an interrupted download
  /// can be restarted without loading the course index first.
  TextColumn get url => text()();

  /// `queued`, `downloading`, `complete` or `failed` (`DownloadStatus`).
  TextColumn get status => text()();

  /// Why a failed download failed (`DownloadFailure`); `null` otherwise.
  TextColumn get failure => text().nullable()();

  /// When the download was requested; downloads run in this order. Kept to
  /// the millisecond, since "Download all" requests many lessons at once.
  IntColumn get requestedAt => integer().map(const _Milliseconds())();

  @override
  Set<Column<Object>> get primaryKey => {courseId, lessonId};
}

/// Stores a time in milliseconds since the epoch; `dateTime()` columns keep
/// whole seconds.
class _Milliseconds extends TypeConverter<DateTime, int> {
  const _Milliseconds();

  @override
  DateTime fromSql(int fromDb) => DateTime.fromMillisecondsSinceEpoch(fromDb);

  @override
  int toSql(DateTime value) => value.millisecondsSinceEpoch;
}

/// App state that must survive restarts. Downloaded content lives in the
/// object store instead.
@DriftDatabase(
  tables: [
    CachedCourseIndex,
    LessonProgressTable,
    SettingsTable,
    DownloadsTable,
  ],
)
class AppDatabase extends _$AppDatabase {
  AppDatabase(super.e);

  // Unreleased: stays 1 until the first store release, after which every
  // schema change needs a migration.
  @override
  int get schemaVersion => 1;
}
