import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';

import 'package:http/http.dart' as http;
import 'package:languagetransfer/src/core/network/network_exception.dart';
import 'package:languagetransfer/src/core/storage/file_pointer.dart';
import 'package:languagetransfer/src/core/storage/integrity.dart';
import 'package:languagetransfer/src/features/catalog/domain/course_index.dart';

/// Read-only access to Language Transfer's public course backend.
class CatalogApi {
  CatalogApi(
    this._client, {
    required this.userAgent,
    this.timeout = const Duration(seconds: 30),
  });

  /// Redirects to the current index on the media host
  /// (upstream `src/data/courseIndex.ts`, `COURSE_INDEX_URL`).
  static final Uri indexUrl = Uri.parse(
    'https://downloads.languagetransfer.org/all-courses.json',
  );

  final http.Client _client;
  final String userAgent;
  final Duration timeout;

  /// Returns the index as JSON text, so the caller can cache exactly what the
  /// server sent. Throws [NetworkException] if it cannot be fetched and
  /// [FormatException] if it is not UTF-8.
  Future<String> fetchIndexJson() async {
    final bytes = await _get(indexUrl);
    try {
      return utf8.decode(bytes);
    } on FormatException catch (error) {
      throw FormatException('Course index is not UTF-8: ${error.message}');
    }
  }

  /// Downloads a small object (such as course metadata) into memory and
  /// verifies it. Throws [NetworkException] or [CorruptObjectException].
  Future<Uint8List> fetchObject(CourseIndex index, FilePointer pointer) async {
    final bytes = await _get(index.urlFor(pointer));
    verifyBytes(pointer, bytes);
    return bytes;
  }

  Future<Uint8List> _get(Uri url) async {
    final response = await guardNetwork(
      url,
      timeout,
      () => _client.get(url, headers: {HttpHeaders.userAgentHeader: userAgent}),
    );
    if (response.statusCode != HttpStatus.ok) {
      throw NetworkException(
        url,
        'HTTP ${response.statusCode}',
        statusCode: response.statusCode,
      );
    }
    return response.bodyBytes;
  }
}
