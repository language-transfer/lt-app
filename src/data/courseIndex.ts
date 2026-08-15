import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  allCoursesSchema,
  storedAllCoursesSchema,
  type CourseIndex,
  type StoredCourseIndex,
} from "@/src/data/courseSchemas";

export const COURSE_INDEX_URL =
  "https://downloads.languagetransfer.org/all-courses.json";
export const COURSE_INDEX_STORAGE_KEY = "@course-index/all";
export const COURSE_INDEX_TTL_MS = 1000 * 60 * 60 * 24 * 7;

export type CourseIndexStorage = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
};

export type CourseIndexRepositoryDependencies = {
  fetchRemote(): Promise<unknown>;
  now?: () => number;
  storage: CourseIndexStorage;
  ttlMs?: number;
  warn?: (message: string, error: unknown) => void;
};

const normalizeCASBaseURL = (base: string) => base.replace(/\/$/, "");

const validateIndex = (raw: unknown): CourseIndex | null => {
  const parsed = allCoursesSchema.safeParse(raw);
  if (!parsed.success) {
    return null;
  }

  return {
    ...parsed.data,
    casBaseURL: normalizeCASBaseURL(parsed.data.casBaseURL),
  };
};

export const createCourseIndexRepository = ({
  fetchRemote,
  now = Date.now,
  storage,
  ttlMs = COURSE_INDEX_TTL_MS,
  warn = console.warn,
}: CourseIndexRepositoryDependencies) => {
  let inMemoryIndex: CourseIndex | null = null;

  const readCached = async (): Promise<StoredCourseIndex | null> => {
    try {
      const contents = await storage.getItem(COURSE_INDEX_STORAGE_KEY);
      if (!contents) {
        return null;
      }

      const parsed = storedAllCoursesSchema.safeParse(JSON.parse(contents));
      if (!parsed.success) {
        return null;
      }

      const validated = validateIndex(parsed.data.data);
      if (!validated) {
        return null;
      }

      return {
        data: validated,
        timestamp: parsed.data.timestamp,
      };
    } catch {
      return null;
    }
  };

  const writeCached = async (index: CourseIndex): Promise<void> => {
    const payload: StoredCourseIndex = {
      timestamp: now(),
      data: index,
    };
    await storage.setItem(COURSE_INDEX_STORAGE_KEY, JSON.stringify(payload));
  };

  const fetchAndCache = async (): Promise<CourseIndex> => {
    const validated = validateIndex(await fetchRemote());
    if (!validated) {
      throw new Error("Invalid course index payload");
    }

    await writeCached(validated);
    inMemoryIndex = validated;
    return validated;
  };

  const ensure = async (forceRemote = false): Promise<CourseIndex> => {
    if (!forceRemote && inMemoryIndex) {
      return inMemoryIndex;
    }

    if (!forceRemote) {
      const cached = await readCached();
      if (cached) {
        inMemoryIndex = cached.data;

        if (now() - cached.timestamp < ttlMs) {
          return cached.data;
        }

        void fetchAndCache().catch((error) =>
          warn("Failed to revalidate course index", error)
        );
        return cached.data;
      }
    }

    return await fetchAndCache();
  };

  return {
    ensure,
    refresh: () => ensure(true),
  };
};

const courseIndexRepository = createCourseIndexRepository({
  storage: AsyncStorage,
  fetchRemote: async () => {
    const response = await fetch(COURSE_INDEX_URL);
    if (!response.ok) {
      throw new Error("Failed to fetch course index");
    }
    return await response.json();
  },
});

export const ensureCourseIndex = (forceRemote = false) =>
  courseIndexRepository.ensure(forceRemote);

export const refreshCourseIndex = () => courseIndexRepository.refresh();
