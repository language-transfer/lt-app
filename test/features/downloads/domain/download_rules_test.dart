import 'package:flutter_test/flutter_test.dart';
import 'package:languagetransfer/src/core/storage/file_pointer.dart';
import 'package:languagetransfer/src/features/catalog/domain/lesson.dart';
import 'package:languagetransfer/src/features/downloads/domain/download_rules.dart';
import 'package:languagetransfer/src/features/downloads/domain/lesson_download.dart';
import 'package:languagetransfer/src/features/settings/domain/app_settings.dart';

import '../../../helpers/fixtures.dart';

Lesson _lesson(int number, {bool withAppleVariant = true}) => Lesson(
  id: 'greek$number',
  title: 'Lesson $number',
  duration: const Duration(minutes: 6),
  variants: LessonVariants(
    low: FilePointer(object: fakeObjectId(number * 3), size: 100),
    high: FilePointer(object: fakeObjectId(number * 3 + 1), size: 200),
    highApple: withAppleVariant
        ? FilePointer(object: fakeObjectId(number * 3 + 2), size: 300)
        : null,
  ),
);

LessonDownload _download(Lesson lesson, DownloadStatus status) =>
    LessonDownload(
      courseId: 'greek',
      lessonId: lesson.id,
      objectId: lesson.variants.high.object,
      variant: AudioVariant.high,
      size: lesson.variants.high.size,
      url: Uri.parse('https://example.org/${lesson.id}'),
      status: status,
      requestedAt: DateTime(2026, 9, 29),
    );

void main() {
  group('lessonsToDownload', () {
    final lessons = [for (var i = 1; i <= 5; i++) _lesson(i)];

    List<String> ids(List<Lesson> lessons) => [
      for (final lesson in lessons) lesson.id,
    ];

    test('starts where "continue" leads, then wraps around', () {
      expect(ids(DownloadRules.lessonsToDownload(lessons, const {}, 2)), [
        'greek3',
        'greek4',
        'greek5',
        'greek1',
        'greek2',
      ]);
    });

    test('starts at the first lesson without a place to continue', () {
      expect(
        ids(DownloadRules.lessonsToDownload(lessons, const {}, null)),
        ids(lessons),
      );
    });

    test('leaves out lessons downloaded or on their way, not failed ones', () {
      final downloads = {
        for (final (lesson, status) in [
          (lessons[0], DownloadStatus.complete),
          (lessons[1], DownloadStatus.downloading),
          (lessons[2], DownloadStatus.queued),
          (lessons[3], DownloadStatus.failed),
        ])
          lesson.id: _download(lesson, status),
      };

      expect(ids(DownloadRules.lessonsToDownload(lessons, downloads, 0)), [
        'greek4',
        'greek5',
      ]);
    });
  });

  group('plannedSize', () {
    const high = AppSettings();
    const low = AppSettings(downloadQuality: AudioQuality.low);

    test('is the size of the variant the download quality picks', () {
      expect(
        DownloadRules.plannedSize(_lesson(1), high, applePlayer: false),
        200,
      );
      expect(
        DownloadRules.plannedSize(_lesson(1), low, applePlayer: false),
        100,
      );
    });

    test("on Apple's player, high quality is the QuickTime variant", () {
      expect(
        DownloadRules.plannedSize(_lesson(1), high, applePlayer: true),
        300,
      );
      expect(
        DownloadRules.plannedSize(
          _lesson(1, withAppleVariant: false),
          high,
          applePlayer: true,
        ),
        100,
        reason: 'low quality where there is none',
      );
    });

    test('counts settings not loaded yet as the defaults', () {
      expect(
        DownloadRules.plannedSize(_lesson(1), null, applePlayer: false),
        200,
      );
    });
  });

  group('waitForWifi', () {
    const wifiOnly = AppSettings();
    const anyNetwork = AppSettings(downloadOnlyOnWifi: false);

    for (final (settings, onWifi, waits) in [
      (wifiOnly, false, true),
      (wifiOnly, true, false),
      (wifiOnly, null, false),
      (anyNetwork, false, false),
      (null, false, true),
    ]) {
      test('Wi-Fi only: ${settings?.downloadOnlyOnWifi}, '
          'on Wi-Fi: $onWifi -> waits: $waits', () {
        expect(DownloadRules.waitForWifi(settings, onWifi: onWifi), waits);
      });
    }
  });
}
