import CourseData from "@/src/data/courseData";
import { CourseNameSchema } from "@/src/types";

jest.mock("@/src/services/downloadManager", () => ({
  ensureObjectDir: jest.fn(),
  ensureRootObjectDir: jest.fn(),
  getLocalObjectPath: jest.fn(),
}));

describe("Complete Inglés course registration", () => {
  test("registers the new course without replacing the previous introduction", () => {
    expect(CourseNameSchema.safeParse("ingles2026").success).toBe(true);
    expect(CourseData.courseExists("ingles2026")).toBe(true);
    expect(CourseData.courseExists("ingles")).toBe(true);
    expect(CourseData.getCourseData("ingles2026")).toMatchObject({
      shortTitle: "Inglés",
      fullTitle: "Inglés Completo",
      courseType: "complete",
    });
    expect(CourseData.getFallbackLessonCount("ingles2026")).toBeUndefined();
  });

  test("reuses the existing Inglés artwork", () => {
    expect(CourseData.getCourseImage("ingles2026")).toBe(
      CourseData.getCourseImage("ingles")
    );
    expect(CourseData.getCourseImageWithText("ingles2026")).toBe(
      CourseData.getCourseImageWithText("ingles")
    );
  });
});
