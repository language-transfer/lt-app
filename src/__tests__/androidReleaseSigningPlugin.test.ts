// Config plugins run as CommonJS during Expo prebuild.
/* eslint-disable @typescript-eslint/no-require-imports */
const {
  applyAndroidReleaseSigning,
}: {
  applyAndroidReleaseSigning: (contents: string) => string;
} = require("../../plugins/withAndroidReleaseSigning");
/* eslint-enable @typescript-eslint/no-require-imports */

const expoBuildGradle = `android {
    signingConfigs {
        debug {
            storeFile file('debug.keystore')
        }
    }
    buildTypes {
        debug {
            signingConfig signingConfigs.debug
        }
        release {
            signingConfig signingConfigs.debug
        }
    }
}`;

describe("Android release signing config plugin", () => {
  test("keeps debug builds on the debug key and signs release builds with the upload key", () => {
    const result = applyAndroidReleaseSigning(expoBuildGradle);

    expect(result).toContain("Language Transfer upload-key signing");
    expect(result).toContain("rootProject.file(\"../legacy/android/app/${MYAPP_UPLOAD_STORE_FILE}\")");
    expect(result).toMatch(
      /buildTypes \{[\s\S]*?debug \{[\s\S]*?signingConfig signingConfigs\.debug/
    );
    expect(result).toMatch(
      /buildTypes \{[\s\S]*?release \{[\s\S]*?signingConfig signingConfigs\.release/
    );
  });

  test("is idempotent", () => {
    const once = applyAndroidReleaseSigning(expoBuildGradle);

    expect(applyAndroidReleaseSigning(once)).toBe(once);
    expect(once.match(/Language Transfer upload-key signing/g)).toHaveLength(1);
  });
});
