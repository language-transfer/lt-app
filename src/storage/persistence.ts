import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { v4 as uuid } from "uuid";

import { CourseDownloadManager } from "@/src/services/downloadManager";
import type { CourseName, Preference, Progress, Quality } from "@/src/types";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "../data/queryClient";

const activityKey = (course: CourseName, lesson?: number) =>
  lesson === undefined
    ? `@activity/${course}`
    : `@activity/${course}/${lesson}`;

export const genAutopause = async (): Promise<{
  type: "off" | "timed" | "manual";
  timedDelay?: number;
}> => {
  const autopause = await AsyncStorage.getItem("@global-setting/autopause");
  if (!autopause) {
    return { type: "off" };
  }
  return JSON.parse(autopause);
};

export const genMostRecentListenedLessonForCourse = async (
  course: CourseName
): Promise<number | null> => {
  const value = await AsyncStorage.getItem(
    `${activityKey(course)}/most-recent-lesson`
  );
  return value === null ? null : Number.parseInt(value, 10);
};

export const genMostRecentListenedCourse =
  async (): Promise<CourseName | null> => {
    return (await AsyncStorage.getItem(
      "@activity/most-recent-course"
    )) as CourseName | null;
  };

export const genProgressForLesson = async (
  course: CourseName,
  lesson: number | null
): Promise<Progress | null> => {
  if (lesson === null) {
    return null;
  }

  const raw = await AsyncStorage.getItem(activityKey(course, lesson));
  if (!raw) {
    return {
      finished: false,
      progress: null,
    };
  }

  return JSON.parse(raw);
};

export const useLessonProgress = (course: CourseName, lesson: number) => {
  const { data: progress } = useQuery({
    queryKey: ["@local", "progress", course, lesson],
    queryFn: () => genProgressForLesson(course, lesson),
  });
  return progress;
};

export const genUpdateProgressForLesson = async (
  course: CourseName,
  lesson: number,
  progress: number
): Promise<void> => {
  const progressObject = (await genProgressForLesson(course, lesson)) ?? {
    finished: false,
    progress: null,
  };

  await Promise.all([
    AsyncStorage.setItem(
      activityKey(course, lesson),
      JSON.stringify({
        ...progressObject,
        progress,
      })
    ),
    AsyncStorage.setItem(
      `${activityKey(course)}/most-recent-lesson`,
      lesson.toString()
    ),
    AsyncStorage.setItem("@activity/most-recent-course", course),
  ]);

  queryClient.invalidateQueries({
    queryKey: ["@local", "progress", course, lesson],
  });
};

export const genMarkLessonFinished = async (
  course: CourseName,
  lesson: number
): Promise<void> => {
  console.log("Marking lesson finished:", course, lesson);

  const progressObject = (await genProgressForLesson(course, lesson)) ?? {
    finished: false,
    progress: null,
  };

  await Promise.all([
    AsyncStorage.setItem(
      activityKey(course, lesson),
      JSON.stringify({
        ...progressObject,
        finished: true,
      })
    ),
    AsyncStorage.setItem(
      `${activityKey(course)}/most-recent-lesson`,
      lesson.toString()
    ),
    AsyncStorage.setItem("@activity/most-recent-course", course),
  ]);

  queryClient.invalidateQueries({
    queryKey: ["@local", "progress", course, lesson],
  });

  const autoDelete =
    (await AsyncStorage.getItem("@preferences/auto-delete-finished")) ===
    "true";
  if (autoDelete) {
    const downloadStatus = await CourseDownloadManager.getDownloadStatus(
      course,
      lesson
    );
    if (downloadStatus === "downloaded") {
      await CourseDownloadManager.unrequestDownload(course, lesson);
    }
  }
};

export const genDeleteProgressForCourse = async (
  course: CourseName
): Promise<void> => {
  const { default: CourseData } = await import("@/src/data/courseData");
  const shouldRemoveGlobalRecentCourse =
    (await AsyncStorage.getItem("@activity/most-recent-course")) === course;

  await Promise.all([
    AsyncStorage.removeItem(`${activityKey(course)}/most-recent-lesson`),
    ...(shouldRemoveGlobalRecentCourse
      ? [AsyncStorage.removeItem("@activity/most-recent-course")]
      : []),
    ...CourseData.getLessonIndices(course).map((lesson) =>
      AsyncStorage.removeItem(activityKey(course, lesson))
    ),
  ]);
};

export const genMetricsToken = async (): Promise<string> => {
  const stored = await AsyncStorage.getItem("@metrics/user-token");
  if (stored) {
    return stored;
  }

  const token = uuid({
    // do not need crypto random bytes here
    random: Uint8Array.from({ length: 16 }, () =>
      Math.floor(Math.random() * 256)
    ),
  });
  await AsyncStorage.setItem("@metrics/user-token", token);
  return token;
};

export const genDeleteMetricsToken = async (): Promise<void> => {
  await AsyncStorage.removeItem("@metrics/user-token");
};

type PreferenceMethods = [() => Promise<any>, (val: any) => Promise<void>];

const preference = (
  name: Preference,
  defaultValue: any,
  fromString: (str: string) => any,
  toString: (val: any) => string = (val) => String(val)
): PreferenceMethods => {
  return [
    async () => {
      const val = await AsyncStorage.getItem(`@preferences/${name}`);
      if (val === null) {
        return defaultValue;
      }

      return fromString(val);
    },
    async (val: any) => {
      await AsyncStorage.setItem(`@preferences/${name}`, toString(val));
      queryClient.invalidateQueries({
        queryKey: ["@local", "preference", name],
      });
    },
  ];
};

export const [
  genPreferenceAutoDeleteFinished,
  genSetPreferenceAutoDeleteFinished,
] = preference("auto-delete-finished", false, (b) => b === "true");

export const [genPreferenceStreamQuality, genSetPreferenceStreamQuality] =
  preference("stream-quality", "low", (value) => value as Quality);

export const [genPreferenceDownloadQuality, genSetPreferenceDownloadQuality] =
  preference("download-quality", "high", (value) => value as Quality);

export const [
  genPreferenceDownloadOnlyOnWifi,
  genSetPreferenceDownloadOnlyOnWifi,
] = preference("download-only-on-wifi", true, (b) => b === "true");

export const [
  genPreferenceAllowDataCollection,
  genSetPreferenceAllowDataCollection,
] = preference("allow-data-collection", true, (b) => b === "true");

export const [genPreferenceIsFirstLoad, genSetPreferenceIsFirstLoad] =
  preference("is-first-load", true, (b) => b === "true");

export const [
  genPreferenceRatingButtonDismissed,
  genSetPreferenceRatingButtonDismissed,
] = preference(
  "rating-button-dismissed",
  { dismissed: false },
  (o) => JSON.parse(o),
  (val) => JSON.stringify(val)
);

export const [
  genPreferenceKillswitchCourseVersionV1,
  genSetPreferenceKillswitchCourseVersionV1,
] = preference("killswitch-course-version-v1", false, (b) => b === "true");

export function usePreference<T>(key: Preference, defaultValue: any) {
  const [value, setValue] = useState<T | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const [loadFn] = preference(key, defaultValue, (v) => v);
      const result = await loadFn();
      if (mounted) {
        setValue(result);
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, [key, defaultValue]);

  return value;
}

export function usePreferenceQuery<T>(key: Preference, defaultValue: any) {
  return useQuery({
    queryKey: ["@local", "preference", key],
    queryFn: async () => {
      const [loadFn] = preference(key, defaultValue, (v) => v);
      return loadFn() as Promise<T>;
    },
  });
}
