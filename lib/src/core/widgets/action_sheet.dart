import 'package:flutter/material.dart';

/// Shows [actions] in a sheet over the whole app, the mini-player included,
/// under an optional [title] naming what they act on.
///
/// Sheets otherwise open on the nearest navigator, which for the screens
/// above the mini-player ends at its top edge: the sheet would rise from the
/// mini-player instead of from the bottom of the screen.
Future<void> showActionSheet(
  BuildContext context, {
  required List<Widget> actions,
  String? title,
}) => showModalBottomSheet<void>(
  context: context,
  useRootNavigator: true,
  // As tall as its actions, and scrolls when large text makes them taller
  // than the screen.
  isScrollControlled: true,
  useSafeArea: true,
  builder: (sheetContext) => SafeArea(
    top: false,
    child: SingleChildScrollView(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (title != null)
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 8),
              child: Semantics(
                header: true,
                child: Text(
                  title,
                  style: Theme.of(sheetContext).textTheme.titleMedium,
                ),
              ),
            ),
          ...actions,
          const SizedBox(height: 8),
        ],
      ),
    ),
  ),
);

/// One action in an action sheet: closes the sheet, then runs [onSelected].
class SheetAction extends StatelessWidget {
  const SheetAction({
    required this.icon,
    required this.label,
    required this.onSelected,
    super.key,
  });

  final IconData icon;
  final String label;
  final VoidCallback onSelected;

  @override
  Widget build(BuildContext context) => ListTile(
    leading: Icon(icon),
    title: Text(label),
    onTap: () {
      Navigator.of(context).pop();
      onSelected();
    },
  );
}
