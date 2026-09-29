import 'dart:io';

import 'package:audio_service/audio_service.dart';
import 'package:http/http.dart' as http;
import 'package:just_audio/just_audio.dart';
import 'package:languagetransfer/src/features/catalog/domain/course_index.dart';
import 'package:languagetransfer/src/features/catalog/domain/lesson.dart';
import 'package:languagetransfer/src/features/player/data/typed_remote_audio_source.dart';

/// Finds downloaded lessons. Implemented by the downloads feature
/// (`DownloadManager`).
abstract interface class DownloadedLessons {
  /// The downloaded files of [courseId] by lesson id, for a new queue.
  ///
  /// The files stay on the device while this queue uses them, even if their
  /// downloads are deleted meanwhile (for example when a finished lesson is
  /// deleted automatically), because the player may still read them. The
  /// next call releases them.
  Future<Map<String, File>> filesForQueue(String courseId);
}

/// Chooses how to play each lesson: its download if there is one, otherwise
/// a stream in the chosen quality, typed for Apple's player
/// ([TypedRemoteAudioSource]).
class LessonSources {
  LessonSources({
    required this.applePlayer,
    required this._client,
    required this._downloads,
  });

  /// True on iOS and macOS, whose player needs the typed stream and cannot
  /// play the MP3-in-MP4 high-quality files.
  final bool applePlayer;

  final http.Client _client;
  final DownloadedLessons _downloads;

  /// One source per lesson of [lessons], tagged with the matching item of
  /// [tags].
  Future<List<AudioSource>> forQueue({
    required String courseId,
    required CourseIndex index,
    required List<Lesson> lessons,
    required AudioQuality streamQuality,
    required List<MediaItem> tags,
  }) async {
    final files = await _downloads.filesForQueue(courseId);
    return [
      for (var i = 0; i < lessons.length; i++)
        _sourceFor(
          index,
          lessons[i],
          files[lessons[i].id],
          streamQuality,
          tags[i],
        ),
    ];
  }

  AudioSource _sourceFor(
    CourseIndex index,
    Lesson lesson,
    File? download,
    AudioQuality streamQuality,
    MediaItem tag,
  ) {
    if (download != null) return AudioSource.file(download.path, tag: tag);

    final audio = lesson.variants.select(
      streamQuality,
      applePlayer: applePlayer,
    );
    final url = index.urlFor(audio.pointer);
    if (!applePlayer) return AudioSource.uri(url, tag: tag);
    return TypedRemoteAudioSource(
      url: url,
      length: audio.pointer.size,
      contentType: audio.variant.contentType,
      client: _client,
      tag: tag,
    );
  }
}
