import 'dart:async';
import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:languagetransfer/src/core/logging.dart';
import 'package:languagetransfer/src/core/storage/integrity.dart';
import 'package:languagetransfer/src/core/storage/object_store.dart';
import 'package:languagetransfer/src/features/catalog/domain/course_index.dart';
import 'package:languagetransfer/src/features/catalog/domain/lesson.dart';
import 'package:languagetransfer/src/features/downloads/data/download_backend.dart';
import 'package:languagetransfer/src/features/downloads/data/download_repository.dart';
import 'package:languagetransfer/src/features/downloads/domain/lesson_download.dart';
import 'package:languagetransfer/src/features/player/data/lesson_sources.dart';
import 'package:languagetransfer/src/features/settings/data/settings_repository.dart';

/// Keeps lessons on the device.
///
/// The `downloads` table records which lessons the listener wants; this
/// class makes the device match it: it hands requests to the platform's
/// background downloads, checks every finished file against its SHA-256,
/// and deletes files nobody wants any more. At start it catches up with
/// whatever happened while the app was not running.
///
/// Every change to rows, files and tasks runs one at a time, so a download
/// that completes while its lesson is being deleted cannot leave a file or a
/// row behind. Only the hashing of finished files runs beside that (see
/// [_checkLater]).
class DownloadManager implements DownloadedLessons {
  DownloadManager({
    required this._backend,
    required this._repository,
    required this._store,
    required this._settings,
    required this.applePlayer,
    this._now = DateTime.now,
  });

  /// Partial writes older than this are left over from a crash.
  static const _abandonedPartialAge = Duration(hours: 1);

  final DownloadBackend _backend;
  final DownloadRepository _repository;
  final ObjectStore _store;
  final SettingsRepository _settings;
  final DateTime Function() _now;

  /// True on iOS and macOS; decides which file high quality means
  /// (`LessonVariants.select`).
  final bool applePlayer;

  final _subscriptions = <StreamSubscription<Object?>>[];
  final _progressController = StreamController<Map<String, double>>.broadcast();
  final _progress = <String, double>{};

  /// Paths of files the player's queue refers to.
  Set<String> _filesInQueue = const {};

  /// Files of deleted downloads that the player's queue referred to, by
  /// object id; deleted once it no longer does, unless they were requested
  /// again meanwhile.
  final _deleteWhenReleased = <String, File>{};

  /// The Wi-Fi rule last handed to the backend.
  bool? _wifiOnly;

  /// The last request time handed out (see [_nextRequestTime]).
  DateTime? _lastRequestedAt;

  Future<void> _tail = Future.value();

  /// Finished files waiting to be hashed, and the files being hashed, as
  /// object id, modification time and size.
  Future<void> _checks = Future.value();
  final _checking = <(String, DateTime, int)>{};

  /// Connects to the platform's downloads and catches up with what happened
  /// while the app was not running. Call once at app start.
  Future<void> start() async {
    // Before the backend starts, so updates held back while the app was not
    // running are not missed. They are handled before catching up.
    _subscriptions.add(
      _backend.events.listen((event) {
        switch (event) {
          case DownloadProgressed(:final taskId, :final fraction):
            _progress[taskId] = fraction;
            _emitProgress();
          case DownloadStateChanged(
            :final taskId,
            :final state,
            :final failure,
          ):
            // Logged in [_serially]; nothing else to do with a failure.
            _serially(
              'handle $event',
              () => _onStateChanged(taskId, state, failure),
            ).ignore();
        }
      }),
    );
    // Queued, so work requested meanwhile waits for the downloader.
    await _serially('start the downloader', () async {
      await _backend.start();
      await _applyWifiRule((await _settings.load()).downloadOnlyOnWifi);
    });
    _subscriptions.add(
      _settings
          .watch()
          .map((settings) => settings.downloadOnlyOnWifi)
          .distinct()
          .listen((wifiOnly) => unawaited(_applyWifiRule(wifiOnly))),
    );
    await _serially('catch up with downloads', _reconcile);
  }

  /// Stops listening and waits for the work under way, so that nothing
  /// touches the database afterwards.
  Future<void> dispose() async {
    for (final subscription in _subscriptions) {
      await subscription.cancel();
    }
    await idle;
    await _progressController.close();
  }

  /// How far each running download is, by object id (0 to 1). Only
  /// meaningful while the download's status is
  /// [DownloadStatus.downloading].
  Stream<Map<String, double>> get progress => _progressController.stream;

  Map<String, double> get currentProgress => Map.unmodifiable(_progress);

  /// Completes when all work queued so far, and any it queued in turn, is
  /// done.
  @visibleForTesting
  Future<void> get idle async {
    Future<void> tail;
    Future<void> checks;
    do {
      tail = _tail;
      checks = _checks;
      await checks;
      await tail;
    } while (!identical(tail, _tail) || !identical(checks, _checks));
  }

  /// Downloads [lessons] of [courseId] in [quality], in the given order.
  ///
  /// Lessons that are already downloaded or on their way are skipped, in
  /// whatever quality they were requested. Failed ones are requested again.
  Future<void> download({
    required String courseId,
    required CourseIndex index,
    required List<Lesson> lessons,
    required AudioQuality quality,
  }) => _serially('download lessons', () async {
    final existing = await _repository.loadCourse(courseId);
    final requested = <LessonDownload>[];
    for (final lesson in lessons) {
      final current = existing[lesson.id];
      if (current != null && current.status != DownloadStatus.failed) continue;
      final audio = lesson.variants.select(quality, applePlayer: applePlayer);
      requested.add(
        LessonDownload(
          courseId: courseId,
          lessonId: lesson.id,
          objectId: audio.pointer.object,
          variant: audio.variant,
          size: audio.pointer.size,
          url: index.urlFor(audio.pointer),
          status: DownloadStatus.queued,
          requestedAt: _nextRequestTime(),
        ),
      );
    }
    if (requested.isEmpty) return;
    await _repository.putAll(requested);

    final active = await _backend.activeTaskIds();
    final toEnqueue = <String, LessonDownload>{};
    for (final download in requested) {
      if (active.contains(download.objectId) ||
          toEnqueue.containsKey(download.objectId)) {
        continue;
      }
      // Another lesson with the same audio may have downloaded it already,
      // or the file of a deleted download is still kept for the player.
      if (_fileOf(download).existsSync()) {
        _checkLater(download);
        continue;
      }
      toEnqueue[download.objectId] = download;
    }
    await _enqueue(toEnqueue.values);
  });

  /// Deletes the downloads of [lessonIds] in [courseId], cancelling those
  /// still on their way.
  Future<void> delete(String courseId, Iterable<String> lessonIds) =>
      _serially('delete downloads', () async {
        await _release(await _repository.remove(courseId, lessonIds));
      });

  /// Deletes every download of [courseId].
  Future<void> deleteCourse(String courseId) =>
      _serially('delete course downloads', () async {
        final downloads = await _repository.loadCourse(courseId);
        await _release(await _repository.remove(courseId, downloads.keys));
      });

  @override
  Future<Map<String, File>> filesForQueue(String courseId) =>
      _serially('prepare queue', () async {
        final downloads = await _repository.loadCourse(courseId);
        final files = <String, File>{
          for (final download in downloads.values)
            if (download.isComplete) download.lessonId: _fileOf(download),
        }..removeWhere((_, file) => !file.existsSync());
        _filesInQueue = {for (final file in files.values) file.path};

        final released = {
          for (final MapEntry(key: objectId, value: file)
              in _deleteWhenReleased.entries)
            if (!_filesInQueue.contains(file.path)) objectId: file,
        };
        final wanted = await _repository.referenced(released.keys);
        for (final MapEntry(key: objectId, value: file) in released.entries) {
          _deleteWhenReleased.remove(objectId);
          if (!wanted.contains(objectId)) await _store.deleteFile(file);
        }
        return files;
      });

  Future<void> _onStateChanged(
    String objectId,
    DownloadTaskState state,
    DownloadFailure? failure,
  ) async {
    final downloads = await _repository.loadByObject(objectId);
    if (state != DownloadTaskState.running) _progress.remove(objectId);
    if (downloads.isEmpty) {
      // Deleted while it was on its way; a file that arrived anyway goes.
      if (state == DownloadTaskState.complete) await _deleteObject(objectId);
      _emitProgress();
      return;
    }
    final download = downloads.first;
    switch (state) {
      case DownloadTaskState.waiting:
      case DownloadTaskState.running:
        // A late update of an earlier attempt must not undo a verified file.
        if (download.isComplete) return;
        await _repository.setStatus(
          objectId,
          state == DownloadTaskState.running
              ? DownloadStatus.downloading
              : DownloadStatus.queued,
        );
      case DownloadTaskState.complete:
        // Already checked, for an earlier update.
        if (downloads.every((row) => row.isComplete)) return;
        _checkLater(download);
      case DownloadTaskState.failed:
        await _repository.setStatus(
          objectId,
          DownloadStatus.failed,
          failure: failure,
        );
      case DownloadTaskState.canceled:
        // This app cancels only downloads it has already removed, so a
        // cancellation here came from the system.
        await _repository.setStatus(
          objectId,
          DownloadStatus.failed,
          failure: DownloadFailure.other,
        );
    }
    _emitProgress();
  }

  /// Makes the device match the `downloads` table after the app was not
  /// running: finds files that arrived meanwhile, requests again what the
  /// system dropped, cancels what is no longer wanted, and deletes files
  /// nobody wants.
  Future<void> _reconcile() async {
    final active = await _backend.activeTaskIds();
    final downloads = await _repository.loadAll();
    final byObject = <String, List<LessonDownload>>{};
    for (final download in downloads) {
      (byObject[download.objectId] ??= []).add(download);
    }

    final unwanted = active.difference(byObject.keys.toSet());
    if (unwanted.isNotEmpty) await _backend.cancel(unwanted);

    final toEnqueue = <LessonDownload>[];
    for (final MapEntry(key: objectId, value: rows) in byObject.entries) {
      if (active.contains(objectId)) continue;
      // The listener decides when to try failed downloads again.
      if (rows.every((row) => row.status == DownloadStatus.failed)) continue;
      final download = rows.first;
      if (rows.every((row) => row.isComplete)) {
        // Checked when it arrived; its size is enough here and avoids
        // hashing hundreds of megabytes at every start.
        if (_hasExpectedSize(download)) continue;
      } else if (_fileOf(download).existsSync()) {
        // Arrived while the app was not running.
        _checkLater(download);
        continue;
      }
      await _repository.setStatus(objectId, DownloadStatus.queued);
      toEnqueue.add(download);
    }
    toEnqueue.sort((a, b) => a.requestedAt.compareTo(b.requestedAt));
    await _enqueue(toEnqueue);
    await _deleteOrphans(byObject.keys.toSet());
  }

  Future<void> _enqueue(Iterable<LessonDownload> downloads) async {
    final requests = [
      for (final download in downloads)
        DownloadRequest(
          taskId: download.objectId,
          url: download.url,
          file: _fileOf(download),
          requestedAt: download.requestedAt,
        ),
    ];
    if (requests.isEmpty) return;
    Set<String> rejected;
    try {
      rejected = await _backend.enqueue(requests);
    } on Object catch (error, stackTrace) {
      logRecoverable('Could not enqueue downloads', error, stackTrace);
      rejected = {for (final request in requests) request.taskId};
    }
    for (final taskId in rejected) {
      await _repository.setStatus(
        taskId,
        DownloadStatus.failed,
        failure: DownloadFailure.other,
      );
    }
  }

  /// Cancels and deletes whatever [removed] used that no other lesson still
  /// uses.
  Future<void> _release(List<LessonDownload> removed) async {
    final byObject = {
      for (final download in removed) download.objectId: download,
    };
    final stillUsed = await _repository.referenced(byObject.keys);
    final toCancel = <String>[];
    final toDelete = <(String, File)>[];
    for (final download in byObject.values) {
      if (stillUsed.contains(download.objectId)) continue;
      if (!download.isComplete) toCancel.add(download.objectId);
      _progress.remove(download.objectId);
      toDelete.add((download.objectId, _fileOf(download)));
    }
    // Cancel first, so a download cannot finish after its file was deleted.
    // One that finishes in between is caught in [_onStateChanged].
    if (toCancel.isNotEmpty) await _backend.cancel(toCancel);
    for (final (objectId, file) in toDelete) {
      if (_filesInQueue.contains(file.path)) {
        _deleteWhenReleased[objectId] = file;
      } else {
        await _store.deleteFile(file);
      }
    }
    _emitProgress();
  }

  /// Deletes audio files no download refers to, and partial writes left by
  /// a crash. Metadata files (no extension) are the catalog's business.
  Future<void> _deleteOrphans(Set<String> wanted) async {
    final audioExtensions = {
      for (final variant in AudioVariant.values) variant.fileExtension,
    };
    final abandonedBefore = _now().subtract(_abandonedPartialAge);
    for (final stored in await _store.list()) {
      final orphan = stored.partial
          ? _modifiedBefore(stored.file, abandonedBefore)
          : audioExtensions.contains(stored.extension) &&
                !wanted.contains(stored.objectId) &&
                !_filesInQueue.contains(stored.file.path);
      if (orphan) await _store.deleteFile(stored.file);
    }
  }

  /// Deletes the file of [objectId] in any audio variant.
  Future<void> _deleteObject(String objectId) async {
    for (final variant in AudioVariant.values) {
      await _store.deleteFile(
        _store.fileForId(objectId, extension: variant.fileExtension),
      );
    }
  }

  File _fileOf(LessonDownload download) => _store.fileFor(
    download.pointer,
    extension: download.variant.fileExtension,
  );

  static bool _modifiedBefore(File file, DateTime time) {
    try {
      return file.lastModifiedSync().isBefore(time);
    } on FileSystemException {
      return false; // Gone since it was listed.
    }
  }

  bool _hasExpectedSize(LessonDownload download) {
    final file = _fileOf(download);
    return file.existsSync() && file.lengthSync() == download.size;
  }

  /// Checks the file that arrived for [download] against its SHA-256, then
  /// records the result in order with other work.
  ///
  /// Hashing a lesson takes a moment, so files are hashed one at a time
  /// outside the queue of [_serially]: a backlog of finished downloads, as
  /// after "Download all" in the background, must not hold up the player or
  /// the listener's actions. Meanwhile the lesson still counts as on its
  /// way.
  void _checkLater(LessonDownload download) {
    final file = _fileOf(download);
    final found = file.statSync();
    final key = (download.objectId, found.modified, found.size);
    if (!_checking.add(key)) return;
    _checks = _checks.then((_) async {
      try {
        final intact = await _matches(download, file);
        _serially('record the check of ${download.objectId}', () async {
          final rows = await _repository.loadByObject(download.objectId);
          // Deleted meanwhile, which took care of the file, or recorded.
          if (rows.isEmpty || rows.every((row) => row.isComplete)) return;
          final current = file.statSync();
          // Replaced meanwhile by a later download, which is checked itself.
          if (current.modified != found.modified ||
              current.size != found.size) {
            return;
          }
          if (intact) {
            await _repository.setStatus(
              download.objectId,
              DownloadStatus.complete,
            );
          } else {
            await _store.deleteFile(file);
            await _repository.setStatus(
              download.objectId,
              DownloadStatus.failed,
              failure: DownloadFailure.damaged,
            );
          }
        }).ignore(); // Logged in [_serially].
      } on Object catch (error, stackTrace) {
        logRecoverable(
          'Could not check ${download.objectId}',
          error,
          stackTrace,
        );
      } finally {
        _checking.remove(key);
      }
    });
  }

  /// Whether [file] exists and matches the SHA-256 of [download].
  static Future<bool> _matches(LessonDownload download, File file) async {
    if (!file.existsSync()) return false;
    try {
      await verifyFile(download.pointer, file);
      return true;
    } on CorruptObjectException catch (error, stackTrace) {
      logRecoverable('Downloaded file is corrupt', error, stackTrace);
      return false;
    }
  }

  Future<void> _applyWifiRule(bool wifiOnly) async {
    // The settings stream repeats the current value when it is first
    // listened to.
    if (wifiOnly == _wifiOnly) return;
    _wifiOnly = wifiOnly;
    try {
      await _backend.setWifiOnly(wifiOnly: wifiOnly);
    } on Object catch (error, stackTrace) {
      _wifiOnly = null; // Try again with the next change.
      logRecoverable('Could not apply the Wi-Fi rule', error, stackTrace);
    }
  }

  /// Now, or a millisecond after the time handed out before if that is not
  /// earlier: downloads start in the order of their request times, which are
  /// stored to the millisecond, and "Download all" requests many at once.
  DateTime _nextRequestTime() {
    final now = DateTime.fromMillisecondsSinceEpoch(
      _now().millisecondsSinceEpoch,
    );
    final last = _lastRequestedAt;
    return _lastRequestedAt = last == null || now.isAfter(last)
        ? now
        : last.add(const Duration(milliseconds: 1));
  }

  void _emitProgress() {
    if (!_progressController.isClosed) {
      _progressController.add(Map.unmodifiable(_progress));
    }
  }

  /// Runs [work] after everything queued before it. A failure is logged and
  /// passed to the caller, and does not stop later work.
  Future<T> _serially<T>(String what, Future<T> Function() work) {
    final result = _tail.then((_) => work());
    _tail = result.then<void>(
      (_) {},
      onError: (Object error, StackTrace stackTrace) {
        logRecoverable('Could not $what', error, stackTrace);
      },
    );
    return result;
  }
}
