import 'package:flutter/material.dart';

/// How the interface moves: few, short animations that show what changed.
/// The player sheet moves on its own spring (see player_sheet.dart).
abstract final class Motion {
  /// A change in place: a glyph, a label, a handle.
  static const quick = Duration(milliseconds: 150);

  /// Something arriving or leaving, such as the mini-player.
  static const standard = Duration(milliseconds: 250);

  /// For what arrives: fast at first, settling gently.
  static const Curve enter = Easing.emphasizedDecelerate;

  /// For what leaves: slow at first, then quickly out of the way.
  static const Curve exit = Easing.emphasizedAccelerate;

  /// For a change in place.
  static const Curve change = Easing.standard;

  /// Faster than this, in logical pixels per second, a swipe decides by its
  /// direction alone, as Flutter's bottom sheets do.
  static const flickVelocity = 700.0;

  /// Whether the system asks for less motion: Android's "Remove animations"
  /// or iOS's "Reduce Motion". Flutter's own animations only shorten
  /// themselves for the first, and [MediaQuery] does not report the second.
  static bool reduced(BuildContext context) =>
      MediaQuery.disableAnimationsOf(context) ||
      View.of(context).platformDispatcher.accessibilityFeatures.reduceMotion;

  /// [duration], or none when the system asks for less motion.
  static Duration of(BuildContext context, Duration duration) =>
      reduced(context) ? Duration.zero : duration;
}
