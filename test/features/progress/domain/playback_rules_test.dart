import 'package:flutter_test/flutter_test.dart';
import 'package:languagetransfer/src/core/storage/file_pointer.dart';
import 'package:languagetransfer/src/features/catalog/domain/lesson.dart';
import 'package:languagetransfer/src/features/progress/domain/lesson_progress.dart';
import 'package:languagetransfer/src/features/progress/domain/playback_rules.dart';

import '../../../helpers/fixtures.dart';

Lesson _lesson(String id) {
  final pointer = FilePointer(object: fakeObjectId(1), size: 1);
  return Lesson(
    id: id,
    title: id,
    duration: const Duration(minutes: 6),
    variants: LessonVariants(low: pointer, high: pointer),
  );
}

LessonProgress _progress(
  String id, {
  required int minute,
  bool finished = false,
}) => LessonProgress(
  lessonId: id,
  finished: finished,
  listenedAt: DateTime(2026, 9, 28, 12, minute),
  position: finished ? null : const Duration(seconds: 30),
);

/// Marked finished without being played.
LessonProgress _marked(String id) =>
    LessonProgress(lessonId: id, finished: true);

void main() {
  group('resumePosition', () {
    const duration = Duration(minutes: 6);

    test('starts at zero without a saved position', () {
      expect(PlaybackRules.resumePosition(null, duration), Duration.zero);
      expect(
        PlaybackRules.resumePosition(Duration.zero, duration),
        Duration.zero,
      );
    });

    test('resumes at the saved position', () {
      expect(
        PlaybackRules.resumePosition(const Duration(minutes: 2), duration),
        const Duration(minutes: 2),
      );
    });

    test('never resumes within the last ten seconds', () {
      const latest = Duration(minutes: 5, seconds: 50);
      expect(PlaybackRules.resumePosition(latest, duration), latest);
      expect(
        PlaybackRules.resumePosition(
          const Duration(minutes: 5, seconds: 58),
          duration,
        ),
        latest,
      );
      expect(PlaybackRules.resumePosition(duration * 2, duration), latest);
    });

    test('starts at zero for lessons shorter than the margin', () {
      expect(
        PlaybackRules.resumePosition(
          const Duration(seconds: 5),
          const Duration(seconds: 8),
        ),
        Duration.zero,
      );
    });
  });

  group('isAtEnd', () {
    const duration = Duration(minutes: 6);

    test('within five seconds of the end counts as finished', () {
      expect(
        PlaybackRules.isAtEnd(
          const Duration(minutes: 5, seconds: 55),
          duration,
        ),
        isTrue,
      );
      expect(PlaybackRules.isAtEnd(duration, duration), isTrue);
    });

    test('earlier does not', () {
      expect(
        PlaybackRules.isAtEnd(
          const Duration(minutes: 5, seconds: 54),
          duration,
        ),
        isFalse,
      );
    });

    test('an unknown duration never counts as finished', () {
      expect(PlaybackRules.isAtEnd(Duration.zero, Duration.zero), isFalse);
    });
  });

  group('continueIndex', () {
    final lessons = [_lesson('a'), _lesson('b'), _lesson('c')];

    test('starts with the first lesson', () {
      expect(PlaybackRules.continueIndex(lessons, []), 0);
    });

    test('returns the most recent unfinished lesson', () {
      expect(
        PlaybackRules.continueIndex(lessons, [
          _progress('a', minute: 1, finished: true),
          _progress('b', minute: 2),
        ]),
        1,
      );
    });

    test('moves on after a finished lesson', () {
      expect(
        PlaybackRules.continueIndex(lessons, [
          _progress('a', minute: 1, finished: true),
        ]),
        1,
      );
    });

    test('prefers the later lesson when times tie', () {
      // Times are stored to the second; the input order must not matter.
      for (final progress in [
        [_progress('a', minute: 1), _progress('b', minute: 1)],
        [_progress('b', minute: 1), _progress('a', minute: 1)],
      ]) {
        expect(PlaybackRules.continueIndex(lessons, progress), 1);
      }
    });

    test('uses recency, not course order', () {
      expect(
        PlaybackRules.continueIndex(lessons, [
          _progress('c', minute: 1),
          _progress('a', minute: 5),
        ]),
        0,
      );
    });

    test('stays on the last lesson when it is finished', () {
      expect(
        PlaybackRules.continueIndex(lessons, [
          _progress('c', minute: 1, finished: true),
        ]),
        2,
      );
    });

    test('ignores lessons that were only marked finished', () {
      expect(
        PlaybackRules.continueIndex(lessons, [
          _progress('b', minute: 1),
          _marked('a'),
          _marked('c'),
        ]),
        1,
      );
    });

    test(
      'without anything played, starts with the first unfinished lesson',
      () {
        expect(
          PlaybackRules.continueIndex(lessons, [_marked('a'), _marked('b')]),
          2,
        );
        expect(
          PlaybackRules.continueIndex(lessons, [
            _marked('a'),
            _marked('b'),
            _marked('c'),
          ]),
          0,
        );
      },
    );

    test('ignores lessons that no longer exist', () {
      expect(
        PlaybackRules.continueIndex(lessons, [
          _progress('b', minute: 1),
          _progress('gone', minute: 5),
        ]),
        1,
      );
    });

    test('an empty course has nothing to continue', () {
      expect(PlaybackRules.continueIndex([], []), isNull);
    });
  });
}
