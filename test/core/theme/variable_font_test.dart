import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';

/// The theme sets weights with plain [FontWeight] values, which keeps the
/// system's bold-text setting working. That relies on Flutter applying
/// fontWeight to the variable font's `wght` axis; this test guards it.
void main() {
  setUpAll(() async {
    final bytes = File('assets/fonts/YsabeauOffice-Variable.ttf')
        .readAsBytesSync();
    final loader = FontLoader('YsabeauOfficeTest')
      ..addFont(Future.value(ByteData.sublistView(bytes)));
    await loader.load();
  });

  double width(TextStyle style) {
    final painter = TextPainter(
      text: TextSpan(
        text: 'Wwwwwwwwwwwwwwwwwwww mmmmmmmmm',
        style: style.copyWith(fontFamily: 'YsabeauOfficeTest', fontSize: 40),
      ),
      textDirection: TextDirection.ltr,
    )..layout();
    final result = painter.width;
    painter.dispose();
    return result;
  }

  test('fontWeight drives the wght axis of the bundled font', () {
    for (final weight in [FontWeight.w300, FontWeight.w500, FontWeight.w900]) {
      expect(
        width(TextStyle(fontWeight: weight)),
        width(
          TextStyle(
            fontVariations: [FontVariation('wght', weight.value.toDouble())],
          ),
        ),
        reason: 'weight ${weight.value}',
      );
    }
  });

  test('text without a weight is regular, not the bold default instance', () {
    expect(
      width(const TextStyle()),
      width(const TextStyle(fontVariations: [FontVariation('wght', 400)])),
    );
    expect(
      width(const TextStyle()),
      isNot(
        width(const TextStyle(fontVariations: [FontVariation('wght', 700)])),
      ),
    );
  });
}
