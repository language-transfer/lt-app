#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."
# Disabled pending the upstream react-native-screens fix; see docs/android-rapid-back.md.
if [[ "${1:-}" != "--run-disabled" ]]; then
  echo "SKIP: Android rapid-Back regression pending upstream react-native-screens update (PR #3777)."
  echo "See docs/android-rapid-back.md for the upgrade and re-enable checklist."
  exit 0
fi
# Requires a running Android app built with the installed native dependencies.
# Maestro settles between commands, so two Maestro `back` steps miss this race.
# Inject the Back events directly, with no animation wait between them.
output_dir="artifacts/maestro/rapid-back/$(date +%Y%m%d-%H%M%S)"
mkdir -p "$output_dir"
maestro test --test-output-dir "$output_dir/setup" maestro/regressions/rapid-back-setup.yaml
adb shell input keyevent KEYCODE_BACK
adb shell input keyevent KEYCODE_BACK
maestro test --test-output-dir "$output_dir/verify" maestro/regressions/rapid-back-verify.yaml
