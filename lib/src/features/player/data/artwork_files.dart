import 'dart:io';

import 'package:flutter/services.dart';
import 'package:languagetransfer/src/core/logging.dart';
import 'package:path/path.dart' as p;

/// Course covers as files, for the lock screen and the media notification,
/// which can show images from files but not from the app's assets.
class ArtworkFiles {
  ArtworkFiles(this._directory, {AssetBundle? bundle})
    : _bundle = bundle ?? rootBundle;

  final Directory _directory;
  final AssetBundle _bundle;

  /// Covers written during this run of the app. Each is written again once
  /// per run, so an app update with a new cover never shows the old one.
  final _written = <String, Future<File>>{};

  /// A file URI for [asset], or `null` if it cannot be written; playback
  /// then goes on without artwork.
  Future<Uri?> uriFor(String asset) async {
    try {
      final file = await _written.putIfAbsent(asset, () => _write(asset));
      return file.uri;
    } on Object catch (error, stackTrace) {
      // The failed attempt is forgotten, so the next lesson tries again.
      _written.remove(asset)?.ignore();
      logRecoverable('Could not prepare the artwork $asset', error, stackTrace);
      return null;
    }
  }

  Future<File> _write(String asset) async {
    final data = await _bundle.load(asset);
    final file = File(p.join(_directory.path, p.basename(asset)));
    await file.parent.create(recursive: true);
    // Written next to the target and renamed, so the system never reads a
    // half-written image.
    final partial = File('${file.path}.part');
    await partial.writeAsBytes(
      data.buffer.asUint8List(data.offsetInBytes, data.lengthInBytes),
      flush: true,
    );
    return await partial.rename(file.path);
  }
}
