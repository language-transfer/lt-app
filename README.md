# Language Transfer (Expo)

The current app is an Expo-managed React Native project that reimplements the core Language Transfer experience from the legacy native codebase. The historical React Native project is still available under `legacy/` for reference, but the new app lives at the repository root.

## Development

```bash
npm install         # install JS deps
npm run start       # launch the Expo dev server (Metro bundler)
npm run android     # open in Android emulator or device
npm run ios         # open in iOS simulator (macOS only)
npm run web         # run the web build
```

Only the open-source Expo CLI workflow is used—there are no Expo Application Services (EAS) configs or build hooks in this repository.

## App features

- Course browser with the familiar Language Transfer artwork pulled from the legacy assets.
- Course home screen that resumes your last lesson, surfaces data management, and links out to Language Transfer resources.
- Lesson player built on `expo-av`, including seek scrubbing, skip-back, and offline download actions.
- All-lessons list with progress indicators, download management, and “download all” support.
- Data management panel mirroring the legacy options for clearing metadata, progress, and downloads.
- Static About, Licenses (embedded web view), and Settings screens that map the previous preferences to Expo-compatible storage.

## Project layout

- `app/` – Expo Router entry points
- `src/` – shared logic and UI
  - `data/` – course metadata and fetch helpers
  - `services/` – audio + download layers built on `expo-av`/`expo-file-system`
  - `components/` – screen components reused by the router routes
  - `storage/` – AsyncStorage persistence helpers and preference APIs
  - `hooks/` – view helpers (status bar, downloads, etc.)
- `legacy/` – untouched archive of the previous bare React Native implementation

Modify the files inside `src/` when extending the modern app. The Expo router is already wired up to load the new screens, and the legacy folder can be referenced whenever you need additional UI or logic context.
