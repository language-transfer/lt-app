import 'dart:io';

import 'package:languagetransfer/src/features/player/data/artwork_files.dart';

/// Artwork without files: widget tests cannot wait for real file writes.
class FakeArtworkFiles extends ArtworkFiles {
  FakeArtworkFiles() : super(Directory.systemTemp);

  @override
  Future<Uri?> uriFor(String asset) async => Uri.file('/artwork/$asset');
}
