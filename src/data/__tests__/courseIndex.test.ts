import {
  COURSE_INDEX_STORAGE_KEY,
  COURSE_INDEX_URL,
  createCourseIndexRepository,
  ensureCourseIndex,
  invalidateCourseIndex,
  type CourseIndexStorage,
} from "@/src/data/courseIndex";
import type { CourseIndex, StoredCourseIndex } from "@/src/data/courseSchemas";
import { queryClient } from "@/src/data/queryClient";

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(undefined),
}));

const oldIndex: CourseIndex = {
  buildVersion: 2,
  casBaseURL: "https://downloads.example/old-cas",
  courses: [],
};

const refreshedIndex: CourseIndex = {
  buildVersion: 2,
  casBaseURL: "https://downloads.example/new-cas/",
  courses: [
    {
      id: "new-course",
      lessons: 20,
      meta: {
        _type: "file",
        object: "new-course-metadata",
        filesize: 456,
        mimeType: "application/json",
      },
    },
  ],
};

const createStorage = (cached?: StoredCourseIndex) => {
  const values = new Map<string, string>();
  if (cached) {
    values.set(COURSE_INDEX_STORAGE_KEY, JSON.stringify(cached));
  }

  const storage: CourseIndexStorage = {
    getItem: jest.fn(async (key) => values.get(key) ?? null),
    setItem: jest.fn(async (key, value) => {
      values.set(key, value);
    }),
  };

  return { storage, values };
};

describe("course index repository", () => {
  afterEach(() => {
    queryClient.clear();
  });

  test.each([false, true])(
    "only explicit refreshes bypass the native HTTP cache (explicit: %s)",
    async (forceRemote) => {
      const request = jest.spyOn(global, "fetch").mockResolvedValue({
        ok: true,
        json: async () => refreshedIndex,
      } as Response);

      try {
        await invalidateCourseIndex();
        const result = await ensureCourseIndex(forceRemote);
        expect(result.courses).toEqual(refreshedIndex.courses);
        expect(request).toHaveBeenCalledWith(
          COURSE_INDEX_URL,
          forceRemote ? { headers: { "Cache-Control": "no-cache" } } : undefined
        );
      } finally {
        request.mockRestore();
      }
    }
  );

  test.each([false, true])(
    "explicit refresh does not reuse an automatic request (failed: %s)",
    async (failed) => {
      let resolveBackground!: (index: CourseIndex) => void;
      let rejectBackground!: (error: Error) => void;
      let started!: () => void;
      const backgroundStarted = new Promise<void>((resolve) => {
        started = resolve;
      });
      const fetchRemote = jest
        .fn()
        .mockImplementationOnce(() => {
          started();
          return new Promise<CourseIndex>((resolve, reject) => {
            resolveBackground = resolve;
            rejectBackground = reject;
          });
        })
        .mockResolvedValue(refreshedIndex);
      const { storage } = createStorage();
      const repository = createCourseIndexRepository({ storage, fetchRemote });
      const background = repository.ensure().catch(() => undefined);
      await backgroundStarted;

      const explicit = repository.refresh();
      const anotherExplicit = repository.refresh();
      expect(fetchRemote).toHaveBeenCalledTimes(1);
      if (failed) rejectBackground(new Error("offline"));
      else resolveBackground(oldIndex);

      await background;
      const result = await explicit;
      expect(result.courses).toEqual(refreshedIndex.courses);
      await expect(anotherExplicit).resolves.toEqual(result);
      expect(fetchRemote.mock.calls).toEqual([[false], [true]]);
    }
  );

  test.each([false, true])(
    "invalidating a fresh index revalidates on the next load (restart: %s)",
    async (restart) => {
      const now = 1_000_000;
      const { storage } = createStorage({ data: oldIndex, timestamp: now });
      const fetchRemote = jest.fn().mockResolvedValue(refreshedIndex);
      const dependencies = { storage, fetchRemote, now: () => now };
      let repository = createCourseIndexRepository(dependencies);
      await repository.ensure();
      await repository.invalidate();
      expect(fetchRemote).not.toHaveBeenCalled();
      expect(repository.timeUntilRefresh()).toBe(0);

      if (restart) repository = createCourseIndexRepository(dependencies);

      const result = await repository.ensure();
      expect(result.courses).toEqual(refreshedIndex.courses);
      expect(fetchRemote).toHaveBeenCalledTimes(1);
    }
  );

  test("an invalidated index remains available offline across restarts", async () => {
    const now = 1_000_000;
    const { storage } = createStorage({ data: oldIndex, timestamp: now });
    const fetchRemote = jest.fn().mockRejectedValue(new Error("offline"));
    const dependencies = {
      storage,
      fetchRemote,
      now: () => now,
      warn: jest.fn(),
    };
    const repository = createCourseIndexRepository(dependencies);
    await repository.invalidate();
    await expect(repository.ensure()).resolves.toEqual(oldIndex);
    const restarted = createCourseIndexRepository(dependencies);
    await expect(restarted.ensure()).resolves.toEqual(oldIndex);
    expect(fetchRemote).toHaveBeenCalledTimes(2);
  });

  test("expires an index already in memory and publishes the replacement", async () => {
    let now = 100;
    const onUpdate = jest.fn();
    const { storage } = createStorage({ data: oldIndex, timestamp: now });
    const fetchRemote = jest.fn().mockResolvedValue(refreshedIndex);
    const repository = createCourseIndexRepository({
      storage,
      fetchRemote,
      now: () => now,
      ttlMs: 10,
      onUpdate,
    });
    await repository.ensure();
    expect(repository.timeUntilRefresh()).toBe(10);
    now += 11;
    expect(repository.timeUntilRefresh()).toBe(0);
    const result = await repository.ensure();
    expect(result.courses).toEqual(refreshedIndex.courses);
    expect(onUpdate).toHaveBeenCalledWith(result);
    expect(fetchRemote).toHaveBeenCalledTimes(1);
    expect(fetchRemote).toHaveBeenCalledWith(false);
  });

  test("keeps cached data offline but rejects an explicit failed refresh", async () => {
    const { storage } = createStorage({ data: oldIndex, timestamp: 0 });
    const repository = createCourseIndexRepository({
      storage,
      now: () => 100,
      ttlMs: 10,
      warn: jest.fn(),
      fetchRemote: jest.fn().mockRejectedValue(new Error("offline")),
    });
    await expect(repository.ensure()).resolves.toEqual(oldIndex);
    await expect(repository.refresh()).rejects.toThrow("offline");
  });
  test("uses a fresh cached all-courses index without fetching", async () => {
    const now = 1_000_000;
    const { storage } = createStorage({ data: oldIndex, timestamp: now });
    const fetchRemote = jest.fn();
    const repository = createCourseIndexRepository({
      fetchRemote,
      now: () => now,
      storage,
    });

    await expect(repository.ensure()).resolves.toEqual(oldIndex);
    expect(fetchRemote).not.toHaveBeenCalled();
  });

  test("a migration refresh replaces even a fresh cache with mocked all-courses data", async () => {
    const now = 1_000_000;
    const { storage, values } = createStorage({
      data: oldIndex,
      timestamp: now,
    });
    const fetchRemote = jest.fn().mockResolvedValue(refreshedIndex);
    const repository = createCourseIndexRepository({
      fetchRemote,
      now: () => now,
      storage,
    });

    await expect(repository.ensure()).resolves.toEqual(oldIndex);
    await expect(repository.refresh()).resolves.toEqual({
      ...refreshedIndex,
      casBaseURL: "https://downloads.example/new-cas",
    });

    expect(fetchRemote).toHaveBeenCalledTimes(1);
    expect(fetchRemote).toHaveBeenCalledWith(true);
    const stored = JSON.parse(
      values.get(COURSE_INDEX_STORAGE_KEY)!
    ) as StoredCourseIndex;
    expect(stored).toEqual({
      timestamp: now,
      data: {
        ...refreshedIndex,
        casBaseURL: "https://downloads.example/new-cas",
      },
    });
  });

  test("does not overwrite the cache with an invalid response", async () => {
    const cached: StoredCourseIndex = { data: oldIndex, timestamp: 42 };
    const { storage, values } = createStorage(cached);
    const repository = createCourseIndexRepository({
      fetchRemote: jest.fn().mockResolvedValue({ buildVersion: 1 }),
      storage,
    });

    await expect(repository.refresh()).rejects.toThrow(
      "Invalid course index payload"
    );
    expect(JSON.parse(values.get(COURSE_INDEX_STORAGE_KEY)!)).toEqual(cached);
  });

  test("uses the preloaded index on a fresh offline install, then retries the network", async () => {
    let now = 1_000_000;
    const { storage, values } = createStorage();
    const fetchRemote = jest
      .fn()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValue(refreshedIndex);
    const repository = createCourseIndexRepository({
      storage,
      fetchRemote,
      preloadedIndex: oldIndex,
      now: () => now,
      warn: jest.fn(),
    });

    await expect(repository.ensure()).resolves.toEqual(oldIndex);
    expect(values.has(COURSE_INDEX_STORAGE_KEY)).toBe(false);
    expect(repository.timeUntilRefresh()).toBe(60_000);

    now += 60_001;
    await expect(repository.ensure()).resolves.toEqual({
      ...refreshedIndex,
      casBaseURL: "https://downloads.example/new-cas",
    });
    expect(fetchRemote).toHaveBeenCalledTimes(2);
    expect(values.has(COURSE_INDEX_STORAGE_KEY)).toBe(true);
  });
});
