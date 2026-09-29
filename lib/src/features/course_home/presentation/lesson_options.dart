import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:languagetransfer/src/core/widgets/action_sheet.dart';
import 'package:languagetransfer/src/features/catalog/domain/lesson.dart';
import 'package:languagetransfer/src/features/downloads/presentation/lesson_download_tile.dart';
import 'package:languagetransfer/src/features/progress/application/progress_providers.dart';
import 'package:languagetransfer/src/l10n/app_localizations.dart';

/// The options of [lesson], the same on the course page and in the player:
/// marking it finished or not, and its download, followed by [more].
///
/// [finished] comes from the caller, which watches it: read only now, the
/// course's progress may not have loaded yet.
void showLessonOptions(
  BuildContext context,
  WidgetRef ref, {
  required String courseId,
  required Lesson lesson,
  required bool finished,
  List<Widget> more = const [],
}) {
  final l10n = AppLocalizations.of(context);
  // Read now: the sheet may outlive the widget that opened it.
  final completion = ref.read(lessonCompletionProvider);
  unawaited(
    showActionSheet(
      context,
      title: lesson.title,
      actions: [
        SheetAction(
          icon: finished ? Icons.remove_done : Icons.done,
          label: finished ? l10n.markNotFinished : l10n.markFinished,
          onSelected: () => unawaited(
            completion.setFinished(courseId, lesson.id, finished: !finished),
          ),
        ),
        LessonDownloadTile(courseId: courseId, lesson: lesson),
        ...more,
      ],
    ),
  );
}
