# Repository guidelines

## Project structure

- Flutter app for iOS and Android. Entry point `lib/main.dart`, app widget in
  `lib/src/app.dart`.
- `lib/src/core/` holds cross-cutting code (network, storage, routing, theme).
- `lib/src/features/<feature>/` holds one feature each, split into `data/`
  (repositories, API access), `domain/` (models and rules), `application/`
  (Riverpod providers and controllers) and `presentation/` (widgets).
- Objects that the player or the downloads share with the screens are
  created once in `lib/main.dart` and handed to Riverpod as overrides; the
  widget test harness does the same.
- Tests mirror `lib/src/` under `test/`. Small JSON fixtures in the real
  backend format live in `test/fixtures/`.
- `test/app/` renders the whole app with fixture data
  (`test/helpers/app_harness.dart`): every screen at several sizes and text
  scales, and against the accessibility guidelines. Add new screens there.

## Commands

The Flutter version is pinned in `.fvmrc`; run Flutter through FVM.

- `fvm flutter pub get`: install dependencies.
- `fvm flutter run`: run on a device or simulator.
- `fvm dart run build_runner build`: regenerate drift code after changing
  tables. Generated `*.g.dart` files are committed, so a fresh clone builds
  without running the generator.
- `fvm flutter analyze`: lints (`very_good_analysis`).
- `fvm flutter test`: unit and widget tests.
- `fvm flutter test --tags live --run-skipped`: contract tests against the
  real backend (skipped in the regular run).
- `fvm flutter test integration_test/<file> -d <device>`: on-device tests of
  audio playback, the playback rules and downloads (real backend, real
  player, the platform's background downloads).
- `fvm flutter drive --driver=test_driver/screenshots.dart
  --target=integration_test/screenshot_tour_test.dart -d <device>`:
  screenshots of every screen in light mode and of the course list, course
  page and player in dark mode, written to
  `build/screenshots/<platform>/`. Attach them to pull requests with UI
  changes. Do not touch the device while it runs.

## Rules

- Run `fvm flutter analyze` and `fvm flutter test` after making changes,
  **before responding back to the user**, and again before a pull request.
- GitHub Actions are prohibited. Do not add workflows under
  `.github/workflows/`.
- Commit messages follow Conventional Commits: an imperative subject of at
  most 72 characters (e.g. `fix(player): keep the position after a call`)
  and a body that explains why.
- Do not commit secrets or large media. Course audio is never bundled.
- Behaviour copied from the Expo app keeps a comment naming the upstream file
  it comes from, so it stays traceable.
- Keep the application id `org.languagetransfer` for release builds; debug and
  profile builds use `org.languagetransfer.dev`.
