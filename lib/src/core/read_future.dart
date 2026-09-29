import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_riverpod/misc.dart';

extension ReadFuture on Ref {
  /// Waits for the value of [provider] (a provider's `.future`), keeping it
  /// listened to until it arrives.
  ///
  /// `read(provider.future)` subscribes and unsubscribes at once, and
  /// Riverpod pauses a provider nobody listens to: a stream that has not
  /// produced its first value then never does, and the future never
  /// completes.
  Future<T> readFuture<T>(ProviderListenable<Future<T>> provider) async {
    final subscription = container.listen(provider, (_, _) {});
    try {
      return await subscription.read();
    } finally {
      subscription.close();
    }
  }
}
