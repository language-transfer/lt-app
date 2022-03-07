/* SAMPLE METADATA:

  {
    version: 0,
    lessons: [
      {
        url: 'https://downloads.languagetransfer.org/spanish/spanish1.mp3',
        id: 'spanish1',
        duration: 334.132,
        title: 'Lesson 1',

        // in the future:
        pauses: [
          {
            start: 4.983162,
            end: 6.588704,
          },
          ...
        ],
      },
      {
        url: 'https://downloads.languagetransfer.org/spanish/spanish2.mp3',
        id: 'spanish2',
        ...
      },
      ...
    ],

    // added post-download by client:
    downloaded: 1588555792598
  },
*/

import spanishCover from '../resources/spanish-cover-stylized.png';
import spanishCoverWithText from '../resources/spanish-cover-stylized-with-text.png';
import arabicCover from '../resources/arabic-cover-stylized.png';
import arabicCoverWithText from '../resources/arabic-cover-stylized-with-text.png';
import turkishCover from '../resources/turkish-cover-stylized.png';
import turkishCoverWithText from '../resources/turkish-cover-stylized-with-text.png';
import germanCover from '../resources/german-cover-stylized.png';
import germanCoverWithText from '../resources/german-cover-stylized-with-text.png';
import greekCover from '../resources/greek-cover-stylized.png';
import greekCoverWithText from '../resources/greek-cover-stylized-with-text.png';
import italianCover from '../resources/italian-cover-stylized.png';
import italianCoverWithText from '../resources/italian-cover-stylized-with-text.png';
import swahiliCover from '../resources/swahili-cover-stylized.png';
import swahiliCoverWithText from '../resources/swahili-cover-stylized-with-text.png';
import frenchCover from '../resources/french-cover-stylized.png';
import frenchCoverWithText from '../resources/french-cover-stylized-with-text.png';
import inglesCover from '../resources/ingles-cover-stylized.png';
import inglesCoverWithText from '../resources/ingles-cover-stylized-with-text.png';
import musicCover from '../resources/music-cover-stylized.png';
import musicCoverWithText from '../resources/music-cover-stylized-with-text.png';

import fs from 'react-native-fs';
// @ts-ignore
import path from 'react-native-path';
import DownloadManager from './download-manager';
import { Platform } from 'react-native';

type CourseDataMap = {[key in Course]: CourseData};

type CourseMetadataMap = {[key in Course]: CourseMetaData | undefined};

const courseMeta: CourseMetadataMap = {} as CourseMetadataMap;

// bundledMediaStripTransform.js transforms these lines to make sure the bundler doesn't include these for non-iOS.
// the ternaries are unnecessary (the the transform has the same effect) but are kept for clarity
// if changing any of these lines, **make sure** the android build doesn't include the bundled files
const spanishFirstLesson = Platform.OS === 'ios' ? require('../resources/courses/spanish1-lq.mp3') : null;
const arabicFirstLesson = Platform.OS === 'ios' ? require('../resources/courses/arabic1-lq.mp3') : null;
const turkishFirstLesson = Platform.OS === 'ios' ? require('../resources/courses/turkish1-lq.mp3') : null;
const germanFirstLesson = Platform.OS === 'ios' ? require('../resources/courses/german1-lq.mp3') : null;
const greekFirstLesson = Platform.OS === 'ios' ? require('../resources/courses/greek1-lq.mp3') : null;
const italianFirstLesson = Platform.OS === 'ios' ? require('../resources/courses/italian1-lq.mp3') : null;
const swahiliFirstLesson = Platform.OS === 'ios' ? require('../resources/courses/swahili1-lq.mp3') : null;
const frenchFirstLesson = Platform.OS === 'ios' ? require('../resources/courses/french1-lq.mp3') : null;
const inglesFirstLesson = Platform.OS === 'ios' ? require('../resources/courses/ingles1-lq.mp3') : null;
const musicFirstLesson = Platform.OS === 'ios' ? require('../resources/courses/music1-lq.mp3') : null;

const data: CourseDataMap = {
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
    fallbackLessonCount: '10+',
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

const CourseData = {
  courseExists(course: Course): boolean {
    return !!data[course];
  },

  getCourseData(course: Course): CourseData {
    return data[course];
  },

  getCourseList(): Array<Course> {
    // @ts-ignore
    return Object.keys(data);
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

  getCourseImage(course: Course): any {
    return data[course].image;
  },

  getCourseImageWithText(course: Course): any {
    return data[course].imageWithText;
  },

  getCourseUIColors(course: Course): UIColors {
    return data[course].uiColors;
  },

  getFallbackLessonCount(course: Course): string {
    return data[course].fallbackLessonCount;
  },

  isCourseMetadataLoaded(course: Course): boolean {
    return !!courseMeta[course];
  },

  getMetadataVersion(course: Course): number {
    return courseMeta[course]!.version;
  },

  async genLoadCourseMetadata(
    course: Course,
    forceLoadFromServer: boolean = false,
  ): Promise<void> {
    const metaFilename = path.basename(data[course].metaUrl);
    const localPath = `${DownloadManager.getDownloadFolderForCourse(
      course,
    )}/${metaFilename}`;

    if (!forceLoadFromServer) {
      if (CourseData.isCourseMetadataLoaded(course)) {
        return;
      }

      try {
        const metaString = await fs.readFile(localPath);
        courseMeta[course] = JSON.parse(metaString);
        return;
      } catch (e) {}
    }

    const json = await fetch(data[course].metaUrl).then((r) => r.json());

    json.downloaded = +new Date();
    courseMeta[course] = json;

    if (
      !(await fs.exists(DownloadManager.getDownloadFolderForCourse(course)))
    ) {
      await fs.mkdir(DownloadManager.getDownloadFolderForCourse(course));
    }
    await fs.writeFile(localPath, JSON.stringify(json));
  },

  clearCourseMetadata(course: Course): void {
    courseMeta[course] = undefined;
  },

  getBundledFirstLesson(course: Course): number {
    return data[course].bundledFirstLesson;
  },

  getBundledFirstLessonId(course: Course): string {
    return data[course].bundledFirstLessonId;
  },

  getLessonData(course: Course, lesson: number): LessonData {
    return courseMeta[course]!.lessons[lesson];
  },

  getLessonId(course: Course, lesson: number): string {
    return courseMeta[course]!.lessons[lesson].id;
  },

  getLessonNumberForId(course: Course, lessonId: string): number | null {
    const index = courseMeta[course]!.lessons.findIndex(
      (l) => l.id === lessonId,
    );
    if (index === -1) {
      return null;
    }
    return index;
  },

  getLessonUrl(course: Course, lesson: number, quality: Quality): string {
    const urls = courseMeta[course]!.lessons[lesson].urls;
    if (quality === 'high') {
      return urls[urls.length - 1];
    } else {
      return urls[0];
    }
  },

  getNextLesson(course: Course, lesson: number): number | null {
    if (lesson + 1 === courseMeta[course]!.lessons.length) {
      return null;
    }

    return lesson + 1;
  },

  getPreviousLesson(_course: Course, lesson: number): number | null {
    if (lesson - 1 === -1) {
      return null;
    }

    return lesson - 1;
  },

  getLessonIndices(course: Course): Array<number> {
    return courseMeta[course]!.lessons.map((_, i) => i);
  },

  getLessonTitle(course: Course, lesson: number): string {
    return courseMeta[course]!.lessons[lesson].title;
  },

  getLessonDuration(course: Course, lesson: number): number {
    return courseMeta[course]!.lessons[lesson].duration;
  },

  getLessonSizeInBytes(
    course: Course,
    lesson: number,
    quality: Quality,
  ): number {
    const url = this.getLessonUrl(course, lesson, quality);
    return courseMeta[course]!.lessons[lesson].filesizes[url];
  },
};

export default CourseData;
