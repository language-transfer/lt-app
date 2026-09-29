import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:languagetransfer/src/core/routing/app_router.dart';
import 'package:languagetransfer/src/core/theme/app_theme.dart';
import 'package:languagetransfer/src/l10n/app_localizations.dart';

class LanguageTransferApp extends ConsumerWidget {
  const LanguageTransferApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) => MaterialApp.router(
    routerConfig: ref.watch(routerProvider),
    onGenerateTitle: (context) => AppLocalizations.of(context).appTitle,
    theme: AppTheme.light(),
    darkTheme: AppTheme.dark(),
    localizationsDelegates: AppLocalizations.localizationsDelegates,
    supportedLocales: AppLocalizations.supportedLocales,
    debugShowCheckedModeBanner: false,
    // Screens without an app bar would otherwise keep whatever status bar
    // style came before; follow the theme instead. Course tints are light in
    // the light theme and dark in the dark one, so this suits them too.
    builder: (context, child) => AnnotatedRegion<SystemUiOverlayStyle>(
      value: Theme.of(context).brightness == Brightness.light
          ? SystemUiOverlayStyle.dark
          : SystemUiOverlayStyle.light,
      child: child!,
    ),
  );
}
