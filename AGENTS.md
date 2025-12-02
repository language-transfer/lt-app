# Repository Guidelines

## Project Structure & Module Organization
- Expo Router app; entry `index.js` registers the track player service from `src/services/trackPlayerService`.
- Screens live in `app/` (stack in `app/_layout.tsx`, course flows under `app/course/[course]/...`).
- UI in `src/components/`, data in `src/data/`, logic in `src/hooks`, `src/services`, `src/storage`, `src/utils`, and shared typing in `src/types`.
- `assets/` holds icons/splash art; `legacy/` keeps bundled first-lesson audio and legacy artwork—treat as read-only. The `legacy/` folder currently houses an older version of the app that works well; the root project is a rewrite and we often port or re-implement legacy behaviors into the new skeleton.

## Build, Test, and Development Commands
- `npm install`: install dependencies (runs `patch-package`).
- `npm run start`: Expo dev server for devices, simulators, or web.
- `npm run android` / `npm run ios`: build and launch native shells through Expo Run (platform toolchains required).
- `npm run web`: quick web preview.
- `npm run typecheck`: strict TypeScript compilation.
- `npm run lint`: ESLint using `eslint-config-expo`.

## Coding Style & Naming Conventions
- TypeScript first: type props/state; strict mode is on.
- Match surrounding file style; rely on `npm run lint` for fixes.
- Components/files use `PascalCase` (e.g., `LanguageHomeScreen.tsx`); hooks use `useX` naming.
- Use the `@/` path alias for absolute imports; keep styles in nearby `StyleSheet.create` blocks.

## Testing Guidelines
- No automated suite yet; always run `npm run typecheck` and `npm run lint` after making changes **before responding back to the user** (repair agentically and noninteractively), and again before a PR.
- Smoke-test on at least one platform (`npm run android` or `npm run ios`): verify course list, playback, downloads, and notification clicks.
- Note manual test devices/OS versions and any regressions avoided in the PR description.

## Commit & Pull Request Guidelines
- Follow existing history: short, imperative commit subjects (e.g., `Fix bottom sheet`).
- PRs should include a concise summary, linked issues, verification steps, and screenshots for UI changes (Android and iOS when possible).
- Call out migrations or asset changes and confirm background playback still registers through `index.js`.

## Security & Configuration Tips
- Do not commit secrets or large media; course metadata/download URLs already live in `src/data/courseData.ts`.
- Avoid changing `app.json` identifiers or `legacy/` assets without aligning on release implications.
