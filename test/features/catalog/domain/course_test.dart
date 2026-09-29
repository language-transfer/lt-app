import 'package:flutter_test/flutter_test.dart';
import 'package:languagetransfer/src/features/catalog/domain/course.dart';
import 'package:languagetransfer/src/features/catalog/domain/course_index.dart';

import '../../../helpers/fixtures.dart';

void main() {
  test('course ids are unique', () {
    final ids = Courses.all.map((course) => course.id).toList();
    expect(ids.toSet(), hasLength(ids.length));
  });

  test('every course in the live index is known to the app', () {
    final index = CourseIndex.parse(fixture('all_courses.json'));
    for (final entry in index.courses) {
      expect(Courses.byId(entry.id), isNotNull, reason: entry.id);
    }
  });

  test('the retired ingles course resolves to Inglés Completo', () {
    expect(Courses.byId('ingles')!.isListed, isFalse);
    expect(Courses.resolve('ingles')!.id, 'ingles_completo');
    expect(Courses.resolve('greek')!.id, 'greek');
    expect(Courses.resolve('klingon'), isNull);
  });

  test('lists courses in the order of the previous app', () {
    // upstream src/components/language-selector/LanguageSelector.tsx
    expect(Courses.listed.map((course) => course.id), [
      'spanish',
      'arabic',
      'turkish',
      'german',
      'greek',
      'italian',
      'swahili',
      'french',
      'ingles_completo',
      'music',
    ]);
  });

  test('only Arabic is written right to left', () {
    expect(Courses.all.where((c) => c.endonymIsRightToLeft).map((c) => c.id), [
      'arabic',
    ]);
  });
}
