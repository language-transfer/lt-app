import 'package:flutter/foundation.dart';

/// Groups on the course list, in display order.
enum CourseSection { languages, forSpanishSpeakers, other }

/// What the app knows about a course beyond the server's index.
///
/// The server lists courses by id only; titles and presentation live in the
/// app (upstream `src/data/courseData.ts`, `courseInfoData`).
@immutable
class Course {
  const Course({
    required this.id,
    required this.fullTitle,
    required this.section,
    required this.cover,
    this.endonym,
    this.endonymIsRightToLeft = false,
    this.replacedBy,
  });

  /// Matches the id in the course index.
  final String id;

  /// Full name such as "Complete Greek".
  final String fullTitle;

  final CourseSection section;

  /// The course's cover with its name (an asset), shown on the lock screen
  /// and in the media notification like in the Expo app
  /// (`getCourseImageWithText`).
  final String cover;

  /// The taught language's name in its own script, such as "Ελληνικά".
  /// Decorative: screen readers announce [fullTitle] instead. `null` for
  /// courses that do not teach a language.
  final String? endonym;

  final bool endonymIsRightToLeft;

  /// Set for a retired course: links to it open [replacedBy] instead, and it
  /// is not listed.
  final String? replacedBy;

  bool get isListed => replacedBy == null;
}

/// All courses this app version knows, in display order within each section.
abstract final class Courses {
  static const all = <Course>[
    Course(
      id: 'spanish',
      cover: 'assets/courses/images/spanish-cover-stylized-with-text.png',
      fullTitle: 'Complete Spanish',
      section: CourseSection.languages,
      endonym: 'Español',
    ),
    Course(
      id: 'arabic',
      cover: 'assets/courses/images/arabic-cover-stylized-with-text.png',
      fullTitle: 'Introduction to Arabic',
      section: CourseSection.languages,
      endonym: 'العربية',
      endonymIsRightToLeft: true,
    ),
    Course(
      id: 'turkish',
      cover: 'assets/courses/images/turkish-cover-stylized-with-text.png',
      fullTitle: 'Introduction to Turkish',
      section: CourseSection.languages,
      endonym: 'Türkçe',
    ),
    Course(
      id: 'german',
      cover: 'assets/courses/images/german-cover-stylized-with-text.png',
      fullTitle: 'Complete German',
      section: CourseSection.languages,
      endonym: 'Deutsch',
    ),
    Course(
      id: 'greek',
      cover: 'assets/courses/images/greek-cover-stylized-with-text.png',
      fullTitle: 'Complete Greek',
      section: CourseSection.languages,
      endonym: 'Ελληνικά',
    ),
    Course(
      id: 'italian',
      cover: 'assets/courses/images/italian-cover-stylized-with-text.png',
      fullTitle: 'Introduction to Italian',
      section: CourseSection.languages,
      endonym: 'Italiano',
    ),
    Course(
      id: 'swahili',
      cover: 'assets/courses/images/swahili-cover-stylized-with-text.png',
      fullTitle: 'Complete Swahili',
      section: CourseSection.languages,
      endonym: 'Kiswahili',
    ),
    Course(
      id: 'french',
      cover: 'assets/courses/images/french-cover-stylized-with-text.png',
      fullTitle: 'Introduction to French',
      section: CourseSection.languages,
      endonym: 'Français',
    ),
    Course(
      id: 'ingles_completo',
      cover: 'assets/courses/images/ingles-cover-stylized-with-text.png',
      fullTitle: 'Inglés Completo',
      section: CourseSection.forSpanishSpeakers,
      endonym: 'English',
    ),
    // Replaced by Inglés Completo; the old introduction is on Language
    // Transfer's YouTube channel (upstream `app/(main)/_layout.tsx` redirect).
    Course(
      id: 'ingles',
      cover: 'assets/courses/images/ingles-cover-stylized-with-text.png',
      fullTitle: 'Introducción a Inglés',
      section: CourseSection.forSpanishSpeakers,
      endonym: 'English',
      replacedBy: 'ingles_completo',
    ),
    Course(
      id: 'music',
      cover: 'assets/courses/images/music-cover-stylized-with-text.png',
      fullTitle: 'Introduction to Music Theory',
      section: CourseSection.other,
    ),
  ];

  static final Map<String, Course> _byId = {
    for (final course in all) course.id: course,
  };

  /// The course with [id], or `null` if this app version does not know it.
  static Course? byId(String id) => _byId[id];

  /// Follows [Course.replacedBy], so retired ids open their successor.
  static Course? resolve(String id) {
    final course = _byId[id];
    final successor = course?.replacedBy;
    return successor == null ? course : _byId[successor];
  }

  static Iterable<Course> get listed => all.where((course) => course.isListed);
}
