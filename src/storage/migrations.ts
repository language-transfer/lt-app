export const LAST_BOOTED_APP_VERSION_KEY = "@app/last-booted-version";
export const MIGRATION_WAIT_TIMEOUT_MS = 30_000;

export type PreferenceUpdates = Record<string, string>;

export type MigrationStorage = {
  getItem(key: string): Promise<string | null>;
  getMany(keys: string[]): Promise<Record<string, string | null>>;
  setMany(entries: Record<string, string>): Promise<void>;
};

export type AppMigrationOperation = () => Promise<PreferenceUpdates | void>;

export const migratePreference = (
  key: string,
  val: string
):
  | {
      changed: false;
    }
  | {
      changed: true;
      updated: string;
    } => {
  if (key !== "stream-quality" && key !== "download-quality") {
    return { changed: false };
  }

  try {
    // Old versions stored low and high directly. Current preferences are
    // consistently JSON encoded, so valid JSON is already migrated.
    JSON.parse(val);
    return { changed: false };
  } catch {
    return { changed: true, updated: JSON.stringify(val) };
  }
};

export const migrateStoredPreferences = async (
  storage: Pick<MigrationStorage, "getMany">
): Promise<PreferenceUpdates> => {
  const preferenceNames = ["stream-quality", "download-quality"];
  const preferenceKeys = preferenceNames.map((name) => `@preferences/${name}`);
  const stored = await storage.getMany(preferenceKeys);
  const updates: PreferenceUpdates = {};

  for (const name of preferenceNames) {
    const storageKey = `@preferences/${name}`;
    const value = stored[storageKey];
    if (value === null) {
      continue;
    }

    const migrated = migratePreference(name, value);
    if (migrated.changed) {
      updates[storageKey] = migrated.updated;
    }
  }

  return updates;
};

export const PRE_2025_COURSE_NAMES = [
  "spanish",
  "arabic",
  "turkish",
  "german",
  "greek",
  "italian",
  "swahili",
  "french",
  "ingles",
  "music",
] as const;

export type LegacyDownloadDirectory = {
  readonly exists: boolean;
  readonly uri: string;
  delete(): void;
};

export type LegacyDownloadCleanupDependencies<Root> = {
  getDirectory(root: Root, course: string): LegacyDownloadDirectory;
  rootDirectories: readonly Root[];
  warn?: (message: string) => void;
};

// Pre-2025 downloads used one directory per course. Current downloads use the
// shared objects and staging directories, so these locations must not be reused.
export const clearOldDownloadLocations = async <Root>({
  getDirectory,
  rootDirectories,
  warn = console.warn,
}: LegacyDownloadCleanupDependencies<Root>): Promise<void> => {
  for (const root of rootDirectories) {
    for (const course of PRE_2025_COURSE_NAMES) {
      const courseDirectory = getDirectory(root, course);
      if (!courseDirectory.exists) {
        continue;
      }

      warn(
        `Deleting old download directory for course ${course} at ${courseDirectory.uri}`
      );
      // Directory.delete is recursive. Re-running is safe because the next
      // pass observes exists === false.
      courseDirectory.delete();
    }
  }
};

export type RunAppMigrationsOptions = {
  currentVersion: string;
  operations: readonly AppMigrationOperation[];
  storage: MigrationStorage;
};

export const runAppMigrations = async ({
  currentVersion,
  operations,
  storage,
}: RunAppMigrationsOptions): Promise<void> => {
  const previousVersion = await storage.getItem(LAST_BOOTED_APP_VERSION_KEY);
  if (previousVersion === currentVersion) {
    return;
  }

  const preferenceUpdates: PreferenceUpdates = {};
  for (const operation of operations) {
    const updates = await operation();
    if (updates) {
      Object.assign(preferenceUpdates, updates);
    }
  }

  // Preference rewrites and the successful version marker are committed as a
  // batch. External operations must be idempotent so an interrupted run can be
  // retried safely on the next boot.
  await storage.setMany({
    ...preferenceUpdates,
    [LAST_BOOTED_APP_VERSION_KEY]: currentVersion,
  });
};

export const waitForAppMigrations = async (
  migrationRun: Promise<void>,
  timeoutMs = MIGRATION_WAIT_TIMEOUT_MS
): Promise<"completed" | "timed-out"> => {
  let timeout: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      migrationRun.then(() => "completed" as const),
      new Promise<"timed-out">((resolve) => {
        timeout = setTimeout(() => resolve("timed-out"), timeoutMs);
      }),
    ]);
  } finally {
    if (timeout !== undefined) {
      clearTimeout(timeout);
    }
  }
};
