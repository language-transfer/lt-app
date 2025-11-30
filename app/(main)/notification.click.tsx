import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import TrackPlayer from 'react-native-track-player';
import { CommonActions, useNavigation } from '@react-navigation/native';

import type { Course } from '@/src/types';

type LessonTrackMetadata = {
  course?: Course;
  lesson?: number;
};

const LISTEN_ROUTE_NAME = 'course/[course]/listen/[lesson]';

const NotificationClickScreen = () => {
  const router = useRouter();
  const navigation = useNavigation();

  useEffect(() => {
    const navigateToLesson = (course: Course, lesson: number) => {
      const state = navigation.getState();
      if (!state || !state.routes?.length) {
        router.replace({
          pathname: '/course/[course]/listen/[lesson]',
          params: { course, lesson: lesson.toString() },
        });
        return;
      }

      const nextRoutes = state.routes.slice(0, -1).map((route) => ({
        name: route.name as string,
        params: route.params,
      }));

      const listenRoute = {
        name: LISTEN_ROUTE_NAME,
        params: { course, lesson: lesson.toString() },
      };

      if (nextRoutes.length === 0) {
        router.replace({
          pathname: '/course/[course]/listen/[lesson]',
          params: { course, lesson: lesson.toString() },
        });
        return;
      }

      const top = nextRoutes[nextRoutes.length - 1];
      if (top.name === LISTEN_ROUTE_NAME) {
        nextRoutes[nextRoutes.length - 1] = listenRoute;
      } else {
        nextRoutes.push(listenRoute);
      }

      navigation.dispatch(
        CommonActions.reset({
          ...state,
          routes: nextRoutes,
          index: nextRoutes.length - 1,
        }),
      );
    };

    const redirect = async () => {
      try {
        const track = (await TrackPlayer.getActiveTrack()) as LessonTrackMetadata | null;
        if (track?.course && typeof track.lesson === 'number') {
          navigateToLesson(track.course, track.lesson);
          return;
        }
      } catch {
        // Player might not be initialized; fall through to home.
      }

      const state = navigation.getState();
      if (state?.routes?.length) {
        const nextRoutes = state.routes.slice(0, -1).map((route) => ({
          name: route.name as string,
          params: route.params,
        }));

        if (nextRoutes.length > 0) {
          navigation.dispatch(
            CommonActions.reset({
              ...state,
              routes: nextRoutes,
              index: nextRoutes.length - 1,
            }),
          );
          return;
        }
      }

      router.replace('/');
    };

    void redirect();
  }, [router, navigation]);
  return null;
};

export default NotificationClickScreen;
