import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import TrackPlayer from 'react-native-track-player';

import type { Course } from '@/src/types';

type LessonTrackMetadata = {
  course?: Course;
  lesson?: number;
};

const NotificationClickScreen = () => {
  const router = useRouter();

  useEffect(() => {
    const redirect = async () => {
      try {
        const track = (await TrackPlayer.getActiveTrack()) as LessonTrackMetadata | null;
        if (track?.course && typeof track.lesson === 'number') {
          router.replace({
            pathname: '/course/[course]/listen/[lesson]',
            params: {
              course: track.course,
              lesson: track.lesson.toString(),
            },
          });
          return;
        }
      } catch {
        // Player might not be initialized; fall through to home.
      }

      router.replace('/');
    };

    void redirect();
  }, [router]);
  return null;
};

export default NotificationClickScreen;
