// This file is the one place that uses just_audio's experimental
// StreamAudioSource API, so the rest of the app does not depend on it. If the
// API changes, integration_test/audio_playback_test.dart fails on iOS.
// ignore_for_file: experimental_member_use

import 'dart:async';
import 'dart:io';

import 'package:http/http.dart' as http;
import 'package:just_audio/just_audio.dart';
import 'package:languagetransfer/src/core/network/network_exception.dart';

/// Streams a remote lesson file to the player with the correct media type.
///
/// Apple's player cannot open the server's files: they have no extension and
/// are served as `application/octet-stream` (verified: AVFoundation error
/// -11828 "Cannot Open"). just_audio's [StreamAudioSource] serves the bytes
/// through a local proxy with the content type given here; every range the
/// player asks for becomes a range request to the server.
///
/// Only needed on Apple platforms. Android's player recognises the files by
/// their content and streams them directly.
class TypedRemoteAudioSource extends StreamAudioSource {
  TypedRemoteAudioSource({
    required this.url,
    required this.length,
    required this.contentType,
    required this._client,
    this.timeout = const Duration(seconds: 30),
    super.tag,
  });

  final Uri url;

  /// Size of the file in bytes, from the lesson metadata.
  final int length;

  final String contentType;

  /// How long to wait for the server to start answering a range request.
  final Duration timeout;

  final http.Client _client;

  @override
  Future<StreamAudioResponse> request([int? start, int? end]) async {
    final from = start ?? 0;
    final to = end ?? length; // exclusive
    if (from < 0 || to > length || from >= to) {
      throw RangeError('Invalid byte range $from-$to of $length');
    }
    final request = http.Request('GET', url)
      ..headers[HttpHeaders.rangeHeader] = 'bytes=$from-${to - 1}';

    final http.StreamedResponse response;
    try {
      response = await _client.send(request).timeout(timeout);
    } on TimeoutException {
      throw NetworkException(url, 'timed out after ${timeout.inSeconds} s');
    } on http.ClientException catch (error) {
      throw NetworkException(url, error.message);
    }
    if (response.statusCode != HttpStatus.partialContent) {
      await response.stream.drain<void>();
      throw NetworkException(
        url,
        'expected a partial response, got HTTP ${response.statusCode}',
        statusCode: response.statusCode,
      );
    }
    return StreamAudioResponse(
      sourceLength: length,
      contentLength: to - from,
      offset: from,
      stream: response.stream,
      contentType: contentType,
    );
  }
}
