import 'dart:io';

/// Ends the name of a file that is still being written (see
/// [writeAtomically]).
const partialFileSuffix = '.part';

/// Writes [bytes] to [file] through a partial file next to it, renamed once
/// complete, so nobody reads a half-written file under the final name, even
/// after a crash. A failed write deletes the partial file and rethrows.
Future<File> writeAtomically(File file, List<int> bytes) async {
  final partial = File('${file.path}$partialFileSuffix');
  try {
    await partial.writeAsBytes(bytes, flush: true);
    return await partial.rename(file.path);
  } on FileSystemException {
    try {
      await partial.delete();
    } on PathNotFoundException {
      // Never created.
    }
    rethrow;
  }
}
