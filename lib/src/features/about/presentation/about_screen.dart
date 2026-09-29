import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:languagetransfer/src/core/theme/lt_colors.dart';
import 'package:languagetransfer/src/l10n/app_localizations.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:url_launcher/url_launcher.dart';

/// Loaded once; used for the version line and the licenses page.
final packageInfoProvider = FutureProvider<PackageInfo>(
  (ref) => PackageInfo.fromPlatform(),
);

/// A feedback email with [subject]. Not built with `queryParameters`, which
/// writes spaces as "+": mail apps show them as they are.
@visibleForTesting
Uri feedbackMail(String subject) => Uri(
  scheme: 'mailto',
  path: 'info@languagetransfer.org',
  query: 'subject=${Uri.encodeComponent(subject)}',
);

/// About Language Transfer and the app. Text and links follow the Expo app
/// (upstream `src/components/about/AboutScreen.tsx`).
class AboutScreen extends ConsumerWidget {
  const AboutScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context);
    final text = Theme.of(context).textTheme;
    final colors = LtColors.of(context);
    final version = ref.watch(packageInfoProvider).value?.version;

    void open(String url) => launchUrl(
      Uri.parse(url),
      mode: LaunchMode.externalApplication,
    ).ignore();

    return Scaffold(
      appBar: AppBar(title: Text(l10n.about)),
      body: ListView(
        padding: const EdgeInsets.only(bottom: 32),
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 8, 20, 0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Image.asset(
                  'assets/images/lt-logo-wordmark.png',
                  height: 140,
                  color: colors.ink,
                  semanticLabel: l10n.appTitle,
                ),
                const SizedBox(height: 20),
                Text(l10n.aboutIntro, style: text.bodyLarge),
                const SizedBox(height: 12),
                Text(l10n.aboutMore, style: text.bodyLarge),
                const SizedBox(height: 8),
              ],
            ),
          ),
          _Link(
            label: l10n.visitWebsite,
            onTap: () => open('https://www.languagetransfer.org/about'),
          ),
          _Link(
            label: l10n.faq,
            onTap: () => open('https://www.languagetransfer.org/faq'),
          ),
          _Link(
            label: l10n.substack,
            onTap: () => open('https://languagetransfer.substack.com/'),
          ),
          _Link(
            label: l10n.sendFeedback,
            icon: Icons.mail_outline,
            onTap: () => launchUrl(feedbackMail(l10n.feedbackSubject)).ignore(),
          ),
          const Divider(indent: 20, endIndent: 20, height: 32),
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 0, 20, 8),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Semantics(
                  header: true,
                  child: Text(l10n.privacy, style: text.titleSmall),
                ),
                const SizedBox(height: 4),
                Text(l10n.privacyBody, style: text.bodyLarge),
              ],
            ),
          ),
          _Link(
            label: l10n.sourceCode,
            onTap: () => open('https://github.com/language-transfer/lt-app'),
          ),
          _Link(
            label: l10n.licenses,
            icon: Icons.chevron_right,
            onTap: () => showLicensePage(
              context: context,
              applicationName: l10n.appTitle,
              applicationVersion: version,
            ),
          ),
          if (version != null)
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
              child: Text(l10n.version(version), style: text.bodyMedium),
            ),
        ],
      ),
    );
  }
}

class _Link extends StatelessWidget {
  const _Link({
    required this.label,
    required this.onTap,
    this.icon = Icons.open_in_new,
  });

  final String label;
  final VoidCallback onTap;
  final IconData icon;

  @override
  Widget build(BuildContext context) => ListTile(
    contentPadding: const EdgeInsets.symmetric(horizontal: 20),
    title: Text(label),
    trailing: Icon(icon, size: 20),
    onTap: onTap,
  );
}
