import {DownloadTask} from 'react-native-background-downloader';
import {IntervalId} from 'react-native-background-timer';

declare global {
  type Course =
    | 'spanish'
    | 'arabic'
    | 'turkish'
    | 'german'
    | 'greek'
    | 'italian'
    | 'swahili'
    | 'french'
    | 'ingles'
    | 'music';

  type Preference =
    | 'auto-delete-finished'
    | 'stream-quality'
    | 'download-quality'
    | 'download-only-on-wifi'
    | 'allow-data-collection'
    | 'is-first-load'
    | 'rating-button-dismissed'
    | 'killswitch-course-version-v1';

  type Quality = 'high' | 'low';

  interface UIColors {
    background: string;
    softBackground: string;
    text: 'white' | 'black';
    backgroundAccent: string;
  }

  interface CourseData {
    image: any;
    imageWithText: any;
    shortTitle: string;
    fullTitle: string;
    courseType: 'intro' | 'complete';
    metaUrl: string;
    fallbackLessonCount: string;
    uiColors: UIColors;
    bundledFirstLesson: number;
    bundledFirstLessonId: string;
  }

  export interface CourseMetaData {
    version: number;
    lessons: LessonData[];
  }

  export interface LessonData {
    id: string;
    title: string;
    urls: string[];
    filesizes: {[key: string]: number};
    duration: number;
  }

  export interface Download {
    requested: boolean,
    totalBytes: number | null,
    bytesWritten: number,
    error: any,
    finished: boolean,
    downloadTask: DownloadTask,
  }
}
