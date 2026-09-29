# Language Transfer

[Language Transfer](https://www.languagetransfer.org/) is a project by Mihalis
Eleftheriou: free audio courses for learning languages with the Thinking
Method. This branch rebuilds the Language Transfer app in Flutter for iOS and
Android. The current Expo app lives on the `master` branch.

## Goals

The app should be:

- 100% free, like the Language Transfer courses
- Accessible and easy to use for the visually impaired
- Considerate of users in areas with poor network quality, expensive Internet
  access, or low-end devices
- Free of distractions and annoyances, like advertisements or superfluous
  notifications
- Self-sustaining: maintainable and easy to build even in the absence of the
  original maintainers
- Private by design

## Development

The Flutter version is pinned in `.fvmrc`. With [FVM](https://fvm.app):

```sh
fvm install          # installs the pinned Flutter version
fvm flutter pub get
fvm flutter run      # on a connected device or simulator
```

Without FVM, install the Flutter version named in `.fvmrc` and use `flutter`
directly.

Checks to run before every commit:

```sh
fvm flutter analyze
fvm flutter test
```

Debug and profile builds use the id `org.languagetransfer.dev` and the name
"LT Dev", so they install next to the store app. Release builds use
`org.languagetransfer`.

### iOS signing

iOS builds are signed with Language Transfer's Apple team (`XZUB4ADZC3`, as
in the Expo app), set in `ios/Flutter/Debug.xcconfig` and `Release.xcconfig`.
To run on your own iPhone with your own team, create
`ios/Flutter/Signing.xcconfig` (git-ignored) containing:

```
DEVELOPMENT_TEAM = <your team id>
```

Set the team there rather than in Xcode's Signing settings: Xcode writes it
into `project.pbxproj`, which is committed. Simulator builds need no team.

### Android release builds

Release builds are signed with the upload key named by the Gradle properties
`MYAPP_UPLOAD_STORE_FILE`, `MYAPP_UPLOAD_KEY_ALIAS`,
`MYAPP_UPLOAD_STORE_PASSWORD` and `MYAPP_UPLOAD_KEY_PASSWORD` (normally in
`~/.gradle/gradle.properties`), the same as the Expo app. Place the keystore
in `android/app/`; it is git-ignored.

```sh
fvm flutter build appbundle
```

Without these properties, release builds are signed with the debug key, which
Google Play does not accept.

## License

The code is provided under the [GPLv2 license](./LICENSE), version 2 or (at
your option) any later version.

## Support

Please consider supporting Language Transfer's
[Patreon campaign](https://www.patreon.com/languagetransfer). This money
directly funds Mihalis and the development of future courses.
