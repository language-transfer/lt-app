# Android rapid-Back regression — disabled pending upstream update

The regression is retained but **disabled by default**. We are waiting for an
upstream react-native-screens release containing the fix instead of maintaining
a local native patch. The app currently uses react-native-screens 4.16.0 and
React Native 0.81.5; the known crash remains on that version.

## Upstream follow-up

Track [react-native-screens PR #3777](https://github.com/software-mansion/react-native-screens/pull/3777),
including the September 6, 2026 commits:

- [Skip header updates during removal transitions (`dc7899f`)](https://github.com/software-mansion/react-native-screens/commit/dc7899fbb0a91ee76022cb75a6f8b66cd4b7ecb9).
- [Finish child transitions before detaching screens (`c2b2cf7`)](https://github.com/software-mansion/react-native-screens/commit/c2b2cf76a7649307327eae3fef1657416290748c).

As checked on September 8, the PR is still open. These commits are on the PR
branch; do not assume they are included in a published release.

When updating Expo / react-native-screens:

1. Confirm the fix is merged and identify the first release containing it.
2. Update to a version compatible with the project's Expo and React Native
   versions, including the lockfile. Do not reintroduce the local patch.
3. Rebuild the native Android app; Metro reloads alone cannot update Kotlin code.
4. Run the disabled regression explicitly using the command below. Repeat it
   on Android 16/API 36, where the crash reproduced, and smoke-test playback,
   downloads, notification navigation, and header/drawer interaction.
5. Once it passes reliably, remove the skip guard in the runner and update this
   note. Keep the direct adb input: ordinary Maestro Back steps miss the race.

## Reproduction and test

Open Inglés, open All Lessons, then immediately send two system Back events.
The unpatched Android 16/API 36 x86_64 emulator produces
`IllegalStateException: The specified child already has a parent` in
`ScreenStackHeaderConfig.onUpdate()`. Playback and notifications are not required.

Native diagnostics showed a header rebuild while its screen had
`isBeingRemoved=true`. The attachment callback bypassed the removal guard in
`maybeUpdate()`. A temporary local guard prevented this reproduction, but that
patch has been removed in favor of the upstream update.

The normal command reports an explicit skip without touching the emulator:

```sh
npm run test:android:rapid-back
```

To evaluate a future dependency update, with Metro running and exactly one
Android emulator/device connected:

```sh
npm run android -- --no-bundler
npm run test:android:rapid-back -- --run-disabled
```

The opt-in run clears the app's test data. It uses Maestro to open the course
and All Lessons, sends two consecutive adb Back events without waiting for the
animation, then verifies the course list, reopened header, and drawer.
Artifacts go under `artifacts/maestro/rapid-back/`.

The helper flows in `maestro/regressions/` are excluded by `maestro/config.yaml`;
they must run through the shell runner rather than as independent Maestro tests.
The runner itself is skipped until explicitly opted in or re-enabled after the
upstream update.
