import { useGlobalSearchParams } from "expo-router";
import CourseData from "../data/courseData";
import { CourseName, CourseNameSchema, UIColors } from "../types";

export const useCourseLessonData = (): {
  course: CourseName | null;
  lesson: number | null;
} => {
  const params = useGlobalSearchParams<{ course: string; lesson: string }>();

  const course = CourseNameSchema.safeParse(params.course);
  if (!course.success) {
    return { course: null, lesson: null };
  }

  if (params.lesson === undefined) {
    return { course: course.data, lesson: null };
  }

  const lesson = Number(params.lesson);
  return { course: course.data, lesson };
};

export const useCourseColors = (): UIColors => {
  const { course } = useCourseLessonData();
  if (course === null) {
    return {
      background: "#FFFFFF",
      backgroundAccent: "#FFFFFF",
      text: "black",
      softBackground: "#FFFFFF",
    };
  }

  return CourseData.getCourseUIColors(course);
};
