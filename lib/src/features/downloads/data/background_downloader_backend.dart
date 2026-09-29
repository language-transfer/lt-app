import 'package:background_downloader/background_downloader.dart';
import 'package:flutter/foundation.dart';
import 'package:languagetransfer/src/features/downloads/data/download_backend.dart';
import 'package:languagetransfer/src/features/downloads/domain/lesson_download.dart';

/// [DownloadBackend] on top of background_downloader: Android WorkManager
/// and iOS background URL sessions, so downloads continue while the app is
/// in the background.
class BackgroundDownloaderBackend implements DownloadBackend {
  BackgroundDownloaderBackend({
    required this._userAgent,
    FileDownloader? downloader,
  }) : _downloader = downloader ?? FileDownloader();

  /// Separates lesson downloads from anything else that might use the
  /// downloader later.
  static const group = 'lessons';

  /// Parallel downloads, as in the Expo app (`downloadManager.ts`,
  /// `concurrency: 3`). Also keeps lessons arriving roughly in order.
  static const _maxConcurrent = 3;

  /// Automatic retries after a failure, with increasing waits in between.
  static const _retries = 3;

  final String _userAgent;
  final FileDownloader _downloader;

  @override
  late final Stream<DownloadEvent> events = _downloader.updates
      .where((update) => update.task.group == group)
      .map(toEvent)
      .where((event) => event != null)
      .cast<DownloadEvent>();

  @override
  Future<void> start() async {
    await _downloader.configure(
      // Native, so queued lessons keep starting while the app is suspended.
      // Tasks still held there are lost if the app is killed;
      // `DownloadManager` enqueues them again at the next start.
      globalConfig: (Config.holdingQueue, (_maxConcurrent, null, null)),
      // Lessons can be downloaded again at any time and add up to hundreds
      // of megabytes, so they stay out of iCloud backups.
      iOSConfig: (Config.excludeFromCloudBackup, true),
    );
    // The downloader's own task database is not needed: `downloads` in the
    // app database records every request.
    await _downloader.start(doTrackTasks: false);
  }

  @override
  Future<void> setWifiOnly({required bool wifiOnly}) async {
    final requirement = wifiOnly
        ? RequireWiFi.forAllTasks
        : RequireWiFi.forNoTasks;
    // The setting persists natively. Setting it again would pause and resume
    // running downloads for nothing.
    if (await _downloader.getRequireWiFiSetting() == requirement) return;
    await _downloader.requireWiFi(requirement);
  }

  @override
  Future<Set<String>> activeTaskIds() async => {
    for (final task in await _downloader.allTasks(group: group)) task.taskId,
  };

  @override
  Future<Set<String>> enqueue(List<DownloadRequest> requests) async {
    final tasks = <DownloadTask>[];
    for (final request in requests) {
      final (baseDirectory, directory, filename) = await Task.split(
        file: request.file,
      );
      tasks.add(
        DownloadTask(
          taskId: request.taskId,
          url: request.url.toString(),
          headers: {'User-Agent': _userAgent},
          baseDirectory: baseDirectory,
          directory: directory,
          filename: filename,
          group: group,
          updates: Updates.statusAndProgress,
          retries: _retries,
          // Lets a change of the Wi-Fi rule pause and resume a running
          // download instead of restarting it.
          allowPause: true,
          creationTime: request.requestedAt,
        ),
      );
    }
    final results = await _downloader.enqueueAll(tasks);
    return {
      for (var i = 0; i < tasks.length; i++)
        if (!results[i]) tasks[i].taskId,
    };
  }

  @override
  Future<void> cancel(Iterable<String> taskIds) async {
    await _downloader.cancelTasksWithIds(taskIds);
  }

  @visibleForTesting
  static DownloadEvent? toEvent(TaskUpdate update) {
    final taskId = update.task.taskId;
    switch (update) {
      case TaskStatusUpdate(status: TaskStatus.notFound):
        return DownloadStateChanged(
          taskId,
          DownloadTaskState.failed,
          failure: DownloadFailure.server,
        );
      case TaskStatusUpdate(status: TaskStatus.failed, :final exception):
        return DownloadStateChanged(
          taskId,
          DownloadTaskState.failed,
          failure: switch (exception) {
            TaskFileSystemException(:final description)
                when _isOutOfSpace(description) =>
              DownloadFailure.storage,
            TaskConnectionException() => DownloadFailure.connection,
            TaskHttpException() => DownloadFailure.server,
            // iOS reports most network errors without a more specific type,
            // and Android labels every I/O error a file-system error, a lost
            // connection included.
            _ => DownloadFailure.other,
          },
        );
      case TaskStatusUpdate(:final status):
        return DownloadStateChanged(taskId, switch (status) {
          TaskStatus.enqueued ||
          TaskStatus.waitingToRetry ||
          TaskStatus.paused => DownloadTaskState.waiting,
          TaskStatus.running => DownloadTaskState.running,
          TaskStatus.complete => DownloadTaskState.complete,
          TaskStatus.failed || TaskStatus.notFound => DownloadTaskState.failed,
          TaskStatus.canceled => DownloadTaskState.canceled,
        });
      case TaskProgressUpdate(:final progress):
        // Negative values mark final states, which arrive as status updates
        // too.
        if (progress < 0 || progress > 1) return null;
        return DownloadProgressed(taskId, progress);
    }
  }

  /// The downloader's own space check, or the system's error for a full
  /// disk.
  static bool _isOutOfSpace(String description) {
    final text = description.toLowerCase();
    return text.contains('insufficient space') ||
        text.contains('enospc') ||
        text.contains('no space left');
  }
}
