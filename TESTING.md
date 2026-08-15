- `npm test`: run the Jest unit and integration tests once.
- `npm run test:watch`: rerun relevant Jest tests while editing.
- `npm run test:coverage`: write an HTML coverage report to
  `artifacts/jest/coverage/lcov-report/index.html`.

For native end-to-end tests:

- `nix develop`
- run emulator
- `EXPO_PUBLIC_E2E_TEST_SUPPRESS_LOGBOX=1 npx expo run:android`
- `npm run test:maestro:report`: run Maestro and write its HTML report and
  screenshots under `artifacts/maestro/`.
- `npm run test:full`: run Jest with HTML coverage, then the reported Maestro
  suite. This requires the native app and emulator to already be running.
