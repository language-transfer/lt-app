import AsyncStorage from "@react-native-async-storage/async-storage";
import { nativeApplicationVersion, nativeBuildVersion } from "expo-application";
import Constants from "expo-constants";
import { Directory, Paths } from "expo-file-system";
import RNFS from "react-native-fs";

import {
  clearOldDownloadLocations,
  migrateStoredPreferences,
  runAppMigrations,
  waitForAppMigrations,
  type AppMigrationOperation,
} from "@/src/storage/migrations";

export const getCurrentAppVersion = (): string => {
  const version =
    nativeApplicationVersion ?? Constants.expoConfig?.version ?? "development";
  return nativeBuildVersion ? `${version} (${nativeBuildVersion})` : version;
};

const clearLegacyDownloads = async (): Promise<void> => {
  const rootDirectories: (Directory | string)[] = [Paths.document];
  if (RNFS.ExternalDirectoryPath) {
    rootDirectories.push(`file:///${RNFS.ExternalDirectoryPath}`);
  }

  await clearOldDownloadLocations({
    rootDirectories,
    getDirectory: (root, course) => new Directory(root, course),
  });
};

const refreshCourseIndex = async (): Promise<void> => {
  // Keep this import lazy: CourseData and DownloadManager already depend on
  // each other during module initialization.
  const courseData = await import("@/src/data/courseData");
  await courseData.refreshCourseIndex();
};

const clearLegacyInglesObjectDownloads = async (): Promise<void> => {
  // Use only locally cached metadata. Anyone with old-course downloads already
  // has this file, while fresh/offline installs should not make a network
  // request solely to discover that there is nothing to remove.
  const courseData = await import("@/src/data/courseData");
  const metadata = await courseData.default.loadCourseMetadataIfDownloaded(
    "ingles"
  );
  if (!metadata) {
    return;
  }

  const { CourseDownloadManager } = await import(
    "@/src/services/downloadManager"
  );
  await CourseDownloadManager.purgeAllDownloadsForCourse("ingles");
};

const appMigrationOperations: readonly AppMigrationOperation[] = [
  () => migrateStoredPreferences(AsyncStorage),
  clearLegacyDownloads,
  clearLegacyInglesObjectDownloads,
  refreshCourseIndex,
];

export const runCurrentAppMigrations = (): Promise<void> =>
  runAppMigrations({
    currentVersion: getCurrentAppVersion(),
    operations: appMigrationOperations,
    storage: AsyncStorage,
  });

const migrationRun = runCurrentAppMigrations();

export const appMigrationsReady = waitForAppMigrations(migrationRun).catch(
  (error) => {
    // Leave the version marker untouched so a failed migration retries next
    // boot, but do not prevent the application from starting.
    console.warn("App migration failed", error);
  }
);
