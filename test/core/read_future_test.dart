import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:languagetransfer/src/core/read_future.dart';

void main() {
  late StreamController<int> values;
  late StreamProvider<int> numbers;
  late ProviderContainer container;
  late Ref ref;

  setUp(() {
    values = StreamController<int>();
    numbers = StreamProvider<int>((ref) => values.stream);
    container = ProviderContainer();
    ref = container.read(Provider<Ref>((ref) => ref));
  });

  tearDown(() async {
    container.dispose();
    await values.close();
  });

  test('waits for a stream nobody else listens to', () async {
    final value = ref.readFuture(numbers.future);
    values.add(42);

    expect(await value, 42);
  });

  // Why readFuture exists. If this starts failing after a Riverpod update,
  // plain read may be enough again.
  test('plain read of such a stream never completes', () async {
    final value = ref.read(numbers.future);
    values.add(42);

    await expectLater(
      value.timeout(const Duration(milliseconds: 200)),
      throwsA(isA<TimeoutException>()),
    );
  });
}
