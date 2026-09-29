import 'dart:io';

import 'package:audio_service/audio_service.dart';
import 'package:http/http.dart' as http;
import 'package:just_audio/just_audio.dart';
import 'package:languagetransfer/src/features/catalog/domain/course_index.dart';
import 'package:languagetransfer/src/features/catalog/domain/lesson.dart';
import 'package:languagetransfer/src/features/player/data/typed_remote_audio_source.dart';

/// Finds downloaded lessons, and deletes their files only once the player
/// no longer refers to them. Implemented by the downloads feature
/// (`DownloadManager`).
abstract interface class DownloadedLessons {
  /// The downloaded files of [courseId] by lesson id, for a new queue, which
  /// refers to them from now on (see [useFiles]).
  Future<Map<String, File>> filesForQueue(String courseId);

  /// Paths of files the queue refers to whose downloads were deleted. The
  /// player then streams those lessons instead and lets go of the files
  /// with [useFiles].
  Stream<Set<String>> get released;

  /// The paths of the files the player's queue refers to now. A deleted
  /// download's file stays on the device while the queue refers to it,
  /// because the player may still read it; the rest are deleted.
  Future<void> useFiles(Set<String> paths);
}

/// A queue's audio, one source per lesson, and the downloaded files among
/// them by queue index.
typedef QueueSources = ({List<AudioSource> sources, Map<int, String> files});

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

  /// See [DownloadedLessons.released].
  Stream<Set<String>> get released => _downloads.released;

  /// See [DownloadedLessons.useFiles].
  Future<void> useFiles(Set<String> paths) => _downloads.useFiles(paths);

  /// One source per lesson of [lessons], tagged with the matching item of
  /// [tags].
  Future<QueueSources> forQueue({
    required String courseId,
    required CourseIndex index,
    required List<Lesson> lessons,
    required AudioQuality streamQuality,
    required List<MediaItem> tags,
  }) async {
    final downloaded = await _downloads.filesForQueue(courseId);
    final sources = <AudioSource>[];
    final files = <int, String>{};
    for (final (i, lesson) in lessons.indexed) {
      if (downloaded[lesson.id] case final file?) {
        sources.add(AudioSource.file(file.path, tag: tags[i]));
        files[i] = file.path;
      } else {
        sources.add(streamFor(index, lesson, streamQuality, tags[i]));
      }
    }
    return (sources: sources, files: files);
  }

  /// [lesson] streamed in [quality], tagged with [tag].
  AudioSource streamFor(
    CourseIndex index,
    Lesson lesson,
    AudioQuality quality,
    MediaItem tag,
  ) {
    final audio = lesson.variants.select(quality, applePlayer: applePlayer);
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
