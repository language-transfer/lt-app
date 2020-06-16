import {IntervalId} from 'react-native-background-timer';

declare global {
  type x = IntervalId;

  type Callback = () => void;

  type Maybe<T> = T | null | undefined;

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
  }

  export interface ICourseMetaData {
    version: number;
    lessons: ILessonData[];
  }

  export interface ILessonData {
    id: string;
    title: string;
    urls: string[];
    duration: number;
  }
}
