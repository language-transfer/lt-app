import { useGlobalSearchParams, useLocalSearchParams } from "expo-router";
import CourseData from "../data/courseData";
import { CourseName, CourseNameSchema, UIColors } from "../types";

export const useCurrentCourse = (): CourseName => {
  const params = useLocalSearchParams<{ course: string }>();

  const course = CourseNameSchema.safeParse(params.course);
  if (!course.success) {
    throw new Error("No course in this route");
  }

  return course.data;
};

export const useCurrentLesson = (): number => {
  const params = useLocalSearchParams<{ lesson: string }>();

  if (params.lesson === undefined) {
    throw new Error("No lesson in this route");
  }

  const lesson = Number(params.lesson);

  if (Number.isNaN(lesson)) {
    throw new Error("Lesson is not a number");
  }

  return lesson;
};

export const useCurrentCourseColors = (): UIColors | null => {
  const course = useCurrentCourse();
  return CourseData.getCourseUIColors(course);
};

// this one is used in the top-level context since that's where we can set
// the safeareaview background color. but we only do this when lesson home is shown
export const useCurrentCourseColorsIfPresent = (): UIColors | null => {
  // here we use global params, since we're above the stack.
  // it's important to use local elsewhere, otherwise the course goes null before unmount
  const params = useGlobalSearchParams<{ course?: string }>();

  if (!params.course) {
    return null;
  }

  const course = CourseNameSchema.safeParse(params.course);
  if (!course.success) {
    return null;
  }

  return CourseData.getCourseUIColors(course.data);
};
