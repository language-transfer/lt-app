import 'package:flutter/material.dart';

/// A course's cover, the same as on the lock screen: a square of [size]
/// with rounded corners, decoded at the size it is shown. Decorative:
/// screen readers get the course from the text beside it.
class CourseCover extends StatelessWidget {
  const CourseCover({
    required this.asset,
    required this.size,
    required this.radius,
    super.key,
  });

  /// From `Course.cover`.
  final String asset;

  final double size;
  final double radius;

  @override
  Widget build(BuildContext context) => ClipRRect(
    borderRadius: BorderRadius.circular(radius),
    child: Image.asset(
      asset,
      width: size,
      height: size,
      cacheWidth: (size * MediaQuery.devicePixelRatioOf(context)).round(),
      excludeFromSemantics: true,
    ),
  );
}
