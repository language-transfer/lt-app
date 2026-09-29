import 'dart:math' as math;
import 'dart:ui' show SemanticsHitTestBehavior;

import 'package:flutter/foundation.dart';
import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:flutter/physics.dart';
import 'package:languagetransfer/src/core/theme/motion.dart';
import 'package:languagetransfer/src/features/player/presentation/player_dock.dart';
import 'package:languagetransfer/src/features/player/presentation/player_screen.dart';

/// Opens the player over the current screen.
void showPlayer(BuildContext context) => Navigator.of(
  context,
  rootNavigator: true,
).push(PlayerSheetRoute._(context));

/// Opens the player for a swipe up that began on the mini-player: the sheet
/// moves with the finger until [PlayerSheetDrag.end].
PlayerSheetDrag dragPlayerOpen(BuildContext context) =>
    PlayerSheetDrag._(context);

/// Critically damped: settles without bouncing, in about 0.4 s from rest.
final _spring = SpringDescription.withDampingRatio(mass: 1, stiffness: 260);

Simulation _springTo(double from, double to, double velocity) =>
    SpringSimulation(_spring, from, to, velocity, snapToEnd: true);

/// The scrim behind the sheet, as dark as the sheet is open.
const Color _scrim = Colors.black54;
const Curve _scrimCurve = Curves.ease;

/// Where a sheet let go [value] of the way up, at [velocity] logical pixels
/// per second (negative up) over a [travel] of logical pixels, goes: open
/// or closed, and at what speed (share of the way per second).
({bool opens, double velocity}) _letGo(
  double value,
  double velocity,
  double travel,
) => (
  opens: velocity.abs() > Motion.flickVelocity ? velocity < 0 : value >= 0.5,
  velocity: travel > 0 ? -velocity / travel : 0.0,
);

/// A swipe up from the mini-player, opening the player.
///
/// While the finger is down the sheet is only drawn over the app, and the
/// player's route takes over when it lets go: pushing a route cancels every
/// pointer on the screen (`NavigatorState._cancelActivePointers`), which
/// would end the swipe.
class PlayerSheetDrag {
  PlayerSheetDrag._(BuildContext context)
    : _navigator = Navigator.of(context, rootNavigator: true),
      _dock = PlayerDock.of(context),
      _labels = _Labels.of(context) {
    _position = AnimationController(vsync: _navigator);
    _entry = OverlayEntry(
      builder: (context) => AnimatedBuilder(
        animation: _position,
        builder: (context, _) => _SheetFrame(
          value: _position.value,
          slides: true,
          dock: _dock,
          dockRect: _dockRect(_dock, _navigator),
          scrim: true,
          // Taps with another finger do not reach the app beneath.
          child: const AbsorbPointer(
            child: ExcludeSemantics(
              child: PlayerPreview(child: PlayerScreen()),
            ),
          ),
        ),
      ),
    );
    _navigator.overlay!.insert(_entry);
  }

  final NavigatorState _navigator;
  final PlayerDock? _dock;
  final _Labels _labels;
  late final AnimationController _position;
  late final OverlayEntry _entry;
  bool _ended = false;

  double get _travel => _travelIn(_navigator, _dock);

  /// Moves the sheet by [delta] logical pixels; negative is up.
  void update(double delta) {
    final travel = _travel;
    if (_ended || travel <= 0) return;
    _position.value -= delta / travel;
  }

  /// Lets go at [velocity] logical pixels per second, negative up: the
  /// player opens from where the sheet is, or the sheet goes back down.
  void end(double velocity) {
    if (_ended) return;
    _ended = true;
    final (:opens, velocity: speed) = _letGo(
      _position.value,
      velocity,
      _travel,
    );
    if (opens) {
      _navigator.push(
        PlayerSheetRoute._fromDrag(
          dock: _dock,
          labels: _labels,
          from: _position.value,
          velocity: speed,
        ),
      );
      // Gone in the same frame the route first shows.
      _remove();
    } else {
      _position
          .animateBackWith(_springTo(_position.value, 0, speed))
          .whenCompleteOrCancel(_remove);
    }
  }

  /// Takes the sheet away at once, when the swipe cannot go on: its
  /// mini-player is gone.
  void cancel() {
    if (_ended) return;
    _ended = true;
    _remove();
  }

  void _remove() {
    _entry
      ..remove()
      ..dispose();
    // After the entry's widgets, which listen to it, are gone.
    WidgetsBinding.instance.addPostFrameCallback((_) => _position.dispose());
  }
}

/// Texts for the route, read where it is opened.
class _Labels {
  const _Labels({required this.barrier, required this.sheet});

  factory _Labels.of(BuildContext context) {
    final material = MaterialLocalizations.of(context);
    return _Labels(
      barrier: material.scrimLabel,
      sheet: switch (defaultTargetPlatform) {
        // Screen readers name the sheet as the platform's own sheets do.
        TargetPlatform.iOS || TargetPlatform.macOS => '',
        _ => material.dialogLabel,
      },
    );
  }

  final String barrier;
  final String sheet;
}

/// The player as a sheet over the app.
///
/// It follows the finger while it is swiped down, and otherwise moves on a
/// spring that starts at the finger's speed. With a mini-player on screen it
/// opens from it: at first the sheet lies exactly on the mini-player and
/// shows it, and that fades out as the sheet rises. Closing runs the same
/// way back.
class PlayerSheetRoute extends PageRoute<void> {
  PlayerSheetRoute._(BuildContext context)
    : _dock = PlayerDock.of(context),
      _labels = _Labels.of(context),
      _from = null,
      _velocity = 0,
      _followsFinger = false,
      super(fullscreenDialog: true, barrierDismissible: true);

  /// Takes over from a swipe up that let go `from` this far up, moving at
  /// `velocity` (share of the way per second).
  PlayerSheetRoute._fromDrag({
    required this._dock,
    required this._labels,
    required double this._from,
    required this._velocity,
  }) : _followsFinger = true,
       super(fullscreenDialog: true, barrierDismissible: true);

  final PlayerDock? _dock;
  final _Labels _labels;
  final double? _from;
  final double _velocity;

  /// Whether the finger has moved the sheet since it last settled; the sheet
  /// then slides even with reduced motion, so it does not jump.
  bool _followsFinger;

  /// Whether a drag on the sheet is under way.
  bool _dragging = false;

  /// The speed the sheet was let go at, for the spring that moves it on.
  double _releaseVelocity = 0;

  @override
  bool get opaque => false;

  @override
  bool get maintainState => true;

  @override
  Color get barrierColor => _scrim;

  @override
  Curve get barrierCurve => _scrimCurve;

  @override
  String get barrierLabel => _labels.barrier;

  /// Unused: the sheet moves on [createSimulation]'s spring instead.
  @override
  Duration get transitionDuration => const Duration(milliseconds: 400);

  @override
  Simulation createSimulation({required bool forward}) {
    final velocity = _releaseVelocity;
    _releaseVelocity = 0;
    return _springTo(controller!.value, forward ? 1 : 0, velocity);
  }

  @override
  void install() {
    super.install();
    controller!.addStatusListener((status) {
      if (status.isCompleted || status.isDismissed) _followsFinger = false;
    });
  }

  @override
  TickerFuture didPush() {
    if (_from case final from?) {
      controller!.value = from;
      _releaseVelocity = _velocity;
    }
    return super.didPush();
  }

  void _dragBy(double delta) {
    if (!isActive) return;
    final travel = _travel;
    if (travel <= 0) return;
    _followsFinger = true;
    controller!.value -= delta / travel;
  }

  void _release(double velocity) {
    if (!isActive) return;
    final (:opens, velocity: speed) = _letGo(
      controller!.value,
      velocity,
      _travel,
    );
    if (opens || !isCurrent) {
      controller!.animateWith(_springTo(controller!.value, 1, speed));
    } else {
      _releaseVelocity = speed;
      navigator!.pop();
    }
  }

  double get _travel => _travelIn(navigator!, _dock);

  @override
  Widget buildPage(
    BuildContext context,
    Animation<double> animation,
    Animation<double> secondaryAnimation,
  ) => const PlayerScreen();

  @override
  Widget buildTransitions(
    BuildContext context,
    Animation<double> animation,
    Animation<double> secondaryAnimation,
    Widget child,
  ) => _SheetFrame(
    value: animation.value,
    // With reduced motion the sheet fades in and out in place, unless the
    // finger has moved it.
    slides: _followsFinger || !Motion.reduced(context),
    dock: _dock,
    dockRect: _dockRect(_dock, navigator),
    child: Semantics(
      scopesRoute: true,
      namesRoute: true,
      label: _labels.sheet,
      explicitChildNodes: true,
      // The barrier behind the sheet is not reached through it.
      hitTestBehavior: SemanticsHitTestBehavior.opaque,
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        // From where the finger went down, so the sheet stays under it.
        dragStartBehavior: DragStartBehavior.down,
        onVerticalDragStart: (_) => _dragging = true,
        onVerticalDragUpdate: (details) => _dragBy(details.primaryDelta ?? 0),
        onVerticalDragEnd: (details) {
          _dragging = false;
          _release(details.primaryVelocity ?? 0);
        },
        onVerticalDragCancel: () {
          // Also called when a tap wins instead of a drag.
          if (!_dragging) return;
          _dragging = false;
          _release(0);
        },
        child: child,
      ),
    ),
  );
}

/// The sheet [value] of the way up, with [child] filling it; the same for
/// the route and for a swipe that is opening it.
class _SheetFrame extends StatelessWidget {
  const _SheetFrame({
    required this.value,
    required this.slides,
    required this.dock,
    required this.dockRect,
    required this.child,
    this.scrim = false,
  });

  final double value;

  /// Whether the sheet slides up; otherwise it fades in where it ends.
  final bool slides;

  /// The mini-player the sheet rises from, and where it is on screen.
  final PlayerDock? dock;
  final Rect? dockRect;

  final Widget child;

  /// Whether to draw the scrim; the route has its own barrier.
  final bool scrim;

  /// Top corners of the open sheet, as the app's other sheets.
  static const _radius = 12.0;

  /// Share of the way up over which the mini-player fades out.
  static const _dockFade = 0.2;

  @override
  Widget build(BuildContext context) {
    final media = MediaQuery.of(context);
    final geometry = _sheetGeometry(media, dockRect);
    final dock = this.dock;
    // How far the mini-player has given way to the player.
    final risen = slides && dock != null && dockRect != null
        ? (value / _dockFade).clamp(0.0, 1.0)
        : 1.0;
    final top = slides
        ? geometry.openTop + (1 - value) * geometry.travel
        : geometry.openTop;

    return Stack(
      children: [
        if (scrim)
          Positioned.fill(
            child: ColoredBox(
              color: Color.lerp(
                _scrim.withValues(alpha: 0),
                _scrim,
                _scrimCurve.transform(value.clamp(0.0, 1.0)),
              )!,
            ),
          ),
        Positioned(
          left: 0,
          right: 0,
          top: top,
          height: media.size.height - geometry.openTop,
          child: MediaQuery.removePadding(
            context: context,
            removeTop: true,
            child: Opacity(
              opacity: slides ? 1 : value,
              child: ClipRRect(
                borderRadius: BorderRadius.vertical(
                  top: Radius.circular(_radius * risen),
                ),
                child: Stack(
                  children: [
                    Positioned.fill(child: child),
                    if (dock != null && risen < 1)
                      Positioned(
                        left: 0,
                        right: 0,
                        top: 0,
                        child: IgnorePointer(
                          child: ExcludeSemantics(
                            child: Opacity(
                              opacity: 1 - risen,
                              child: dock.copy,
                            ),
                          ),
                        ),
                      ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }
}

/// Where the open sheet's top edge is, and how far it travels between
/// closed, on the mini-player or below the screen, and open.
({double openTop, double travel}) _sheetGeometry(
  MediaQueryData media,
  Rect? dock,
) {
  final openTop = media.padding.top;
  final closedTop = dock?.top ?? media.size.height;
  return (openTop: openTop, travel: math.max(0, closedTop - openTop));
}

/// How far the sheet travels in [navigator] between closed and open, read
/// without subscribing to the screen: for gestures, outside builds.
double _travelIn(NavigatorState navigator, PlayerDock? dock) => _sheetGeometry(
  navigator.context.getInheritedWidgetOfExactType<MediaQuery>()!.data,
  _dockRect(dock, navigator),
).travel;

/// The mini-player's rectangle in [navigator]'s overlay, if it is on
/// screen.
Rect? _dockRect(PlayerDock? dock, NavigatorState? navigator) {
  final box = dock?.miniPlayer.currentContext?.findRenderObject();
  final overlay = navigator?.overlay?.context.findRenderObject();
  if (box is! RenderBox || !box.hasSize || overlay is! RenderBox) return null;
  final rect = box.localToGlobal(Offset.zero, ancestor: overlay) & box.size;
  return rect.isEmpty ? null : rect;
}
