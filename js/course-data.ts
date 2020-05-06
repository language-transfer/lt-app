import spain from '../resources/jorge-fernandez-salas-ChSZETOal-I-unsplash.jpg';
import egypt from '../resources/spencer-davis-UvKCy14AYRY-unsplash.jpg';
import turkey from '../resources/fatih-yurur-kNSREmtaGOE-unsplash.jpg';
import germany from '../resources/brandenburger-tor-tja.jpg';
import greece from '../resources/andre-benz-tPPi0jzLP_w-unsplash.jpg';
import italy from '../resources/faruk-kaymak-KTsg_xKnB3E-unsplash.jpg';
import kenya from '../resources/ian-macharia-7k91OUDYAQ0-unsplash.jpg';
import france from '../resources/chris-karidis-nnzkZNYWHaU-unsplash.jpg';
import london from '../resources/eva-dang-EXdXLrZXS9Q-unsplash.jpg';

import fs from 'react-native-fs';
import path from 'react-native-path';
import Downloader from 'react-native-background-downloader';
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
    image: spain,
    title: 'Spanish',
    metaUrl: 'http://syntaxblitz.net/static/lt/spanish-meta.json',
    fallbackLessonCount: 90,
    uiColors: {
      background: '#fbc02d',
      text: 'black',
      backgroundAccent: '#c49000',
    },
  },
  arabic: {
    image: egypt,
    title: 'Arabic',
    metaUrl: 'http://syntaxblitz.net/static/lt/arabic-meta.json',
    fallbackLessonCount: 38,
    uiColors: {
      background: '#424242',
      text: 'white',
      backgroundAccent: '#1b1b1b',
    },
  },
  turkish: {
    image: turkey,
    title: 'Turkish',
    metaUrl: 'http://syntaxblitz.net/static/lt/turkish-meta.json',
    fallbackLessonCount: 44,
    uiColors: {
      background: '#d32f2f',
      text: 'white',
      backgroundAccent: '#9a0007',
    },
  },
  german: {
    image: germany,
    title: 'German',
    metaUrl: 'http://syntaxblitz.net/static/lt/german-meta.json',
    fallbackLessonCount: 50,
    uiColors: {
      background: '#bf360c',
      text: 'white',
      backgroundAccent: '#870000',
    },
  },
  greek: {
    image: greece,
    title: 'Greek',
    metaUrl: 'http://syntaxblitz.net/static/lt/greek-meta.json',
    fallbackLessonCount: 120,
    uiColors: {
      background: '#e3f2fd',
      text: 'black',
      backgroundAccent: '#b1bfca',
    },
  },
  italian: {
    image: italy,
    title: 'Italian',
    metaUrl: 'http://syntaxblitz.net/static/lt/italian-meta.json',
    fallbackLessonCount: 45,
    uiColors: {
      background: '#2e7d32',
      text: 'white',
      backgroundAccent: '#005005',
    },
  },
  swahili: {
    image: kenya,
    title: 'Swahili',
    metaUrl: 'http://syntaxblitz.net/static/lt/swahili-meta.json',
    fallbackLessonCount: 110,
    uiColors: {
      background: '#0097a7',
      text: 'white',
      backgroundAccent: '#006978',
    },
  },
  french: {
    image: france,
    title: 'French',
    metaUrl: 'http://syntaxblitz.net/static/lt/french-meta.json',
    fallbackLessonCount: 40,
    uiColors: {
      background: '#1976d2',
      text: 'white',
      backgroundAccent: '#004ba0',
    },
  },
  ingles: {
    image: london,
    title: 'Inglés',
    metaUrl: 'http://syntaxblitz.net/static/lt/ingles-meta.json',
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

  async genLoadCourseMetadata(course: Course): Promise<void> {
    if (CourseData.isCourseMetadataLoaded(course)) {
      return;
    }

    const metaFilename = path.basename(data[course].metaUrl);
    const localPath = `${DownloadManager.getDownloadFolderForCourse(
      course,
    )}/${metaFilename}`;

    try {
      const metaString = await fs.readFile(localPath);
      courseMeta[course] = JSON.parse(metaString);
      return;
    } catch (e) {}

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

  getLessonId(course: Course, lesson: number): string {
    return courseMeta[course].lessons[lesson].id;
  },

  getLessonUrl(course: Course, lesson: number): string {
    return courseMeta[course].lessons[lesson].url;
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
