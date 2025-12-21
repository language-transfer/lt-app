Welcome to the Language Transfer app! Thanks for your interest in contributing :)

## How to build and run the app

The app uses React Native 0.68.2: https://reactnative-archive-august-2023.netlify.app/docs/0.68/getting-started

### Prerequisites

**Required Software:**
- **Node.js**: v16+ (tested with v22.18.0)
- **npm**: v8+ (tested with v10.9.3)

**For Android Development:**
- **Java Development Kit (JDK)**: Java 11 (required for Gradle 6.2 compatibility)
  - Install: `sudo apt install openjdk-11-jdk`
  - Set as default: `sudo update-alternatives --set java /usr/lib/jvm/java-11-openjdk-amd64/bin/java`
  - Verify with: `java --version` (should show version 11.x.x)
- **Android Studio**: (tested with 2025.2.2) with Android SDK
- Environment variables (add to ~/.bashrc):
  ```bash
  export ANDROID_HOME=$HOME/Android/Sdk
  export PATH=$PATH:$ANDROID_HOME/emulator
  export PATH=$PATH:$ANDROID_HOME/platform-tools
  ```

### Setup Instructions

Then, clone and install dependencies for the repository.

1. `git clone https://github.com/language-transfer/lt-app.git`
2. `cd lt-app`
3. `npm install --legacy-peer-deps`

#### Android

Run:

```bash
emulator -avd Medium_Phone_API_36.1
npm start
npm run android
```

For some reason, I've had issues with gradle being able to access Node from Volta, so I have to run:

```bash
export PATH="/home/rv/.volta/tools/image/node/22.18.0/bin:$PATH"
```

Build app:

```bash
cd android
./gradlew assembleDebug
```

Cannot use release build because I need to sign it?

Install to device:

```bash
adb devices
adb -s {device-id} install android/app/build/outputs/apk/debug/app-debug.apk
```

#### iOS

Install native dependencies by running:

```bash
cd ios
pod install
```

When you're ready to run the app, run:

```bash
npx react-native run-ios
```

To build a production-ready release, add on the `--variant=release` flag:

    npx react-native run-android --variant=release

## Releasing iOS App Updates

The iOS app release flow is currently set up with Fastlane. To create a new beta release, simply run:

    cd ios && fastlane beta

Your code will be compiled and uploaded to TestFlight. To create a production release, simply run:

    cd ios && fastlane release

In order to use Language Transfer's own App Store Connect account, you'll need to obtain the organization's Apple Provisioning Profile & Developer Certificate. Both can be obtained by contacting Mihalis.

For more help about the iOS development flow, contact @jafayer.

## Dependencies

We use GitHub's [Licensed](https://github.com/github/licensed) to track dependency licenses. When adding new dependencies, use `licensed status` in the root and make sure there are no errors (unless there's missing license text for a public domain dependency). Then generate an update to NOTICES with `licensed notices`. This needs to be uploaded manually to the downloads server to keep the app up-to-date.

## Issues & Pull Requests

At the moment, there's little outstanding work to be done by contributors. Check with the core project maintainers before starting work on a PR, just to make sure you don't duplicate work or go too far in the wrong direction. Accepting contributions is currently a nontrivial burden on the core maintainers; although of course interest in contributing is appreciated, in practice it can be hard to make sure contributors have the support they need throughout the process. Please don't take offense if your PRs/issues aren't accepted, or if they sit idle for a long time!

## Questions?

Feel free to email me@timothyaveni.com if you have any questions about the repository.
