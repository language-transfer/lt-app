import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'expo-router';
import TrackPlayer, { Event } from 'react-native-track-player';

import type { Course } from '@/src/types';
import { stopLessonAudio } from '@/src/services/audioPlayer';

type LessonTrackMetadata = {
  course?: Course;
  lesson?: number;
};

type LessonRoute = {
  course: Course;
  lesson: number;
};

const LISTEN_ROUTE_REGEX = /^\/course\/([^/]+)\/listen\/(\d+)$/;

const parseListenRoute = (pathname: string | null): LessonRoute | null => {
  if (!pathname) {
    return null;
  }

  const match = pathname.match(LISTEN_ROUTE_REGEX);
  if (!match) {
    return null;
  }

  return {
    course: match[1] as Course,
    lesson: Number.parseInt(match[2], 10),
  };
};

const useListenNavigationSync = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [activeLesson, setActiveLesson] = useState<LessonRoute | null>(null);

  useEffect(() => {
    let cancelled = false;
    const resolveActiveLesson = async () => {
      try {
        const track = (await TrackPlayer.getActiveTrack()) as LessonTrackMetadata | null;
        if (!track?.course || typeof track.lesson !== 'number') {
          setActiveLesson(null);
          return;
        }
        if (cancelled) {
          return;
        }
        setActiveLesson({ course: track.course, lesson: track.lesson });
      } catch {
        // Player might not be ready; ignore errors.
      }
    };

    void resolveActiveLesson();
    const subscription = TrackPlayer.addEventListener(
      Event.PlaybackActiveTrackChanged,
      resolveActiveLesson,
    );

    return () => {
      cancelled = true;
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (!activeLesson) {
      return;
    }

    const currentRoute = parseListenRoute(pathname);
    if (!currentRoute) {
      return;
    }

    if (
      currentRoute.course === activeLesson.course &&
      currentRoute.lesson === activeLesson.lesson
    ) {
      return;
    }

    router.replace({
      pathname: '/course/[course]/listen/[lesson]',
      params: {
        course: activeLesson.course,
        lesson: activeLesson.lesson.toString(),
      },
    });
  }, [activeLesson, pathname, router]);

  useEffect(() => {
    // Stop audio when navigating, unless we're staying on the listen page
    // (it's okay if it's a different listen page -- this would happen because of a sync from the track player)
    const currentListenRoute = parseListenRoute(pathname);
    if (!currentListenRoute) {
      if (pathname === '/notification.click') {
        // we're about to handle this path and navigate to the listen page, so don't stop the audio
        return;
      }
      void stopLessonAudio();
    }
  }, [pathname]);
};

export default useListenNavigationSync;
