import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:intl/intl.dart' as intl;

import 'app_localizations_en.dart';

// ignore_for_file: type=lint

/// Callers can lookup localized strings with an instance of AppLocalizations
/// returned by `AppLocalizations.of(context)`.
///
/// Applications need to include `AppLocalizations.delegate()` in their app's
/// `localizationDelegates` list, and the locales they support in the app's
/// `supportedLocales` list. For example:
///
/// ```dart
/// import 'l10n/app_localizations.dart';
///
/// return MaterialApp(
///   localizationsDelegates: AppLocalizations.localizationsDelegates,
///   supportedLocales: AppLocalizations.supportedLocales,
///   home: MyApplicationHome(),
/// );
/// ```
///
/// ## Update pubspec.yaml
///
/// Please make sure to update your pubspec.yaml to include the following
/// packages:
///
/// ```yaml
/// dependencies:
///   # Internationalization support.
///   flutter_localizations:
///     sdk: flutter
///   intl: any # Use the pinned version from flutter_localizations
///
///   # Rest of dependencies
/// ```
///
/// ## iOS Applications
///
/// iOS applications define key application metadata, including supported
/// locales, in an Info.plist file that is built into the application bundle.
/// To configure the locales supported by your app, you’ll need to edit this
/// file.
///
/// First, open your project’s ios/Runner.xcworkspace Xcode workspace file.
/// Then, in the Project Navigator, open the Info.plist file under the Runner
/// project’s Runner folder.
///
/// Next, select the Information Property List item, select Add Item from the
/// Editor menu, then select Localizations from the pop-up menu.
///
/// Select and expand the newly-created Localizations item then, for each
/// locale your application supports, add a new item and select the locale
/// you wish to add from the pop-up menu in the Value field. This list should
/// be consistent with the languages listed in the AppLocalizations.supportedLocales
/// property.
abstract class AppLocalizations {
  AppLocalizations(String locale)
    : localeName = intl.Intl.canonicalizedLocale(locale.toString());

  final String localeName;

  static AppLocalizations of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations)!;
  }

  static const LocalizationsDelegate<AppLocalizations> delegate =
      _AppLocalizationsDelegate();

  /// A list of this localizations delegate along with the default localizations
  /// delegates.
  ///
  /// Returns a list of localizations delegates containing this delegate along with
  /// GlobalMaterialLocalizations.delegate, GlobalCupertinoLocalizations.delegate,
  /// and GlobalWidgetsLocalizations.delegate.
  ///
  /// Additional delegates can be added by appending to this list in
  /// MaterialApp. This list does not have to be used at all if a custom list
  /// of delegates is preferred or required.
  static const List<LocalizationsDelegate<dynamic>> localizationsDelegates =
      <LocalizationsDelegate<dynamic>>[
        delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
      ];

  /// A list of this localizations delegate's supported locales.
  static const List<Locale> supportedLocales = <Locale>[Locale('en')];

  /// No description provided for @appTitle.
  ///
  /// In en, this message translates to:
  /// **'Language Transfer'**
  String get appTitle;

  /// Course list group of the language courses taught in English.
  ///
  /// In en, this message translates to:
  /// **'Language courses'**
  String get sectionLanguages;

  /// Course list group of courses taught in Spanish.
  ///
  /// In en, this message translates to:
  /// **'For Spanish speakers'**
  String get sectionForSpanishSpeakers;

  /// Course list group of courses that do not teach a language, such as music theory.
  ///
  /// In en, this message translates to:
  /// **'Other courses'**
  String get sectionOther;

  /// No description provided for @lessonCount.
  ///
  /// In en, this message translates to:
  /// **'{count, plural, =1{1 lesson} other{{count} lessons}}'**
  String lessonCount(int count);

  /// No description provided for @lessonsFinished.
  ///
  /// In en, this message translates to:
  /// **'{finished} of {total} lessons finished'**
  String lessonsFinished(int finished, int total);

  /// No description provided for @coursesUnavailableTitle.
  ///
  /// In en, this message translates to:
  /// **'Courses can’t be loaded'**
  String get coursesUnavailableTitle;

  /// No description provided for @courseUnavailableTitle.
  ///
  /// In en, this message translates to:
  /// **'This course can’t be loaded'**
  String get courseUnavailableTitle;

  /// No description provided for @offlineBody.
  ///
  /// In en, this message translates to:
  /// **'Check your internet connection and try again.'**
  String get offlineBody;

  /// No description provided for @serverProblemBody.
  ///
  /// In en, this message translates to:
  /// **'Language Transfer’s server sent something unexpected. Try again later.'**
  String get serverProblemBody;

  /// No description provided for @unknownProblemBody.
  ///
  /// In en, this message translates to:
  /// **'Something went wrong. Try again.'**
  String get unknownProblemBody;

  /// No description provided for @tryAgain.
  ///
  /// In en, this message translates to:
  /// **'Try again'**
  String get tryAgain;

  /// No description provided for @menu.
  ///
  /// In en, this message translates to:
  /// **'Menu'**
  String get menu;

  /// No description provided for @settings.
  ///
  /// In en, this message translates to:
  /// **'Settings'**
  String get settings;

  /// No description provided for @about.
  ///
  /// In en, this message translates to:
  /// **'About'**
  String get about;

  /// No description provided for @courseOptions.
  ///
  /// In en, this message translates to:
  /// **'Course options'**
  String get courseOptions;

  /// Label of what opens a lesson's options: the download button of a downloaded or failed lesson (for screen readers), and the ⋯ button in the player.
  ///
  /// In en, this message translates to:
  /// **'Lesson options'**
  String get lessonOptions;

  /// No description provided for @manageCourse.
  ///
  /// In en, this message translates to:
  /// **'Downloads and progress'**
  String get manageCourse;

  /// No description provided for @visitWebsite.
  ///
  /// In en, this message translates to:
  /// **'Visit languagetransfer.org'**
  String get visitWebsite;

  /// Label above the title of the lesson the listener stopped in.
  ///
  /// In en, this message translates to:
  /// **'Continue'**
  String get continueLesson;

  /// Label above the title of the next lesson, not yet started.
  ///
  /// In en, this message translates to:
  /// **'Start'**
  String get startLesson;

  /// No description provided for @nowPlaying.
  ///
  /// In en, this message translates to:
  /// **'Now playing'**
  String get nowPlaying;

  /// Time left in a lesson, for example '5:09 left'.
  ///
  /// In en, this message translates to:
  /// **'{time} left'**
  String timeLeft(String time);

  /// No description provided for @lessonFinished.
  ///
  /// In en, this message translates to:
  /// **'Finished'**
  String get lessonFinished;

  /// No description provided for @lessons.
  ///
  /// In en, this message translates to:
  /// **'Lessons'**
  String get lessons;

  /// No description provided for @lessonStateFinished.
  ///
  /// In en, this message translates to:
  /// **'finished'**
  String get lessonStateFinished;

  /// No description provided for @lessonStatePlaying.
  ///
  /// In en, this message translates to:
  /// **'playing'**
  String get lessonStatePlaying;

  /// No description provided for @markFinished.
  ///
  /// In en, this message translates to:
  /// **'Mark as finished'**
  String get markFinished;

  /// No description provided for @markNotFinished.
  ///
  /// In en, this message translates to:
  /// **'Mark as not finished'**
  String get markNotFinished;

  /// Name of the Android notification channel for playback, shown in the system's notification settings for the app.
  ///
  /// In en, this message translates to:
  /// **'Lesson playback'**
  String get playbackChannelName;

  /// No description provided for @closePlayer.
  ///
  /// In en, this message translates to:
  /// **'Close player'**
  String get closePlayer;

  /// No description provided for @openPlayer.
  ///
  /// In en, this message translates to:
  /// **'Open player'**
  String get openPlayer;

  /// No description provided for @play.
  ///
  /// In en, this message translates to:
  /// **'Play'**
  String get play;

  /// No description provided for @pause.
  ///
  /// In en, this message translates to:
  /// **'Pause'**
  String get pause;

  /// No description provided for @loading.
  ///
  /// In en, this message translates to:
  /// **'Loading'**
  String get loading;

  /// No description provided for @back10.
  ///
  /// In en, this message translates to:
  /// **'Back 10 seconds'**
  String get back10;

  /// No description provided for @forward10.
  ///
  /// In en, this message translates to:
  /// **'Forward 10 seconds'**
  String get forward10;

  /// No description provided for @previousLesson.
  ///
  /// In en, this message translates to:
  /// **'Previous lesson'**
  String get previousLesson;

  /// No description provided for @nextLesson.
  ///
  /// In en, this message translates to:
  /// **'Next lesson'**
  String get nextLesson;

  /// No description provided for @speed.
  ///
  /// In en, this message translates to:
  /// **'Speed'**
  String get speed;

  /// Playback speed, for example '1.25×'.
  ///
  /// In en, this message translates to:
  /// **'{speed}×'**
  String speedValue(String speed);

  /// No description provided for @sleepTimer.
  ///
  /// In en, this message translates to:
  /// **'Sleep timer'**
  String get sleepTimer;

  /// No description provided for @sleepTimerOff.
  ///
  /// In en, this message translates to:
  /// **'Off'**
  String get sleepTimerOff;

  /// No description provided for @sleepTimerEndOfLesson.
  ///
  /// In en, this message translates to:
  /// **'End of lesson'**
  String get sleepTimerEndOfLesson;

  /// A sleep timer's time in whole minutes, for example '15 min'.
  ///
  /// In en, this message translates to:
  /// **'{minutes} min'**
  String sleepTimerMinutes(int minutes);

  /// No description provided for @positionInLesson.
  ///
  /// In en, this message translates to:
  /// **'Position in lesson'**
  String get positionInLesson;

  /// No description provided for @positionOf.
  ///
  /// In en, this message translates to:
  /// **'{position} of {duration}'**
  String positionOf(String position, String duration);

  /// No description provided for @playbackFailedTitle.
  ///
  /// In en, this message translates to:
  /// **'This lesson can’t be played'**
  String get playbackFailedTitle;

  /// No description provided for @playback.
  ///
  /// In en, this message translates to:
  /// **'Playback'**
  String get playback;

  /// No description provided for @autoplayTitle.
  ///
  /// In en, this message translates to:
  /// **'Play the next lesson automatically'**
  String get autoplayTitle;

  /// No description provided for @autoplayBody.
  ///
  /// In en, this message translates to:
  /// **'When a lesson ends, the next one starts.'**
  String get autoplayBody;

  /// No description provided for @streamingQuality.
  ///
  /// In en, this message translates to:
  /// **'Streaming quality'**
  String get streamingQuality;

  /// No description provided for @streamingQualityBody.
  ///
  /// In en, this message translates to:
  /// **'High quality uses about 1 MB per minute, low quality about half that.'**
  String get streamingQualityBody;

  /// No description provided for @qualityLow.
  ///
  /// In en, this message translates to:
  /// **'Low'**
  String get qualityLow;

  /// No description provided for @qualityHigh.
  ///
  /// In en, this message translates to:
  /// **'High'**
  String get qualityHigh;

  /// No description provided for @aboutIntro.
  ///
  /// In en, this message translates to:
  /// **'Language Transfer audio courses capture real life learning experiences in which you can participate fully, wherever you are in the world! Just engage, pause, think and answer out loud, the rest will take care of itself!'**
  String get aboutIntro;

  /// No description provided for @aboutMore.
  ///
  /// In en, this message translates to:
  /// **'Language Transfer is a unique project in more ways than one. Find out more on the website.'**
  String get aboutMore;

  /// No description provided for @faq.
  ///
  /// In en, this message translates to:
  /// **'Frequently asked questions'**
  String get faq;

  /// No description provided for @substack.
  ///
  /// In en, this message translates to:
  /// **'Substack blog'**
  String get substack;

  /// No description provided for @sendFeedback.
  ///
  /// In en, this message translates to:
  /// **'Send feedback'**
  String get sendFeedback;

  /// No description provided for @feedbackSubject.
  ///
  /// In en, this message translates to:
  /// **'Feedback about the Language Transfer app'**
  String get feedbackSubject;

  /// No description provided for @sourceCode.
  ///
  /// In en, this message translates to:
  /// **'Source code on GitHub'**
  String get sourceCode;

  /// No description provided for @licenses.
  ///
  /// In en, this message translates to:
  /// **'Licenses'**
  String get licenses;

  /// No description provided for @privacy.
  ///
  /// In en, this message translates to:
  /// **'Privacy'**
  String get privacy;

  /// No description provided for @privacyBody.
  ///
  /// In en, this message translates to:
  /// **'This app does not collect any information about you or how you use it. Courses and lessons are loaded from Language Transfer’s servers.'**
  String get privacyBody;

  /// No description provided for @version.
  ///
  /// In en, this message translates to:
  /// **'Version {version}'**
  String version(String version);

  /// Heading of the listening progress actions.
  ///
  /// In en, this message translates to:
  /// **'Progress'**
  String get progress;

  /// No description provided for @refreshCourse.
  ///
  /// In en, this message translates to:
  /// **'Check for new lessons'**
  String get refreshCourse;

  /// No description provided for @refreshCourseBody.
  ///
  /// In en, this message translates to:
  /// **'Loads the latest list of lessons from Language Transfer’s server.'**
  String get refreshCourseBody;

  /// No description provided for @courseUpToDate.
  ///
  /// In en, this message translates to:
  /// **'The course is up to date.'**
  String get courseUpToDate;

  /// No description provided for @clearProgress.
  ///
  /// In en, this message translates to:
  /// **'Clear progress'**
  String get clearProgress;

  /// No description provided for @clearProgressBody.
  ///
  /// In en, this message translates to:
  /// **'Marks every lesson as not finished and forgets where you stopped in each one.'**
  String get clearProgressBody;

  /// No description provided for @clearProgressQuestion.
  ///
  /// In en, this message translates to:
  /// **'Clear your progress in {course}?'**
  String clearProgressQuestion(String course);

  /// No description provided for @progressCleared.
  ///
  /// In en, this message translates to:
  /// **'Progress cleared.'**
  String get progressCleared;

  /// No description provided for @downloads.
  ///
  /// In en, this message translates to:
  /// **'Downloads'**
  String get downloads;

  /// No description provided for @downloadLesson.
  ///
  /// In en, this message translates to:
  /// **'Download'**
  String get downloadLesson;

  /// No description provided for @cancelDownload.
  ///
  /// In en, this message translates to:
  /// **'Cancel download'**
  String get cancelDownload;

  /// No description provided for @deleteDownload.
  ///
  /// In en, this message translates to:
  /// **'Delete download'**
  String get deleteDownload;

  /// No description provided for @retryDownload.
  ///
  /// In en, this message translates to:
  /// **'Try downloading again'**
  String get retryDownload;

  /// A lesson download waiting to start. Shown under a small icon, so keep it short.
  ///
  /// In en, this message translates to:
  /// **'Queued'**
  String get downloadQueued;

  /// A lesson download that failed. Shown under a small icon, so keep it short.
  ///
  /// In en, this message translates to:
  /// **'Failed'**
  String get downloadFailed;

  /// No description provided for @downloadFailedStorage.
  ///
  /// In en, this message translates to:
  /// **'The lesson couldn’t be saved. Free up some space on this device and try again.'**
  String get downloadFailedStorage;

  /// No description provided for @downloadFailedConnection.
  ///
  /// In en, this message translates to:
  /// **'The connection broke off. Check your internet connection and try again.'**
  String get downloadFailedConnection;

  /// No description provided for @downloadFailedServer.
  ///
  /// In en, this message translates to:
  /// **'Language Transfer’s server didn’t send the lesson. Try again later.'**
  String get downloadFailedServer;

  /// No description provided for @downloadFailedDamaged.
  ///
  /// In en, this message translates to:
  /// **'The downloaded file was damaged. Try again.'**
  String get downloadFailedDamaged;

  /// No description provided for @downloadFailedOther.
  ///
  /// In en, this message translates to:
  /// **'The download didn’t finish. Try again.'**
  String get downloadFailedOther;

  /// How far a download is, for example '42%'.
  ///
  /// In en, this message translates to:
  /// **'{percent}%'**
  String downloadPercent(int percent);

  /// No description provided for @downloadingPercent.
  ///
  /// In en, this message translates to:
  /// **'Downloading, {percent}%'**
  String downloadingPercent(int percent);

  /// No description provided for @lessonStateDownloaded.
  ///
  /// In en, this message translates to:
  /// **'downloaded'**
  String get lessonStateDownloaded;

  /// No description provided for @downloadAll.
  ///
  /// In en, this message translates to:
  /// **'Download all'**
  String get downloadAll;

  /// No description provided for @downloadAllQuestion.
  ///
  /// In en, this message translates to:
  /// **'Download {count, plural, =1{1 lesson} other{{count} lessons}}?'**
  String downloadAllQuestion(int count);

  /// No description provided for @downloadAllBody.
  ///
  /// In en, this message translates to:
  /// **'They take up {size} on this device.'**
  String downloadAllBody(String size);

  /// No description provided for @downloadWhenOnWifi.
  ///
  /// In en, this message translates to:
  /// **'They download when you’re on Wi-Fi.'**
  String get downloadWhenOnWifi;

  /// Confirms downloading lessons.
  ///
  /// In en, this message translates to:
  /// **'Download'**
  String get download;

  /// No description provided for @downloadsLeft.
  ///
  /// In en, this message translates to:
  /// **'{count, plural, =1{1 lesson left to download} other{{count} lessons left to download}}'**
  String downloadsLeft(int count);

  /// No description provided for @allDownloaded.
  ///
  /// In en, this message translates to:
  /// **'All lessons downloaded'**
  String get allDownloaded;

  /// No description provided for @waitingForWifi.
  ///
  /// In en, this message translates to:
  /// **'Downloads wait for Wi-Fi.'**
  String get waitingForWifi;

  /// No description provided for @downloadStartsOnWifi.
  ///
  /// In en, this message translates to:
  /// **'The download starts when you’re on Wi-Fi.'**
  String get downloadStartsOnWifi;

  /// No description provided for @downloadedSummary.
  ///
  /// In en, this message translates to:
  /// **'{count} of {total} lessons downloaded, {size}'**
  String downloadedSummary(int count, int total, String size);

  /// No description provided for @noneDownloaded.
  ///
  /// In en, this message translates to:
  /// **'No lessons downloaded'**
  String get noneDownloaded;

  /// No description provided for @downloadAllLessons.
  ///
  /// In en, this message translates to:
  /// **'Download all lessons'**
  String get downloadAllLessons;

  /// No description provided for @downloadAllLessonsBody.
  ///
  /// In en, this message translates to:
  /// **'Keeps every lesson on this device, so you can listen without internet.'**
  String get downloadAllLessonsBody;

  /// No description provided for @deleteFinishedDownloads.
  ///
  /// In en, this message translates to:
  /// **'Delete finished downloads'**
  String get deleteFinishedDownloads;

  /// No description provided for @deleteFinishedDownloadsBody.
  ///
  /// In en, this message translates to:
  /// **'Frees the space used by lessons you’ve finished.'**
  String get deleteFinishedDownloadsBody;

  /// No description provided for @finishedDownloadsDeleted.
  ///
  /// In en, this message translates to:
  /// **'Finished downloads deleted.'**
  String get finishedDownloadsDeleted;

  /// No description provided for @deleteAllDownloads.
  ///
  /// In en, this message translates to:
  /// **'Delete all downloads'**
  String get deleteAllDownloads;

  /// No description provided for @deleteAllDownloadsBody.
  ///
  /// In en, this message translates to:
  /// **'Deletes every downloaded lesson of this course. Your progress stays.'**
  String get deleteAllDownloadsBody;

  /// No description provided for @deleteAllDownloadsQuestion.
  ///
  /// In en, this message translates to:
  /// **'Delete all downloads of {course}?'**
  String deleteAllDownloadsQuestion(String course);

  /// No description provided for @downloadsDeleted.
  ///
  /// In en, this message translates to:
  /// **'Downloads deleted.'**
  String get downloadsDeleted;

  /// No description provided for @deleteCourseData.
  ///
  /// In en, this message translates to:
  /// **'Delete all course data'**
  String get deleteCourseData;

  /// No description provided for @deleteCourseDataBody.
  ///
  /// In en, this message translates to:
  /// **'Clears your progress, deletes all downloads and removes the course’s lesson list from this device.'**
  String get deleteCourseDataBody;

  /// No description provided for @deleteCourseDataQuestion.
  ///
  /// In en, this message translates to:
  /// **'Delete all data of {course}?'**
  String deleteCourseDataQuestion(String course);

  /// No description provided for @courseDataDeleted.
  ///
  /// In en, this message translates to:
  /// **'Course data deleted.'**
  String get courseDataDeleted;

  /// Confirms deleting something.
  ///
  /// In en, this message translates to:
  /// **'Delete'**
  String get delete;

  /// No description provided for @downloadQuality.
  ///
  /// In en, this message translates to:
  /// **'Download quality'**
  String get downloadQuality;

  /// No description provided for @downloadQualityBody.
  ///
  /// In en, this message translates to:
  /// **'High quality takes about 1 MB of storage per minute, low quality about half that.'**
  String get downloadQualityBody;

  /// No description provided for @downloadOnlyOnWifi.
  ///
  /// In en, this message translates to:
  /// **'Download only on Wi-Fi'**
  String get downloadOnlyOnWifi;

  /// No description provided for @downloadOnlyOnWifiBody.
  ///
  /// In en, this message translates to:
  /// **'Downloads wait until you’re on Wi-Fi. Streaming is not affected.'**
  String get downloadOnlyOnWifiBody;

  /// No description provided for @autoDeleteFinished.
  ///
  /// In en, this message translates to:
  /// **'Delete lessons after finishing'**
  String get autoDeleteFinished;

  /// No description provided for @autoDeleteFinishedBody.
  ///
  /// In en, this message translates to:
  /// **'A downloaded lesson is deleted from this device when you finish it.'**
  String get autoDeleteFinishedBody;

  /// No description provided for @sizeMegabytes.
  ///
  /// In en, this message translates to:
  /// **'{size} MB'**
  String sizeMegabytes(String size);

  /// No description provided for @sizeGigabytes.
  ///
  /// In en, this message translates to:
  /// **'{size} GB'**
  String sizeGigabytes(String size);

  /// A zero duration read out by screen readers.
  ///
  /// In en, this message translates to:
  /// **'0 seconds'**
  String get durationZero;

  /// A duration read out by screen readers, for example '6 minutes 58 seconds'. Parts that are zero stay empty.
  ///
  /// In en, this message translates to:
  /// **'{minutes, plural, =0{} =1{1 minute} other{{minutes} minutes}} {seconds, plural, =0{} =1{1 second} other{{seconds} seconds}}'**
  String durationWords(int minutes, int seconds);
}

class _AppLocalizationsDelegate
    extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  Future<AppLocalizations> load(Locale locale) {
    return SynchronousFuture<AppLocalizations>(lookupAppLocalizations(locale));
  }

  @override
  bool isSupported(Locale locale) =>
      <String>['en'].contains(locale.languageCode);

  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}

AppLocalizations lookupAppLocalizations(Locale locale) {
  // Lookup logic when only language code is specified.
  switch (locale.languageCode) {
    case 'en':
      return AppLocalizationsEn();
  }

  throw FlutterError(
    'AppLocalizations.delegate failed to load unsupported locale "$locale". This is likely '
    'an issue with the localizations generation tool. Please file an issue '
    'on GitHub with a reproducible sample app and the gen-l10n configuration '
    'that was used.',
  );
}
