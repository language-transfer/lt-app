import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

import {
  Course,
  CourseInfo,
  CourseMetaData,
  LessonData,
  Quality,
  UIColors,
} from '@/src/types';
import {
  genPreferenceKillswitchCourseVersionV1,
  genSetPreferenceKillswitchCourseVersionV1,
} from '@/src/storage/persistence';

import spanishCover from '../../legacy/resources/spanish-cover-stylized.png';
import spanishCoverWithText from '../../legacy/resources/spanish-cover-stylized-with-text.png';
import arabicCover from '../../legacy/resources/arabic-cover-stylized.png';
import arabicCoverWithText from '../../legacy/resources/arabic-cover-stylized-with-text.png';
import turkishCover from '../../legacy/resources/turkish-cover-stylized.png';
import turkishCoverWithText from '../../legacy/resources/turkish-cover-stylized-with-text.png';
import germanCover from '../../legacy/resources/german-cover-stylized.png';
import germanCoverWithText from '../../legacy/resources/german-cover-stylized-with-text.png';
import greekCover from '../../legacy/resources/greek-cover-stylized.png';
import greekCoverWithText from '../../legacy/resources/greek-cover-stylized-with-text.png';
import italianCover from '../../legacy/resources/italian-cover-stylized.png';
import italianCoverWithText from '../../legacy/resources/italian-cover-stylized-with-text.png';
import swahiliCover from '../../legacy/resources/swahili-cover-stylized.png';
import swahiliCoverWithText from '../../legacy/resources/swahili-cover-stylized-with-text.png';
import frenchCover from '../../legacy/resources/french-cover-stylized.png';
import frenchCoverWithText from '../../legacy/resources/french-cover-stylized-with-text.png';
import inglesCover from '../../legacy/resources/ingles-cover-stylized.png';
import inglesCoverWithText from '../../legacy/resources/ingles-cover-stylized-with-text.png';
import musicCover from '../../legacy/resources/music-cover-stylized.png';
import musicCoverWithText from '../../legacy/resources/music-cover-stylized-with-text.png';

const spanishFirstLesson =
  Platform.OS === 'ios' ? require('../../legacy/resources/courses/spanish1-lq.mp3') : null;
const arabicFirstLesson =
  Platform.OS === 'ios' ? require('../../legacy/resources/courses/arabic1-lq.mp3') : null;
const turkishFirstLesson =
  Platform.OS === 'ios' ? require('../../legacy/resources/courses/turkish1-lq.mp3') : null;
const germanFirstLesson =
  Platform.OS === 'ios' ? require('../../legacy/resources/courses/german1-lq.mp3') : null;
const greekFirstLesson =
  Platform.OS === 'ios' ? require('../../legacy/resources/courses/greek1-lq.mp3') : null;
const italianFirstLesson =
  Platform.OS === 'ios' ? require('../../legacy/resources/courses/italian1-lq.mp3') : null;
const swahiliFirstLesson =
  Platform.OS === 'ios' ? require('../../legacy/resources/courses/swahili1-lq.mp3') : null;
const frenchFirstLesson =
  Platform.OS === 'ios' ? require('../../legacy/resources/courses/french1-lq.mp3') : null;
const inglesFirstLesson =
  Platform.OS === 'ios' ? require('../../legacy/resources/courses/ingles1-lq.mp3') : null;
const musicFirstLesson =
  Platform.OS === 'ios' ? require('../../legacy/resources/courses/music1-lq.mp3') : null;

const META_VERSIONS_URL = 'https://downloads.languagetransfer.org/course-versions.json';
const DOCUMENT_DIRECTORY =
  (FileSystem as any).documentDirectory ?? (FileSystem as any).cacheDirectory ?? '';
const META_STORAGE_DIR = `${DOCUMENT_DIRECTORY}course-meta`;

const courseMeta: Partial<Record<Course, CourseMetaData>> = {};

const data: Record<Course, CourseInfo> = {
  spanish: {
    image: spanishCover,
    imageWithText: spanishCoverWithText,
    shortTitle: 'Spanish',
    fullTitle: 'Complete Spanish',
    courseType: 'complete',
    metaUrl: 'https://downloads.languagetransfer.org/spanish/spanish-meta.json',
    fallbackLessonCount: '90',
    uiColors: {
      background: '#7186d0',
      softBackground: '#d5d9ee',
      text: 'white',
      backgroundAccent: '#516198',
    },
    bundledFirstLesson: spanishFirstLesson,
    bundledFirstLessonId: 'spanish/spanish1',
  },
  arabic: {
    image: arabicCover,
    imageWithText: arabicCoverWithText,
    shortTitle: 'Arabic',
    fullTitle: 'Introduction to Arabic',
    courseType: 'intro',
    metaUrl: 'https://downloads.languagetransfer.org/arabic/arabic-meta.json',
    fallbackLessonCount: '38',
    uiColors: {
      background: '#c2930f',
      softBackground: '#e9dccc',
      text: 'black',
      backgroundAccent: '#806006',
    },
    bundledFirstLesson: arabicFirstLesson,
    bundledFirstLessonId: 'arabic/arabic1',
  },
  turkish: {
    image: turkishCover,
    imageWithText: turkishCoverWithText,
    shortTitle: 'Turkish',
    fullTitle: 'Introduction to Turkish',
    courseType: 'intro',
    metaUrl: 'https://downloads.languagetransfer.org/turkish/turkish-meta.json',
    fallbackLessonCount: '44',
    uiColors: {
      background: '#a20b3b',
      softBackground: '#e0ccce',
      text: 'white',
      backgroundAccent: '#760629',
    },
    bundledFirstLesson: turkishFirstLesson,
    bundledFirstLessonId: 'turkish/turkish1',
  },
  german: {
    image: germanCover,
    imageWithText: germanCoverWithText,
    shortTitle: 'German',
    fullTitle: 'Complete German',
    courseType: 'complete',
    metaUrl: 'https://downloads.languagetransfer.org/german/german-meta.json',
    fallbackLessonCount: '50',
    uiColors: {
      background: '#009900',
      softBackground: '#cbdecb',
      text: 'white',
      backgroundAccent: '#006400',
    },
    bundledFirstLesson: germanFirstLesson,
    bundledFirstLessonId: 'german/german1',
  },
  greek: {
    image: greekCover,
    imageWithText: greekCoverWithText,
    shortTitle: 'Greek',
    fullTitle: 'Complete Greek',
    courseType: 'complete',
    metaUrl: 'https://downloads.languagetransfer.org/greek/greek-meta.json',
    fallbackLessonCount: '120',
    uiColors: {
      background: '#d57d2f',
      softBackground: '#efd7cd',
      text: 'white',
      backgroundAccent: '#9c5a20',
    },
    bundledFirstLesson: greekFirstLesson,
    bundledFirstLessonId: 'greek/greek1',
  },
  italian: {
    image: italianCover,
    imageWithText: italianCoverWithText,
    shortTitle: 'Italian',
    fullTitle: 'Introduction to Italian',
    courseType: 'intro',
    metaUrl: 'https://downloads.languagetransfer.org/italian/italian-meta.json',
    fallbackLessonCount: '45',
    uiColors: {
      background: '#e423ae',
      softBackground: '#f5cce3',
      text: 'white',
      backgroundAccent: '#a7177f',
    },
    bundledFirstLesson: italianFirstLesson,
    bundledFirstLessonId: 'italian/italian1',
  },
  swahili: {
    image: swahiliCover,
    imageWithText: swahiliCoverWithText,
    shortTitle: 'Swahili',
    fullTitle: 'Complete Swahili',
    courseType: 'complete',
    metaUrl: 'https://downloads.languagetransfer.org/swahili/swahili-meta.json',
    fallbackLessonCount: '110',
    uiColors: {
      background: '#12eddd',
      softBackground: '#ccf8f2',
      text: 'black',
      backgroundAccent: '#0aaea2',
    },
    bundledFirstLesson: swahiliFirstLesson,
    bundledFirstLessonId: 'swahili/swahili1',
  },
  french: {
    image: frenchCover,
    imageWithText: frenchCoverWithText,
    shortTitle: 'French',
    fullTitle: 'Introduction to French',
    courseType: 'intro',
    metaUrl: 'https://downloads.languagetransfer.org/french/french-meta.json',
    fallbackLessonCount: '40',
    uiColors: {
      background: '#10bdff',
      softBackground: '#cce8ff',
      text: 'white',
      backgroundAccent: '#098abc',
    },
    bundledFirstLesson: frenchFirstLesson,
    bundledFirstLessonId: 'french/french1',
  },
  ingles: {
    image: inglesCover,
    imageWithText: inglesCoverWithText,
    shortTitle: 'Inglés',
    fullTitle: 'Introducción a Inglés',
    courseType: 'intro',
    metaUrl: 'https://downloads.languagetransfer.org/ingles/ingles-meta.json',
    fallbackLessonCount: '40',
    uiColors: {
      background: '#7186d0',
      softBackground: '#d5daee',
      text: 'white',
      backgroundAccent: '#516198',
    },
    bundledFirstLesson: inglesFirstLesson,
    bundledFirstLessonId: 'ingles/ingles1',
  },
  music: {
    image: musicCover,
    imageWithText: musicCoverWithText,
    shortTitle: 'Music Theory',
    fullTitle: 'Introduction to Music Theory',
    courseType: 'intro',
    metaUrl: 'https://downloads.languagetransfer.org/music/music-meta.json',
    fallbackLessonCount: '30',
    uiColors: {
      background: '#f8eebc',
      softBackground: '#ffffff',
      text: 'black',
      backgroundAccent: '#786951',
    },
    bundledFirstLesson: musicFirstLesson,
    bundledFirstLessonId: 'music/music1',
  },
};

const ensureMetaDir = async () => {
  const info = await FileSystem.getInfoAsync(META_STORAGE_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(META_STORAGE_DIR, { intermediates: true });
  }
};

const getLocalMetaPath = (course: Course) => `${META_STORAGE_DIR}/${course}.json`;

const requireMeta = (course: Course): CourseMetaData => {
  const meta = courseMeta[course];
  if (!meta) {
    throw new Error(`Course metadata missing for ${course}`);
  }
  return meta;
};

const CourseData = {
  courseExists(course: Course): boolean {
    return Boolean(data[course]);
  },

  getCourseData(course: Course): CourseInfo {
    return data[course];
  },

  getCourseList(): Course[] {
    return Object.keys(data) as Course[];
  },

  getCourseShortTitle(course: Course): string {
    return data[course].shortTitle;
  },

  getCourseFullTitle(course: Course): string {
    return data[course].fullTitle;
  },

  getCourseType(course: Course): string {
    return data[course].courseType;
  },

  getCourseImage(course: Course) {
    return data[course].image;
  },

  getCourseImageWithText(course: Course) {
    return data[course].imageWithText;
  },

  getBundledFirstLesson(course: Course) {
    return data[course].bundledFirstLesson ?? null;
  },

  getBundledFirstLessonId(course: Course) {
    return data[course].bundledFirstLessonId ?? null;
  },

  getCourseUIColors(course: Course): UIColors {
    return data[course].uiColors;
  },

  getFallbackLessonCount(course: Course): string {
    return data[course].fallbackLessonCount;
  },

  isCourseMetadataLoaded(course: Course): boolean {
    return Boolean(courseMeta[course]);
  },

  getMetadataVersion(course: Course): number | null {
    return courseMeta[course]?.version ?? null;
  },

  async genLoadCourseMetadata(course: Course, forceRemote = false): Promise<void> {
    if (!forceRemote && courseMeta[course]) {
      return;
    }

    await ensureMetaDir();
    const localPath = getLocalMetaPath(course);

    if (!forceRemote) {
      const info = await FileSystem.getInfoAsync(localPath);
      if (info.exists) {
        try {
          const contents = await FileSystem.readAsStringAsync(localPath);
          courseMeta[course] = JSON.parse(contents);
          return;
        } catch {
          // fall back to remote fetch
        }
      }
    }

    const response = await fetch(data[course].metaUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch metadata for ${course}`);
    }

    const json = (await response.json()) as CourseMetaData;
    json.downloaded = Date.now();
    courseMeta[course] = json;

    await FileSystem.writeAsStringAsync(localPath, JSON.stringify(json));

    if (!forceRemote) {
      // Kick off background version check but don't await it.
      CourseData.genGentlyCheckForMetadataUpdates().catch(() => {});
    }
  },

  async genGentlyCheckForMetadataUpdates(): Promise<void> {
    try {
      const killswitched = await genPreferenceKillswitchCourseVersionV1();
      if (killswitched) {
        return;
      }

      const response = await fetch(META_VERSIONS_URL);
      if (!response.ok) {
        return;
      }
      const json = await response.json();
      if (json.killswitch) {
        await genSetPreferenceKillswitchCourseVersionV1(true);
        return;
      }

      const courses = CourseData.getCourseList();
      for (const course of courses) {
        const localMeta = courseMeta[course];
        if (localMeta?.version && json.courseVersions?.[course]) {
          if (localMeta.version !== json.courseVersions[course]) {
            await CourseData.genLoadCourseMetadata(course, true);
          }
        }
      }
    } catch {
      // best-effort; swallow errors
    }
  },

  async clearCourseMetadata(course: Course): Promise<void> {
    delete courseMeta[course];
    const localPath = getLocalMetaPath(course);
    const info = await FileSystem.getInfoAsync(localPath);
    if (info.exists) {
      await FileSystem.deleteAsync(localPath, { idempotent: true });
    }
  },

  getLessonData(course: Course, lesson: number): LessonData {
    return requireMeta(course).lessons[lesson];
  },

  getLessonId(course: Course, lesson: number): string {
    return CourseData.getLessonData(course, lesson).id;
  },

  getLessonNumberForId(course: Course, lessonId: string): number | null {
    const meta = requireMeta(course);
    const index = meta.lessons.findIndex((l) => l.id === lessonId);
    return index === -1 ? null : index;
  },

  getLessonUrl(course: Course, lesson: number, quality: Quality): string {
    const urls = CourseData.getLessonData(course, lesson).urls;
    return quality === 'high' ? urls[urls.length - 1] : urls[0];
  },

  getLessonIndices(course: Course): number[] {
    return requireMeta(course).lessons.map((_, idx) => idx);
  },

  getLessonTitle(course: Course, lesson: number): string {
    return CourseData.getLessonData(course, lesson).title;
  },

  getLessonDuration(course: Course, lesson: number): number {
    return CourseData.getLessonData(course, lesson).duration;
  },

  getLessonSizeInBytes(course: Course, lesson: number, quality: Quality): number {
    const url = CourseData.getLessonUrl(course, lesson, quality);
    return CourseData.getLessonData(course, lesson).filesizes[url];
  },

  getNextLesson(course: Course, lesson: number): number | null {
    const meta = requireMeta(course);
    return lesson + 1 < meta.lessons.length ? lesson + 1 : null;
  },

  getPreviousLesson(_: Course, lesson: number): number | null {
    return lesson - 1 >= 0 ? lesson - 1 : null;
  },
};

export default CourseData;
