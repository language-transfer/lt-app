// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'database.dart';

// ignore_for_file: type=lint
class $CachedCourseIndexTable extends CachedCourseIndex
    with TableInfo<$CachedCourseIndexTable, CachedCourseIndexData> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $CachedCourseIndexTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<int> id = GeneratedColumn<int>(
    'id',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: false,
    defaultValue: const Constant(CachedCourseIndex.singleRowId),
  );
  static const VerificationMeta _jsonMeta = const VerificationMeta('json');
  @override
  late final GeneratedColumn<String> json = GeneratedColumn<String>(
    'json',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _fetchedAtMeta = const VerificationMeta(
    'fetchedAt',
  );
  @override
  late final GeneratedColumn<DateTime> fetchedAt = GeneratedColumn<DateTime>(
    'fetched_at',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: true,
  );
  @override
  List<GeneratedColumn> get $columns => [id, json, fetchedAt];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'cached_course_index';
  @override
  VerificationContext validateIntegrity(
    Insertable<CachedCourseIndexData> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    }
    if (data.containsKey('json')) {
      context.handle(
        _jsonMeta,
        json.isAcceptableOrUnknown(data['json']!, _jsonMeta),
      );
    } else if (isInserting) {
      context.missing(_jsonMeta);
    }
    if (data.containsKey('fetched_at')) {
      context.handle(
        _fetchedAtMeta,
        fetchedAt.isAcceptableOrUnknown(data['fetched_at']!, _fetchedAtMeta),
      );
    } else if (isInserting) {
      context.missing(_fetchedAtMeta);
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  CachedCourseIndexData map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return CachedCourseIndexData(
      id: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}id'],
      )!,
      json: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}json'],
      )!,
      fetchedAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}fetched_at'],
      )!,
    );
  }

  @override
  $CachedCourseIndexTable createAlias(String alias) {
    return $CachedCourseIndexTable(attachedDatabase, alias);
  }
}

class CachedCourseIndexData extends DataClass
    implements Insertable<CachedCourseIndexData> {
  final int id;
  final String json;
  final DateTime fetchedAt;
  const CachedCourseIndexData({
    required this.id,
    required this.json,
    required this.fetchedAt,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<int>(id);
    map['json'] = Variable<String>(json);
    map['fetched_at'] = Variable<DateTime>(fetchedAt);
    return map;
  }

  CachedCourseIndexCompanion toCompanion(bool nullToAbsent) {
    return CachedCourseIndexCompanion(
      id: Value(id),
      json: Value(json),
      fetchedAt: Value(fetchedAt),
    );
  }

  factory CachedCourseIndexData.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return CachedCourseIndexData(
      id: serializer.fromJson<int>(json['id']),
      json: serializer.fromJson<String>(json['json']),
      fetchedAt: serializer.fromJson<DateTime>(json['fetchedAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<int>(id),
      'json': serializer.toJson<String>(json),
      'fetchedAt': serializer.toJson<DateTime>(fetchedAt),
    };
  }

  CachedCourseIndexData copyWith({
    int? id,
    String? json,
    DateTime? fetchedAt,
  }) => CachedCourseIndexData(
    id: id ?? this.id,
    json: json ?? this.json,
    fetchedAt: fetchedAt ?? this.fetchedAt,
  );
  CachedCourseIndexData copyWithCompanion(CachedCourseIndexCompanion data) {
    return CachedCourseIndexData(
      id: data.id.present ? data.id.value : this.id,
      json: data.json.present ? data.json.value : this.json,
      fetchedAt: data.fetchedAt.present ? data.fetchedAt.value : this.fetchedAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('CachedCourseIndexData(')
          ..write('id: $id, ')
          ..write('json: $json, ')
          ..write('fetchedAt: $fetchedAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(id, json, fetchedAt);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is CachedCourseIndexData &&
          other.id == this.id &&
          other.json == this.json &&
          other.fetchedAt == this.fetchedAt);
}

class CachedCourseIndexCompanion
    extends UpdateCompanion<CachedCourseIndexData> {
  final Value<int> id;
  final Value<String> json;
  final Value<DateTime> fetchedAt;
  const CachedCourseIndexCompanion({
    this.id = const Value.absent(),
    this.json = const Value.absent(),
    this.fetchedAt = const Value.absent(),
  });
  CachedCourseIndexCompanion.insert({
    this.id = const Value.absent(),
    required String json,
    required DateTime fetchedAt,
  }) : json = Value(json),
       fetchedAt = Value(fetchedAt);
  static Insertable<CachedCourseIndexData> custom({
    Expression<int>? id,
    Expression<String>? json,
    Expression<DateTime>? fetchedAt,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (json != null) 'json': json,
      if (fetchedAt != null) 'fetched_at': fetchedAt,
    });
  }

  CachedCourseIndexCompanion copyWith({
    Value<int>? id,
    Value<String>? json,
    Value<DateTime>? fetchedAt,
  }) {
    return CachedCourseIndexCompanion(
      id: id ?? this.id,
      json: json ?? this.json,
      fetchedAt: fetchedAt ?? this.fetchedAt,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<int>(id.value);
    }
    if (json.present) {
      map['json'] = Variable<String>(json.value);
    }
    if (fetchedAt.present) {
      map['fetched_at'] = Variable<DateTime>(fetchedAt.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('CachedCourseIndexCompanion(')
          ..write('id: $id, ')
          ..write('json: $json, ')
          ..write('fetchedAt: $fetchedAt')
          ..write(')'))
        .toString();
  }
}

class $LessonProgressTableTable extends LessonProgressTable
    with TableInfo<$LessonProgressTableTable, LessonProgressRow> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $LessonProgressTableTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _courseIdMeta = const VerificationMeta(
    'courseId',
  );
  @override
  late final GeneratedColumn<String> courseId = GeneratedColumn<String>(
    'course_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _lessonIdMeta = const VerificationMeta(
    'lessonId',
  );
  @override
  late final GeneratedColumn<String> lessonId = GeneratedColumn<String>(
    'lesson_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _positionMsMeta = const VerificationMeta(
    'positionMs',
  );
  @override
  late final GeneratedColumn<int> positionMs = GeneratedColumn<int>(
    'position_ms',
    aliasedName,
    true,
    type: DriftSqlType.int,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _finishedMeta = const VerificationMeta(
    'finished',
  );
  @override
  late final GeneratedColumn<bool> finished = GeneratedColumn<bool>(
    'finished',
    aliasedName,
    false,
    type: DriftSqlType.bool,
    requiredDuringInsert: false,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'CHECK ("finished" IN (0, 1))',
    ),
    defaultValue: const Constant(false),
  );
  static const VerificationMeta _listenedAtMeta = const VerificationMeta(
    'listenedAt',
  );
  @override
  late final GeneratedColumn<DateTime> listenedAt = GeneratedColumn<DateTime>(
    'listened_at',
    aliasedName,
    true,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: false,
  );
  @override
  List<GeneratedColumn> get $columns => [
    courseId,
    lessonId,
    positionMs,
    finished,
    listenedAt,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'lesson_progress';
  @override
  VerificationContext validateIntegrity(
    Insertable<LessonProgressRow> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('course_id')) {
      context.handle(
        _courseIdMeta,
        courseId.isAcceptableOrUnknown(data['course_id']!, _courseIdMeta),
      );
    } else if (isInserting) {
      context.missing(_courseIdMeta);
    }
    if (data.containsKey('lesson_id')) {
      context.handle(
        _lessonIdMeta,
        lessonId.isAcceptableOrUnknown(data['lesson_id']!, _lessonIdMeta),
      );
    } else if (isInserting) {
      context.missing(_lessonIdMeta);
    }
    if (data.containsKey('position_ms')) {
      context.handle(
        _positionMsMeta,
        positionMs.isAcceptableOrUnknown(data['position_ms']!, _positionMsMeta),
      );
    }
    if (data.containsKey('finished')) {
      context.handle(
        _finishedMeta,
        finished.isAcceptableOrUnknown(data['finished']!, _finishedMeta),
      );
    }
    if (data.containsKey('listened_at')) {
      context.handle(
        _listenedAtMeta,
        listenedAt.isAcceptableOrUnknown(data['listened_at']!, _listenedAtMeta),
      );
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {courseId, lessonId};
  @override
  LessonProgressRow map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return LessonProgressRow(
      courseId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}course_id'],
      )!,
      lessonId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}lesson_id'],
      )!,
      positionMs: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}position_ms'],
      ),
      finished: attachedDatabase.typeMapping.read(
        DriftSqlType.bool,
        data['${effectivePrefix}finished'],
      )!,
      listenedAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}listened_at'],
      ),
    );
  }

  @override
  $LessonProgressTableTable createAlias(String alias) {
    return $LessonProgressTableTable(attachedDatabase, alias);
  }
}

class LessonProgressRow extends DataClass
    implements Insertable<LessonProgressRow> {
  final String courseId;
  final String lessonId;

  /// Where to resume, in milliseconds; `null` if never started or reset
  /// after finishing.
  final int? positionMs;
  final bool finished;

  /// Last time this lesson was played; "continue" picks the most recent.
  /// `null` for a lesson that was only marked finished.
  final DateTime? listenedAt;
  const LessonProgressRow({
    required this.courseId,
    required this.lessonId,
    this.positionMs,
    required this.finished,
    this.listenedAt,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['course_id'] = Variable<String>(courseId);
    map['lesson_id'] = Variable<String>(lessonId);
    if (!nullToAbsent || positionMs != null) {
      map['position_ms'] = Variable<int>(positionMs);
    }
    map['finished'] = Variable<bool>(finished);
    if (!nullToAbsent || listenedAt != null) {
      map['listened_at'] = Variable<DateTime>(listenedAt);
    }
    return map;
  }

  LessonProgressTableCompanion toCompanion(bool nullToAbsent) {
    return LessonProgressTableCompanion(
      courseId: Value(courseId),
      lessonId: Value(lessonId),
      positionMs: positionMs == null && nullToAbsent
          ? const Value.absent()
          : Value(positionMs),
      finished: Value(finished),
      listenedAt: listenedAt == null && nullToAbsent
          ? const Value.absent()
          : Value(listenedAt),
    );
  }

  factory LessonProgressRow.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return LessonProgressRow(
      courseId: serializer.fromJson<String>(json['courseId']),
      lessonId: serializer.fromJson<String>(json['lessonId']),
      positionMs: serializer.fromJson<int?>(json['positionMs']),
      finished: serializer.fromJson<bool>(json['finished']),
      listenedAt: serializer.fromJson<DateTime?>(json['listenedAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'courseId': serializer.toJson<String>(courseId),
      'lessonId': serializer.toJson<String>(lessonId),
      'positionMs': serializer.toJson<int?>(positionMs),
      'finished': serializer.toJson<bool>(finished),
      'listenedAt': serializer.toJson<DateTime?>(listenedAt),
    };
  }

  LessonProgressRow copyWith({
    String? courseId,
    String? lessonId,
    Value<int?> positionMs = const Value.absent(),
    bool? finished,
    Value<DateTime?> listenedAt = const Value.absent(),
  }) => LessonProgressRow(
    courseId: courseId ?? this.courseId,
    lessonId: lessonId ?? this.lessonId,
    positionMs: positionMs.present ? positionMs.value : this.positionMs,
    finished: finished ?? this.finished,
    listenedAt: listenedAt.present ? listenedAt.value : this.listenedAt,
  );
  LessonProgressRow copyWithCompanion(LessonProgressTableCompanion data) {
    return LessonProgressRow(
      courseId: data.courseId.present ? data.courseId.value : this.courseId,
      lessonId: data.lessonId.present ? data.lessonId.value : this.lessonId,
      positionMs: data.positionMs.present
          ? data.positionMs.value
          : this.positionMs,
      finished: data.finished.present ? data.finished.value : this.finished,
      listenedAt: data.listenedAt.present
          ? data.listenedAt.value
          : this.listenedAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('LessonProgressRow(')
          ..write('courseId: $courseId, ')
          ..write('lessonId: $lessonId, ')
          ..write('positionMs: $positionMs, ')
          ..write('finished: $finished, ')
          ..write('listenedAt: $listenedAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode =>
      Object.hash(courseId, lessonId, positionMs, finished, listenedAt);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is LessonProgressRow &&
          other.courseId == this.courseId &&
          other.lessonId == this.lessonId &&
          other.positionMs == this.positionMs &&
          other.finished == this.finished &&
          other.listenedAt == this.listenedAt);
}

class LessonProgressTableCompanion extends UpdateCompanion<LessonProgressRow> {
  final Value<String> courseId;
  final Value<String> lessonId;
  final Value<int?> positionMs;
  final Value<bool> finished;
  final Value<DateTime?> listenedAt;
  final Value<int> rowid;
  const LessonProgressTableCompanion({
    this.courseId = const Value.absent(),
    this.lessonId = const Value.absent(),
    this.positionMs = const Value.absent(),
    this.finished = const Value.absent(),
    this.listenedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  LessonProgressTableCompanion.insert({
    required String courseId,
    required String lessonId,
    this.positionMs = const Value.absent(),
    this.finished = const Value.absent(),
    this.listenedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  }) : courseId = Value(courseId),
       lessonId = Value(lessonId);
  static Insertable<LessonProgressRow> custom({
    Expression<String>? courseId,
    Expression<String>? lessonId,
    Expression<int>? positionMs,
    Expression<bool>? finished,
    Expression<DateTime>? listenedAt,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (courseId != null) 'course_id': courseId,
      if (lessonId != null) 'lesson_id': lessonId,
      if (positionMs != null) 'position_ms': positionMs,
      if (finished != null) 'finished': finished,
      if (listenedAt != null) 'listened_at': listenedAt,
      if (rowid != null) 'rowid': rowid,
    });
  }

  LessonProgressTableCompanion copyWith({
    Value<String>? courseId,
    Value<String>? lessonId,
    Value<int?>? positionMs,
    Value<bool>? finished,
    Value<DateTime?>? listenedAt,
    Value<int>? rowid,
  }) {
    return LessonProgressTableCompanion(
      courseId: courseId ?? this.courseId,
      lessonId: lessonId ?? this.lessonId,
      positionMs: positionMs ?? this.positionMs,
      finished: finished ?? this.finished,
      listenedAt: listenedAt ?? this.listenedAt,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (courseId.present) {
      map['course_id'] = Variable<String>(courseId.value);
    }
    if (lessonId.present) {
      map['lesson_id'] = Variable<String>(lessonId.value);
    }
    if (positionMs.present) {
      map['position_ms'] = Variable<int>(positionMs.value);
    }
    if (finished.present) {
      map['finished'] = Variable<bool>(finished.value);
    }
    if (listenedAt.present) {
      map['listened_at'] = Variable<DateTime>(listenedAt.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('LessonProgressTableCompanion(')
          ..write('courseId: $courseId, ')
          ..write('lessonId: $lessonId, ')
          ..write('positionMs: $positionMs, ')
          ..write('finished: $finished, ')
          ..write('listenedAt: $listenedAt, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $SettingsTableTable extends SettingsTable
    with TableInfo<$SettingsTableTable, SettingRow> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $SettingsTableTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _keyMeta = const VerificationMeta('key');
  @override
  late final GeneratedColumn<String> key = GeneratedColumn<String>(
    'key',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _valueMeta = const VerificationMeta('value');
  @override
  late final GeneratedColumn<String> value = GeneratedColumn<String>(
    'value',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  @override
  List<GeneratedColumn> get $columns => [key, value];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'settings';
  @override
  VerificationContext validateIntegrity(
    Insertable<SettingRow> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('key')) {
      context.handle(
        _keyMeta,
        key.isAcceptableOrUnknown(data['key']!, _keyMeta),
      );
    } else if (isInserting) {
      context.missing(_keyMeta);
    }
    if (data.containsKey('value')) {
      context.handle(
        _valueMeta,
        value.isAcceptableOrUnknown(data['value']!, _valueMeta),
      );
    } else if (isInserting) {
      context.missing(_valueMeta);
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {key};
  @override
  SettingRow map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return SettingRow(
      key: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}key'],
      )!,
      value: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}value'],
      )!,
    );
  }

  @override
  $SettingsTableTable createAlias(String alias) {
    return $SettingsTableTable(attachedDatabase, alias);
  }
}

class SettingRow extends DataClass implements Insertable<SettingRow> {
  final String key;
  final String value;
  const SettingRow({required this.key, required this.value});
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['key'] = Variable<String>(key);
    map['value'] = Variable<String>(value);
    return map;
  }

  SettingsTableCompanion toCompanion(bool nullToAbsent) {
    return SettingsTableCompanion(key: Value(key), value: Value(value));
  }

  factory SettingRow.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return SettingRow(
      key: serializer.fromJson<String>(json['key']),
      value: serializer.fromJson<String>(json['value']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'key': serializer.toJson<String>(key),
      'value': serializer.toJson<String>(value),
    };
  }

  SettingRow copyWith({String? key, String? value}) =>
      SettingRow(key: key ?? this.key, value: value ?? this.value);
  SettingRow copyWithCompanion(SettingsTableCompanion data) {
    return SettingRow(
      key: data.key.present ? data.key.value : this.key,
      value: data.value.present ? data.value.value : this.value,
    );
  }

  @override
  String toString() {
    return (StringBuffer('SettingRow(')
          ..write('key: $key, ')
          ..write('value: $value')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(key, value);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is SettingRow &&
          other.key == this.key &&
          other.value == this.value);
}

class SettingsTableCompanion extends UpdateCompanion<SettingRow> {
  final Value<String> key;
  final Value<String> value;
  final Value<int> rowid;
  const SettingsTableCompanion({
    this.key = const Value.absent(),
    this.value = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  SettingsTableCompanion.insert({
    required String key,
    required String value,
    this.rowid = const Value.absent(),
  }) : key = Value(key),
       value = Value(value);
  static Insertable<SettingRow> custom({
    Expression<String>? key,
    Expression<String>? value,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (key != null) 'key': key,
      if (value != null) 'value': value,
      if (rowid != null) 'rowid': rowid,
    });
  }

  SettingsTableCompanion copyWith({
    Value<String>? key,
    Value<String>? value,
    Value<int>? rowid,
  }) {
    return SettingsTableCompanion(
      key: key ?? this.key,
      value: value ?? this.value,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (key.present) {
      map['key'] = Variable<String>(key.value);
    }
    if (value.present) {
      map['value'] = Variable<String>(value.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('SettingsTableCompanion(')
          ..write('key: $key, ')
          ..write('value: $value, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $DownloadsTableTable extends DownloadsTable
    with TableInfo<$DownloadsTableTable, DownloadRow> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $DownloadsTableTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _courseIdMeta = const VerificationMeta(
    'courseId',
  );
  @override
  late final GeneratedColumn<String> courseId = GeneratedColumn<String>(
    'course_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _lessonIdMeta = const VerificationMeta(
    'lessonId',
  );
  @override
  late final GeneratedColumn<String> lessonId = GeneratedColumn<String>(
    'lesson_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _objectIdMeta = const VerificationMeta(
    'objectId',
  );
  @override
  late final GeneratedColumn<String> objectId = GeneratedColumn<String>(
    'object_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _variantMeta = const VerificationMeta(
    'variant',
  );
  @override
  late final GeneratedColumn<String> variant = GeneratedColumn<String>(
    'variant',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _sizeMeta = const VerificationMeta('size');
  @override
  late final GeneratedColumn<int> size = GeneratedColumn<int>(
    'size',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _urlMeta = const VerificationMeta('url');
  @override
  late final GeneratedColumn<String> url = GeneratedColumn<String>(
    'url',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _statusMeta = const VerificationMeta('status');
  @override
  late final GeneratedColumn<String> status = GeneratedColumn<String>(
    'status',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _failureMeta = const VerificationMeta(
    'failure',
  );
  @override
  late final GeneratedColumn<String> failure = GeneratedColumn<String>(
    'failure',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  @override
  late final GeneratedColumnWithTypeConverter<DateTime, int> requestedAt =
      GeneratedColumn<int>(
        'requested_at',
        aliasedName,
        false,
        type: DriftSqlType.int,
        requiredDuringInsert: true,
      ).withConverter<DateTime>($DownloadsTableTable.$converterrequestedAt);
  @override
  List<GeneratedColumn> get $columns => [
    courseId,
    lessonId,
    objectId,
    variant,
    size,
    url,
    status,
    failure,
    requestedAt,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'downloads';
  @override
  VerificationContext validateIntegrity(
    Insertable<DownloadRow> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('course_id')) {
      context.handle(
        _courseIdMeta,
        courseId.isAcceptableOrUnknown(data['course_id']!, _courseIdMeta),
      );
    } else if (isInserting) {
      context.missing(_courseIdMeta);
    }
    if (data.containsKey('lesson_id')) {
      context.handle(
        _lessonIdMeta,
        lessonId.isAcceptableOrUnknown(data['lesson_id']!, _lessonIdMeta),
      );
    } else if (isInserting) {
      context.missing(_lessonIdMeta);
    }
    if (data.containsKey('object_id')) {
      context.handle(
        _objectIdMeta,
        objectId.isAcceptableOrUnknown(data['object_id']!, _objectIdMeta),
      );
    } else if (isInserting) {
      context.missing(_objectIdMeta);
    }
    if (data.containsKey('variant')) {
      context.handle(
        _variantMeta,
        variant.isAcceptableOrUnknown(data['variant']!, _variantMeta),
      );
    } else if (isInserting) {
      context.missing(_variantMeta);
    }
    if (data.containsKey('size')) {
      context.handle(
        _sizeMeta,
        size.isAcceptableOrUnknown(data['size']!, _sizeMeta),
      );
    } else if (isInserting) {
      context.missing(_sizeMeta);
    }
    if (data.containsKey('url')) {
      context.handle(
        _urlMeta,
        url.isAcceptableOrUnknown(data['url']!, _urlMeta),
      );
    } else if (isInserting) {
      context.missing(_urlMeta);
    }
    if (data.containsKey('status')) {
      context.handle(
        _statusMeta,
        status.isAcceptableOrUnknown(data['status']!, _statusMeta),
      );
    } else if (isInserting) {
      context.missing(_statusMeta);
    }
    if (data.containsKey('failure')) {
      context.handle(
        _failureMeta,
        failure.isAcceptableOrUnknown(data['failure']!, _failureMeta),
      );
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {courseId, lessonId};
  @override
  DownloadRow map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return DownloadRow(
      courseId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}course_id'],
      )!,
      lessonId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}lesson_id'],
      )!,
      objectId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}object_id'],
      )!,
      variant: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}variant'],
      )!,
      size: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}size'],
      )!,
      url: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}url'],
      )!,
      status: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}status'],
      )!,
      failure: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}failure'],
      ),
      requestedAt: $DownloadsTableTable.$converterrequestedAt.fromSql(
        attachedDatabase.typeMapping.read(
          DriftSqlType.int,
          data['${effectivePrefix}requested_at'],
        )!,
      ),
    );
  }

  @override
  $DownloadsTableTable createAlias(String alias) {
    return $DownloadsTableTable(attachedDatabase, alias);
  }

  static TypeConverter<DateTime, int> $converterrequestedAt =
      const _Milliseconds();
}

class DownloadRow extends DataClass implements Insertable<DownloadRow> {
  final String courseId;
  final String lessonId;
  final String objectId;

  /// `AudioVariant.key`, which also decides the file extension.
  final String variant;

  /// Expected size in bytes, from the lesson metadata.
  final int size;

  /// Where to download from. Objects never change, so an interrupted download
  /// can be restarted without loading the course index first.
  final String url;

  /// `queued`, `downloading`, `complete` or `failed` (`DownloadStatus`).
  final String status;

  /// Why a failed download failed (`DownloadFailure`); `null` otherwise.
  final String? failure;

  /// When the download was requested; downloads run in this order. Kept to
  /// the millisecond, since "Download all" requests many lessons at once.
  final DateTime requestedAt;
  const DownloadRow({
    required this.courseId,
    required this.lessonId,
    required this.objectId,
    required this.variant,
    required this.size,
    required this.url,
    required this.status,
    this.failure,
    required this.requestedAt,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['course_id'] = Variable<String>(courseId);
    map['lesson_id'] = Variable<String>(lessonId);
    map['object_id'] = Variable<String>(objectId);
    map['variant'] = Variable<String>(variant);
    map['size'] = Variable<int>(size);
    map['url'] = Variable<String>(url);
    map['status'] = Variable<String>(status);
    if (!nullToAbsent || failure != null) {
      map['failure'] = Variable<String>(failure);
    }
    {
      map['requested_at'] = Variable<int>(
        $DownloadsTableTable.$converterrequestedAt.toSql(requestedAt),
      );
    }
    return map;
  }

  DownloadsTableCompanion toCompanion(bool nullToAbsent) {
    return DownloadsTableCompanion(
      courseId: Value(courseId),
      lessonId: Value(lessonId),
      objectId: Value(objectId),
      variant: Value(variant),
      size: Value(size),
      url: Value(url),
      status: Value(status),
      failure: failure == null && nullToAbsent
          ? const Value.absent()
          : Value(failure),
      requestedAt: Value(requestedAt),
    );
  }

  factory DownloadRow.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return DownloadRow(
      courseId: serializer.fromJson<String>(json['courseId']),
      lessonId: serializer.fromJson<String>(json['lessonId']),
      objectId: serializer.fromJson<String>(json['objectId']),
      variant: serializer.fromJson<String>(json['variant']),
      size: serializer.fromJson<int>(json['size']),
      url: serializer.fromJson<String>(json['url']),
      status: serializer.fromJson<String>(json['status']),
      failure: serializer.fromJson<String?>(json['failure']),
      requestedAt: serializer.fromJson<DateTime>(json['requestedAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'courseId': serializer.toJson<String>(courseId),
      'lessonId': serializer.toJson<String>(lessonId),
      'objectId': serializer.toJson<String>(objectId),
      'variant': serializer.toJson<String>(variant),
      'size': serializer.toJson<int>(size),
      'url': serializer.toJson<String>(url),
      'status': serializer.toJson<String>(status),
      'failure': serializer.toJson<String?>(failure),
      'requestedAt': serializer.toJson<DateTime>(requestedAt),
    };
  }

  DownloadRow copyWith({
    String? courseId,
    String? lessonId,
    String? objectId,
    String? variant,
    int? size,
    String? url,
    String? status,
    Value<String?> failure = const Value.absent(),
    DateTime? requestedAt,
  }) => DownloadRow(
    courseId: courseId ?? this.courseId,
    lessonId: lessonId ?? this.lessonId,
    objectId: objectId ?? this.objectId,
    variant: variant ?? this.variant,
    size: size ?? this.size,
    url: url ?? this.url,
    status: status ?? this.status,
    failure: failure.present ? failure.value : this.failure,
    requestedAt: requestedAt ?? this.requestedAt,
  );
  DownloadRow copyWithCompanion(DownloadsTableCompanion data) {
    return DownloadRow(
      courseId: data.courseId.present ? data.courseId.value : this.courseId,
      lessonId: data.lessonId.present ? data.lessonId.value : this.lessonId,
      objectId: data.objectId.present ? data.objectId.value : this.objectId,
      variant: data.variant.present ? data.variant.value : this.variant,
      size: data.size.present ? data.size.value : this.size,
      url: data.url.present ? data.url.value : this.url,
      status: data.status.present ? data.status.value : this.status,
      failure: data.failure.present ? data.failure.value : this.failure,
      requestedAt: data.requestedAt.present
          ? data.requestedAt.value
          : this.requestedAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('DownloadRow(')
          ..write('courseId: $courseId, ')
          ..write('lessonId: $lessonId, ')
          ..write('objectId: $objectId, ')
          ..write('variant: $variant, ')
          ..write('size: $size, ')
          ..write('url: $url, ')
          ..write('status: $status, ')
          ..write('failure: $failure, ')
          ..write('requestedAt: $requestedAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
    courseId,
    lessonId,
    objectId,
    variant,
    size,
    url,
    status,
    failure,
    requestedAt,
  );
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is DownloadRow &&
          other.courseId == this.courseId &&
          other.lessonId == this.lessonId &&
          other.objectId == this.objectId &&
          other.variant == this.variant &&
          other.size == this.size &&
          other.url == this.url &&
          other.status == this.status &&
          other.failure == this.failure &&
          other.requestedAt == this.requestedAt);
}

class DownloadsTableCompanion extends UpdateCompanion<DownloadRow> {
  final Value<String> courseId;
  final Value<String> lessonId;
  final Value<String> objectId;
  final Value<String> variant;
  final Value<int> size;
  final Value<String> url;
  final Value<String> status;
  final Value<String?> failure;
  final Value<DateTime> requestedAt;
  final Value<int> rowid;
  const DownloadsTableCompanion({
    this.courseId = const Value.absent(),
    this.lessonId = const Value.absent(),
    this.objectId = const Value.absent(),
    this.variant = const Value.absent(),
    this.size = const Value.absent(),
    this.url = const Value.absent(),
    this.status = const Value.absent(),
    this.failure = const Value.absent(),
    this.requestedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  DownloadsTableCompanion.insert({
    required String courseId,
    required String lessonId,
    required String objectId,
    required String variant,
    required int size,
    required String url,
    required String status,
    this.failure = const Value.absent(),
    required DateTime requestedAt,
    this.rowid = const Value.absent(),
  }) : courseId = Value(courseId),
       lessonId = Value(lessonId),
       objectId = Value(objectId),
       variant = Value(variant),
       size = Value(size),
       url = Value(url),
       status = Value(status),
       requestedAt = Value(requestedAt);
  static Insertable<DownloadRow> custom({
    Expression<String>? courseId,
    Expression<String>? lessonId,
    Expression<String>? objectId,
    Expression<String>? variant,
    Expression<int>? size,
    Expression<String>? url,
    Expression<String>? status,
    Expression<String>? failure,
    Expression<int>? requestedAt,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (courseId != null) 'course_id': courseId,
      if (lessonId != null) 'lesson_id': lessonId,
      if (objectId != null) 'object_id': objectId,
      if (variant != null) 'variant': variant,
      if (size != null) 'size': size,
      if (url != null) 'url': url,
      if (status != null) 'status': status,
      if (failure != null) 'failure': failure,
      if (requestedAt != null) 'requested_at': requestedAt,
      if (rowid != null) 'rowid': rowid,
    });
  }

  DownloadsTableCompanion copyWith({
    Value<String>? courseId,
    Value<String>? lessonId,
    Value<String>? objectId,
    Value<String>? variant,
    Value<int>? size,
    Value<String>? url,
    Value<String>? status,
    Value<String?>? failure,
    Value<DateTime>? requestedAt,
    Value<int>? rowid,
  }) {
    return DownloadsTableCompanion(
      courseId: courseId ?? this.courseId,
      lessonId: lessonId ?? this.lessonId,
      objectId: objectId ?? this.objectId,
      variant: variant ?? this.variant,
      size: size ?? this.size,
      url: url ?? this.url,
      status: status ?? this.status,
      failure: failure ?? this.failure,
      requestedAt: requestedAt ?? this.requestedAt,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (courseId.present) {
      map['course_id'] = Variable<String>(courseId.value);
    }
    if (lessonId.present) {
      map['lesson_id'] = Variable<String>(lessonId.value);
    }
    if (objectId.present) {
      map['object_id'] = Variable<String>(objectId.value);
    }
    if (variant.present) {
      map['variant'] = Variable<String>(variant.value);
    }
    if (size.present) {
      map['size'] = Variable<int>(size.value);
    }
    if (url.present) {
      map['url'] = Variable<String>(url.value);
    }
    if (status.present) {
      map['status'] = Variable<String>(status.value);
    }
    if (failure.present) {
      map['failure'] = Variable<String>(failure.value);
    }
    if (requestedAt.present) {
      map['requested_at'] = Variable<int>(
        $DownloadsTableTable.$converterrequestedAt.toSql(requestedAt.value),
      );
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('DownloadsTableCompanion(')
          ..write('courseId: $courseId, ')
          ..write('lessonId: $lessonId, ')
          ..write('objectId: $objectId, ')
          ..write('variant: $variant, ')
          ..write('size: $size, ')
          ..write('url: $url, ')
          ..write('status: $status, ')
          ..write('failure: $failure, ')
          ..write('requestedAt: $requestedAt, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

abstract class _$AppDatabase extends GeneratedDatabase {
  _$AppDatabase(QueryExecutor e) : super(e);
  $AppDatabaseManager get managers => $AppDatabaseManager(this);
  late final $CachedCourseIndexTable cachedCourseIndex =
      $CachedCourseIndexTable(this);
  late final $LessonProgressTableTable lessonProgressTable =
      $LessonProgressTableTable(this);
  late final $SettingsTableTable settingsTable = $SettingsTableTable(this);
  late final $DownloadsTableTable downloadsTable = $DownloadsTableTable(this);
  late final Index downloadsObjectId = Index(
    'downloads_object_id',
    'CREATE INDEX downloads_object_id ON downloads (object_id)',
  );
  @override
  Iterable<TableInfo<Table, Object?>> get allTables =>
      allSchemaEntities.whereType<TableInfo<Table, Object?>>();
  @override
  List<DatabaseSchemaEntity> get allSchemaEntities => [
    cachedCourseIndex,
    lessonProgressTable,
    settingsTable,
    downloadsTable,
    downloadsObjectId,
  ];
}

typedef $$CachedCourseIndexTableCreateCompanionBuilder =
    CachedCourseIndexCompanion Function({
      Value<int> id,
      required String json,
      required DateTime fetchedAt,
    });
typedef $$CachedCourseIndexTableUpdateCompanionBuilder =
    CachedCourseIndexCompanion Function({
      Value<int> id,
      Value<String> json,
      Value<DateTime> fetchedAt,
    });

class $$CachedCourseIndexTableFilterComposer
    extends Composer<_$AppDatabase, $CachedCourseIndexTable> {
  $$CachedCourseIndexTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<int> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get json => $composableBuilder(
    column: $table.json,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get fetchedAt => $composableBuilder(
    column: $table.fetchedAt,
    builder: (column) => ColumnFilters(column),
  );
}

class $$CachedCourseIndexTableOrderingComposer
    extends Composer<_$AppDatabase, $CachedCourseIndexTable> {
  $$CachedCourseIndexTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<int> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get json => $composableBuilder(
    column: $table.json,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get fetchedAt => $composableBuilder(
    column: $table.fetchedAt,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$CachedCourseIndexTableAnnotationComposer
    extends Composer<_$AppDatabase, $CachedCourseIndexTable> {
  $$CachedCourseIndexTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<int> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get json =>
      $composableBuilder(column: $table.json, builder: (column) => column);

  GeneratedColumn<DateTime> get fetchedAt =>
      $composableBuilder(column: $table.fetchedAt, builder: (column) => column);
}

class $$CachedCourseIndexTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $CachedCourseIndexTable,
          CachedCourseIndexData,
          $$CachedCourseIndexTableFilterComposer,
          $$CachedCourseIndexTableOrderingComposer,
          $$CachedCourseIndexTableAnnotationComposer,
          $$CachedCourseIndexTableCreateCompanionBuilder,
          $$CachedCourseIndexTableUpdateCompanionBuilder,
          (
            CachedCourseIndexData,
            BaseReferences<
              _$AppDatabase,
              $CachedCourseIndexTable,
              CachedCourseIndexData
            >,
          ),
          CachedCourseIndexData,
          PrefetchHooks Function()
        > {
  $$CachedCourseIndexTableTableManager(
    _$AppDatabase db,
    $CachedCourseIndexTable table,
  ) : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$CachedCourseIndexTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$CachedCourseIndexTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$CachedCourseIndexTableAnnotationComposer(
                $db: db,
                $table: table,
              ),
          updateCompanionCallback:
              ({
                Value<int> id = const Value.absent(),
                Value<String> json = const Value.absent(),
                Value<DateTime> fetchedAt = const Value.absent(),
              }) => CachedCourseIndexCompanion(
                id: id,
                json: json,
                fetchedAt: fetchedAt,
              ),
          createCompanionCallback:
              ({
                Value<int> id = const Value.absent(),
                required String json,
                required DateTime fetchedAt,
              }) => CachedCourseIndexCompanion.insert(
                id: id,
                json: json,
                fetchedAt: fetchedAt,
              ),
          withReferenceMapper: (p0) => p0
              .map(
                (e) => (
                  e.readTable<$CachedCourseIndexTable, CachedCourseIndexData>(
                    table,
                  ),
                  BaseReferences<
                    _$AppDatabase,
                    $CachedCourseIndexTable,
                    CachedCourseIndexData
                  >(db, table, e),
                ),
              )
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$CachedCourseIndexTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $CachedCourseIndexTable,
      CachedCourseIndexData,
      $$CachedCourseIndexTableFilterComposer,
      $$CachedCourseIndexTableOrderingComposer,
      $$CachedCourseIndexTableAnnotationComposer,
      $$CachedCourseIndexTableCreateCompanionBuilder,
      $$CachedCourseIndexTableUpdateCompanionBuilder,
      (
        CachedCourseIndexData,
        BaseReferences<
          _$AppDatabase,
          $CachedCourseIndexTable,
          CachedCourseIndexData
        >,
      ),
      CachedCourseIndexData,
      PrefetchHooks Function()
    >;
typedef $$LessonProgressTableTableCreateCompanionBuilder =
    LessonProgressTableCompanion Function({
      required String courseId,
      required String lessonId,
      Value<int?> positionMs,
      Value<bool> finished,
      Value<DateTime?> listenedAt,
      Value<int> rowid,
    });
typedef $$LessonProgressTableTableUpdateCompanionBuilder =
    LessonProgressTableCompanion Function({
      Value<String> courseId,
      Value<String> lessonId,
      Value<int?> positionMs,
      Value<bool> finished,
      Value<DateTime?> listenedAt,
      Value<int> rowid,
    });

class $$LessonProgressTableTableFilterComposer
    extends Composer<_$AppDatabase, $LessonProgressTableTable> {
  $$LessonProgressTableTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get courseId => $composableBuilder(
    column: $table.courseId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get lessonId => $composableBuilder(
    column: $table.lessonId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get positionMs => $composableBuilder(
    column: $table.positionMs,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<bool> get finished => $composableBuilder(
    column: $table.finished,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get listenedAt => $composableBuilder(
    column: $table.listenedAt,
    builder: (column) => ColumnFilters(column),
  );
}

class $$LessonProgressTableTableOrderingComposer
    extends Composer<_$AppDatabase, $LessonProgressTableTable> {
  $$LessonProgressTableTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get courseId => $composableBuilder(
    column: $table.courseId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get lessonId => $composableBuilder(
    column: $table.lessonId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get positionMs => $composableBuilder(
    column: $table.positionMs,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<bool> get finished => $composableBuilder(
    column: $table.finished,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get listenedAt => $composableBuilder(
    column: $table.listenedAt,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$LessonProgressTableTableAnnotationComposer
    extends Composer<_$AppDatabase, $LessonProgressTableTable> {
  $$LessonProgressTableTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get courseId =>
      $composableBuilder(column: $table.courseId, builder: (column) => column);

  GeneratedColumn<String> get lessonId =>
      $composableBuilder(column: $table.lessonId, builder: (column) => column);

  GeneratedColumn<int> get positionMs => $composableBuilder(
    column: $table.positionMs,
    builder: (column) => column,
  );

  GeneratedColumn<bool> get finished =>
      $composableBuilder(column: $table.finished, builder: (column) => column);

  GeneratedColumn<DateTime> get listenedAt => $composableBuilder(
    column: $table.listenedAt,
    builder: (column) => column,
  );
}

class $$LessonProgressTableTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $LessonProgressTableTable,
          LessonProgressRow,
          $$LessonProgressTableTableFilterComposer,
          $$LessonProgressTableTableOrderingComposer,
          $$LessonProgressTableTableAnnotationComposer,
          $$LessonProgressTableTableCreateCompanionBuilder,
          $$LessonProgressTableTableUpdateCompanionBuilder,
          (
            LessonProgressRow,
            BaseReferences<
              _$AppDatabase,
              $LessonProgressTableTable,
              LessonProgressRow
            >,
          ),
          LessonProgressRow,
          PrefetchHooks Function()
        > {
  $$LessonProgressTableTableTableManager(
    _$AppDatabase db,
    $LessonProgressTableTable table,
  ) : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$LessonProgressTableTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$LessonProgressTableTableOrderingComposer(
                $db: db,
                $table: table,
              ),
          createComputedFieldComposer: () =>
              $$LessonProgressTableTableAnnotationComposer(
                $db: db,
                $table: table,
              ),
          updateCompanionCallback:
              ({
                Value<String> courseId = const Value.absent(),
                Value<String> lessonId = const Value.absent(),
                Value<int?> positionMs = const Value.absent(),
                Value<bool> finished = const Value.absent(),
                Value<DateTime?> listenedAt = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => LessonProgressTableCompanion(
                courseId: courseId,
                lessonId: lessonId,
                positionMs: positionMs,
                finished: finished,
                listenedAt: listenedAt,
                rowid: rowid,
              ),
          createCompanionCallback:
              ({
                required String courseId,
                required String lessonId,
                Value<int?> positionMs = const Value.absent(),
                Value<bool> finished = const Value.absent(),
                Value<DateTime?> listenedAt = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => LessonProgressTableCompanion.insert(
                courseId: courseId,
                lessonId: lessonId,
                positionMs: positionMs,
                finished: finished,
                listenedAt: listenedAt,
                rowid: rowid,
              ),
          withReferenceMapper: (p0) => p0
              .map(
                (e) => (
                  e.readTable<$LessonProgressTableTable, LessonProgressRow>(
                    table,
                  ),
                  BaseReferences<
                    _$AppDatabase,
                    $LessonProgressTableTable,
                    LessonProgressRow
                  >(db, table, e),
                ),
              )
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$LessonProgressTableTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $LessonProgressTableTable,
      LessonProgressRow,
      $$LessonProgressTableTableFilterComposer,
      $$LessonProgressTableTableOrderingComposer,
      $$LessonProgressTableTableAnnotationComposer,
      $$LessonProgressTableTableCreateCompanionBuilder,
      $$LessonProgressTableTableUpdateCompanionBuilder,
      (
        LessonProgressRow,
        BaseReferences<
          _$AppDatabase,
          $LessonProgressTableTable,
          LessonProgressRow
        >,
      ),
      LessonProgressRow,
      PrefetchHooks Function()
    >;
typedef $$SettingsTableTableCreateCompanionBuilder =
    SettingsTableCompanion Function({
      required String key,
      required String value,
      Value<int> rowid,
    });
typedef $$SettingsTableTableUpdateCompanionBuilder =
    SettingsTableCompanion Function({
      Value<String> key,
      Value<String> value,
      Value<int> rowid,
    });

class $$SettingsTableTableFilterComposer
    extends Composer<_$AppDatabase, $SettingsTableTable> {
  $$SettingsTableTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get key => $composableBuilder(
    column: $table.key,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get value => $composableBuilder(
    column: $table.value,
    builder: (column) => ColumnFilters(column),
  );
}

class $$SettingsTableTableOrderingComposer
    extends Composer<_$AppDatabase, $SettingsTableTable> {
  $$SettingsTableTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get key => $composableBuilder(
    column: $table.key,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get value => $composableBuilder(
    column: $table.value,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$SettingsTableTableAnnotationComposer
    extends Composer<_$AppDatabase, $SettingsTableTable> {
  $$SettingsTableTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get key =>
      $composableBuilder(column: $table.key, builder: (column) => column);

  GeneratedColumn<String> get value =>
      $composableBuilder(column: $table.value, builder: (column) => column);
}

class $$SettingsTableTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $SettingsTableTable,
          SettingRow,
          $$SettingsTableTableFilterComposer,
          $$SettingsTableTableOrderingComposer,
          $$SettingsTableTableAnnotationComposer,
          $$SettingsTableTableCreateCompanionBuilder,
          $$SettingsTableTableUpdateCompanionBuilder,
          (
            SettingRow,
            BaseReferences<_$AppDatabase, $SettingsTableTable, SettingRow>,
          ),
          SettingRow,
          PrefetchHooks Function()
        > {
  $$SettingsTableTableTableManager(_$AppDatabase db, $SettingsTableTable table)
    : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$SettingsTableTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$SettingsTableTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$SettingsTableTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback: ({
            Value<String> key = const Value.absent(),
            Value<String> value = const Value.absent(),
            Value<int> rowid = const Value.absent(),
          }) => SettingsTableCompanion(key: key, value: value, rowid: rowid),
          createCompanionCallback:
              ({
                required String key,
                required String value,
                Value<int> rowid = const Value.absent(),
              }) => SettingsTableCompanion.insert(
                key: key,
                value: value,
                rowid: rowid,
              ),
          withReferenceMapper: (p0) => p0
              .map(
                (e) => (
                  e.readTable<$SettingsTableTable, SettingRow>(table),
                  BaseReferences<
                    _$AppDatabase,
                    $SettingsTableTable,
                    SettingRow
                  >(db, table, e),
                ),
              )
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$SettingsTableTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $SettingsTableTable,
      SettingRow,
      $$SettingsTableTableFilterComposer,
      $$SettingsTableTableOrderingComposer,
      $$SettingsTableTableAnnotationComposer,
      $$SettingsTableTableCreateCompanionBuilder,
      $$SettingsTableTableUpdateCompanionBuilder,
      (
        SettingRow,
        BaseReferences<_$AppDatabase, $SettingsTableTable, SettingRow>,
      ),
      SettingRow,
      PrefetchHooks Function()
    >;
typedef $$DownloadsTableTableCreateCompanionBuilder =
    DownloadsTableCompanion Function({
      required String courseId,
      required String lessonId,
      required String objectId,
      required String variant,
      required int size,
      required String url,
      required String status,
      Value<String?> failure,
      required DateTime requestedAt,
      Value<int> rowid,
    });
typedef $$DownloadsTableTableUpdateCompanionBuilder =
    DownloadsTableCompanion Function({
      Value<String> courseId,
      Value<String> lessonId,
      Value<String> objectId,
      Value<String> variant,
      Value<int> size,
      Value<String> url,
      Value<String> status,
      Value<String?> failure,
      Value<DateTime> requestedAt,
      Value<int> rowid,
    });

class $$DownloadsTableTableFilterComposer
    extends Composer<_$AppDatabase, $DownloadsTableTable> {
  $$DownloadsTableTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get courseId => $composableBuilder(
    column: $table.courseId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get lessonId => $composableBuilder(
    column: $table.lessonId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get objectId => $composableBuilder(
    column: $table.objectId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get variant => $composableBuilder(
    column: $table.variant,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get size => $composableBuilder(
    column: $table.size,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get url => $composableBuilder(
    column: $table.url,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get status => $composableBuilder(
    column: $table.status,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get failure => $composableBuilder(
    column: $table.failure,
    builder: (column) => ColumnFilters(column),
  );

  ColumnWithTypeConverterFilters<DateTime, DateTime, int> get requestedAt =>
      $composableBuilder(
        column: $table.requestedAt,
        builder: (column) => ColumnWithTypeConverterFilters(column),
      );
}

class $$DownloadsTableTableOrderingComposer
    extends Composer<_$AppDatabase, $DownloadsTableTable> {
  $$DownloadsTableTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get courseId => $composableBuilder(
    column: $table.courseId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get lessonId => $composableBuilder(
    column: $table.lessonId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get objectId => $composableBuilder(
    column: $table.objectId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get variant => $composableBuilder(
    column: $table.variant,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get size => $composableBuilder(
    column: $table.size,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get url => $composableBuilder(
    column: $table.url,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get status => $composableBuilder(
    column: $table.status,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get failure => $composableBuilder(
    column: $table.failure,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get requestedAt => $composableBuilder(
    column: $table.requestedAt,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$DownloadsTableTableAnnotationComposer
    extends Composer<_$AppDatabase, $DownloadsTableTable> {
  $$DownloadsTableTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get courseId =>
      $composableBuilder(column: $table.courseId, builder: (column) => column);

  GeneratedColumn<String> get lessonId =>
      $composableBuilder(column: $table.lessonId, builder: (column) => column);

  GeneratedColumn<String> get objectId =>
      $composableBuilder(column: $table.objectId, builder: (column) => column);

  GeneratedColumn<String> get variant =>
      $composableBuilder(column: $table.variant, builder: (column) => column);

  GeneratedColumn<int> get size =>
      $composableBuilder(column: $table.size, builder: (column) => column);

  GeneratedColumn<String> get url =>
      $composableBuilder(column: $table.url, builder: (column) => column);

  GeneratedColumn<String> get status =>
      $composableBuilder(column: $table.status, builder: (column) => column);

  GeneratedColumn<String> get failure =>
      $composableBuilder(column: $table.failure, builder: (column) => column);

  GeneratedColumnWithTypeConverter<DateTime, int> get requestedAt =>
      $composableBuilder(
        column: $table.requestedAt,
        builder: (column) => column,
      );
}

class $$DownloadsTableTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $DownloadsTableTable,
          DownloadRow,
          $$DownloadsTableTableFilterComposer,
          $$DownloadsTableTableOrderingComposer,
          $$DownloadsTableTableAnnotationComposer,
          $$DownloadsTableTableCreateCompanionBuilder,
          $$DownloadsTableTableUpdateCompanionBuilder,
          (
            DownloadRow,
            BaseReferences<_$AppDatabase, $DownloadsTableTable, DownloadRow>,
          ),
          DownloadRow,
          PrefetchHooks Function()
        > {
  $$DownloadsTableTableTableManager(
    _$AppDatabase db,
    $DownloadsTableTable table,
  ) : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$DownloadsTableTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$DownloadsTableTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$DownloadsTableTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                Value<String> courseId = const Value.absent(),
                Value<String> lessonId = const Value.absent(),
                Value<String> objectId = const Value.absent(),
                Value<String> variant = const Value.absent(),
                Value<int> size = const Value.absent(),
                Value<String> url = const Value.absent(),
                Value<String> status = const Value.absent(),
                Value<String?> failure = const Value.absent(),
                Value<DateTime> requestedAt = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => DownloadsTableCompanion(
                courseId: courseId,
                lessonId: lessonId,
                objectId: objectId,
                variant: variant,
                size: size,
                url: url,
                status: status,
                failure: failure,
                requestedAt: requestedAt,
                rowid: rowid,
              ),
          createCompanionCallback:
              ({
                required String courseId,
                required String lessonId,
                required String objectId,
                required String variant,
                required int size,
                required String url,
                required String status,
                Value<String?> failure = const Value.absent(),
                required DateTime requestedAt,
                Value<int> rowid = const Value.absent(),
              }) => DownloadsTableCompanion.insert(
                courseId: courseId,
                lessonId: lessonId,
                objectId: objectId,
                variant: variant,
                size: size,
                url: url,
                status: status,
                failure: failure,
                requestedAt: requestedAt,
                rowid: rowid,
              ),
          withReferenceMapper: (p0) => p0
              .map(
                (e) => (
                  e.readTable<$DownloadsTableTable, DownloadRow>(table),
                  BaseReferences<
                    _$AppDatabase,
                    $DownloadsTableTable,
                    DownloadRow
                  >(db, table, e),
                ),
              )
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$DownloadsTableTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $DownloadsTableTable,
      DownloadRow,
      $$DownloadsTableTableFilterComposer,
      $$DownloadsTableTableOrderingComposer,
      $$DownloadsTableTableAnnotationComposer,
      $$DownloadsTableTableCreateCompanionBuilder,
      $$DownloadsTableTableUpdateCompanionBuilder,
      (
        DownloadRow,
        BaseReferences<_$AppDatabase, $DownloadsTableTable, DownloadRow>,
      ),
      DownloadRow,
      PrefetchHooks Function()
    >;

class $AppDatabaseManager {
  final _$AppDatabase _db;
  $AppDatabaseManager(this._db);
  $$CachedCourseIndexTableTableManager get cachedCourseIndex =>
      $$CachedCourseIndexTableTableManager(_db, _db.cachedCourseIndex);
  $$LessonProgressTableTableTableManager get lessonProgressTable =>
      $$LessonProgressTableTableTableManager(_db, _db.lessonProgressTable);
  $$SettingsTableTableTableManager get settingsTable =>
      $$SettingsTableTableTableManager(_db, _db.settingsTable);
  $$DownloadsTableTableTableManager get downloadsTable =>
      $$DownloadsTableTableTableManager(_db, _db.downloadsTable);
}
