import {IntervalId} from 'react-native-background-timer';

declare global {
  type x = IntervalId;

  type Callback = () => void;

  type CallbackWithParam<T> = (param: T) => void;

  type Maybe<T> = T | null | undefined;

  type KeyValMap = {[key: string]: any};

  type FileSizeMap = {[key: string]: number};

  type Course =
    | 'spanish'
    | 'arabic'
    | 'turkish'
    | 'german'
    | 'greek'
    | 'italian'
    | 'swahili'
    | 'french'
    | 'ingles';

  type Preference =
    | 'auto-delete-finished'
    | 'stream-quality'
    | 'download-quality'
    | 'download-only-on-wifi'
    | 'allow-data-collection';

  type Quality = 'high' | 'low';

  interface IUIColors {
    background: string;
    softBackground: string;
    text: string;
    backgroundAccent: string;
  }

  interface ICourseData {
    image: any;
    imageWithText: any;
    shortTitle: string;
    fullTitle: string;
    metaUrl: string;
    fallbackLessonCount: number;
    uiColors: IUIColors;
    bundledFirstLesson: string;
  }

  export interface ICourseMetaData {
    version: number;
    lessons: ILessonData[];
  }

  export interface ILessonData {
    id: string;
    title: string;
    urls: string[];
    filesizes: FileSizeMap;
    duration: number;
  }
}
