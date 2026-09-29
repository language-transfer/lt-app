import 'package:flutter_test/flutter_test.dart';
import 'package:languagetransfer/src/features/about/presentation/about_screen.dart';

void main() {
  test('the feedback subject keeps its spaces', () {
    expect(
      feedbackMail('Feedback about the app').toString(),
      'mailto:info@languagetransfer.org?subject=Feedback%20about%20the%20app',
    );
  });
}
