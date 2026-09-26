import type { CourseIndex, CourseMetadata, LessonData } from "@/src/data/courseSchemas";
import type { CourseName } from "@/src/types";

// These files are generated from the public CAS by `npm run prepare:preloaded-content`.
// Keep the paths static so Metro includes them only in the iOS build.
const metadata: Record<CourseName, () => CourseMetadata> = {
  spanish: () => require("@/generated/preloaded-content/metadata/spanish.json"),
  arabic: () => require("@/generated/preloaded-content/metadata/arabic.json"),
  turkish: () => require("@/generated/preloaded-content/metadata/turkish.json"),
  german: () => require("@/generated/preloaded-content/metadata/german.json"),
  greek: () => require("@/generated/preloaded-content/metadata/greek.json"),
  italian: () => require("@/generated/preloaded-content/metadata/italian.json"),
  swahili: () => require("@/generated/preloaded-content/metadata/swahili.json"),
  french: () => require("@/generated/preloaded-content/metadata/french.json"),
  ingles: () => require("@/generated/preloaded-content/metadata/ingles.json"),
  ingles_completo: () => require("@/generated/preloaded-content/metadata/ingles_completo.json"),
  music: () => require("@/generated/preloaded-content/metadata/music.json"),
};
// This module is generated from scripts/preloaded-content.config.json. Each
// value is a static require, so Metro includes only the selected iOS audio.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const audio = require("@/generated/preloaded-content/assets.js") as Record<string, number>;

export const getPreloadedCourseIndex = (): CourseIndex =>
  require("@/generated/preloaded-content/metadata/all-courses.json");
export const getPreloadedCourseMetadata = (course: CourseName): CourseMetadata => metadata[course]();
export const getPreloadedLesson = (
  course: CourseName,
  index: number
): { asset: number; data: LessonData } | null => {
  const asset = audio[`${course}:${index}`];
  if (asset == null) return null;
  const data = getPreloadedCourseMetadata(course).lessons[index];
  if (!data) throw new Error(`Missing preloaded metadata for ${course} lesson ${index}`);
  return { asset, data };
};
