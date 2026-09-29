import 'dart:developer' as developer;

/// Records a problem the app recovered from, such as using a cached course
/// index because the network failed. Visible in the debug console and
/// DevTools; never sent anywhere.
void logRecoverable(String message, Object error, [StackTrace? stackTrace]) {
  developer.log(
    message,
    name: 'languagetransfer',
    level: 900, // WARNING in package:logging terms.
    error: error,
    stackTrace: stackTrace,
  );
}
