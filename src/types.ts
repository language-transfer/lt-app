import { ImageSourcePropType } from 'react-native';

export type Course =
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

export type CourseType = 'intro' | 'complete';

export type Quality = 'high' | 'low';

export interface UIColors {
  background: string;
  softBackground: string;
  text: 'white' | 'black';
  backgroundAccent: string;
}

export interface CourseInfo {
  image: ImageSourcePropType;
  imageWithText: ImageSourcePropType;
  shortTitle: string;
  fullTitle: string;
  courseType: CourseType;
  metaUrl: string;
  fallbackLessonCount: string;
  uiColors: UIColors;
  bundledFirstLesson?: any;
  bundledFirstLessonId?: string;
}

export interface LessonData {
  id: string;
  title: string;
  urls: string[];
  filesizes: Record<string, number>;
  duration: number;
}

export interface CourseMetaData {
  version: number;
  lessons: LessonData[];
  downloaded?: number;
}

export interface Progress {
  finished: boolean;
  progress: number | null;
}

export type Preference =
  | 'auto-delete-finished'
  | 'stream-quality'
  | 'download-quality'
  | 'download-only-on-wifi'
  | 'allow-data-collection'
  | 'is-first-load'
  | 'rating-button-dismissed'
  | 'killswitch-course-version-v1';

export interface DownloadSnapshot {
  id: string;
  state: 'idle' | 'downloading' | 'finished' | 'error';
  bytesWritten: number;
  totalBytes: number | null;
  errorMessage?: string;
  requested: boolean;
}
