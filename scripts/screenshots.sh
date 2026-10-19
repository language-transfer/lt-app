#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
root="$PWD"
platform="${1:-}"
[[ $# -gt 0 ]] && shift
size=all
mode=capture
skip_build=false
artifact=
usage() {
  cat <<'HELP'
Usage: screenshots.sh ios|android [options]
  --size phone|tablet|all   Default: all
  --prepare                Build/install/launch only; leave devices open for manual captures
  --skip-build             Reuse artifacts/screenshots/build output (or --artifact)
  --artifact PATH          Existing simulator .app or Android .apk; implies --skip-build
  --help                   Show this help
Environment:
  LT_IOS_PHONE / LT_IOS_TABLET       Exact simulator names or UDIDs (auto-selected by default)
  LT_ANDROID_PHONE / LT_ANDROID_TABLET  AVD hardware profiles (pixel_6 / pixel_c)
  LT_ANDROID_PORT                  First dedicated emulator port (default: 5580)
HELP
}
while [[ $# -gt 0 ]]; do
  case "$1" in
    --size) size="${2:?Missing size}"; shift 2 ;;
    --prepare) mode=prepare; shift ;;
    --skip-build) skip_build=true; shift ;;
    --artifact) artifact="${2:?Missing artifact}"; skip_build=true; shift 2 ;;
    --help|-h) usage; exit 0 ;;
    *) usage >&2; exit 2 ;;
  esac
done
[[ "$platform" == ios || "$platform" == android ]] || { usage >&2; exit 2; }
[[ "$size" == phone || "$size" == tablet || "$size" == all ]] || { usage >&2; exit 2; }
if [[ "$platform" == ios && "$(uname -s)" != Darwin ]]; then
  echo 'Run the iOS command in the repository on a Mac with Xcode (see screenshots/README.md).' >&2
  exit 1
fi
if [[ "$platform" == android && "$(uname -sm)" != 'Linux x86_64' ]]; then
  echo 'Automated Android captures currently require x86_64 Linux.' >&2
  exit 1
fi
export MAESTRO_CLI_NO_ANALYTICS=true MAESTRO_CLI_ANALYSIS_NOTIFICATION_DISABLED=true
export CI=1
if [[ "$platform" == ios ]]; then
  export MAESTRO_DRIVER_STARTUP_TIMEOUT="${MAESTRO_DRIVER_STARTUP_TIMEOUT:-180000}"
fi
build_dir="$root/artifacts/screenshots/build"
mkdir -p "$build_dir"
if [[ "$skip_build" == false ]]; then
  [[ -d node_modules ]] || npm ci
  if [[ "$platform" == ios ]]; then
    npx expo prebuild --platform ios --no-install
    npm run prepare:preloaded-content
    (cd ios && pod install)
    xcodebuild -workspace ios/LanguageTransfer.xcworkspace -scheme LanguageTransfer \
      -configuration Release -sdk iphonesimulator -destination 'generic/platform=iOS Simulator' \
      -derivedDataPath "$build_dir/ios" CODE_SIGNING_ALLOWED=NO build
  else
    npx expo prebuild --platform android --no-install
    # Public debug key for this local capture build; never require release credentials.
    (cd android && ./gradlew assembleRelease -PreactNativeArchitectures=x86_64 \
      -PMYAPP_UPLOAD_STORE_FILE=debug.keystore -PMYAPP_UPLOAD_KEY_ALIAS=androiddebugkey \
      -PMYAPP_UPLOAD_STORE_PASSWORD=android -PMYAPP_UPLOAD_KEY_PASSWORD=android)
    mkdir -p "$build_dir/android"
    cp android/app/build/outputs/apk/release/app-release.apk "$build_dir/android/app.apk"
  fi
fi
if [[ -z "$artifact" ]]; then
  if [[ "$platform" == ios ]]; then
    artifact="$build_dir/ios/Build/Products/Release-iphonesimulator/LanguageTransfer.app"
  else
    artifact="$build_dir/android/app.apk"
  fi
fi
[[ -e "$artifact" ]] || { echo "Build artifact missing: $artifact. Run without --skip-build." >&2; exit 1; }
sizes=(phone tablet)
[[ "$size" != all ]] && sizes=("$size")
emulator_pid=
cleanup() {
  if [[ -n "$emulator_pid" && "$mode" != prepare ]]; then
    kill "$emulator_pid" 2>/dev/null || true
    wait "$emulator_pid" 2>/dev/null || true
  fi
}
trap cleanup EXIT
for device_size in "${sizes[@]}"; do
  output="$root/screenshots/$platform/$device_size"
  run_dir="$root/artifacts/screenshots/$platform/$device_size/$(date +%Y%m%d-%H%M%S)"
  mkdir -p "$output" "$run_dir"
  if [[ "$platform" == ios ]]; then
    xcrun simctl list devices available --json > "$run_dir/devices.json"
    device=$(python3 scripts/screenshots/select-ios-device.py "$run_dir/devices.json" "$device_size")
    state=$(xcrun simctl list devices available --json | python3 -c \
      'import json,sys; print(next(d["state"] for ds in json.load(sys.stdin)["devices"].values() for d in ds if d["udid"] == sys.argv[1]))' "$device")
    [[ "$state" == Booted ]] || xcrun simctl boot "$device"
    xcrun simctl bootstatus "$device" -b
    xcrun simctl ui "$device" appearance light
    xcrun simctl status_bar "$device" override --time '9:41' --dataNetwork wifi \
      --wifiMode active --wifiBars 3 --batteryState charged --batteryLevel 100
    # Uninstall only on dedicated capture devices, never erase an entire simulator.
    xcrun simctl uninstall "$device" org.languagetransfer 2>/dev/null || true
    xcrun simctl install "$device" "$artifact"
    if [[ "$mode" == prepare ]]; then
      xcrun simctl launch "$device" org.languagetransfer
      open -a Simulator --args -CurrentDeviceUDID "$device"
    fi
  else
    port="${LT_ANDROID_PORT:-5580}"
    [[ "$device_size" == tablet ]] && port=$((port + 2))
    [[ "$port" =~ ^[0-9]+$ ]] && (( port >= 5554 && port <= 5682 && port % 2 == 0 )) || { echo 'Invalid emulator port.' >&2; exit 2; }
    device="emulator-$port"
    # Refuse to take over another emulator on our selected port.
    if adb -s "$device" get-state >/dev/null 2>&1; then
      echo "$device already running. Stop it or choose LT_ANDROID_PORT." >&2; exit 1
    fi
    profile="${LT_ANDROID_PHONE:-pixel_6}"
    [[ "$device_size" == tablet ]] && profile="${LT_ANDROID_TABLET:-pixel_c}"
    avd="lt_screenshots_$device_size"
    export ANDROID_AVD_HOME="$root/artifacts/screenshots/avd"
    mkdir -p "$ANDROID_AVD_HOME"
    if [[ ! -f "$ANDROID_AVD_HOME/$avd.ini" ]]; then
      echo no | avdmanager create avd --name "$avd" --package 'system-images;android-36;google_apis;x86_64' --device "$profile"
    fi
    emulator_args=(-avd "$avd" -port "$port" -no-snapshot -wipe-data -no-boot-anim -gpu swiftshader_indirect)
    [[ "$mode" != prepare ]] && emulator_args+=(-no-window -no-audio)
    emulator "${emulator_args[@]}" > "$run_dir/emulator.log" 2>&1 &
    emulator_pid=$!
    booted=false
    for ((attempt=0; attempt<180; attempt++)); do
      kill -0 "$emulator_pid" 2>/dev/null || { cat "$run_dir/emulator.log" >&2; exit 1; }
      if [[ "$(adb -s "$device" shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')" == 1 ]]; then booted=true; break; fi
      sleep 2
    done
    [[ "$booted" == true ]] || { echo "Emulator boot timed out: $run_dir/emulator.log" >&2; exit 1; }
    adb -s "$device" shell input keyevent KEYCODE_WAKEUP
    adb -s "$device" shell wm dismiss-keyguard
    adb -s "$device" shell cmd uimode night no
    adb -s "$device" shell settings put global window_animation_scale 0
    adb -s "$device" shell settings put global transition_animation_scale 0
    adb -s "$device" shell settings put global animator_duration_scale 0
    adb -s "$device" shell settings put global sysui_demo_allowed 1
    adb -s "$device" shell am broadcast -a com.android.systemui.demo -e command enter
    adb -s "$device" shell am broadcast -a com.android.systemui.demo -e command notifications -e visible false
    adb -s "$device" shell am broadcast -a com.android.systemui.demo -e command network -e wifi show -e level 4 -e fully true
    adb -s "$device" shell am broadcast -a com.android.systemui.demo -e command clock -e hhmm 0941
    adb -s "$device" shell am broadcast -a com.android.systemui.demo -e command battery -e level 100 -e plugged false
    adb -s "$device" install -r "$artifact"
    if [[ "$mode" == prepare ]]; then
      adb -s "$device" shell monkey -p org.languagetransfer 1
    fi
  fi
  if [[ "$mode" == capture ]]; then
    # Explicit paths work with the flake's pinned Maestro 2.0.9.
    maestro --device "$device" test --test-output-dir "$run_dir" \
      -e "SCREENSHOT_DIR=$run_dir" scripts/screenshots/capture.yaml
    for shot in 01-courses 02-spanish 03-lessons 04-player; do
      [[ -s "$run_dir/$shot.png" ]] || { echo "Missing screenshot: $run_dir/$shot.png" >&2; exit 1; }
    done
    cp "$run_dir/"*.png "$output/"
  fi
  python3 scripts/screenshots/manifest.py "$platform" "$device_size" "$device" "$artifact" "$output" "$mode"
  echo "$platform $device_size: $output ($device)"
  cleanup
  emulator_pid=
done
