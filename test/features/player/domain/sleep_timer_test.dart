import 'package:fake_async/fake_async.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:languagetransfer/src/features/player/domain/sleep_timer.dart';

void main() {
  late List<SleepTimer?> changes;
  late List<double> volumes;
  late int runOuts;
  late SleepCountdown countdown;

  setUp(() {
    changes = [];
    volumes = [];
    runOuts = 0;
    countdown = SleepCountdown(
      onChanged: changes.add,
      onVolume: volumes.add,
      onRunOut: () => runOuts++,
    );
  });

  tearDown(() => countdown.dispose());

  test('counts down only while playing', () {
    fakeAsync((async) {
      countdown
        ..set(const SleepAfter(Duration(seconds: 10)))
        ..playing = true;
      async.elapse(const Duration(seconds: 4));
      expect(countdown.timer, const SleepAfter(Duration(seconds: 6)));

      countdown.playing = false;
      async.elapse(const Duration(minutes: 5));
      expect(countdown.timer, const SleepAfter(Duration(seconds: 6)));
      expect(runOuts, 0);

      countdown.playing = true;
      async.elapse(const Duration(seconds: 6));
      expect(runOuts, 1);
      expect(countdown.timer, isNull);
      expect(changes.last, isNull);
    });
  });

  test('lowers the volume over the last seconds', () {
    fakeAsync((async) {
      countdown
        ..set(const SleepAfter(Duration(seconds: 8)))
        ..playing = true;
      async.elapse(const Duration(seconds: 3));
      expect(volumes, isEmpty);

      async.elapse(const Duration(milliseconds: 2750));
      // 2.25 s of 5 s left.
      expect(volumes.last, closeTo(0.45, 0.001));
      // Only ever down.
      final descending = List<double>.of(volumes)
        ..sort((a, b) => b.compareTo(a));
      expect(volumes, orderedEquals(descending));

      async.elapse(const Duration(seconds: 3));
      expect(runOuts, 1);
    });
  });

  test('turned off while fading, the volume comes back', () {
    fakeAsync((async) {
      countdown
        ..set(const SleepAfter(Duration(seconds: 3)))
        ..playing = true;
      async.elapse(const Duration(seconds: 1));
      expect(volumes.last, lessThan(1));

      countdown.set(null);
      expect(volumes.last, 1);
      async.elapse(const Duration(minutes: 1));
      expect(runOuts, 0);
    });
  });

  test('reports the time left when the minutes shown change', () {
    fakeAsync((async) {
      countdown
        ..set(const SleepAfter(Duration(minutes: 2, seconds: 30)))
        ..playing = true;
      async.elapse(const Duration(seconds: 29));
      expect(changes, hasLength(1), reason: 'still 3 minutes shown');

      async.elapse(const Duration(seconds: 2));
      expect(
        [for (final change in changes) (change! as SleepAfter).minutesLeft],
        [3, 2],
      );
    });
  });

  test('shows whole minutes left, rounded up', () {
    for (final (left, minutes) in [
      (const Duration(minutes: 15), 15),
      (const Duration(minutes: 14, seconds: 1), 15),
      (const Duration(milliseconds: 1), 1),
      (Duration.zero, 0),
    ]) {
      expect(SleepAfter(left).minutesLeft, minutes, reason: '$left');
    }
  });

  test('stops once at the end of the lesson', () {
    countdown.set(const SleepAtLessonEnd());

    expect(countdown.lessonEnded(), isTrue);
    expect(countdown.timer, isNull);
    expect(changes.last, isNull);
    expect(countdown.lessonEnded(), isFalse);
  });

  test('a countdown does not stop at the end of a lesson', () {
    countdown.set(const SleepAfter(Duration(minutes: 10)));

    expect(countdown.lessonEnded(), isFalse);
    expect(countdown.timer, const SleepAfter(Duration(minutes: 10)));
  });
}
