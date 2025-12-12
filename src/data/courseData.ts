import { Buffer } from "buffer";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";
import { Platform } from "react-native";

import {
  allCoursesSchema,
  CourseMetadata,
  courseMetaSchema,
  type CourseIndex,
  type FilePointer,
  type LessonData,
  storedAllCoursesSchema,
  type StoredCourseIndex,
} from "@/src/data/courseSchemas";
import { CourseInfo, CourseName, Quality, UIColors } from "@/src/types";

import arabicCoverWithText from "@/assets/courses/images/arabic-cover-stylized-with-text.png";
import arabicCover from "@/assets/courses/images/arabic-cover-stylized.png";
import frenchCoverWithText from "@/assets/courses/images/french-cover-stylized-with-text.png";
import frenchCover from "@/assets/courses/images/french-cover-stylized.png";
import germanCoverWithText from "@/assets/courses/images/german-cover-stylized-with-text.png";
import germanCover from "@/assets/courses/images/german-cover-stylized.png";
import greekCoverWithText from "@/assets/courses/images/greek-cover-stylized-with-text.png";
import greekCover from "@/assets/courses/images/greek-cover-stylized.png";
import inglesCoverWithText from "@/assets/courses/images/ingles-cover-stylized-with-text.png";
import inglesCover from "@/assets/courses/images/ingles-cover-stylized.png";
import italianCoverWithText from "@/assets/courses/images/italian-cover-stylized-with-text.png";
import italianCover from "@/assets/courses/images/italian-cover-stylized.png";
import musicCoverWithText from "@/assets/courses/images/music-cover-stylized-with-text.png";
import musicCover from "@/assets/courses/images/music-cover-stylized.png";
import spanishCoverWithText from "@/assets/courses/images/spanish-cover-stylized-with-text.png";
import spanishCover from "@/assets/courses/images/spanish-cover-stylized.png";
import swahiliCoverWithText from "@/assets/courses/images/swahili-cover-stylized-with-text.png";
import swahiliCover from "@/assets/courses/images/swahili-cover-stylized.png";
import turkishCoverWithText from "@/assets/courses/images/turkish-cover-stylized-with-text.png";
import turkishCover from "@/assets/courses/images/turkish-cover-stylized.png";

const spanishFirstLesson =
  Platform.OS === "ios"
    ? require("@/assets/courses/audio/spanish1-lq.mp3")
    : null;
const arabicFirstLesson =
  Platform.OS === "ios"
    ? require("@/assets/courses/audio/arabic1-lq.mp3")
    : null;
const turkishFirstLesson =
  Platform.OS === "ios"
    ? require("@/assets/courses/audio/turkish1-lq.mp3")
    : null;
const germanFirstLesson =
  Platform.OS === "ios"
    ? require("@/assets/courses/audio/german1-lq.mp3")
    : null;
const greekFirstLesson =
  Platform.OS === "ios"
    ? require("@/assets/courses/audio/greek1-lq.mp3")
    : null;
const italianFirstLesson =
  Platform.OS === "ios"
    ? require("@/assets/courses/audio/italian1-lq.mp3")
    : null;
const swahiliFirstLesson =
  Platform.OS === "ios"
    ? require("@/assets/courses/audio/swahili1-lq.mp3")
    : null;
const frenchFirstLesson =
  Platform.OS === "ios"
    ? require("@/assets/courses/audio/french1-lq.mp3")
    : null;
const inglesFirstLesson =
  Platform.OS === "ios"
    ? require("@/assets/courses/audio/ingles1-lq.mp3")
    : null;
const musicFirstLesson =
  Platform.OS === "ios"
    ? require("@/assets/courses/audio/music1-lq.mp3")
    : null;

const COURSE_INDEX_URL =
  "https://downloads.languagetransfer.org/all-courses.json";
const COURSE_INDEX_STORAGE_KEY = "@course-index/all";
const COURSE_INDEX_TTL_MS = 1000 * 60 * 60 * 24 * 7;

const DOCUMENT_DIRECTORY =
  (FileSystem as any).documentDirectory ??
  (FileSystem as any).cacheDirectory ??
  "";
const OBJECT_STORAGE_DIR = `${DOCUMENT_DIRECTORY}objects`;

const courseInfoData: Record<CourseName, CourseInfo> = {
  spanish: {
    image: spanishCover,
    imageWithText: spanishCoverWithText,
    shortTitle: "Spanish",
    fullTitle: "Complete Spanish",
    courseType: "complete",
    fallbackLessonCount: "90",
    uiColors: {
      background: "#7186d0",
      softBackground: "#d5d9ee",
      text: "white",
      backgroundAccent: "#516198",
    },
    bundledFirstLesson: spanishFirstLesson,
    bundledFirstLessonId: "spanish/spanish1",
  },
  arabic: {
    image: arabicCover,
    imageWithText: arabicCoverWithText,
    shortTitle: "Arabic",
    fullTitle: "Introduction to Arabic",
    courseType: "intro",
    fallbackLessonCount: "38",
    uiColors: {
      background: "#c2930f",
      softBackground: "#e9dccc",
      text: "black",
      backgroundAccent: "#806006",
    },
    bundledFirstLesson: arabicFirstLesson,
    bundledFirstLessonId: "arabic/arabic1",
  },
  turkish: {
    image: turkishCover,
    imageWithText: turkishCoverWithText,
    shortTitle: "Turkish",
    fullTitle: "Introduction to Turkish",
    courseType: "intro",
    fallbackLessonCount: "44",
    uiColors: {
      background: "#a20b3b",
      softBackground: "#e0ccce",
      text: "white",
      backgroundAccent: "#760629",
    },
    bundledFirstLesson: turkishFirstLesson,
    bundledFirstLessonId: "turkish/turkish1",
  },
  german: {
    image: germanCover,
    imageWithText: germanCoverWithText,
    shortTitle: "German",
    fullTitle: "Complete German",
    courseType: "complete",
    fallbackLessonCount: "50",
    uiColors: {
      background: "#009900",
      softBackground: "#cbdecb",
      text: "white",
      backgroundAccent: "#006400",
    },
    bundledFirstLesson: germanFirstLesson,
    bundledFirstLessonId: "german/german1",
  },
  greek: {
    image: greekCover,
    imageWithText: greekCoverWithText,
    shortTitle: "Greek",
    fullTitle: "Complete Greek",
    courseType: "complete",
    fallbackLessonCount: "120",
    uiColors: {
      background: "#d57d2f",
      softBackground: "#efd7cd",
      text: "white",
      backgroundAccent: "#9c5a20",
    },
    bundledFirstLesson: greekFirstLesson,
    bundledFirstLessonId: "greek/greek1",
  },
  italian: {
    image: italianCover,
    imageWithText: italianCoverWithText,
    shortTitle: "Italian",
    fullTitle: "Introduction to Italian",
    courseType: "intro",
    fallbackLessonCount: "45",
    uiColors: {
      background: "#e423ae",
      softBackground: "#f5cce3",
      text: "white",
      backgroundAccent: "#a7177f",
    },
    bundledFirstLesson: italianFirstLesson,
    bundledFirstLessonId: "italian/italian1",
  },
  swahili: {
    image: swahiliCover,
    imageWithText: swahiliCoverWithText,
    shortTitle: "Swahili",
    fullTitle: "Complete Swahili",
    courseType: "complete",
    fallbackLessonCount: "110",
    uiColors: {
      background: "#12eddd",
      softBackground: "#ccf8f2",
      text: "black",
      backgroundAccent: "#0aaea2",
    },
    bundledFirstLesson: swahiliFirstLesson,
    bundledFirstLessonId: "swahili/swahili1",
  },
  french: {
    image: frenchCover,
    imageWithText: frenchCoverWithText,
    shortTitle: "French",
    fullTitle: "Introduction to French",
    courseType: "intro",
    fallbackLessonCount: "40",
    uiColors: {
      background: "#10bdff",
      softBackground: "#cce8ff",
      text: "white",
      backgroundAccent: "#098abc",
    },
    bundledFirstLesson: frenchFirstLesson,
    bundledFirstLessonId: "french/french1",
  },
  ingles: {
    image: inglesCover,
    imageWithText: inglesCoverWithText,
    shortTitle: "Inglés",
    fullTitle: "Introducción a Inglés",
    courseType: "intro",
    fallbackLessonCount: "40",
    uiColors: {
      background: "#7186d0",
      softBackground: "#d5daee",
      text: "white",
      backgroundAccent: "#516198",
    },
    bundledFirstLesson: inglesFirstLesson,
    bundledFirstLessonId: "ingles/ingles1",
  },
  music: {
    image: musicCover,
    imageWithText: musicCoverWithText,
    shortTitle: "Music Theory",
    fullTitle: "Introduction to Music Theory",
    courseType: "intro",
    fallbackLessonCount: "30",
    uiColors: {
      background: "#f8eebc",
      softBackground: "#ffffff",
      text: "black",
      backgroundAccent: "#786951",
    },
    bundledFirstLesson: musicFirstLesson,
    bundledFirstLessonId: "music/music1",
  },
};

const loadedInMemoryCourseMeta: Partial<Record<CourseName, CourseMetadata>> =
  {};

// best avoid reloading while the app is open -- keep things consistent
let cachedInMemoryCourseIndex: CourseIndex | null = null;

const normalizeCasBaseURL = (base: string) => base.replace(/\/$/, "");

const ensureObjectDir = async () => {
  const info = await FileSystem.getInfoAsync(OBJECT_STORAGE_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(OBJECT_STORAGE_DIR, {
      intermediates: true,
    });
  }
};

const validateIndex = (raw: any): CourseIndex | null => {
  const parsed = allCoursesSchema.safeParse(raw);
  if (!parsed.success) {
    return null;
  }

  return {
    ...parsed.data,
    casBaseURL: normalizeCasBaseURL(parsed.data.casBaseURL),
  };
};

type CachedCourseIndex = {
  data: CourseIndex;
  timestamp: number;
};

const readCachedCourseIndex = async (): Promise<CachedCourseIndex | null> => {
  try {
    const contents = await AsyncStorage.getItem(COURSE_INDEX_STORAGE_KEY);
    if (!contents) {
      return null;
    }

    const parsed = storedAllCoursesSchema.safeParse(JSON.parse(contents));
    if (!parsed.success) {
      return null;
    }

    const validated = validateIndex(parsed.data.data);
    if (!validated) {
      return null;
    }

    return {
      data: validated,
      timestamp: parsed.data.timestamp,
    };
  } catch {
    return null;
  }
};

const writeCachedCourseIndex = async (index: CourseIndex): Promise<void> => {
  const payload: StoredCourseIndex = {
    timestamp: Date.now(),
    data: index,
  };
  await AsyncStorage.setItem(COURSE_INDEX_STORAGE_KEY, JSON.stringify(payload));
};

const fetchAndCacheCourseIndex = async (): Promise<CourseIndex> => {
  const response = await fetch(COURSE_INDEX_URL);
  if (!response.ok) {
    throw new Error("Failed to fetch course index");
  }

  const json = (await response.json()) as CourseIndex;
  const validated = validateIndex(json);
  if (!validated) {
    throw new Error("Invalid course index payload");
  }

  await writeCachedCourseIndex(validated);
  cachedInMemoryCourseIndex = validated;

  return validated;
};

const ensureCourseIndex = async (forceRemote = false): Promise<CourseIndex> => {
  if (!forceRemote && cachedInMemoryCourseIndex) {
    return cachedInMemoryCourseIndex;
  }

  if (!forceRemote) {
    const cached = await readCachedCourseIndex();
    if (cached) {
      cachedInMemoryCourseIndex = cached.data;

      const isFresh = Date.now() - cached.timestamp < COURSE_INDEX_TTL_MS;
      if (isFresh) {
        return cached.data;
      }

      void fetchAndCacheCourseIndex().catch((error) =>
        console.warn("Failed to revalidate course index", error)
      );
      return cached.data;
    }
  }

  const latest = await fetchAndCacheCourseIndex();
  return latest;
};

export const getCASBaseURL = async (): Promise<string> => {
  const index = await ensureCourseIndex();
  return index.casBaseURL;
};

export const getCASObjectURL = async (
  pointer: FilePointer
): Promise<string> => {
  const baseURL = await getCASBaseURL();
  return `${baseURL}/${pointer.object}`;
};

export const _getLocalObjectPath = (pointer: FilePointer): string => {
  const objectHash = pointer.object;
  const prefix = objectHash.substring(0, 2);
  const rest = objectHash.substring(2);

  return `${OBJECT_STORAGE_DIR}/${prefix}/${rest}`;
};

const _saveLocalObject = async (
  pointer: FilePointer,
  data: Uint8Array
): Promise<void> => {
  const localPath = _getLocalObjectPath(pointer);
  const dirPath = localPath.substring(0, localPath.lastIndexOf("/"));
  await FileSystem.makeDirectoryAsync(dirPath, { intermediates: true });
  await FileSystem.writeAsStringAsync(
    localPath,
    // bizarre
    Buffer.from(data).toString("base64"),
    { encoding: FileSystem.EncodingType.Base64 }
  );
};

export const readObject = async (
  pointer: FilePointer,
  // no need for forceRemote because it's content-addressed
  { save = true }: { save?: boolean } = {}
): Promise<Uint8Array | null> => {
  let data: Uint8Array | null = null;

  const localPath = _getLocalObjectPath(pointer);
  console.log({localPath})
  const info = await FileSystem.getInfoAsync(localPath);
  if (info.exists) {
    const contents = await FileSystem.readAsStringAsync(localPath, {
      encoding: FileSystem.EncodingType.Base64,
    });
    data = Uint8Array.from(Buffer.from(contents, "base64"));
  } else {
    const url = await getCASObjectURL(pointer);
    const response = await fetch(url);
    if (!response.ok) {
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    data = new Uint8Array(arrayBuffer);
  }

  if (save) {
    await _saveLocalObject(pointer, data);
  }

  return data;
};

const parseCourseMeta = (raw: any): CourseMetadata | null => {
  const parsed = courseMetaSchema.safeParse(raw);
  if (!parsed.success) {
    return null;
  }

  return parsed.data;
};

const requireMeta = (course: CourseName): CourseMetadata => {
  const meta = loadedInMemoryCourseMeta[course];
  if (!meta) {
    throw new Error(`Course metadata missing for ${course}`);
  }
  return meta;
};

const CourseData = {
  courseExists(course: CourseName): boolean {
    return Boolean(courseInfoData[course]);
  },

  getCourseData(course: CourseName): CourseInfo {
    return courseInfoData[course];
  },

  getCourseList(): CourseName[] {
    return Object.keys(courseInfoData) as CourseName[];
  },

  getCourseShortTitle(course: CourseName): string {
    return courseInfoData[course].shortTitle;
  },

  getCourseFullTitle(course: CourseName): string {
    return courseInfoData[course].fullTitle;
  },

  getCourseType(course: CourseName): string {
    return courseInfoData[course].courseType;
  },

  getCourseImage(course: CourseName) {
    return courseInfoData[course].image;
  },

  getCourseImageWithText(course: CourseName) {
    return courseInfoData[course].imageWithText;
  },

  getBundledFirstLesson(course: CourseName) {
    return courseInfoData[course].bundledFirstLesson ?? null;
  },

  getBundledFirstLessonId(course: CourseName) {
    return courseInfoData[course].bundledFirstLessonId ?? null;
  },

  getCourseUIColors(course: CourseName): UIColors {
    return courseInfoData[course].uiColors;
  },

  getFallbackLessonCount(course: CourseName): string {
    return courseInfoData[course].fallbackLessonCount;
  },

  isCourseMetadataLoaded(course: CourseName): boolean {
    return Boolean(loadedInMemoryCourseMeta[course]);
  },

  getMetadataVersion(course: CourseName): number | null {
    return loadedInMemoryCourseMeta[course]?.buildVersion ?? null;
  },

  async loadCourseMetadata(course: CourseName): Promise<void> {
    if (CourseData.isCourseMetadataLoaded(course)) {
      return;
    }

    const courseIndex = await ensureCourseIndex();
    const courseIndexEntry = courseIndex.courses.find(
      (entry) => entry.id === course
    );

    if (!courseIndexEntry) {
      throw new Error(`Course ${course} not found in index`);
    }

    await ensureObjectDir();

    const metadataFilePointer = courseIndexEntry.meta;
    // if the index changes and THEN we lose internet access, this fails, without the fallback we used to have
    // but I can live with this
    const metadataFile = await readObject(metadataFilePointer);
    const metadataString = metadataFile
      ? Buffer.from(metadataFile).toString("utf-8")
      : null;

    if (!metadataString) {
      throw new Error(`Failed to read metadata for course ${course}`);
    }

    const parsedMeta = parseCourseMeta(JSON.parse(metadataString));

    if (!parsedMeta) {
      throw new Error(`Invalid metadata for course ${course}`);
    }

    loadedInMemoryCourseMeta[course] = parsedMeta;
  },

  getLessonData(course: CourseName, lesson: number): LessonData {
    return requireMeta(course).lessons[lesson];
  },

  getLessonId(course: CourseName, lesson: number): string {
    return CourseData.getLessonData(course, lesson).id;
  },

  getLessonNumberForId(course: CourseName, lessonId: string): number | null {
    const meta = requireMeta(course);
    const index = meta.lessons.findIndex((l) => l.id === lessonId);
    return index === -1 ? null : index;
  },

  getLessonPointer(
    course: CourseName,
    lesson: number,
    quality: Quality
  ): FilePointer {
    const variants = CourseData.getLessonData(course, lesson).variants;
    return quality === "high" ? variants.hq : variants.lq;
  },

  async getLessonUrl(
    course: CourseName,
    lesson: number,
    quality: Quality
  ): Promise<string> {
    const pointer = CourseData.getLessonPointer(course, lesson, quality);
    return await getCASObjectURL(pointer);
  },

  getLessonIndices(course: CourseName): number[] {
    return requireMeta(course).lessons.map((_, idx) => idx);
  },

  getLessonTitle(course: CourseName, lesson: number): string {
    return CourseData.getLessonData(course, lesson).title;
  },

  getLessonDuration(course: CourseName, lesson: number): number {
    return CourseData.getLessonData(course, lesson).duration;
  },

  getLessonSizeInBytes(
    course: CourseName,
    lesson: number,
    quality: Quality
  ): number {
    return CourseData.getLessonPointer(course, lesson, quality).filesize;
  },

  getLessonMimeType(
    course: CourseName,
    lesson: number,
    quality: Quality
  ): string {
    return CourseData.getLessonPointer(course, lesson, quality).mimeType;
  },

  getNextLesson(course: CourseName, lesson: number): number | null {
    const meta = requireMeta(course);
    return lesson + 1 < meta.lessons.length ? lesson + 1 : null;
  },

  getPreviousLesson(_: CourseName, lesson: number): number | null {
    return lesson - 1 >= 0 ? lesson - 1 : null;
  },
};

export default CourseData;
