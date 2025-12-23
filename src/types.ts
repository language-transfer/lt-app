import { ImageSourcePropType } from "react-native";
import { z } from "zod";

export const CourseNameSchema = z.enum([
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
]);

export type CourseName = z.infer<typeof CourseNameSchema>;

export type CourseType = "intro" | "complete";

export type Quality = "high" | "low";

export interface UIColors {
  background: string;
  softBackground: string;
  text: "white" | "black";
  backgroundAccent: string;
}

export interface CourseInfo {
  image: ImageSourcePropType;
  imageWithText: ImageSourcePropType;
  shortTitle: string;
  fullTitle: string;
  courseType: CourseType;
  fallbackLessonCount: string;
  uiColors: UIColors;
  bundledFirstLesson?: any;
  bundledFirstLessonId?: string;
}

export type {
  CourseIndex as AllCoursesIndex, CourseIndexEntry, FilePointer, LessonData, LessonVariants
} from "@/src/data/courseSchemas";

export interface Progress {
  finished: boolean;
  progress: number | null;
}

export interface DownloadSnapshot {
  id: string;
  state: "idle" | "downloading" | "finished" | "error";
  bytesWritten: number;
  totalBytes: number | null;
  errorMessage?: string;
  requested: boolean;
}
