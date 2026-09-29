import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:languagetransfer/src/core/theme/lt_colors.dart';
import 'package:languagetransfer/src/core/widgets/section_heading.dart';
import 'package:languagetransfer/src/core/widgets/titled_page.dart';
import 'package:languagetransfer/src/features/catalog/domain/lesson.dart';
import 'package:languagetransfer/src/features/settings/application/settings_providers.dart';
import 'package:languagetransfer/src/features/settings/domain/app_settings.dart';
import 'package:languagetransfer/src/l10n/app_localizations.dart';

class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context);
    final settings = ref.watch(settingsProvider).value;
    final repository = ref.watch(settingsRepositoryProvider);

    Future<void> update(AppSettings Function(AppSettings) change) =>
        repository.update(change);

    return TitledPage(
      title: l10n.settings,
      slivers: [
        if (settings != null)
          SliverList.list(
            children: [
              SectionHeading(l10n.playback),
              SwitchListTile(
                title: Text(l10n.autoplayTitle),
                subtitle: Text(l10n.autoplayBody),
                value: settings.autoplay,
                onChanged: (value) =>
                    update((s) => s.copyWith(autoplay: value)),
              ),
              _QualitySetting(
                title: l10n.streamingQuality,
                body: l10n.streamingQualityBody,
                value: settings.streamQuality,
                onChanged: (quality) =>
                    update((s) => s.copyWith(streamQuality: quality)),
              ),
              SectionHeading(l10n.downloads),
              SwitchListTile(
                title: Text(l10n.downloadOnlyOnWifi),
                subtitle: Text(l10n.downloadOnlyOnWifiBody),
                value: settings.downloadOnlyOnWifi,
                onChanged: (value) =>
                    update((s) => s.copyWith(downloadOnlyOnWifi: value)),
              ),
              SwitchListTile(
                title: Text(l10n.autoDeleteFinished),
                subtitle: Text(l10n.autoDeleteFinishedBody),
                value: settings.autoDeleteFinished,
                onChanged: (value) =>
                    update((s) => s.copyWith(autoDeleteFinished: value)),
              ),
              _QualitySetting(
                title: l10n.downloadQuality,
                body: l10n.downloadQualityBody,
                value: settings.downloadQuality,
                onChanged: (quality) =>
                    update((s) => s.copyWith(downloadQuality: quality)),
              ),
            ],
          ),
      ],
    );
  }
}

class _QualitySetting extends StatelessWidget {
  const _QualitySetting({
    required this.title,
    required this.body,
    required this.value,
    required this.onChanged,
  });

  final String title;
  final String body;
  final AudioQuality value;
  final ValueChanged<AudioQuality> onChanged;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final text = Theme.of(context).textTheme;
    final colors = LtColors.of(context);
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: text.titleSmall),
          const SizedBox(height: 2),
          Text(body, style: text.bodyMedium),
          const SizedBox(height: 12),
          SegmentedButton<AudioQuality>(
            // As wide as the text above it.
            expandedInsets: EdgeInsets.zero,
            showSelectedIcon: false,
            segments: [
              ButtonSegment(
                value: AudioQuality.low,
                label: Text(l10n.qualityLow),
              ),
              ButtonSegment(
                value: AudioQuality.high,
                label: Text(l10n.qualityHigh),
              ),
            ],
            selected: {value},
            onSelectionChanged: (selection) => onChanged(selection.single),
            style: SegmentedButton.styleFrom(
              selectedBackgroundColor: colors.ink,
              selectedForegroundColor: colors.paper,
              textStyle: text.labelMedium,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(4),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
