# Preloaded content

The iOS build includes the low-quality lessons selected in
`scripts/preloaded-content.config.json`, plus a course-index snapshot and
course metadata. The current selection is the first lesson of every course.
A fresh installation can open and play those lessons without a network
connection. Android does not include the preloaded media or JSON.

Run `npm run prepare:preloaded-content` before starting Metro for iOS. The
script fetches the public course index, each course's JSON, and each selected
lesson's low-quality CAS object. It verifies CAS sizes and SHA-256 hashes and
writes the result to ignored `generated/preloaded-content/`. An unavailable or
changed CAS object fails preparation. `npm run ios` invokes this script
automatically, and the `withPreloadedContent` config plugin adds the same step
before Xcode's JavaScript-bundling phase for native builds. The Xcode phase
also exports both platform bundles and runs the size and Android-exclusion
checks, so a failed check fails the local build.

After adding or changing the config plugin in an existing ignored `ios/`
project, run `npx expo prebuild --platform ios --no-install` so Xcode receives
the latest build phase. The generated content is never committed. Before an Xcode archive,
confirm that its target has a **Prepare Preloaded Content** phase immediately
before **Bundle React Native code and images**.

Metro resolves `src/data/preloadedContent.ios.ts` only for iOS. The regular
`preloadedContent.ts` module returns no snapshot or media on Android and web.
The course index and metadata use the snapshots only if online loading fails;
an explicit refresh still reports errors. The app retries the course index
after one minute when it had to use the preloaded snapshot. When a lesson
plays from its preloaded copy, its shipped title, ID, and duration are used
even if online metadata has changed. An explicitly downloaded CAS copy takes
precedence and uses the online lesson metadata instead.

`npm run test:preloaded-content` regenerates the content and exports both
platform bundles. It verifies that all selected lessons and metadata are present
in iOS, that Android contains none of them, and that the audio and Android
asset sizes stay within their budgets. The native Xcode build runs the same
bundle check after preparation.

To preload more lessons, add their zero-based indices to the corresponding
course in `scripts/preloaded-content.config.json`. The build script generates
the static Metro audio imports from that selection. Keep the selection within
`maxIosAudioBytes` in the same config, or update that budget deliberately.
After changing it, check playback with networking
disabled on a fresh iOS install and verify that downloaded copies still take
precedence when online.
