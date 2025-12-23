import AsyncStorage from "@react-native-async-storage/async-storage";
import { v4 as uuid } from "uuid";

import { CourseDownloadManager } from "@/src/services/downloadManager";
import type { CourseName, Preference, Progress, Quality } from "@/src/types";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "../data/queryClient";

const activityKey = (course: CourseName, lesson?: number) =>
  lesson === undefined
    ? `@activity/${course}`
    : `@activity/${course}/${lesson}`;

export const getMostRecentListenedLessonForCourse = async (
  course: CourseName
): Promise<number | null> => {
  const value = await AsyncStorage.getItem(
    `${activityKey(course)}/most-recent-lesson`
  );
  return value === null ? null : Number.parseInt(value, 10);
};

export const getMostRecentListenedCourse =
  async (): Promise<CourseName | null> => {
    return (await AsyncStorage.getItem(
      "@activity/most-recent-course"
    )) as CourseName | null;
  };

export const getProgressForLesson = async (
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
    queryFn: () => getProgressForLesson(course, lesson),
  });
  return progress;
};

export const updateProgressForLesson = async (
  course: CourseName,
  lesson: number,
  progress: number
): Promise<void> => {
  const progressObject = (await getProgressForLesson(course, lesson)) ?? {
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

export const markLessonFinished = async (
  course: CourseName,
  lesson: number
): Promise<void> => {
  console.log("Marking lesson finished:", course, lesson);

  const progressObject = (await getProgressForLesson(course, lesson)) ?? {
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

export const deleteProgressForCourse = async (
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

export const getMetricsToken = async (): Promise<string> => {
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

export const deleteMetricsToken = async (): Promise<void> => {
  await AsyncStorage.removeItem("@metrics/user-token");
};

type PreferenceMethods<T> = [
  () => Promise<T>,
  (val: T) => Promise<void>,
  () => T | null
];

const getPreferenceOrDefault = async <T>(
  name: Preference,
  defaultValue: T,
  fromString: (str: string) => T
): Promise<T> => {
  const val = await AsyncStorage.getItem(`@preferences/${name}`);
  if (val === null) {
    return defaultValue;
  }

  return fromString(val);
};

const setPreference = async <T>(
  name: Preference,
  val: T,
  toString: (v: T) => string = (v) => String(v)
): Promise<void> => {
  await AsyncStorage.setItem(`@preferences/${name}`, toString(val));
  queryClient.invalidateQueries({
    queryKey: ["@local", "preference", name],
  });
};

const preference = <T>(
  name: Preference,
  defaultValue: T,
  fromString: (str: string) => T,
  toString: (val: T) => string = (val) => String(val)
): PreferenceMethods<T> => {
  return [
    () => getPreferenceOrDefault<T>(name, defaultValue, fromString),
    (val: T) => setPreference<T>(name, val, toString),
    () => {
      return usePreference<T>(name, defaultValue, fromString);
    },
  ];
};

// todo - replace this with runtime type stuff w/ zod

export const [
  getPreferenceAutoDeleteFinished,
  setPreferenceAutoDeleteFinished,
  usePreferenceAutoDeleteFinished,
] = preference("auto-delete-finished", false, (b) => b === "true");

export const [
  getPreferenceStreamQuality,
  setPreferenceStreamQuality,
  usePreferenceStreamQuality,
] = preference("stream-quality", "low", (value) => value as Quality);

export const [
  getPreferenceDownloadQuality,
  setPreferenceDownloadQuality,
  usePreferenceDownloadQuality,
] = preference("download-quality", "high", (value) => value as Quality);

export const [
  getPreferenceDownloadOnlyOnWifi,
  setPreferenceDownloadOnlyOnWifi,
  usePreferenceDownloadOnlyOnWifi,
] = preference("download-only-on-wifi", true, (b) => b === "true");

export const [
  getPreferenceAllowDataCollection,
  setPreferenceAllowDataCollection,
  usePreferenceAllowDataCollection,
] = preference("allow-data-collection", true, (b) => b === "true");

export const [
  getPreferenceIsFirstLoad,
  setPreferenceIsFirstLoad,
  usePreferenceIsFirstLoad,
] = preference("is-first-load", true, (b) => b === "true");

export const [
  getPreferenceRatingButtonDismissed,
  setPreferenceRatingButtonDismissed,
  usePreferenceRatingButtonDismissed,
] = preference<{
  dismissed: boolean;
  surface?: "LanguageHomeTopButton";
  explicit?: boolean;
  time?: number;
}>(
  "rating-button-dismissed",
  { dismissed: false },
  (o) => JSON.parse(o),
  (val) => JSON.stringify(val)
);

export const [
  getPreferenceKillswitchCourseVersionV1,
  setPreferenceKillswitchCourseVersionV1,
  usePreferenceKillswitchCourseVersionV1,
] = preference("killswitch-course-version-v1", false, (b) => b === "true");

export function usePreference<T>(
  key: Preference,
  defaultValue: T,
  fromString: (str: string) => T
): T | null {
  const query = useQuery({
    queryKey: ["@local", "preference", key],
    queryFn: async () => {
      const value = await getPreferenceOrDefault<T>(
        key,
        defaultValue,
        fromString
      );
      return value;
    },
  });

  // need a default value, because null is reserved for not-yet-loaded
  // (we _could_ return the query object here, I suppose...)
  return query.isSuccess ? query.data : null;
}
