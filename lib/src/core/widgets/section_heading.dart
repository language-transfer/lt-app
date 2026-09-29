import 'package:flutter/material.dart';

/// The heading of a group of rows, in secondary text and announced as a
/// heading.
class SectionHeading extends StatelessWidget {
  const SectionHeading(
    this.label, {
    this.padding = const EdgeInsets.fromLTRB(20, 20, 20, 4),
    super.key,
  });

  final String label;
  final EdgeInsetsGeometry padding;

  @override
  Widget build(BuildContext context) => Padding(
    padding: padding,
    child: Semantics(
      header: true,
      child: Text(label, style: Theme.of(context).textTheme.bodyMedium),
    ),
  );
}
