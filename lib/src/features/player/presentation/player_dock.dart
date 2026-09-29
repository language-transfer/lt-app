import 'package:flutter/widgets.dart';

/// Where the mini-player is, for the screens around it: the player opens
/// from it and closes back onto it.
class PlayerDock extends InheritedWidget {
  const PlayerDock({
    required this.miniPlayer,
    required this.copy,
    required super.child,
    super.key,
  });

  /// The key of the mini-player on screen.
  final GlobalKey miniPlayer;

  /// What the player's sheet shows while it lies on the mini-player: a copy
  /// of it, which fades out as the sheet rises.
  final Widget copy;

  static PlayerDock? of(BuildContext context) =>
      context.getInheritedWidgetOfExactType<PlayerDock>();

  @override
  bool updateShouldNotify(PlayerDock oldWidget) =>
      miniPlayer != oldWidget.miniPlayer || copy != oldWidget.copy;
}

/// Around the player while a swipe up is opening it, when it is only drawn:
/// native views, such as the output picker, are left out, since the player's
/// route creates its own when it takes over.
class PlayerPreview extends InheritedWidget {
  const PlayerPreview({required super.child, super.key});

  static bool of(BuildContext context) =>
      context.getInheritedWidgetOfExactType<PlayerPreview>() != null;

  @override
  bool updateShouldNotify(PlayerPreview oldWidget) => false;
}
