import { Buffer } from "buffer";
import * as FileSystem from "expo-file-system/legacy";

import {
  CourseMetadata,
  courseMetaSchema,
  type FilePointer,
  type LessonData,
} from "@/src/data/courseSchemas";
import {
  ensureCourseIndex,
  refreshCourseIndex as refreshStoredCourseIndex,
  subscribeCourseIndex,
} from "@/src/data/courseIndex";
import { queryClient } from "@/src/data/queryClient";
import {
  CourseInfo,
  CourseName,
  CourseNameSchema,
  Quality,
  SourceLanguage,
  UIColors,
} from "@/src/types";
import {
  ensureObjectDir,
  ensureRootObjectDir,
  getLocalObjectPath,
} from "../services/downloadManager";

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
import { useQuery } from "@tanstack/react-query";

// const spanishFirstLesson =
//   Platform.OS === "ios"
//     ? require("@/assets/courses/audio/spanish1-lq.mp3")
//     : null;
// const arabicFirstLesson =
//   Platform.OS === "ios"
//     ? require("@/assets/courses/audio/arabic1-lq.mp3")
//     : null;
// const turkishFirstLesson =
//   Platform.OS === "ios"
//     ? require("@/assets/courses/audio/turkish1-lq.mp3")
//     : null;
// const germanFirstLesson =
//   Platform.OS === "ios"
//     ? require("@/assets/courses/audio/german1-lq.mp3")
//     : null;
// const greekFirstLesson =
//   Platform.OS === "ios"
//     ? require("@/assets/courses/audio/greek1-lq.mp3")
//     : null;
// const italianFirstLesson =
//   Platform.OS === "ios"
//     ? require("@/assets/courses/audio/italian1-lq.mp3")
//     : null;
// const swahiliFirstLesson =
//   Platform.OS === "ios"
//     ? require("@/assets/courses/audio/swahili1-lq.mp3")
//     : null;
// const frenchFirstLesson =
//   Platform.OS === "ios"
//     ? require("@/assets/courses/audio/french1-lq.mp3")
//     : null;
// const inglesFirstLesson =
//   Platform.OS === "ios"
//     ? require("@/assets/courses/audio/ingles1-lq.mp3")
//     : null;
// const musicFirstLesson =
//   Platform.OS === "ios"
//     ? require("@/assets/courses/audio/music1-lq.mp3")
//     : null;

const courseInfoData: Record<CourseName, CourseInfo> = {
  spanish: {
    image: spanishCover,
    imageWithText: spanishCoverWithText,
    shortTitle: "Spanish",
    fullTitle: "Complete Spanish",
    courseType: "complete",
    sourceLanguage: SourceLanguage.ENGLISH,
    fallbackLessonCount: "90",
    uiColors: {
      background: "#7186d0",
      softBackground: "#d5d9ee",
      text: "white",
      backgroundAccent: "#516198",
    },
    // bundledFirstLesson: spanishFirstLesson,
    bundledFirstLesson: null,
    bundledFirstLessonId: "spanish/spanish1",
  },
  arabic: {
    image: arabicCover,
    imageWithText: arabicCoverWithText,
    shortTitle: "Arabic",
    fullTitle: "Introduction to Arabic",
    courseType: "intro",
    sourceLanguage: SourceLanguage.ENGLISH,
    fallbackLessonCount: "38",
    uiColors: {
      background: "#c2930f",
      softBackground: "#e9dccc",
      text: "black",
      backgroundAccent: "#806006",
    },
    // bundledFirstLesson:arabicFirstLesson,
    // bundledFirstLesson: null,
    bundledFirstLessonId: "arabic/arabic1",
  },
  turkish: {
    image: turkishCover,
    imageWithText: turkishCoverWithText,
    shortTitle: "Turkish",
    fullTitle: "Introduction to Turkish",
    courseType: "intro",
    sourceLanguage: SourceLanguage.ENGLISH,
    fallbackLessonCount: "44",
    uiColors: {
      background: "#a20b3b",
      softBackground: "#e0ccce",
      text: "white",
      backgroundAccent: "#760629",
    },
    // bundledFirstLesson: turkishFirstLesson,
    bundledFirstLesson: null,
    bundledFirstLessonId: "turkish/turkish1",
  },
  german: {
    image: germanCover,
    imageWithText: germanCoverWithText,
    shortTitle: "German",
    fullTitle: "Complete German",
    courseType: "complete",
    sourceLanguage: SourceLanguage.ENGLISH,
    fallbackLessonCount: "50",
    uiColors: {
      background: "#009900",
      softBackground: "#cbdecb",
      text: "white",
      backgroundAccent: "#006400",
    },
    // bundledFirstLesson: germanFirstLesson,
    bundledFirstLesson: null,
    bundledFirstLessonId: "german/german1",
  },
  greek: {
    image: greekCover,
    imageWithText: greekCoverWithText,
    shortTitle: "Greek",
    fullTitle: "Complete Greek",
    courseType: "complete",
    sourceLanguage: SourceLanguage.ENGLISH,
    fallbackLessonCount: "120",
    uiColors: {
      background: "#d57d2f",
      softBackground: "#efd7cd",
      text: "white",
      backgroundAccent: "#9c5a20",
    },
    // bundledFirstLesson: greekFirstLesson,
    bundledFirstLesson: null,
    bundledFirstLessonId: "greek/greek1",
  },
  italian: {
    image: italianCover,
    imageWithText: italianCoverWithText,
    shortTitle: "Italian",
    fullTitle: "Introduction to Italian",
    courseType: "intro",
    sourceLanguage: SourceLanguage.ENGLISH,
    fallbackLessonCount: "45",
    uiColors: {
      background: "#e423ae",
      softBackground: "#f5cce3",
      text: "white",
      backgroundAccent: "#a7177f",
    },
    // bundledFirstLesson: italianFirstLesson,
    bundledFirstLesson: null,
    bundledFirstLessonId: "italian/italian1",
  },
  swahili: {
    image: swahiliCover,
    imageWithText: swahiliCoverWithText,
    shortTitle: "Swahili",
    fullTitle: "Complete Swahili",
    courseType: "complete",
    sourceLanguage: SourceLanguage.ENGLISH,
    fallbackLessonCount: "110",
    uiColors: {
      background: "#12eddd",
      softBackground: "#ccf8f2",
      text: "black",
      backgroundAccent: "#0aaea2",
    },
    // bundledFirstLesson: swahiliFirstLesson,
    bundledFirstLesson: null,
    bundledFirstLessonId: "swahili/swahili1",
  },
  french: {
    image: frenchCover,
    imageWithText: frenchCoverWithText,
    shortTitle: "French",
    fullTitle: "Introduction to French",
    courseType: "intro",
    sourceLanguage: SourceLanguage.ENGLISH,
    fallbackLessonCount: "40",
    uiColors: {
      background: "#10bdff",
      softBackground: "#cce8ff",
      text: "white",
      backgroundAccent: "#098abc",
    },
    // bundledFirstLesson: frenchFirstLesson,
    bundledFirstLesson: null,
    bundledFirstLessonId: "french/french1",
  },
  ingles: {
    image: inglesCover,
    imageWithText: inglesCoverWithText,
    shortTitle: "Inglés",
    fullTitle: "Introducción a Inglés",
    courseType: "intro",
    sourceLanguage: SourceLanguage.SPANISH,
    fallbackLessonCount: "40",
    uiColors: {
      background: "#7186d0",
      softBackground: "#d5daee",
      text: "white",
      backgroundAccent: "#516198",
    },
    // bundledFirstLesson: inglesFirstLesson,
    bundledFirstLesson: null,
    bundledFirstLessonId: "ingles/ingles1",
  },
  ingles_completo: {
    image: inglesCover,
    imageWithText: inglesCoverWithText,
    shortTitle: "Inglés",
    fullTitle: "Inglés Completo",
    courseType: "complete",
    sourceLanguage: SourceLanguage.SPANISH,
    fallbackLessonCount: "51",
    uiColors: {
      background: "#7186d0",
      softBackground: "#d5daee",
      text: "white",
      backgroundAccent: "#516198",
    },
    bundledFirstLesson: null,
  },
  music: {
    image: musicCover,
    imageWithText: musicCoverWithText,
    shortTitle: "Music Theory",
    fullTitle: "Introduction to Music Theory",
    courseType: "intro",
    sourceLanguage: SourceLanguage.ENGLISH,
    fallbackLessonCount: "30",
    uiColors: {
      background: "#f8eebc",
      softBackground: "#ffffff",
      text: "black",
      backgroundAccent: "#786951",
    },
    // bundledFirstLesson: musicFirstLesson,
    bundledFirstLesson: null,
    bundledFirstLessonId: "music/music1",
  },
};

const loadedInMemoryCourseMeta: Partial<Record<CourseName, CourseMetadata>> =
  {};
const metadataPointers: Partial<Record<CourseName, FilePointer>> = {};
const metadataQueryKey = (course: CourseName) => [
  "@local",
  "course-data",
  "metadata",
  course,
];

const clearMemoryMetadata = (course: CourseName) => {
  delete loadedInMemoryCourseMeta[course];
  for (const [object, metadata] of Object.entries(loadedObjectMetadataLookup)) {
    if (metadata.course === course) delete loadedObjectMetadataLookup[object];
  }
};

subscribeCourseIndex((index) => {
  for (const course of Object.keys(metadataPointers) as CourseName[]) {
    const pointer = index.courses.find((entry) => entry.id === course)?.meta;
    if (pointer?.object !== metadataPointers[course]?.object) {
      void queryClient.invalidateQueries({
        queryKey: metadataQueryKey(course),
      });
    }
  }
});

const loadedObjectMetadataLookup: Record<
  string,
  {
    pointer: FilePointer; // for mime type, filesize

    // don't love this structure -- maybe better to have a generic pointer? idk, pros and cons
    course: CourseName;
    lessonIndex: number;
    quality: Quality;
  }
> = {};

export const getCASBaseURL = async (): Promise<string> => {
  const index = await ensureCourseIndex();
  return index.casBaseURL;
};

export const refreshCourseIndex = async (): Promise<void> => {
  await refreshStoredCourseIndex();
};

export const getCASObjectURL = async (
  pointer: FilePointer
): Promise<string> => {
  const baseURL = await getCASBaseURL();
  return `${baseURL}/${pointer.object}`;
};

const _saveLocalObject = async (
  pointer: FilePointer,
  data: Uint8Array
): Promise<void> => {
  // TODO move this to download manager
  await ensureObjectDir(pointer);
  const localPath = getLocalObjectPath(pointer);
  await FileSystem.writeAsStringAsync(
    localPath,
    // bizarre
    Buffer.from(data).toString("base64"),
    { encoding: FileSystem.EncodingType.Base64 }
  );
};

const readLocalObjectOrNull = async (
  pointer: FilePointer
): Promise<Uint8Array | null> => {
  const localPath = getLocalObjectPath(pointer);
  // console.log({ localPath });
  const info = await FileSystem.getInfoAsync(localPath);
  if (info.exists) {
    const contents = await FileSystem.readAsStringAsync(localPath, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return Uint8Array.from(Buffer.from(contents, "base64"));
  } else {
    return null;
  }
};

export const readObject = async (
  pointer: FilePointer,
  // no need for forceRemote because it's content-addressed
  { save = true }: { save?: boolean } = {}
): Promise<Uint8Array | null> => {
  const localData = await readLocalObjectOrNull(pointer);
  if (localData) {
    return localData;
  }

  const url = await getCASObjectURL(pointer);
  const response = await fetch(url);
  if (!response.ok) {
    return null;
  }

  const arrayBuffer = await response.arrayBuffer();
  const data = new Uint8Array(arrayBuffer);
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

const indexObjects = (course: CourseName, meta: CourseMetadata): void => {
  for (let lessonIndex = 0; lessonIndex < meta.lessons.length; lessonIndex++) {
    const lesson = meta.lessons[lessonIndex];
    loadedObjectMetadataLookup[lesson.variants.lq.object] = {
      pointer: lesson.variants.lq,
      course,
      lessonIndex,
      quality: "low",
    };
    loadedObjectMetadataLookup[lesson.variants.hq.object] = {
      pointer: lesson.variants.hq,
      course,
      lessonIndex,
      quality: "high",
    };
  }
};

export type LoadedObjectMetadata = {
  pointer: FilePointer;
  course: CourseName;
  lessonIndex: number;
  quality: Quality;
};

const CourseData = {
  courseExists(course: CourseName): boolean {
    return Boolean(courseInfoData[course]);
  },

  isCourseVisible(course: CourseName): boolean {
    return CourseData.courseExists(course) && course !== "ingles";
  },

  getCourseData(course: CourseName): CourseInfo {
    return courseInfoData[course];
  },

  getCourseList(): CourseName[] {
    return (Object.keys(courseInfoData) as CourseName[]).filter((course) =>
      CourseData.isCourseVisible(course)
    );
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

  getFallbackLessonCount(course: CourseName): string | undefined {
    return courseInfoData[course].fallbackLessonCount;
  },

  isCourseMetadataLoaded(course: CourseName): boolean {
    return Boolean(loadedInMemoryCourseMeta[course]);
  },

  getMetadataVersion(course: CourseName): number | null {
    return loadedInMemoryCourseMeta[course]?.buildVersion ?? null;
  },

  async loadCourseMetadataIfDownloaded(
    course: CourseName,
    forceRemote: boolean = false
  ): Promise<CourseMetadata | null> {
    const courseIndex = await ensureCourseIndex(forceRemote);
    const courseIndexEntry = courseIndex.courses.find(
      (entry) => entry.id === course
    );

    if (!courseIndexEntry) {
      throw new Error(`Course ${course} not found in index`);
    }
    if (
      !forceRemote &&
      CourseData.isCourseMetadataLoaded(course) &&
      metadataPointers[course]?.object === courseIndexEntry.meta.object
    ) {
      return loadedInMemoryCourseMeta[course]!;
    }

    await ensureRootObjectDir();

    const metadataFilePointer = courseIndexEntry.meta;
    // if the index changes and THEN we lose internet access, this fails, without the fallback we used to have
    // but I can live with this
    const metadataFile = await readLocalObjectOrNull(metadataFilePointer);

    if (!metadataFile) {
      return null;
    }

    const metadataString = Buffer.from(metadataFile).toString("utf-8");

    const parsedMeta = parseCourseMeta(JSON.parse(metadataString));

    if (!parsedMeta) {
      throw new Error(`Invalid metadata for course ${course}`);
    }

    clearMemoryMetadata(course);
    indexObjects(course, parsedMeta);

    metadataPointers[course] = metadataFilePointer;
    loadedInMemoryCourseMeta[course] = parsedMeta;

    return parsedMeta;
  },

  async loadCourseMetadata(
    course: CourseName,
    forceRemote: boolean = false
  ): Promise<CourseMetadata | null> {
    if (forceRemote) {
      await ensureCourseIndex(true);
    }
    const meta = await CourseData.loadCourseMetadataIfDownloaded(course, false);

    if (meta) {
      if (forceRemote) queryClient.setQueryData(metadataQueryKey(course), meta);
      return meta;
    }

    const courseIndex = await ensureCourseIndex();
    const courseIndexEntry = courseIndex.courses.find(
      (entry) => entry.id === course
    );

    if (!courseIndexEntry) {
      throw new Error(`Course ${course} not found in index`);
    }

    const metadataFilePointer = courseIndexEntry.meta;
    const downloaded = await readObject(metadataFilePointer, {
      save: true,
    });
    if (!downloaded)
      throw new Error(`Failed to fetch metadata for course ${course}`);

    const loaded = await CourseData.loadCourseMetadataIfDownloaded(
      course,
      false
    );
    if (forceRemote) queryClient.setQueryData(metadataQueryKey(course), loaded);
    return loaded;
  },

  async deleteCourseMetadata(course: CourseName): Promise<void> {
    await queryClient.cancelQueries({ queryKey: metadataQueryKey(course) });
    const index = await ensureCourseIndex();
    const pointers = [
      metadataPointers[course],
      index.courses.find((entry) => entry.id === course)?.meta,
    ];
    for (const pointer of pointers) {
      if (pointer)
        await FileSystem.deleteAsync(getLocalObjectPath(pointer), {
          idempotent: true,
        });
    }
    clearMemoryMetadata(course);
    delete metadataPointers[course];
    queryClient.removeQueries({ queryKey: metadataQueryKey(course) });
  },

  async loadAllLocallyDownloadedCourseMetadata(): Promise<void> {
    const courseIndex = await ensureCourseIndex();

    await Promise.all(
      courseIndex.courses.map(async (entry) => {
        // new courses could be in the remote
        const courseId = CourseNameSchema.safeParse(entry.id);
        if (!courseId.success) {
          return;
        }
        await CourseData.loadCourseMetadataIfDownloaded(courseId.data);
      })
    );
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

  getLessonPointersAllVariants(
    course: CourseName,
    lesson: number
  ): FilePointer[] {
    return Object.values(CourseData.getLessonData(course, lesson).variants);
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

  getLoadedObjectMetadata(objectId: string): LoadedObjectMetadata {
    if (!(objectId in loadedObjectMetadataLookup)) {
      throw new Error(`Object metadata not found for ${objectId}`);
    }
    return loadedObjectMetadataLookup[objectId];
  },

  getAllLoadedObjectIds(): string[] {
    return Object.keys(loadedObjectMetadataLookup);
  },
};

export const useCourseMetadata = (
  course: CourseName
): CourseMetadata | null => {
  return (
    useQuery({
      queryKey: metadataQueryKey(course),
      queryFn: async () => {
        return await CourseData.loadCourseMetadata(course);
      },
    }).data ?? null
  );
};

export default CourseData;
