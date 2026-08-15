import {
  allCoursesSchema,
  courseMetaSchema,
  storedAllCoursesSchema,
} from "@/src/data/courseSchemas";

const filePointer = {
  _type: "file" as const,
  object: "0123456789abcdef",
  filesize: 123,
  mimeType: "application/json",
};

describe("course schemas", () => {
  test("accepts a valid course index", () => {
    const index = {
      buildVersion: 2,
      casBaseURL: "https://downloads.example/cas",
      courses: [
        {
          id: "spanish",
          lessons: 90,
          meta: filePointer,
        },
      ],
    };

    expect(allCoursesSchema.parse(index)).toEqual(index);
  });

  test("allows the server to advertise courses unknown to this app version", () => {
    const result = allCoursesSchema.safeParse({
      buildVersion: 2,
      casBaseURL: "https://downloads.example/cas",
      courses: [
        {
          id: "future-course",
          lessons: 12,
          meta: filePointer,
        },
      ],
    });

    expect(result.success).toBe(true);
  });

  test("rejects unsupported metadata versions", () => {
    const result = courseMetaSchema.safeParse({
      buildVersion: 1,
      lessons: [],
    });

    expect(result.success).toBe(false);
  });

  test("validates the cached index envelope", () => {
    const result = storedAllCoursesSchema.safeParse({
      timestamp: "yesterday",
      data: {
        buildVersion: 2,
        casBaseURL: "https://downloads.example/cas",
        courses: [],
      },
    });

    expect(result.success).toBe(false);
  });
});
