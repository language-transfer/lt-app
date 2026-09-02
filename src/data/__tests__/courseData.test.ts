import CourseData from "@/src/data/courseData";
import { CourseNameSchema } from "@/src/types";

jest.mock("@/src/services/downloadManager", () => ({
  ensureObjectDir: jest.fn(),
  ensureRootObjectDir: jest.fn(),
  getLocalObjectPath: jest.fn(),
}));

describe("Complete Inglés course registration", () => {
  test("registers the new course without replacing the previous introduction", () => {
    expect(CourseNameSchema.safeParse("ingles_completo").success).toBe(true);
    expect(CourseData.courseExists("ingles_completo")).toBe(true);
    expect(CourseData.courseExists("ingles")).toBe(true);
    expect(CourseData.getCourseData("ingles_completo")).toMatchObject({
      shortTitle: "Inglés",
      fullTitle: "Inglés Completo",
      courseType: "complete",
    });
    expect(CourseData.getFallbackLessonCount("ingles_completo")).toBe("51");
  });

  test("reuses the existing Inglés artwork", () => {
    expect(CourseData.getCourseImage("ingles_completo")).toBe(
      CourseData.getCourseImage("ingles")
    );
    expect(CourseData.getCourseImageWithText("ingles_completo")).toBe(
      CourseData.getCourseImageWithText("ingles")
    );
  });
});
