import 'dart:async';
import 'dart:io';

import 'package:http/http.dart' as http;

/// A request to the backend failed: no connection, a timeout, or an
/// unexpected HTTP status.
class NetworkException implements Exception {
  const NetworkException(this.url, this.reason, {this.statusCode});

  final Uri url;
  final String reason;

  /// Set when the server answered with an unexpected status.
  final int? statusCode;

  @override
  String toString() => 'NetworkException: $reason ($url)';
}

/// Runs [request] to [url], giving up after [timeout], and reports every way
/// it can fail to reach the server as a [NetworkException].
Future<T> guardNetwork<T>(
  Uri url,
  Duration timeout,
  Future<T> Function() request,
) async {
  try {
    return await request().timeout(timeout);
  } on TimeoutException {
    throw NetworkException(url, 'timed out after ${timeout.inSeconds} s');
  } on http.ClientException catch (error) {
    throw NetworkException(url, error.message);
  } on IOException catch (error) {
    // Failures that the client does not wrap, such as a TLS handshake.
    throw NetworkException(url, error.toString());
  }
}
