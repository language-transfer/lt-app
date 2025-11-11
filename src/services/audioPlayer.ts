import { useCallback, useEffect, useRef, useState } from 'react';
import { Audio, AVPlaybackStatusSuccess } from 'expo-av';

import CourseData from '@/src/data/courseData';
import DownloadManager from '@/src/services/downloadManager';
import {
  genMarkLessonFinished,
  genPreferenceStreamQuality,
  genProgressForLesson,
  genUpdateProgressForLesson,
} from '@/src/storage/persistence';
import type { Course } from '@/src/types';

type AudioError = {
  message: string;
};

export type LessonAudioControls = {
  ready: boolean;
  playing: boolean;
  buffering: boolean;
  duration: number;
  position: number;
  error: AudioError | null;
  play: () => Promise<void>;
  pause: () => Promise<void>;
  toggle: () => Promise<void>;
  seekTo: (seconds: number) => Promise<void>;
  skipBack: (seconds?: number) => Promise<void>;
};

const AUDIO_MODE = {
  staysActiveInBackground: false,
  allowsRecordingIOS: false,
  playsInSilentModeIOS: true,
  shouldDuckAndroid: true,
};

export const useLessonAudio = (course: Course, lesson: number): LessonAudioControls => {
  const soundRef = useRef<Audio.Sound | null>(null);
  const [status, setStatus] = useState<AVPlaybackStatusSuccess | null>(null);
  const [error, setError] = useState<AudioError | null>(null);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const persistRef = useRef(0);

  useEffect(() => {
    let mounted = true;
    let cancelled = false;

    async function load() {
      setStatus(null);
      setError(null);
      setPosition(0);
      if (CourseData.isCourseMetadataLoaded(course)) {
        setDuration(CourseData.getLessonDuration(course, lesson));
      } else {
        setDuration(0);
      }

      try {
        await CourseData.genLoadCourseMetadata(course);
        setDuration(CourseData.getLessonDuration(course, lesson));
        await Audio.setAudioModeAsync(AUDIO_MODE);
        const [quality, downloaded] = await Promise.all([
          genPreferenceStreamQuality(),
          DownloadManager.genIsDownloaded(course, lesson),
        ]);

        const uri = downloaded
          ? DownloadManager.getDownloadSaveLocation(DownloadManager.getDownloadId(course, lesson))
          : CourseData.getLessonUrl(course, lesson, quality);

        const sound = new Audio.Sound();

        sound.setOnPlaybackStatusUpdate((playbackStatus) => {
          if (!playbackStatus.isLoaded || !mounted) {
            return;
          }

          const successStatus = playbackStatus as AVPlaybackStatusSuccess;
          setStatus(successStatus);
          setPosition((successStatus.positionMillis ?? 0) / 1000);
          if (successStatus.durationMillis) {
            setDuration(successStatus.durationMillis / 1000);
          }

          const now = Date.now();
          if (
            successStatus.positionMillis !== undefined &&
            now - persistRef.current > 4000 &&
            successStatus.isPlaying
          ) {
            persistRef.current = now;
            genUpdateProgressForLesson(course, lesson, successStatus.positionMillis / 1000);
          }

          if (successStatus.didJustFinish) {
            genMarkLessonFinished(course, lesson);
          }
        });

        const source = uri.startsWith('file://') ? { uri } : { uri, headers: {} };
        await sound.loadAsync(source, {
          shouldPlay: false,
          progressUpdateIntervalMillis: 500,
        });

        const savedProgress = await genProgressForLesson(course, lesson);
        if (savedProgress?.progress) {
          await sound.setPositionAsync(savedProgress.progress * 1000);
        }

        if (!mounted || cancelled) {
          await sound.unloadAsync();
          return;
        }

        soundRef.current = sound;
      } catch (err) {
        if (mounted) {
          setError({ message: err instanceof Error ? err.message : 'Unable to load audio' });
        }
      }
    }

    load();

    return () => {
      mounted = false;
      cancelled = true;
      const sound = soundRef.current;
      soundRef.current = null;
      if (sound) {
        sound.unloadAsync().catch(() => {});
      }
    };
  }, [course, lesson]);

  const play = useCallback(async () => {
    if (!soundRef.current) {
      return;
    }
    await soundRef.current.playAsync();
  }, []);

  const pause = useCallback(async () => {
    if (!soundRef.current) {
      return;
    }
    await soundRef.current.pauseAsync();
  }, []);

  const toggle = useCallback(async () => {
    if (!soundRef.current) {
      return;
    }
    const currentStatus = status;
    if (!currentStatus?.isLoaded) {
      return;
    }
    if (currentStatus.isPlaying) {
      await pause();
    } else {
      await play();
    }
  }, [pause, play, status]);

  const seekTo = useCallback(async (seconds: number) => {
    if (!soundRef.current) {
      return;
    }
    await soundRef.current.setPositionAsync(seconds * 1000);
    setPosition(seconds);
    await genUpdateProgressForLesson(course, lesson, seconds);
  }, [course, lesson]);

  const skipBack = useCallback(
    async (seconds = 10) => {
      const newPosition = Math.max(0, position - seconds);
      await seekTo(newPosition);
    },
    [position, seekTo],
  );

  return {
    ready: Boolean(status?.isLoaded),
    playing: Boolean(status?.isLoaded && status.isPlaying),
    buffering: Boolean(status?.isLoaded && status.isBuffering),
    duration,
    position,
    error,
    play,
    pause,
    toggle,
    seekTo,
    skipBack,
  };
};
