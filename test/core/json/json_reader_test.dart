import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:languagetransfer/src/core/json/json_reader.dart';

void main() {
  JsonObject read(String source) => JsonObject(jsonDecode(source), '');

  test('reads typed values', () {
    final json = read('{"s": "x", "i": 3, "n": 2.5, "o": {"k": 1}}');
    expect(json.string('s'), 'x');
    expect(json.integer('i'), 3);
    expect(json.number('n'), 2.5);
    expect(json.number('i'), 3.0);
    expect(json.object('o').integer('k'), 1);
  });

  test('names the full path of a problem', () {
    final json = read(
      '{"courses": [{"meta": {}}, {"meta": {"filesize": "7"}}]}',
    );
    final second = json.objects('courses')[1].object('meta');
    expect(
      () => second.integer('filesize'),
      throwsA(
        isA<FormatException>().having(
          (e) => e.message,
          'message',
          'Expected an integer at courses[1].meta.filesize',
        ),
      ),
    );
    expect(
      () => json.objects('courses')[0].object('meta').string('object'),
      throwsA(
        isA<FormatException>().having(
          (e) => e.message,
          'message',
          'Missing courses[0].meta.object',
        ),
      ),
    );
  });

  test('rejects non-integral numbers as integers', () {
    expect(() => read('{"i": 3.5}').integer('i'), throwsFormatException);
  });

  test('rejects a value of the wrong kind', () {
    expect(() => read('{"o": []}').object('o'), throwsFormatException);
    expect(() => read('{"l": {}}').objects('l'), throwsFormatException);
    expect(() => JsonObject(<Object?>[], ''), throwsFormatException);
  });

  test('optionalObject treats absent and null alike', () {
    final json = read('{"n": null}');
    expect(json.optionalObject('n'), isNull);
    expect(json.optionalObject('missing'), isNull);
  });

  test('expectInteger enforces a format version', () {
    expect(() => read('{"v": 2}').expectInteger('v', 2), returnsNormally);
    expect(
      () => read('{"v": 3}').expectInteger('v', 2),
      throwsA(
        isA<FormatException>().having(
          (e) => e.message,
          'message',
          'Unsupported v: expected 2, found 3',
        ),
      ),
    );
  });

  test('decodeJson names what failed to decode', () {
    expect(
      () => decodeJson('{', 'course index'),
      throwsA(
        isA<FormatException>().having(
          (e) => e.message,
          'message',
          startsWith('Invalid JSON in course index'),
        ),
      ),
    );
  });
}
