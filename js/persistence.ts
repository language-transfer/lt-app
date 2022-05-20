import {useState, useEffect} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DownloadManager from './download-manager';
import CourseData from './course-data';

import 'react-native-get-random-values';
import {v4 as uuid} from 'uuid';
import {log} from './metrics';

// Some operations are not atomic. I don't expect it to cause problems, so I
// haven't gone to the effort of adding a mutex. mostly because I don't like
// the API for the most popular library.

export interface Progress {
  finished: boolean;
  progress: number | null;
}

export const genAutopause = async (): Promise<{
  type: 'off' | 'timed' | 'manual';
  timedDelay?: number;
}> => {
  const autopause = await AsyncStorage.getItem('@global-setting/autopause');
  if (autopause === null) {
    return {
      type: 'off',
    };
  }

  return JSON.parse(autopause);
};

export const genMostRecentListenedLessonForCourse = async (
  course: Course,
): Promise<number | null> => {
  const mostRecentLesson = await AsyncStorage.getItem(
    `@activity/${course}/most-recent-lesson`,
  );
  if (mostRecentLesson === null) {
    return null;
  }

  return parseInt(mostRecentLesson, 10);
};

export const genMostRecentListenedCourse = async (): Promise<Course | null> => {
  return (await AsyncStorage.getItem('@activity/most-recent-course')) as Course;
};

export const genProgressForLesson = async (
  course: Course,
  lesson: number | null,
): Promise<{
  finished: boolean;
  progress: number | null;
} | null> => {
  if (lesson === null) {
    return null;
  }

  const progress = await AsyncStorage.getItem(`@activity/${course}/${lesson}`);
  if (progress === null) {
    return {
      finished: false,
      progress: null,
    };
  } else {
    return JSON.parse(progress);
  }
};

export const genUpdateProgressForLesson = async (
  course: Course,
  lesson: number,
  progress: number,
): Promise<void> => {
  const progressObject = await genProgressForLesson(course, lesson);

  await Promise.all([
    AsyncStorage.setItem(
      `@activity/${course}/${lesson}`,
      JSON.stringify({
        ...progressObject,
        progress,
      }),
    ),
    AsyncStorage.setItem(
      `@activity/${course}/most-recent-lesson`,
      lesson.toString(),
    ),
    AsyncStorage.setItem('@activity/most-recent-course', course),
  ]);
};

export const genMarkLessonFinished = async (
  course: Course,
  lesson: number,
): Promise<void> => {
  const progressObject = await genProgressForLesson(course, lesson);

  await Promise.all([
    AsyncStorage.setItem(
      `@activity/${course}/${lesson}`,
      JSON.stringify({
        ...progressObject,
        finished: true,
      }),
    ),
    AsyncStorage.setItem(
      `@activity/${course}/most-recent-lesson`,
      lesson.toString(),
    ),
    AsyncStorage.setItem('@activity/most-recent-course', course),
  ]);

  if (
    (await genPreferenceAutoDeleteFinished()) &&
    (await DownloadManager.genIsDownloaded(course, lesson))
  ) {
    await DownloadManager.genDeleteDownload(course, lesson);
  }
};

export const genDeleteProgressForCourse = async (
  course: Course,
): Promise<void> => {
  const shouldRemoveGlobalRecentCourse =
    (await AsyncStorage.getItem('@activity/most-recent-course')) === course;

  await Promise.all([
    AsyncStorage.removeItem(`@activity/${course}/most-recent-lesson`),
    ...(shouldRemoveGlobalRecentCourse
      ? [AsyncStorage.removeItem('@activity/most-recent-course')]
      : []),
    ...CourseData.getLessonIndices(course).map((lesson) =>
      AsyncStorage.removeItem(`@activity/${course}/${lesson}`),
    ),
  ]);
};

export const genMetricsToken = async (): Promise<string> => {
  const storedToken = await AsyncStorage.getItem('@metrics/user-token');
  if (storedToken) {
    return storedToken;
  }

  const createdToken = uuid();
  await AsyncStorage.setItem('@metrics/user-token', createdToken);
  return createdToken;
};

export const genDeleteMetricsToken = async (): Promise<void> => {
  await AsyncStorage.removeItem('@metrics/user-token');
};

type PreferenceMethods = [() => Promise<any>, (val: any) => Promise<void>];
const preference = (
  name: Preference,
  defaultValue: any,
  fromString: (str: string) => any,
): PreferenceMethods => {
  return [
    async (): Promise<any> => {
      const val = await AsyncStorage.getItem(`@preferences/${name}`);
      if (val === null) {
        return defaultValue;
      }

      return fromString(val);
    },
    async (val: any): Promise<void> => {
      await AsyncStorage.setItem(`@preferences/${name}`, '' + val);
      // log after setting the preference so we respect the 'allow data collection' preference
      log({
        action: 'set_preference',
        surface: name,
        setting_value: val,
      });
    },
  ];
};

export const [
  genPreferenceAutoDeleteFinished,
  genSetPreferenceAutoDeleteFinished,
] = preference('auto-delete-finished', false, (b) => b === 'true');

export const [
  genPreferenceStreamQuality,
  genSetPreferenceStreamQuality,
] = preference('stream-quality', 'low', (b) => b);

export const [
  genPreferenceDownloadQuality,
  genSetPreferenceDownloadQuality,
] = preference('download-quality', 'high', (b) => b);

export const [
  genPreferenceDownloadOnlyOnWifi,
  genSetPreferenceDownloadOnlyOnWifi,
] = preference('download-only-on-wifi', true, (b) => b === 'true');

export const [
  genPreferenceAllowDataCollection,
  genSetPreferenceAllowDataCollection,
] = preference('allow-data-collection', true, (b) => b === 'true');

export const [
  genPreferenceIsFirstLoad,
  genSetPreferenceIsFirstLoad,
] = preference('is-first-load', true, (b) => b === 'true');

export const [
  genPreferenceRatingButtonDismissed,
  genSetPreferenceRatingButtonDismissed,
] = preference('rating-button-dismissed', { dismissed: false }, (o) => JSON.parse(o));

export const [
  genPreferenceKillswitchCourseVersionV1,
  genSetPreferenceKillswitchCourseVersionV1,
] = preference('killswitch-course-version-v1', false, (b) => b === 'true');

export function usePreference<T>(key: Preference, defaultValue: any) {
  const [value, setValue] = useState<T>(null!);

  useEffect(() => {
    async function loadValue() {
      const [loadFn] = preference(key, defaultValue, (b) => b);
      setValue(await loadFn());
    }

    loadValue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return value;
}
