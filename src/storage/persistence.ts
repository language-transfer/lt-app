import AsyncStorage from "@react-native-async-storage/async-storage";
import { v4 as uuid } from "uuid";

import { CourseDownloadManager } from "@/src/services/downloadManager";
import type { CourseName, Progress } from "@/src/types";
import { useQuery } from "@tanstack/react-query";
import z from "zod";
import { queryClient } from "../data/queryClient";
import { log } from "../utils/log";
import { migratePreference } from "./migrations";

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

export const getPreferenceWithDefault = async <T>(
  preference: Preference<T>
): Promise<T> => {
  let val = await AsyncStorage.getItem(`@preferences/${preference.name}`);
  if (val === null) {
    return preference.defaultValue;
  }

  const migrated = migratePreference(preference.name, val);

  if (migrated.changed) {
    await AsyncStorage.setItem(
      `@preferences/${preference.name}`,
      migrated.updated
    );
    val = migrated.updated;
  }

  const parsed = preference.schema.safeParse(JSON.parse(val));
  if (!parsed.success) {
    console.error("Failed to parse preference:", preference.name, val);
    return preference.defaultValue;
  }

  return parsed.data;
};

export const setPreference = async <T>(
  preference: Preference<T>,
  val: T
): Promise<void> => {
  const asString = JSON.stringify(val);
  await AsyncStorage.setItem(`@preferences/${preference.name}`, asString);
  queryClient.invalidateQueries({
    queryKey: ["@local", "preference", preference.name],
  });
  log({
    action: "set_preference",
    surface: "preference-change",
    preference_key: preference.name,
    preference_value: asString,
  }).then();
};

// export type Preference =
//   | "auto-delete-finished"
//   | "stream-quality"
//   | "download-quality"
//   | "download-only-on-wifi"
//   | "allow-data-collection"
//   | "is-first-load"
//   | "rating-button-dismissed"
//   | "killswitch-course-version-v1";

export type Preference<T> = {
  name: string;
  schema: z.ZodType<T>;
  defaultValue: T;
};

export const PreferenceAutoDelete: Preference<boolean> = {
  name: "auto-delete-finished",
  schema: z.boolean(),
  defaultValue: false,
};

const QualitySchema = z.enum(["low", "high"]);

export const PreferenceStreamQuality: Preference<
  z.TypeOf<typeof QualitySchema>
> = {
  name: "stream-quality",
  schema: QualitySchema,
  defaultValue: "low",
};

export const PreferenceDownloadQuality: Preference<
  z.TypeOf<typeof QualitySchema>
> = {
  name: "download-quality",
  schema: QualitySchema,
  defaultValue: "high",
};

export const PreferenceDownloadOnlyOnWifi: Preference<boolean> = {
  name: "download-only-on-wifi",
  schema: z.boolean(),
  defaultValue: true,
};

export const PreferenceAllowDataCollection: Preference<boolean> = {
  name: "allow-data-collection",
  schema: z.boolean(),
  defaultValue: true,
};

export const PreferenceIsFirstLoad: Preference<boolean> = {
  name: "is-first-load",
  schema: z.boolean(),
  defaultValue: true,
};

const RatingButtonDismissedSchema = z.object({
  dismissed: z.boolean(),
  surface: z.enum(["LanguageHomeTopButton"]).optional(),
  explicit: z.boolean().optional(),
  time: z.number().optional(),
});

export const PreferenceRatingButtonDismissed: Preference<
  z.TypeOf<typeof RatingButtonDismissedSchema>
> = {
  name: "rating-button-dismissed",
  schema: RatingButtonDismissedSchema,
  defaultValue: { dismissed: false },
};

export const PreferenceKillswitchCourseVersionV1: Preference<boolean> = {
  name: "killswitch-course-version-v1",
  schema: z.boolean(),
  defaultValue: false,
};

export function usePreference<T>(preference: Preference<T>): T | null {
  const query = useQuery({
    queryKey: ["@local", "preference", preference.name],
    queryFn: async () => {
      const value = await getPreferenceWithDefault<T>(preference);
      return value;
    },
  });

  // need a default value, because null is reserved for not-yet-loaded
  // (we _could_ return the query object here, I suppose...)
  return query.isSuccess ? query.data : null;
}
