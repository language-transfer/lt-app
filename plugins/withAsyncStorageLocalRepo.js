// plugins/withAsyncStorageLocalRepo.js
const { withProjectBuildGradle } = require("@expo/config-plugins");

/**
 * Injects AsyncStorage's local Maven repo using Gradle's
 * project(':react-native-async-storage_async-storage').file('local_repo')
 * so the path resolves correctly regardless of where the Android folder lives.
 */
module.exports = function withAsyncStorageLocalRepo(config) {
  return withProjectBuildGradle(config, (config) => {
    if (config.modResults.language !== "groovy") {
      throw new Error(
        `withAsyncStorageLocalRepo only supports Groovy build.gradle (got ${config.modResults.language}).`
      );
    }

    const snippet = `
allprojects {
  repositories {
    maven {
      url = uri(project(":react-native-async-storage_async-storage").file("local_repo"))
    }
  }
}
`.trim();

    const contents = config.modResults.contents;

    // If already present, do nothing.
    if (contents.includes('project(":react-native-async-storage_async-storage").file("local_repo")')) {
      return config;
    }

    // Prefer inserting before "apply plugin" lines.
    const marker = 'apply plugin: "expo-root-project"';
    if (contents.includes(marker)) {
      config.modResults.contents = contents.replace(marker, `${snippet}\n\n${marker}`);
    } else {
      // Fallback: append at end.
      config.modResults.contents = `${contents}\n\n${snippet}\n`;
    }

    return config;
  });
};

