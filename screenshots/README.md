# Native app screenshots

Run these commands **from the repository root**. Maestro drives the actual native
app, capturing courses, the Spanish course, its lesson list, and the paused player.
The app needs Internet access for metadata/audio (iOS includes selected offline
lessons). These are full-resolution PNGs, not resized phone images. The default
Android tablet uses the Pixel C's natural landscape orientation.

```sh
# Linux: API 36 Android phone + tablet, headless emulators
nix run .#screenshots-android

# Mac: iPhone + 13-inch iPad Pro, newest installed iOS runtime
nix run .#screenshots-ios

# Reuse the previous build; target only the iPad
nix run .#screenshots-ios -- --skip-build --size tablet
```

Files belong in `ios/phone/`, `ios/tablet/`, `android/phone/`, and
`android/tablet/`. Each successful capture writes `capture.json` with actual PNG
sizes, device ID, time, source revision, and artifact checksum. Review PNGs
before adding them to Git.
Failures preserve the previous screenshots; build products and automation logs
stay under ignored `artifacts/screenshots/`. A screenshot build is local only:
Android uses the public debug signing key; iOS disables simulator code signing.
The normal release signing setup is unchanged. Neither command uses EAS.

## Requirements

- Nix with flakes enabled. Dependencies are installed with `npm ci` if absent.
- Android automation currently runs on x86_64 Linux with KVM available. The flake
  supplies the emulator and API 36 Google APIs system image. macOS Android shells
  provide build tools but do not currently include emulator images.
- iOS needs Xcode selected and an iOS simulator runtime installed in Xcode
  Settings > Components. Nix supplies Node, CocoaPods, and Maestro; Xcode supplies
  the SDK and simulator. A usable macOS login session may be needed by XCTest.

## Remote Mac via Git

Push this branch, then fetch and check it out in the repository under the Mac's
logged-in account (`timothy@jobs.local`). Run `npm ci` if dependencies have
changed, then `nix run .#screenshots-ios` there.
Commit the reviewed PNGs on that branch, push, and pull them back on Linux.
This uses Git for source and artifact transfer; no source directories are copied
through SSH. Use a separate Git worktree if the Mac has other work in progress.

## Manual capture / Xcode fallback

```sh
# Build, install, launch, and open the iPad without running Maestro
nix run .#screenshots-ios -- --prepare --size tablet
# Show Android emulators for manual capture
nix run .#screenshots-android -- --prepare
```

On the Mac, open Simulator and choose the `LT Screenshots tablet ...` device.
Navigate to the desired screen and use File > Save Screen, or capture explicitly:

```sh
xcrun simctl list devices available
xcrun simctl io YOUR_DEVICE_UDID screenshot screenshots/ios/tablet/01-courses.png
# Optional: open the generated project in Xcode
open ios/LanguageTransfer.xcworkspace
```

`--prepare` leaves devices running. Automated Android capture stops only the
emulator it started; iOS devices stay available in Simulator. Fresh capture
uninstalls the app on the selected iOS device and wipes dedicated Android AVDs.
The default iOS devices are dedicated to screenshots; **overriding a device means
its Language Transfer app data will be removed**, although other apps are kept.

Use `LT_IOS_PHONE` / `LT_IOS_TABLET` for an exact simulator name or UDID.
Use `LT_ANDROID_PHONE` / `LT_ANDROID_TABLET` for hardware profiles from
`avdmanager list device`; profiles apply when the dedicated AVD is first created.
Use `LT_ANDROID_PORT` to avoid a port conflict (default 5580, tablet uses +2).
An existing `.app` or `.apk` can be supplied with `--artifact PATH`.
All switches are listed by `nix run .#screenshots-ios -- --help`.

The flow is in [`scripts/screenshots/capture.yaml`](../scripts/screenshots/capture.yaml).
See [Maestro screenshot commands](https://docs.maestro.dev/reference/commands-available/takescreenshot)
and [device selection](https://docs.maestro.dev/maestro-cli/maestro-cli-commands-and-options).
The flake pins Maestro 2.0.9; its absolute screenshot paths differ from newer
Maestro versions, so validate artifact paths before upgrading.
