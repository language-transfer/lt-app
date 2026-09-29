import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// The device's network connections, as the system reports them.
final connectivityProvider = StreamProvider<List<ConnectivityResult>>((
  ref,
) async* {
  final connectivity = Connectivity();
  yield await connectivity.checkConnectivity();
  yield* connectivity.onConnectivityChanged;
});

/// Whether the device has any network connection; `null` while unknown.
///
/// Only the radio state: a connection can still fail to reach the internet.
final onlineProvider = Provider<bool?>(
  (ref) => ref
      .watch(connectivityProvider)
      .value
      ?.any((result) => result != ConnectivityResult.none),
);

/// Whether the device is on Wi-Fi or Ethernet, the networks "download only
/// on Wi-Fi" allows (the same test the downloader uses); `null` while
/// unknown.
final onWifiProvider = Provider<bool?>(
  (ref) => ref
      .watch(connectivityProvider)
      .value
      ?.any(
        (result) =>
            result == ConnectivityResult.wifi ||
            result == ConnectivityResult.ethernet,
      ),
);
