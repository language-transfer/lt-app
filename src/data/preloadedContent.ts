import type { CourseIndex, CourseMetadata, LessonData } from "@/src/data/courseSchemas";
import type { CourseName } from "@/src/types";

// Metro resolves preloadedContent.ios.ts for iOS. Other platforms have no preloaded media.
export const getPreloadedCourseIndex = (): CourseIndex | null => null;
export const getPreloadedCourseMetadata = (_course: CourseName): CourseMetadata | null => null;
export const getPreloadedLesson = (
  _course: CourseName,
  _index: number
): { asset: number; data: LessonData } | null => null;
