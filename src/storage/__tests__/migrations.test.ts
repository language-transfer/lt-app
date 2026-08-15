import {
  LAST_BOOTED_APP_VERSION_KEY,
  MIGRATION_WAIT_TIMEOUT_MS,
  PRE_2025_COURSE_NAMES,
  clearOldDownloadLocations,
  migratePreference,
  migrateStoredPreferences,
  runAppMigrations,
  waitForAppMigrations,
  type LegacyDownloadDirectory,
  type MigrationStorage,
} from "@/src/storage/migrations";

const createStorage = (initial: Record<string, string> = {}) => {
  const values = new Map(Object.entries(initial));
  const storage: MigrationStorage = {
    getItem: jest.fn(async (key) => values.get(key) ?? null),
    getMany: jest.fn(async (keys) =>
      Object.fromEntries(keys.map((key) => [key, values.get(key) ?? null]))
    ),
    setMany: jest.fn(async (entries) => {
      for (const [key, value] of Object.entries(entries)) {
        values.set(key, value);
      }
    }),
  };
  return { storage, values };
};

describe("preference migrations", () => {
  test.each([
    ["stream-quality", "low", '"low"'],
    ["download-quality", "high", '"high"'],
  ])("JSON-encodes legacy %s values", (key, oldValue, updated) => {
    expect(migratePreference(key, oldValue)).toEqual({
      changed: true,
      updated,
    });
  });

  test.each([
    ["stream-quality", '"low"'],
    ["download-quality", '"high"'],
    ["unrelated-preference", "old-value"],
  ])("leaves current or unrelated %s values alone", (key, value) => {
    expect(migratePreference(key, value)).toEqual({ changed: false });
  });

  test("collects both old preference updates without writing early", async () => {
    const { storage } = createStorage({
      "@preferences/stream-quality": "low",
      "@preferences/download-quality": "high",
    });

    await expect(migrateStoredPreferences(storage)).resolves.toEqual({
      "@preferences/stream-quality": '"low"',
      "@preferences/download-quality": '"high"',
    });
    expect(storage.setMany).not.toHaveBeenCalled();
  });
});

describe("old download cleanup", () => {
  test("checks every legacy course in every old root and is idempotent", async () => {
    const existing = new Set(["documents/spanish", "external/music"]);
    const deleted: string[] = [];
    const checked: string[] = [];

    const getDirectory = (root: string, course: string) => {
      const path = `${root}/${course}`;
      checked.push(path);
      const directory: LegacyDownloadDirectory = {
        get exists() {
          return existing.has(path);
        },
        uri: `file:///${path}`,
        delete: () => {
          deleted.push(path);
          existing.delete(path);
        },
      };
      return directory;
    };

    const options = {
      getDirectory,
      rootDirectories: ["documents", "external"],
      warn: jest.fn(),
    };
    await clearOldDownloadLocations(options);
    await clearOldDownloadLocations(options);

    expect(checked).toHaveLength(PRE_2025_COURSE_NAMES.length * 2 * 2);
    expect(deleted).toEqual(["documents/spanish", "external/music"]);
  });
});

describe("app migration runner", () => {
  test("runs operations once per app version and atomically marks success", async () => {
    const { storage, values } = createStorage({
      [LAST_BOOTED_APP_VERSION_KEY]: "1.0 (1)",
    });
    const migratePreferences = jest.fn(async () => ({
      "@preferences/stream-quality": '"low"',
    }));
    const clearDownloads = jest.fn(async () => undefined);
    const refreshCourseIndex = jest.fn(async () => undefined);
    const options = {
      currentVersion: "2.0 (2)",
      operations: [migratePreferences, clearDownloads, refreshCourseIndex],
      storage,
    };

    await runAppMigrations(options);
    await runAppMigrations(options);

    expect(migratePreferences).toHaveBeenCalledTimes(1);
    expect(clearDownloads).toHaveBeenCalledTimes(1);
    expect(refreshCourseIndex).toHaveBeenCalledTimes(1);
    expect(storage.setMany).toHaveBeenCalledTimes(1);
    expect(storage.setMany).toHaveBeenCalledWith({
      "@preferences/stream-quality": '"low"',
      [LAST_BOOTED_APP_VERSION_KEY]: "2.0 (2)",
    });
    expect(values.get(LAST_BOOTED_APP_VERSION_KEY)).toBe("2.0 (2)");
  });

  test("does nothing when the current version already ran", async () => {
    const { storage } = createStorage({
      [LAST_BOOTED_APP_VERSION_KEY]: "2.0 (2)",
    });
    const operation = jest.fn(async () => undefined);

    await runAppMigrations({
      currentVersion: "2.0 (2)",
      operations: [operation],
      storage,
    });

    expect(operation).not.toHaveBeenCalled();
    expect(storage.setMany).not.toHaveBeenCalled();
  });

  test("does not mark a failed run and retries it on the next boot", async () => {
    const { storage, values } = createStorage();
    const operation = jest
      .fn(async (): Promise<void> => undefined)
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce(undefined);
    const options = {
      currentVersion: "2.0 (2)",
      operations: [operation],
      storage,
    };

    await expect(runAppMigrations(options)).rejects.toThrow("offline");
    expect(values.has(LAST_BOOTED_APP_VERSION_KEY)).toBe(false);

    await expect(runAppMigrations(options)).resolves.toBeUndefined();
    expect(operation).toHaveBeenCalledTimes(2);
    expect(values.get(LAST_BOOTED_APP_VERSION_KEY)).toBe("2.0 (2)");
  });
});

describe("migration startup wait", () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  test("reports completion before the timeout", async () => {
    await expect(waitForAppMigrations(Promise.resolve())).resolves.toBe(
      "completed"
    );
  });

  test("releases startup after 30 seconds while work continues", async () => {
    jest.useFakeTimers();
    const pendingMigration = new Promise<void>(() => undefined);
    const waiting = waitForAppMigrations(pendingMigration);

    await jest.advanceTimersByTimeAsync(MIGRATION_WAIT_TIMEOUT_MS);

    await expect(waiting).resolves.toBe("timed-out");
  });
});
