import 'dart:async';

import 'package:flutter/foundation.dart';

/// What the sleep timer is set to.
@immutable
sealed class SleepTimer {
  const SleepTimer();
}

/// Stops playback after [left] more listening. Time spent paused does not
/// count: pausing to think is how a lesson is listened to.
final class SleepAfter extends SleepTimer {
  const SleepAfter(this.left);

  /// The times offered, in minutes.
  static const choices = [5, 10, 15, 30, 45, 60];

  final Duration left;

  /// Whole minutes left, rounded up, as shown.
  int get minutesLeft =>
      (left.inMilliseconds / Duration.millisecondsPerMinute).ceil();

  @override
  bool operator ==(Object other) => other is SleepAfter && other.left == left;

  @override
  int get hashCode => left.hashCode;
}

/// Stops playback when the lesson ends, instead of going on to the next.
final class SleepAtLessonEnd extends SleepTimer {
  const SleepAtLessonEnd();

  @override
  bool operator ==(Object other) => other is SleepAtLessonEnd;

  @override
  int get hashCode => runtimeType.hashCode;
}

/// Runs a [SleepTimer]: counts a [SleepAfter] down while playing, lowers the
/// volume over its last [fade], and says when it has run out.
class SleepCountdown {
  SleepCountdown({
    required this.onChanged,
    required this.onVolume,
    required this.onRunOut,
  });

  /// With the timer whenever it is set, cleared, or the minutes it shows
  /// ([SleepAfter.minutesLeft]) change.
  final void Function(SleepTimer? timer) onChanged;

  /// With the volume to play at, from 0 to 1.
  final void Function(double volume) onVolume;

  /// When a [SleepAfter] has run out: playback should stop.
  final void Function() onRunOut;

  /// How long the volume takes to go down before playback stops.
  static const fade = Duration(seconds: 5);

  /// Often enough for the fade to sound smooth.
  static const _tick = Duration(milliseconds: 250);

  SleepTimer? _timer;
  Timer? _ticker;
  int _ticksCounted = 0;
  bool _playing = false;

  SleepTimer? get timer => _timer;

  /// Sets the timer, or clears it with `null`.
  void set(SleepTimer? timer) {
    final fading = switch (_timer) {
      SleepAfter(:final left) => left < fade,
      _ => false,
    };
    _timer = timer;
    if (fading) onVolume(1);
    _restart();
    onChanged(timer);
  }

  /// Whether playback is playing; only then does a [SleepAfter] count down.
  bool get playing => _playing;
  set playing(bool playing) {
    if (_playing == playing) return;
    _playing = playing;
    _restart();
  }

  /// A lesson has ended. True if the timer was waiting for that, in which
  /// case playback should stop there; the timer is then done.
  bool lessonEnded() {
    if (_timer is! SleepAtLessonEnd) return false;
    set(null);
    return true;
  }

  void dispose() => _ticker?.cancel();

  void _restart() {
    _ticker?.cancel();
    _ticker = null;
    if (_playing && _timer is SleepAfter) {
      _ticksCounted = 0;
      _ticker = Timer.periodic(_tick, _onTick);
    }
  }

  void _onTick(Timer ticker) {
    final timer = _timer;
    if (timer is! SleepAfter) return;
    // Ticks can come late; `tick` counts the ones that were due.
    final left = timer.left - _tick * (ticker.tick - _ticksCounted);
    _ticksCounted = ticker.tick;
    if (left <= Duration.zero) {
      _ticker?.cancel();
      _ticker = null;
      _timer = null;
      onRunOut();
      onChanged(null);
      return;
    }
    if (left < fade) onVolume(left.inMicroseconds / fade.inMicroseconds);
    final counted = _timer = SleepAfter(left);
    if (counted.minutesLeft != timer.minutesLeft) onChanged(counted);
  }
}
