import 'package:flutter/foundation.dart';
import 'package:languagetransfer/src/features/catalog/domain/lesson.dart';

/// The listener's preferences. Defaults match the Expo app
/// (upstream `src/storage/persistence.ts`).
@immutable
class AppSettings {
  const AppSettings({
    this.streamQuality = AudioQuality.low,
    this.downloadQuality = AudioQuality.high,
    this.downloadOnlyOnWifi = true,
    this.autoDeleteFinished = false,
    this.autoplay = true,
    this.playbackSpeed = 1,
  });

  /// Quality when streaming. Low by default to save mobile data.
  final AudioQuality streamQuality;

  final AudioQuality downloadQuality;
  final bool downloadOnlyOnWifi;

  /// Delete a lesson's download once it is finished.
  final bool autoDeleteFinished;

  /// Continue with the next lesson when one ends.
  final bool autoplay;

  /// Playback rate, one of [speeds].
  final double playbackSpeed;

  /// Speeds offered in the player. Slower than normal helps while learning,
  /// faster helps when reviewing.
  static const speeds = <double>[0.75, 1, 1.25, 1.5, 1.75, 2];

  AppSettings copyWith({
    AudioQuality? streamQuality,
    AudioQuality? downloadQuality,
    bool? downloadOnlyOnWifi,
    bool? autoDeleteFinished,
    bool? autoplay,
    double? playbackSpeed,
  }) => AppSettings(
    streamQuality: streamQuality ?? this.streamQuality,
    downloadQuality: downloadQuality ?? this.downloadQuality,
    downloadOnlyOnWifi: downloadOnlyOnWifi ?? this.downloadOnlyOnWifi,
    autoDeleteFinished: autoDeleteFinished ?? this.autoDeleteFinished,
    autoplay: autoplay ?? this.autoplay,
    playbackSpeed: playbackSpeed ?? this.playbackSpeed,
  );

  @override
  bool operator ==(Object other) =>
      other is AppSettings &&
      other.streamQuality == streamQuality &&
      other.downloadQuality == downloadQuality &&
      other.downloadOnlyOnWifi == downloadOnlyOnWifi &&
      other.autoDeleteFinished == autoDeleteFinished &&
      other.autoplay == autoplay &&
      other.playbackSpeed == playbackSpeed;

  @override
  int get hashCode => Object.hash(
    streamQuality,
    downloadQuality,
    downloadOnlyOnWifi,
    autoDeleteFinished,
    autoplay,
    playbackSpeed,
  );
}
