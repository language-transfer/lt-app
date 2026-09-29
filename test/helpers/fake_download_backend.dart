import 'dart:async';

import 'package:languagetransfer/src/features/downloads/data/download_backend.dart';

/// Records what the download manager asks of the platform and lets tests
/// play the platform's part.
class FakeDownloadBackend implements DownloadBackend {
  final _events = StreamController<DownloadEvent>();

  /// Emitted during [start], like updates that arrived while the app was not
  /// running.
  final heldBack = <DownloadEvent>[];

  /// Task ids the platform reports as queued or running.
  final active = <String>{};

  final enqueued = <DownloadRequest>[];
  final canceled = <String>[];
  final wifiOnlyCalls = <bool>[];

  bool listenedBeforeStart = false;
  bool failEnqueue = false;

  /// Task ids [enqueue] reports as rejected.
  final rejectIds = <String>{};

  /// If set, [start] waits for it.
  Completer<void>? startGate;

  @override
  Stream<DownloadEvent> get events => _events.stream;

  @override
  Future<void> start() async {
    listenedBeforeStart = _events.hasListener;
    await startGate?.future;
    heldBack.forEach(_events.add);
  }

  @override
  Future<void> setWifiOnly({required bool wifiOnly}) async =>
      wifiOnlyCalls.add(wifiOnly);

  @override
  Future<Set<String>> activeTaskIds() async => {...active};

  @override
  Future<Set<String>> enqueue(List<DownloadRequest> requests) async {
    if (failEnqueue) throw StateError('enqueue failed');
    final accepted = [
      for (final request in requests)
        if (!rejectIds.contains(request.taskId)) request,
    ];
    enqueued.addAll(accepted);
    active.addAll(accepted.map((request) => request.taskId));
    return {
      for (final request in requests)
        if (rejectIds.contains(request.taskId)) request.taskId,
    };
  }

  @override
  Future<void> cancel(Iterable<String> taskIds) async {
    canceled.addAll(taskIds);
    active.removeAll(taskIds);
  }

  void emit(DownloadEvent event) => _events.add(event);

  /// Writes [bytes] where the request for [taskId] asked for them and
  /// reports the download complete.
  Future<void> finish(String taskId, List<int> bytes) async {
    final request = enqueued.lastWhere((request) => request.taskId == taskId);
    await request.file.parent.create(recursive: true);
    await request.file.writeAsBytes(bytes);
    active.remove(taskId);
    emit(DownloadStateChanged(taskId, DownloadTaskState.complete));
  }

  /// Completes at once if nobody listens: the done future of a
  /// single-subscription stream that was never listened to never completes.
  Future<void> close() async {
    if (_events.hasListener) {
      await _events.close();
    } else {
      unawaited(_events.close());
    }
  }
}
