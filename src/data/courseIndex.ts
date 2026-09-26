import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/src/data/queryClient";
import { getPreloadedCourseIndex } from "@/src/data/preloadedContent";

import {
  allCoursesSchema,
  storedAllCoursesSchema,
  type CourseIndex,
  type StoredCourseIndex,
} from "@/src/data/courseSchemas";

export const COURSE_INDEX_URL =
  "https://downloads.languagetransfer.org/all-courses.json";
export const COURSE_INDEX_STORAGE_KEY = "@course-index/all";
export const COURSE_INDEX_TTL_MS = 1000 * 60 * 60 * 12;
export const COURSE_INDEX_QUERY_KEY = ["course-index"];
const listeners = new Set<(index: CourseIndex) => void>();
export const subscribeCourseIndex = (
  listener: (index: CourseIndex) => void
) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

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
  onUpdate?: (index: CourseIndex) => void;
  preloadedIndex?: CourseIndex | null | (() => CourseIndex | null);
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
  onUpdate,
  preloadedIndex,
}: CourseIndexRepositoryDependencies) => {
  let inMemoryIndex: CourseIndex | null = null;
  let updatedAt = 0;
  let pending: Promise<CourseIndex> | null = null;

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
    updatedAt = now();
    onUpdate?.(validated);
    return validated;
  };

  const refresh = () => {
    pending ??= fetchAndCache().finally(() => {
      pending = null;
    });
    return pending;
  };

  const ensure = async (forceRemote = false): Promise<CourseIndex> => {
    if (!forceRemote && inMemoryIndex && now() - updatedAt < ttlMs) {
      return inMemoryIndex;
    }

    if (!forceRemote) {
      const cached = await readCached();
      if (cached) {
        inMemoryIndex = cached.data;
        updatedAt = cached.timestamp;

        if (now() - cached.timestamp < ttlMs) {
          return cached.data;
        }

        try {
          return await refresh();
        } catch (error) {
          warn("Failed to revalidate course index", error);
          return cached.data;
        }
      }
    }

    try {
      return await refresh();
    } catch (error) {
      const snapshot =
        typeof preloadedIndex === "function" ? preloadedIndex() : preloadedIndex;
      const fallback = snapshot && validateIndex(snapshot);
      if (!fallback) throw error;
      warn("Failed to load course index; using preloaded snapshot", error);
      inMemoryIndex = fallback;
      // Retry the network soon if the app comes online during this session.
      updatedAt = now() - ttlMs + Math.min(ttlMs, 60_000);
      onUpdate?.(fallback);
      return fallback;
    }
  };

  return {
    ensure,
    refresh: () => ensure(true),
    timeUntilRefresh: () => Math.max(0, updatedAt + ttlMs - now()),
  };
};

const courseIndexRepository = createCourseIndexRepository({
  storage: AsyncStorage,
  preloadedIndex: getPreloadedCourseIndex,
  onUpdate: (index) => {
    for (const listener of listeners) listener(index);
    queryClient.setQueryData(COURSE_INDEX_QUERY_KEY, index);
  },
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

export const useCourseIndex = () =>
  useQuery({
    queryKey: COURSE_INDEX_QUERY_KEY,
    queryFn: () => ensureCourseIndex(),
    // The repository owns the persisted twelve-hour TTL. Check it on mount
    // instead of starting a second twelve-hour window when a query reads it.
    staleTime: 0,
    refetchInterval: () =>
      Math.max(60_000, courseIndexRepository.timeUntilRefresh()),
    retry: false,
  });
