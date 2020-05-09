import spanishCover from '../resources/spanish-cover.png';
import arabicCover from '../resources/arabic-cover.png';
import turkishCover from '../resources/turkish-cover.png';
import germanCover from '../resources/german-cover.png';
import greekCover from '../resources/greek-cover.png';
import italianCover from '../resources/italian-cover.png';
import swahiliCover from '../resources/swahili-cover.png';
import frenchCover from '../resources/french-cover.png';
import inglesCover from '../resources/ingles-cover.png';

import fs from 'react-native-fs';
import path from 'react-native-path';
import DownloadManager from './download-manager';

export type Course =
  | 'spanish'
  | 'arabic'
  | 'turkish'
  | 'german'
  | 'greek'
  | 'italian'
  | 'swahili'
  | 'french'
  | 'ingles';

/* SAMPLE METADATA: 

  {
    version: 0,
    lessons: [
      {
        url: 'http://syntaxblitz.net/static/lt/spanish1.mp3',
        id: 'spanish1',
        duration: 334.132,
        title: 'Lesson 1',
        pauses: [
          {
            start: 4.983162,
            end: 6.588704,
          },
          ...
        ],
      },
      {
        url: 'http://syntaxblitz.net/static/lt/spanish2.mp3',
        id: 'spanish2',
        ...
      },
      ...
    ],

    // added post-download by client:
    downloaded: 1588555792598
  },
*/

const courseMeta = {};

const data = {
  spanish: {
    image: spanishCover,
    title: 'Spanish',
    metaUrl:
      'https://language-transfer.us-east-1.linodeobjects.com/spanish-meta.json',
    fallbackLessonCount: 90,
    uiColors: {
      background: '#fbc02d',
      text: 'black',
      backgroundAccent: '#c49000',
    },
  },
  arabic: {
    image: arabicCover,
    title: 'Arabic',
    metaUrl:
      'https://language-transfer.us-east-1.linodeobjects.com/spanish-meta.json',
    fallbackLessonCount: 38,
    uiColors: {
      background: '#424242',
      text: 'white',
      backgroundAccent: '#1b1b1b',
    },
  },
  turkish: {
    image: turkishCover,
    title: 'Turkish',
    metaUrl:
      'https://language-transfer.us-east-1.linodeobjects.com/turkish-meta.json',
    fallbackLessonCount: 44,
    uiColors: {
      background: '#d32f2f',
      text: 'white',
      backgroundAccent: '#9a0007',
    },
  },
  german: {
    image: germanCover,
    title: 'German',
    metaUrl:
      'https://language-transfer.us-east-1.linodeobjects.com/spanish-meta.json',
    fallbackLessonCount: 50,
    uiColors: {
      background: '#bf360c',
      text: 'white',
      backgroundAccent: '#870000',
    },
  },
  greek: {
    image: greekCover,
    title: 'Greek',
    metaUrl:
      'https://language-transfer.us-east-1.linodeobjects.com/spanish-meta.json',
    fallbackLessonCount: 120,
    uiColors: {
      background: '#e3f2fd',
      text: 'black',
      backgroundAccent: '#b1bfca',
    },
  },
  italian: {
    image: italianCover,
    title: 'Italian',
    metaUrl:
      'https://language-transfer.us-east-1.linodeobjects.com/spanish-meta.json',
    fallbackLessonCount: 45,
    uiColors: {
      background: '#2e7d32',
      text: 'white',
      backgroundAccent: '#005005',
    },
  },
  swahili: {
    image: swahiliCover,
    title: 'Swahili',
    metaUrl:
      'https://language-transfer.us-east-1.linodeobjects.com/spanish-meta.json',
    fallbackLessonCount: 110,
    uiColors: {
      background: '#0097a7',
      text: 'white',
      backgroundAccent: '#006978',
    },
  },
  french: {
    image: frenchCover,
    title: 'French',
    metaUrl:
      'https://language-transfer.us-east-1.linodeobjects.com/french-meta.json',
    fallbackLessonCount: 40,
    uiColors: {
      background: '#1976d2',
      text: 'white',
      backgroundAccent: '#004ba0',
    },
  },
  ingles: {
    image: inglesCover,
    title: 'Inglés',
    metaUrl:
      'https://language-transfer.us-east-1.linodeobjects.com/spanish-meta.json',
    fallbackLessonCount: 40,
    uiColors: {
      background: '#512da8',
      text: 'white',
      backgroundAccent: '#140078',
    },
  },
};

const CourseData = {
  courseExists(course: Course): boolean {
    return !!data[course];
  },

  getCourseList(): Array<string> {
    return Object.keys(data);
  },

  getImageForCourse(course: Course) {
    return data[course].image;
  },

  getCourseTitle(course: Course): string {
    return data[course].title;
  },

  getCourseImage(course: Course) {
    return data[course].image;
  },

  getCourseUIColors(course: Course) {
    return data[course].uiColors;
  },

  getFallbackLessonCount(course: Course) {
    return data[course].fallbackLessonCount;
  },

  isCourseMetadataLoaded(course: Course) {
    return !!courseMeta[course];
  },

  getMetadataVersion(course: Course) {
    return courseMeta[course].version;
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

  getLessonId(course: Course, lesson: number): string {
    return courseMeta[course].lessons[lesson].id;
  },

  getLessonUrl(course: Course, lesson: number, quality: string): string {
    const urls = courseMeta[course].lessons[lesson].urls;
    if (quality === 'high') {
      return urls[urls.length - 1];
    } else {
      return urls[0];
    }
  },

  getNextLesson(course: Course, lesson: number): number | null {
    if (lesson + 1 === courseMeta[course].lessons.length) {
      return null;
    }

    return lesson + 1;
  },

  getLessonIndices(course: Course): Array<number> {
    return courseMeta[course].lessons.map((_, i) => i);
  },

  getLessonTitle(course: Course, lesson: number) {
    return courseMeta[course].lessons[lesson].title;
  },

  getLessonDuration(course: Course, lesson: number) {
    return courseMeta[course].lessons[lesson].duration;
  },
};

export default CourseData;
