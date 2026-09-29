// Driver for integration_test/screenshot_tour_test.dart; writes the
// screenshots to build/screenshots/<platform>/.
//
//   fvm flutter drive --driver=test_driver/screenshots.dart \
//     --target=integration_test/screenshot_tour_test.dart -d <device>

import 'dart:io';

import 'package:integration_test/integration_test_driver_extended.dart';

Future<void> main() => integrationDriver(
  onScreenshot: (name, image, [args]) async {
    final file = File('build/screenshots/$name.png')
      ..createSync(recursive: true)
      ..writeAsBytesSync(image);
    stdout.writeln('screenshot: ${file.path}');
    return true;
  },
);
