- `npm test`: run the Jest unit and integration tests once.
- `npm run test:watch`: rerun relevant Jest tests while editing.
- `npm run test:coverage`: write an HTML coverage report to
  `artifacts/jest/coverage/lcov-report/index.html`.

For native end-to-end tests:

- `nix develop`
- run emulator
- `EXPO_PUBLIC_E2E_TEST_SUPPRESS_LOGBOX=1 npx expo run:android`
- `maestro test maestro/`
