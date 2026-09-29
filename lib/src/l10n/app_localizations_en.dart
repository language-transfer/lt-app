// ignore: unused_import
import 'package:intl/intl.dart' as intl;

import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for English (`en`).
class AppLocalizationsEn extends AppLocalizations {
  AppLocalizationsEn([String locale = 'en']) : super(locale);

  @override
  String get appTitle => 'Language Transfer';

  @override
  String get sectionLanguages => 'Language courses';

  @override
  String get sectionForSpanishSpeakers => 'For Spanish speakers';

  @override
  String get sectionOther => 'Other courses';

  @override
  String lessonCount(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count lessons',
      one: '1 lesson',
    );
    return '$_temp0';
  }

  @override
  String lessonsFinished(int finished, int total) {
    return '$finished of $total lessons finished';
  }

  @override
  String get coursesUnavailableTitle => 'Courses can’t be loaded';

  @override
  String get courseUnavailableTitle => 'This course can’t be loaded';

  @override
  String get offlineBody => 'Check your internet connection and try again.';

  @override
  String get serverProblemBody =>
      'Language Transfer’s server sent something unexpected. Try again later.';

  @override
  String get unknownProblemBody => 'Something went wrong. Try again.';

  @override
  String get tryAgain => 'Try again';

  @override
  String get menu => 'Menu';

  @override
  String get settings => 'Settings';

  @override
  String get about => 'About';

  @override
  String get courseOptions => 'Course options';

  @override
  String get lessonOptions => 'Lesson options';

  @override
  String get manageCourse => 'Downloads and progress';

  @override
  String get visitWebsite => 'Visit languagetransfer.org';

  @override
  String get continueLesson => 'Continue';

  @override
  String get startLesson => 'Start';

  @override
  String get nowPlaying => 'Now playing';

  @override
  String timeLeft(String time) {
    return '$time left';
  }

  @override
  String get lessonFinished => 'Finished';

  @override
  String get lessons => 'Lessons';

  @override
  String get lessonStateFinished => 'finished';

  @override
  String get lessonStatePlaying => 'playing';

  @override
  String get markFinished => 'Mark as finished';

  @override
  String get markNotFinished => 'Mark as not finished';

  @override
  String get playbackChannelName => 'Lesson playback';

  @override
  String get closePlayer => 'Close player';

  @override
  String get openPlayer => 'Open player';

  @override
  String get play => 'Play';

  @override
  String get pause => 'Pause';

  @override
  String get loading => 'Loading';

  @override
  String get back10 => 'Back 10 seconds';

  @override
  String get forward10 => 'Forward 10 seconds';

  @override
  String get previousLesson => 'Previous lesson';

  @override
  String get nextLesson => 'Next lesson';

  @override
  String get speed => 'Speed';

  @override
  String speedValue(String speed) {
    return '$speed×';
  }

  @override
  String get sleepTimer => 'Sleep timer';

  @override
  String get sleepTimerOff => 'Off';

  @override
  String get sleepTimerEndOfLesson => 'End of lesson';

  @override
  String sleepTimerMinutes(int minutes) {
    return '$minutes min';
  }

  @override
  String get positionInLesson => 'Position in lesson';

  @override
  String positionOf(String position, String duration) {
    return '$position of $duration';
  }

  @override
  String get playbackFailedTitle => 'This lesson can’t be played';

  @override
  String get playback => 'Playback';

  @override
  String get autoplayTitle => 'Play the next lesson automatically';

  @override
  String get autoplayBody => 'When a lesson ends, the next one starts.';

  @override
  String get streamingQuality => 'Streaming quality';

  @override
  String get streamingQualityBody =>
      'High quality uses about 1 MB per minute, low quality about half that.';

  @override
  String get qualityLow => 'Low';

  @override
  String get qualityHigh => 'High';

  @override
  String get aboutIntro =>
      'Language Transfer audio courses capture real life learning experiences in which you can participate fully, wherever you are in the world! Just engage, pause, think and answer out loud, the rest will take care of itself!';

  @override
  String get aboutMore =>
      'Language Transfer is a unique project in more ways than one. Find out more on the website.';

  @override
  String get faq => 'Frequently asked questions';

  @override
  String get substack => 'Substack blog';

  @override
  String get sendFeedback => 'Send feedback';

  @override
  String get feedbackSubject => 'Feedback about the Language Transfer app';

  @override
  String get sourceCode => 'Source code on GitHub';

  @override
  String get licenses => 'Licenses';

  @override
  String get privacy => 'Privacy';

  @override
  String get privacyBody =>
      'This app does not collect any information about you or how you use it. Courses and lessons are loaded from Language Transfer’s servers.';

  @override
  String version(String version) {
    return 'Version $version';
  }

  @override
  String get progress => 'Progress';

  @override
  String get refreshCourse => 'Check for new lessons';

  @override
  String get refreshCourseBody =>
      'Loads the latest list of lessons from Language Transfer’s server.';

  @override
  String get courseUpToDate => 'The course is up to date.';

  @override
  String get clearProgress => 'Clear progress';

  @override
  String get clearProgressBody =>
      'Marks every lesson as not finished and forgets where you stopped in each one.';

  @override
  String clearProgressQuestion(String course) {
    return 'Clear your progress in $course?';
  }

  @override
  String get progressCleared => 'Progress cleared.';

  @override
  String get downloads => 'Downloads';

  @override
  String get downloadLesson => 'Download';

  @override
  String get cancelDownload => 'Cancel download';

  @override
  String get deleteDownload => 'Delete download';

  @override
  String get retryDownload => 'Try downloading again';

  @override
  String get downloadQueued => 'Queued';

  @override
  String get downloadFailed => 'Failed';

  @override
  String get downloadFailedStorage =>
      'The lesson couldn’t be saved. Free up some space on this device and try again.';

  @override
  String get downloadFailedConnection =>
      'The connection broke off. Check your internet connection and try again.';

  @override
  String get downloadFailedServer =>
      'Language Transfer’s server didn’t send the lesson. Try again later.';

  @override
  String get downloadFailedDamaged =>
      'The downloaded file was damaged. Try again.';

  @override
  String get downloadFailedOther => 'The download didn’t finish. Try again.';

  @override
  String downloadPercent(int percent) {
    return '$percent%';
  }

  @override
  String downloadingPercent(int percent) {
    return 'Downloading, $percent%';
  }

  @override
  String get lessonStateDownloaded => 'downloaded';

  @override
  String get downloadAll => 'Download all';

  @override
  String downloadAllQuestion(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count lessons',
      one: '1 lesson',
    );
    return 'Download $_temp0?';
  }

  @override
  String downloadAllBody(String size) {
    return 'They take up $size on this device.';
  }

  @override
  String get downloadWhenOnWifi => 'They download when you’re on Wi-Fi.';

  @override
  String get download => 'Download';

  @override
  String downloadsLeft(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count lessons left to download',
      one: '1 lesson left to download',
    );
    return '$_temp0';
  }

  @override
  String get allDownloaded => 'All lessons downloaded';

  @override
  String get waitingForWifi => 'Downloads wait for Wi-Fi.';

  @override
  String get downloadStartsOnWifi =>
      'The download starts when you’re on Wi-Fi.';

  @override
  String downloadedSummary(int count, int total, String size) {
    return '$count of $total lessons downloaded, $size';
  }

  @override
  String get noneDownloaded => 'No lessons downloaded';

  @override
  String get downloadAllLessons => 'Download all lessons';

  @override
  String get downloadAllLessonsBody =>
      'Keeps every lesson on this device, so you can listen without internet.';

  @override
  String get deleteFinishedDownloads => 'Delete finished downloads';

  @override
  String get deleteFinishedDownloadsBody =>
      'Frees the space used by lessons you’ve finished.';

  @override
  String get finishedDownloadsDeleted => 'Finished downloads deleted.';

  @override
  String get deleteAllDownloads => 'Delete all downloads';

  @override
  String get deleteAllDownloadsBody =>
      'Deletes every downloaded lesson of this course. Your progress stays.';

  @override
  String deleteAllDownloadsQuestion(String course) {
    return 'Delete all downloads of $course?';
  }

  @override
  String get downloadsDeleted => 'Downloads deleted.';

  @override
  String get deleteCourseData => 'Delete all course data';

  @override
  String get deleteCourseDataBody =>
      'Clears your progress, deletes all downloads and removes the course’s lesson list from this device.';

  @override
  String deleteCourseDataQuestion(String course) {
    return 'Delete all data of $course?';
  }

  @override
  String get courseDataDeleted => 'Course data deleted.';

  @override
  String get delete => 'Delete';

  @override
  String get downloadQuality => 'Download quality';

  @override
  String get downloadQualityBody =>
      'High quality takes about 1 MB of storage per minute, low quality about half that.';

  @override
  String get downloadOnlyOnWifi => 'Download only on Wi-Fi';

  @override
  String get downloadOnlyOnWifiBody =>
      'Downloads wait until you’re on Wi-Fi. Streaming is not affected.';

  @override
  String get autoDeleteFinished => 'Delete lessons after finishing';

  @override
  String get autoDeleteFinishedBody =>
      'A downloaded lesson is deleted from this device when you finish it.';

  @override
  String sizeMegabytes(String size) {
    return '$size MB';
  }

  @override
  String sizeGigabytes(String size) {
    return '$size GB';
  }

  @override
  String get durationZero => '0 seconds';

  @override
  String durationWords(int minutes, int seconds) {
    String _temp0 = intl.Intl.pluralLogic(
      minutes,
      locale: localeName,
      other: '$minutes minutes',
      one: '1 minute',
      zero: '',
    );
    String _temp1 = intl.Intl.pluralLogic(
      seconds,
      locale: localeName,
      other: '$seconds seconds',
      one: '1 second',
      zero: '',
    );
    return '$_temp0 $_temp1';
  }
}
