import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:languagetransfer/src/features/downloads/domain/lesson_download.dart';

/// The platform's background downloads, as far as `DownloadManager` needs
/// them. Implemented with background_downloader in
/// `background_downloader_backend.dart`; tests use a fake.
abstract interface class DownloadBackend {
  /// Status and progress of this app's downloads, including updates that
  /// arrived while the app was not running. Listen before calling [start].
  Stream<DownloadEvent> get events;

  /// Configures the downloader and delivers updates held back while the app
  /// was not running.
  Future<void> start();

  /// Whether downloads, including queued and running ones, wait for Wi-Fi.
  Future<void> setWifiOnly({required bool wifiOnly});

  /// Ids of downloads that are queued, running or waiting to retry.
  Future<Set<String>> activeTaskIds();

  /// Returns the ids of the requests the platform rejected.
  Future<Set<String>> enqueue(List<DownloadRequest> requests);

  Future<void> cancel(Iterable<String> taskIds);
}

@immutable
class DownloadRequest {
  const DownloadRequest({
    required this.taskId,
    required this.url,
    required this.file,
    required this.requestedAt,
  });

  final String taskId;
  final Uri url;

  /// Where the finished file goes.
  final File file;

  /// Downloads start in this order.
  final DateTime requestedAt;
}

sealed class DownloadEvent {
  const DownloadEvent(this.taskId);

  final String taskId;
}

enum DownloadTaskState {
  /// Queued, paused, or waiting to retry after a failure.
  waiting,
  running,

  /// The file was written to [DownloadRequest.file].
  complete,

  /// Failed for good, after any retries.
  failed,

  /// Cancelled by the app or the system.
  canceled,
}

class DownloadStateChanged extends DownloadEvent {
  const DownloadStateChanged(super.taskId, this.state, {this.failure});

  final DownloadTaskState state;

  /// Why, for [DownloadTaskState.failed]; `null` if unknown.
  final DownloadFailure? failure;

  @override
  String toString() =>
      'DownloadStateChanged($taskId, ${state.name}'
      '${failure == null ? '' : ', ${failure!.name}'})';
}

class DownloadProgressed extends DownloadEvent {
  const DownloadProgressed(super.taskId, this.fraction);

  /// Between 0 and 1.
  final double fraction;

  @override
  String toString() => 'DownloadProgressed($taskId, $fraction)';
}
