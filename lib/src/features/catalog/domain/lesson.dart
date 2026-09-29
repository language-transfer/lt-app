import 'package:flutter/foundation.dart';
import 'package:languagetransfer/src/core/json/json_reader.dart';
import 'package:languagetransfer/src/core/storage/file_pointer.dart';

/// Audio quality the listener can choose for streaming and for downloads.
enum AudioQuality { low, high }

/// The audio files a lesson is published in.
enum AudioVariant {
  /// AAC in an MP4 container, mono, about 65 kbit/s.
  low('lq', 'm4a', 'audio/mp4'),

  /// MP3 in an MP4 container, stereo, 128 kbit/s. Apple's player rejects
  /// this combination (verified: it loads but never plays).
  high('hq', 'mp4', 'audio/mp4'),

  /// The high-quality MP3 remuxed into a QuickTime container for Apple
  /// devices, which play it (verified). Optional, so courses without it keep
  /// working.
  highApple('hq-mov', 'mov', 'video/quicktime');

  AudioVariant(this.key, this.fileExtension, this.contentType);

  /// Key in the metadata's `variants` object.
  final String key;

  /// Extension for the local copy. Objects on the server have none, and
  /// Apple's player identifies local files by their extension (verified:
  /// the same bytes play as `.m4a` and fail without an extension).
  final String fileExtension;

  /// The real media type. The metadata labels `lq` and `hq` `video/mp4` and
  /// the server sends `application/octet-stream`, which Apple's player
  /// cannot use.
  final String contentType;
}

/// One audio file of a lesson.
@immutable
class AudioFile {
  const AudioFile(this.variant, this.pointer);

  final AudioVariant variant;
  final FilePointer pointer;

  @override
  bool operator ==(Object other) =>
      other is AudioFile &&
      other.variant == variant &&
      other.pointer == pointer;

  @override
  int get hashCode => Object.hash(variant, pointer);
}

@immutable
class LessonVariants {
  const LessonVariants({required this.low, required this.high, this.highApple});

  /// `hq` and `lq` are required; `hq-mov` is optional. Unknown variants are
  /// ignored so that new server-side variants do not break older app
  /// versions.
  factory LessonVariants.fromJson(JsonObject json) {
    final highApple = json.optionalObject(AudioVariant.highApple.key);
    return LessonVariants(
      low: FilePointer.fromJson(json.object(AudioVariant.low.key)),
      high: FilePointer.fromJson(json.object(AudioVariant.high.key)),
      highApple: highApple == null ? null : FilePointer.fromJson(highApple),
    );
  }

  final FilePointer low;
  final FilePointer high;
  final FilePointer? highApple;

  /// The file to play for [quality].
  ///
  /// With [applePlayer] (iOS and macOS), high quality uses the QuickTime
  /// variant, and falls back to low quality for a lesson without it,
  /// because the regular high-quality file cannot be played there.
  AudioFile select(AudioQuality quality, {required bool applePlayer}) {
    switch (quality) {
      case AudioQuality.low:
        return AudioFile(AudioVariant.low, low);
      case AudioQuality.high when !applePlayer:
        return AudioFile(AudioVariant.high, high);
      case AudioQuality.high:
        final apple = highApple;
        return apple == null
            ? AudioFile(AudioVariant.low, low)
            : AudioFile(AudioVariant.highApple, apple);
    }
  }
}

@immutable
class Lesson {
  const Lesson({
    required this.id,
    required this.title,
    required this.duration,
    required this.variants,
  });

  /// Parses one entry of a course's `lessons` list
  /// (upstream `src/data/courseSchemas.ts`, `lessonSchema`).
  factory Lesson.fromJson(JsonObject json) {
    final seconds = json.number('duration');
    if (seconds.isNaN || seconds < 0) {
      throw FormatException('Invalid duration at ${json.path}.duration');
    }
    return Lesson(
      id: json.string('id'),
      title: json.string('title'),
      duration: Duration(microseconds: (seconds * 1e6).round()),
      variants: LessonVariants.fromJson(json.object('variants')),
    );
  }

  /// Stable identifier such as `spanish1`.
  final String id;

  /// Display title such as "Lesson 1".
  final String title;

  final Duration duration;
  final LessonVariants variants;
}
