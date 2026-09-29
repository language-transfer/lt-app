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
