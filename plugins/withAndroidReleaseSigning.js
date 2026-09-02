const { withAppBuildGradle } = require("@expo/config-plugins");

const RELEASE_SIGNING_MARKER = "Language Transfer upload-key signing";

function applyAndroidReleaseSigning(contents) {
  if (!contents.includes(RELEASE_SIGNING_MARKER)) {
    const signingConfigsPattern = /(\n    signingConfigs \{[\s\S]*?)(\n    \}\n    buildTypes \{)/;
    const signingConfigsMatch = contents.match(signingConfigsPattern);

    if (!signingConfigsMatch) {
      throw new Error("Could not find signingConfigs in android/app/build.gradle.");
    }

    const releaseSigningConfig = `
        // ${RELEASE_SIGNING_MARKER}. Do not put credential values in this file.
        release {
            if (project.hasProperty('MYAPP_UPLOAD_STORE_FILE')) {
                def configuredStoreFile = file(MYAPP_UPLOAD_STORE_FILE)
                def legacyStoreFile = rootProject.file("../legacy/android/app/\${MYAPP_UPLOAD_STORE_FILE}")
                def uploadStoreFile = configuredStoreFile.exists() ? configuredStoreFile : legacyStoreFile

                if (!uploadStoreFile.exists()) {
                    throw new GradleException("Android upload keystore not found at \${configuredStoreFile} or \${legacyStoreFile}")
                }

                storeFile uploadStoreFile
                storePassword MYAPP_UPLOAD_STORE_PASSWORD
                keyAlias MYAPP_UPLOAD_KEY_ALIAS
                keyPassword MYAPP_UPLOAD_KEY_PASSWORD
            }
        }`;

    contents = contents.replace(
      signingConfigsPattern,
      `${signingConfigsMatch[1]}${releaseSigningConfig}${signingConfigsMatch[2]}`
    );
  }

  const buildTypesStart = contents.indexOf("\n    buildTypes {");

  if (buildTypesStart === -1) {
    throw new Error("Could not find buildTypes in android/app/build.gradle.");
  }

  const beforeBuildTypes = contents.slice(0, buildTypesStart);
  let buildTypesAndAfter = contents.slice(buildTypesStart);
  const debugBuildPattern = /(\n        debug \{[\s\S]*?)signingConfig signingConfigs\.(?:debug|release)/;
  const releaseBuildPattern = /(\n        release \{[\s\S]*?)signingConfig signingConfigs\.(?:debug|release)/;

  if (!debugBuildPattern.test(buildTypesAndAfter) || !releaseBuildPattern.test(buildTypesAndAfter)) {
    throw new Error("Could not find the debug and release buildTypes in android/app/build.gradle.");
  }

  buildTypesAndAfter = buildTypesAndAfter.replace(
    debugBuildPattern,
    "$1signingConfig signingConfigs.debug"
  );
  buildTypesAndAfter = buildTypesAndAfter.replace(
    releaseBuildPattern,
    "$1signingConfig signingConfigs.release"
  );

  return beforeBuildTypes + buildTypesAndAfter;
}

/**
 * Keeps Android release signing reproducible when Expo regenerates the ignored
 * native project. Credential values remain in ~/.gradle/gradle.properties.
 */
module.exports = function withAndroidReleaseSigning(config) {
  return withAppBuildGradle(config, (config) => {
    if (config.modResults.language !== "groovy") {
      throw new Error(
        `withAndroidReleaseSigning only supports Groovy build.gradle (got ${config.modResults.language}).`
      );
    }

    config.modResults.contents = applyAndroidReleaseSigning(config.modResults.contents);

    return config;
  });
};

module.exports.applyAndroidReleaseSigning = applyAndroidReleaseSigning;
