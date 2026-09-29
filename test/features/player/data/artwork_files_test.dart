import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:languagetransfer/src/features/player/data/artwork_files.dart';

/// Serves [assets] and counts the loads.
class _Bundle extends CachingAssetBundle {
  _Bundle(this.assets);

  final Map<String, List<int>> assets;
  int loads = 0;

  @override
  Future<ByteData> load(String key) async {
    loads++;
    final bytes = assets[key];
    // Like rootBundle for a missing asset.
    if (bytes == null) throw FlutterError('Unable to load asset: $key');
    return ByteData.sublistView(Uint8List.fromList(bytes));
  }
}

void main() {
  late Directory root;

  setUp(() => root = Directory.systemTemp.createTempSync('artwork_test'));
  tearDown(() => root.deleteSync(recursive: true));

  test('writes the cover to a file and returns its URI', () async {
    final bundle = _Bundle({
      'assets/courses/images/greek.png': [1, 2, 3],
    });
    final artwork = ArtworkFiles(root, bundle: bundle);

    final uri = await artwork.uriFor('assets/courses/images/greek.png');

    expect(uri!.scheme, 'file');
    expect(File.fromUri(uri).readAsBytesSync(), [1, 2, 3]);
    expect(File('${File.fromUri(uri).path}.part').existsSync(), isFalse);
  });

  test('writes each cover once per run', () async {
    final bundle = _Bundle({
      'assets/courses/images/greek.png': [1],
    });
    final artwork = ArtworkFiles(root, bundle: bundle);

    await artwork.uriFor('assets/courses/images/greek.png');
    await artwork.uriFor('assets/courses/images/greek.png');

    expect(bundle.loads, 1);
  });

  test('replaces a cover left by an earlier version of the app', () async {
    File('${root.path}/greek.png').writeAsBytesSync([9, 9]);
    final artwork = ArtworkFiles(
      root,
      bundle: _Bundle({
        'assets/courses/images/greek.png': [1, 2],
      }),
    );

    final uri = await artwork.uriFor('assets/courses/images/greek.png');

    expect(File.fromUri(uri!).readAsBytesSync(), [1, 2]);
  });

  test('goes without artwork if the cover cannot be loaded', () async {
    final bundle = _Bundle({});
    final artwork = ArtworkFiles(root, bundle: bundle);

    expect(await artwork.uriFor('assets/courses/images/missing.png'), isNull);
    // Not remembered as written: the next lesson tries again.
    expect(await artwork.uriFor('assets/courses/images/missing.png'), isNull);
    expect(bundle.loads, 2);
  });
}
