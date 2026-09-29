import 'package:flutter_riverpod/misc.dart';
import 'package:languagetransfer/src/core/network/network_exception.dart';
import 'package:languagetransfer/src/core/storage/integrity.dart';
import 'package:languagetransfer/src/features/catalog/domain/course_index.dart';
import 'package:languagetransfer/src/l10n/app_localizations.dart';

/// What the listener can do about an error.
enum ErrorKind {
  /// No connection or it failed: check the connection and try again.
  offline,

  /// The server answered with something unusable: try again later.
  server,

  /// Anything else.
  unknown;

  /// Classifies [error], looking through Riverpod's wrapper for errors of
  /// providers that another provider depends on.
  static ErrorKind of(Object error) {
    var cause = error;
    // Wrapped once per provider the error passed through.
    while (cause is ProviderException) {
      cause = cause.exception;
    }
    return switch (cause) {
      NetworkException(statusCode: null) => ErrorKind.offline,
      NetworkException() => ErrorKind.server,
      FormatException() ||
      CorruptObjectException() ||
      UnknownCourseException() => ErrorKind.server,
      _ => ErrorKind.unknown,
    };
  }

  /// What to tell the listener about an error of this kind.
  String body(AppLocalizations l10n) => switch (this) {
    ErrorKind.offline => l10n.offlineBody,
    ErrorKind.server => l10n.serverProblemBody,
    ErrorKind.unknown => l10n.unknownProblemBody,
  };
}
