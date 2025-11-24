import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import TrackPlayer from 'react-native-track-player';
import { useNavigation } from '@react-navigation/native';

import type { Course } from '@/src/types';

type LessonTrackMetadata = {
  course?: Course;
  lesson?: number;
};

const NotificationClickScreen = () => {
  const router = useRouter();
  const navigation = useNavigation();

  useEffect(() => {
    const navigateToLesson = (course: Course, lesson: number) => {
      const listenRoute = {
        pathname: '/course/[course]/listen/[lesson]' as const,
        params: { course, lesson: lesson.toString() },
      };

      const state = navigation.getState();
      const routes = state?.routes ?? [];
      const hasPrevious = routes.length > 1;
      const previousRoute = hasPrevious ? routes[routes.length - 2] : undefined;
      const previousIsListen = previousRoute?.name === 'course/[course]/listen/[lesson]';

      if (hasPrevious && navigation.canGoBack()) {
        router.back();
        setTimeout(() => {
          if (previousIsListen) {
            router.replace(listenRoute);
          } else {
            router.push(listenRoute);
          }
        }, 0);
        return;
      }

      router.replace(listenRoute);
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
      if (state?.routes?.length > 1 && navigation.canGoBack()) {
        router.back();
        setTimeout(() => {
          router.push('/');
        }, 0);
        return;
      }

      router.replace('/');
    };

    void redirect();
  }, [router, navigation]);
  return null;
};

export default NotificationClickScreen;
