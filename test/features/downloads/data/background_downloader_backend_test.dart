import 'package:background_downloader/background_downloader.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:languagetransfer/src/features/downloads/data/background_downloader_backend.dart';
import 'package:languagetransfer/src/features/downloads/data/download_backend.dart';
import 'package:languagetransfer/src/features/downloads/domain/lesson_download.dart';

void main() {
  final task = DownloadTask(
    taskId: 'object',
    url: 'https://example.org/cas/object',
    group: BackgroundDownloaderBackend.group,
  );

  DownloadStateChanged stateFor(TaskStatus status, [TaskException? error]) =>
      BackgroundDownloaderBackend.toEvent(
            TaskStatusUpdate(task, status, error),
          )!
          as DownloadStateChanged;

  test('maps the downloader states', () {
    expect(stateFor(TaskStatus.enqueued).state, DownloadTaskState.waiting);
    expect(
      stateFor(TaskStatus.waitingToRetry).state,
      DownloadTaskState.waiting,
    );
    expect(stateFor(TaskStatus.paused).state, DownloadTaskState.waiting);
    expect(stateFor(TaskStatus.running).state, DownloadTaskState.running);
    expect(stateFor(TaskStatus.complete).state, DownloadTaskState.complete);
    expect(stateFor(TaskStatus.canceled).state, DownloadTaskState.canceled);
  });

  test('tells why a download failed', () {
    final cases = {
      TaskFileSystemException(
        'Insufficient space to store the file to be downloaded',
      ): DownloadFailure.storage,
      TaskFileSystemException(
        'java.io.IOException: write failed: ENOSPC (No space left on device)',
      ): DownloadFailure.storage,
      // Android labels every I/O error a file-system error.
      TaskFileSystemException(
        'java.net.UnknownHostException: Unable to resolve host',
      ): DownloadFailure.other,
      TaskConnectionException('Connection reset'): DownloadFailure.connection,
      TaskHttpException('Forbidden', 403): DownloadFailure.server,
      TaskException('The network connection was lost.'): DownloadFailure.other,
    };
    for (final MapEntry(key: error, value: failure) in cases.entries) {
      final event = stateFor(TaskStatus.failed, error);
      expect(event.state, DownloadTaskState.failed);
      expect(event.failure, failure, reason: '$error');
    }
    expect(stateFor(TaskStatus.failed).failure, DownloadFailure.other);
    expect(stateFor(TaskStatus.notFound).failure, DownloadFailure.server);
  });

  test('passes progress on, but not the final-state markers', () {
    final running = BackgroundDownloaderBackend.toEvent(
      TaskProgressUpdate(task, 0.25),
    );
    expect(running, isA<DownloadProgressed>());
    expect((running! as DownloadProgressed).fraction, 0.25);
    expect(
      BackgroundDownloaderBackend.toEvent(
        TaskProgressUpdate(task, progressFailed),
      ),
      isNull,
    );
  });
}
