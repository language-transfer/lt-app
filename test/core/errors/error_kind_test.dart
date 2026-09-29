import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:languagetransfer/src/core/errors/error_kind.dart';
import 'package:languagetransfer/src/core/network/network_exception.dart';
import 'package:languagetransfer/src/core/storage/file_pointer.dart';
import 'package:languagetransfer/src/core/storage/integrity.dart';
import 'package:languagetransfer/src/features/catalog/domain/course_index.dart';

import '../../helpers/fixtures.dart';

void main() {
  final url = Uri.parse('https://downloads.languagetransfer.org/cas/index');

  test('tells a missing connection from a bad answer', () {
    for (final (error, kind) in [
      (NetworkException(url, 'offline'), ErrorKind.offline),
      (NetworkException(url, 'bad gateway', statusCode: 502), ErrorKind.server),
      (const FormatException('not JSON'), ErrorKind.server),
      (
        CorruptObjectException(
          FilePointer(object: fakeObjectId(1), size: 1),
          'hash',
        ),
        ErrorKind.server,
      ),
      (const UnknownCourseException('klingon'), ErrorKind.server),
      (StateError('bug'), ErrorKind.unknown),
    ]) {
      expect(ErrorKind.of(error), kind, reason: '$error');
    }
  });

  test("looks through the wrapper of a provider's dependency", () {
    final failing = Provider<int>(
      (ref) => throw NetworkException(url, 'offline'),
    );
    final dependent = Provider<int>((ref) => ref.watch(failing));
    final container = ProviderContainer();
    addTearDown(container.dispose);

    Object? error;
    try {
      container.read(dependent);
    } on Object catch (caught) {
      error = caught;
    }

    expect(error, isNot(isA<NetworkException>()), reason: 'wrapped');
    expect(ErrorKind.of(error!), ErrorKind.offline);
  });
}
