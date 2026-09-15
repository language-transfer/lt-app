import CourseData from "@/src/data/courseData";
import { CourseNameSchema } from "@/src/types";
import * as FileSystem from "expo-file-system/legacy";
import {
  ensureCourseIndex,
  subscribeCourseIndex,
} from "@/src/data/courseIndex";
import { queryClient } from "@/src/data/queryClient";
import { Buffer } from "buffer";

jest.mock("@/src/data/courseIndex", () => ({
  ensureCourseIndex: jest.fn(),
  subscribeCourseIndex: jest.fn(),
}));

jest.mock("expo-file-system/legacy", () => ({
  getInfoAsync: jest.fn(),
  readAsStringAsync: jest.fn(),
  writeAsStringAsync: jest.fn(),
  deleteAsync: jest.fn(),
  EncodingType: { Base64: "base64" },
}));

jest.mock("@/src/services/downloadManager", () => ({
  ensureObjectDir: jest.fn(),
  ensureRootObjectDir: jest.fn(),
  getLocalObjectPath: jest.fn((pointer) => `/objects/${pointer.object}`),
}));

describe("metadata refresh and deletion", () => {
  const pointer = (object: string) => ({
    _type: "file" as const,
    object,
    filesize: 1,
    mimeType: "application/json",
  });
  const index = (object: string) => ({
    buildVersion: 2 as const,
    casBaseURL: "https://example.test",
    courses: [{ id: "spanish", lessons: 1, meta: pointer(object) }],
  });
  const metadata = (title: string) => ({
    buildVersion: 2,
    lessons: [
      {
        id: "lesson1",
        title,
        duration: 60,
        variants: { hq: pointer(`${title}-hq`), lq: pointer(`${title}-lq`) },
      },
    ],
  });

  beforeEach(async () => {
    jest.mocked(ensureCourseIndex).mockResolvedValue(index("old"));
    await CourseData.deleteCourseMetadata("spanish");
    jest
      .mocked(FileSystem.getInfoAsync)
      .mockResolvedValue({ exists: true } as FileSystem.FileInfo);
    jest
      .mocked(FileSystem.readAsStringAsync)
      .mockImplementation(async (path) =>
        Buffer.from(
          JSON.stringify(metadata(path.endsWith("new") ? "new" : "old"))
        ).toString("base64")
      );
    jest.clearAllMocks();
  });

  afterEach(() => queryClient.clear());

  test("downloads newly referenced metadata and only refreshes the index once", async () => {
    await CourseData.loadCourseMetadata("spanish");
    jest.mocked(ensureCourseIndex).mockResolvedValue(index("new"));
    jest
      .mocked(FileSystem.getInfoAsync)
      .mockResolvedValueOnce({ exists: false } as FileSystem.FileInfo)
      .mockResolvedValueOnce({ exists: false } as FileSystem.FileInfo);
    const originalFetch = global.fetch;
    global.fetch = jest
      .fn()
      .mockResolvedValue({
        ok: true,
        arrayBuffer: async () =>
          Uint8Array.from(Buffer.from(JSON.stringify(metadata("new")))).buffer,
      });
    try {
      await CourseData.loadCourseMetadata("spanish", true);
      expect(global.fetch).toHaveBeenCalledWith("https://example.test/new");
      expect(FileSystem.writeAsStringAsync).toHaveBeenCalled();
      expect(
        jest.mocked(ensureCourseIndex).mock.calls.filter(([force]) => force)
      ).toHaveLength(1);
      expect(CourseData.getLessonData("spanish", 0).title).toBe("new");
    } finally {
      global.fetch = originalFetch;
    }
  });

  test("forced refresh replaces loaded metadata and query data without restarting", async () => {
    await CourseData.loadCourseMetadata("spanish");
    jest.mocked(ensureCourseIndex).mockResolvedValue(index("new"));
    await CourseData.loadCourseMetadata("spanish", true);
    expect(ensureCourseIndex).toHaveBeenCalledWith(true);
    expect(CourseData.getLessonData("spanish", 0).title).toBe("new");
    expect(
      queryClient.getQueryData(["@local", "course-data", "metadata", "spanish"])
    ).toEqual(metadata("new"));
    expect(CourseData.getAllLoadedObjectIds()).not.toContain("old-hq");
  });

  test("index updates invalidate loaded lesson metadata", async () => {
    await CourseData.loadCourseMetadata("spanish", true);
    jest.mocked(ensureCourseIndex).mockResolvedValue(index("new"));
    indexListener(index("new"));
    expect(
      queryClient.getQueryState([
        "@local",
        "course-data",
        "metadata",
        "spanish",
      ])?.isInvalidated
    ).toBe(true);
    await CourseData.loadCourseMetadata("spanish");
    expect(CourseData.getLessonData("spanish", 0).title).toBe("new");
  });

  test("deletion clears disk, memory, and query metadata", async () => {
    await CourseData.loadCourseMetadata("spanish", true);
    await CourseData.deleteCourseMetadata("spanish");
    expect(FileSystem.deleteAsync).toHaveBeenCalledWith("/objects/old", {
      idempotent: true,
    });
    expect(CourseData.isCourseMetadataLoaded("spanish")).toBe(false);
    expect(
      queryClient.getQueryData(["@local", "course-data", "metadata", "spanish"])
    ).toBeUndefined();
  });

  test("failed explicit refresh rejects and preserves existing metadata", async () => {
    await CourseData.loadCourseMetadata("spanish");
    jest.mocked(ensureCourseIndex).mockRejectedValueOnce(new Error("offline"));
    await expect(
      CourseData.loadCourseMetadata("spanish", true)
    ).rejects.toThrow("offline");
    expect(CourseData.getLessonData("spanish", 0).title).toBe("old");
  });
});

const indexListener = jest.mocked(subscribeCourseIndex).mock.calls[0][0];

describe("Complete Inglés course registration", () => {
  test("registers the new course without replacing the previous introduction", () => {
    expect(CourseNameSchema.safeParse("ingles_completo").success).toBe(true);
    expect(CourseData.courseExists("ingles_completo")).toBe(true);
    expect(CourseData.courseExists("ingles")).toBe(true);
    expect(CourseData.isCourseVisible("ingles_completo")).toBe(true);
    expect(CourseData.isCourseVisible("ingles")).toBe(false);
    expect(CourseData.getCourseList()).toContain("ingles_completo");
    expect(CourseData.getCourseList()).not.toContain("ingles");
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
