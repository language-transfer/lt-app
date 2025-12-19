import { z } from "zod";

export const filePointerSchema = z.object({
  _type: z.literal("file"),
  object: z.string(),
  filesize: z.number(),
  mimeType: z.string(),
});

export const lessonSchema = z.object({
  id: z.string(),
  title: z.string(),
  duration: z.number(),
  variants: z.object({
    hq: filePointerSchema,
    lq: filePointerSchema,
  }),
});

export const courseMetaSchema = z.object({
  buildVersion: z.literal(2),
  lessons: z.array(lessonSchema),
});

export const courseIndexEntrySchema = z.object({
  id: z.string(),
  meta: filePointerSchema,
  lessons: z.number(),
});

export const allCoursesSchema = z.object({
  buildVersion: z.literal(2),
  casBaseURL: z.string(),
  courses: z.array(courseIndexEntrySchema),
});

export const storedAllCoursesSchema = z.object({
  timestamp: z.number(),
  data: allCoursesSchema,
});

export type FilePointer = z.infer<typeof filePointerSchema>;
export type ObjectPointer = Pick<FilePointer, "object">;
export type LessonVariants = z.infer<typeof lessonSchema>["variants"];
export type LessonData = z.infer<typeof lessonSchema>;
export type CourseMetadata = z.infer<typeof courseMetaSchema>;
export type CourseIndexEntry = z.infer<typeof courseIndexEntrySchema>;
export type CourseIndex = z.infer<typeof allCoursesSchema>;
export type StoredCourseIndex = z.infer<typeof storedAllCoursesSchema>;
