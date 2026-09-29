import 'dart:async';

import 'package:drift/drift.dart';
import 'package:flutter/foundation.dart';
import 'package:languagetransfer/src/core/logging.dart';
import 'package:languagetransfer/src/core/storage/database.dart';
import 'package:languagetransfer/src/features/catalog/data/catalog_api.dart';
import 'package:languagetransfer/src/features/catalog/domain/course_index.dart';

/// The course index together with the time it was fetched from the server.
@immutable
class LoadedCourseIndex {
  const LoadedCourseIndex(this.index, this.fetchedAt);

  final CourseIndex index;
  final DateTime fetchedAt;
}

/// Loads the course index from memory, the local cache or the network.
///
/// Like the Expo app (`src/data/courseIndex.ts`), an index older than
/// [maxAge] is refreshed and a cached copy keeps the app working offline.
/// A stale index is returned at once and refreshed in the background
/// (announced on [updates]), so a slow network never blocks the app while a
/// cached index exists.
class CourseIndexRepository {
  CourseIndexRepository({
    required this._api,
    required this._database,
    this._now = DateTime.now,
    this.maxAge = const Duration(hours: 12),
    this.retryDelay = const Duration(minutes: 1),
  });

  final CatalogApi _api;
  final AppDatabase _database;
  final DateTime Function() _now;

  /// How long an index is used before it is refreshed.
  final Duration maxAge;

  /// How long to wait after a failed background refresh before trying again.
  final Duration retryDelay;

  final _updates = StreamController<LoadedCourseIndex>.broadcast();
  LoadedCourseIndex? _memory;
  Future<LoadedCourseIndex>? _pendingRefresh;
  DateTime? _lastFailedRefresh;

  /// Every index fetched from the server after the first [load].
  Stream<LoadedCourseIndex> get updates => _updates.stream;

  /// Returns the best available index without waiting for the network,
  /// unless there is no cached index at all. Starts a background refresh when
  /// the index is older than [maxAge].
  ///
  /// Throws [Exception]s from the network or the parser only when nothing is
  /// cached.
  Future<LoadedCourseIndex> load() async {
    final loaded = _memory ??= await _readCache();
    if (loaded == null) return await _refresh();
    if (!_isFresh(loaded)) _refreshInBackground();
    return loaded;
  }

  /// Fetches the index from the network now and throws if that fails, like
  /// the Expo app's explicit "Refresh metadata".
  Future<LoadedCourseIndex> refresh() => _refresh();

  /// How long until the loaded index is due for a refresh, so a long-running
  /// app can check again (upstream refetches every twelve hours,
  /// `src/data/courseIndex.ts`, `refetchInterval`). Zero if nothing is loaded
  /// or it is due now.
  Duration get timeUntilStale {
    final memory = _memory;
    if (memory == null || !_isFresh(memory)) return Duration.zero;
    return maxAge - _now().difference(memory.fetchedAt);
  }

  Future<void> dispose() => _updates.close();

  bool _isFresh(LoadedCourseIndex loaded) {
    final age = _now().difference(loaded.fetchedAt);
    // A fetch time in the future means the clock was changed; do not trust it.
    return !age.isNegative && age < maxAge;
  }

  void _refreshInBackground() {
    final lastFailure = _lastFailedRefresh;
    if (_pendingRefresh != null ||
        (lastFailure != null && _now().difference(lastFailure) < retryDelay)) {
      return;
    }
    unawaited(
      _refresh().then<void>(
        (_) {},
        onError: (Object error, StackTrace stackTrace) {
          _lastFailedRefresh = _now();
          logRecoverable('Using cached course index', error, stackTrace);
        },
      ),
    );
  }

  /// Concurrent callers share one request.
  Future<LoadedCourseIndex> _refresh() {
    return _pendingRefresh ??= _fetchAndStore().whenComplete(() {
      _pendingRefresh = null;
    });
  }

  Future<LoadedCourseIndex> _fetchAndStore() async {
    final json = await _api.fetchIndexJson();
    // Parse before storing, so an invalid response never replaces a good
    // cached copy.
    final loaded = LoadedCourseIndex(CourseIndex.parse(json), _now());
    await _database
        .into(_database.cachedCourseIndex)
        .insertOnConflictUpdate(
          CachedCourseIndexCompanion.insert(
            id: const Value(CachedCourseIndex.singleRowId),
            json: json,
            fetchedAt: loaded.fetchedAt,
          ),
        );
    _memory = loaded;
    _lastFailedRefresh = null;
    if (!_updates.isClosed) _updates.add(loaded);
    return loaded;
  }

  Future<LoadedCourseIndex?> _readCache() async {
    final row = await _database
        .select(_database.cachedCourseIndex)
        .getSingleOrNull();
    if (row == null) return null;
    try {
      return LoadedCourseIndex(CourseIndex.parse(row.json), row.fetchedAt);
    } on FormatException catch (error, stackTrace) {
      // Written in a format this version cannot read; fetch a new one.
      logRecoverable(
        'Ignoring unreadable cached course index',
        error,
        stackTrace,
      );
      return null;
    }
  }
}
