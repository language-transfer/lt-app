import 'dart:async';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:languagetransfer/src/core/network/network_exception.dart';
import 'package:languagetransfer/src/features/player/data/typed_remote_audio_source.dart';

void main() {
  final url = Uri.parse('https://example.org/cas/abc');

  TypedRemoteAudioSource sourceWith(
    MockClientHandler handler, {
    Duration timeout = const Duration(seconds: 30),
  }) => TypedRemoteAudioSource(
    url: url,
    length: 10,
    contentType: 'audio/mp4',
    client: MockClient(handler),
    timeout: timeout,
  );

  test('streams the range the player asks for, typed', () async {
    late http.BaseRequest seen;
    final source = sourceWith((request) async {
      seen = request;
      return http.Response.bytes([3, 4, 5], 206);
    });

    final response = await source.request(3, 6);

    expect(seen.url, url);
    expect(seen.headers['range'], 'bytes=3-5');
    expect(response.contentType, 'audio/mp4');
    expect(response.sourceLength, 10);
    expect(response.contentLength, 3);
    expect(response.offset, 3);
    expect(await response.stream.expand((chunk) => chunk).toList(), [3, 4, 5]);
  });

  test('asks for the whole file when the player names no range', () async {
    late http.BaseRequest seen;
    final source = sourceWith((request) async {
      seen = request;
      return http.Response.bytes(List.filled(10, 0), 206);
    });

    final response = await source.request();

    expect(seen.headers['range'], 'bytes=0-9');
    expect(response.contentLength, 10);
  });

  test('refuses ranges outside the file', () {
    final source = sourceWith((_) async => http.Response('', 206));

    expect(() => source.request(5, 11), throwsRangeError);
    expect(() => source.request(6, 6), throwsRangeError);
    expect(() => source.request(-1, 4), throwsRangeError);
  });

  test('reports a response that is not partial', () {
    final source = sourceWith((_) async => http.Response('whole file', 200));

    expect(
      source.request(0, 4),
      throwsA(
        isA<NetworkException>().having((e) => e.statusCode, 'status', 200),
      ),
    );
  });

  test('reports a server that does not answer in time', () {
    final source = sourceWith(
      (_) => Completer<http.Response>().future,
      timeout: const Duration(milliseconds: 10),
    );

    expect(source.request(0, 4), throwsA(isA<NetworkException>()));
  });

  test('reports a connection that fails', () {
    final source = sourceWith(
      (_) async => throw http.ClientException('Connection refused', url),
    );

    expect(
      source.request(0, 4),
      throwsA(
        isA<NetworkException>().having((e) => e.statusCode, 'status', null),
      ),
    );
  });
}
