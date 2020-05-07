import {AsyncStorage} from 'react-native';
import type {Course} from './course-data';
import {DefaultTransition} from '@react-navigation/stack/lib/typescript/src/TransitionConfigs/TransitionPresets';

// Some operations are not atomic. I don't expect it to cause problems, so I
// haven't gone to the effort of adding a mutex. mostly because I don't like
// the API for the most popular library.

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

export const genMostRecentListenedCourse = async (
  course: Course,
): Promise<Course | null> => {
  return (await AsyncStorage.getItem('@activity/most-recent-course')) as Course;
};

export const genProgressForLesson = async (
  course: Course,
  lesson: number | null,
): Promise<{
  finished: boolean;
  progress: number | null;
}> => {
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
};

const preference = (name, defaultValue, fromString) => {
  return [
    async (): Promise<boolean> => {
      const preference = await AsyncStorage.getItem(`@preferences/${name}`);
      if (preference === null) {
        return defaultValue;
      }

      return fromString(preference);
    },
    async (preference: boolean): Promise<void> => {
      await AsyncStorage.setItem(`@preferences/${name}`, '' + preference);
    },
  ];
};

export const [genPreferenceAutoplay, genSetPreferenceAutoplay] = preference(
  'autoplay',
  true,
  (b) => b === 'true',
);

export const [
  genPreferenceAutoplayNonDownloaded,
  genSetPreferenceAutoplayNonDownloaded,
] = preference('autoplay-non-downloaded', true, (b) => b === 'true');
