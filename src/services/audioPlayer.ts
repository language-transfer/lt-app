import { useCallback, useEffect, useRef, useState } from 'react';
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';

import CourseData from '@/src/data/courseData';
import DownloadManager from '@/src/services/downloadManager';
import {
  genMarkLessonFinished,
  genPreferenceStreamQuality,
  genProgressForLesson,
  genUpdateProgressForLesson,
} from '@/src/storage/persistence';
import type { Course } from '@/src/types';
import type { AudioStatus } from 'expo-audio';

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
  playsInSilentMode: true,
  allowsRecording: false,
  shouldPlayInBackground: false,
  interruptionMode: 'duckOthers' as const,
  interruptionModeAndroid: 'duckOthers' as const,
  shouldRouteThroughEarpiece: false,
};

export const useLessonAudio = (course: Course, lesson: number): LessonAudioControls => {
  const [source, setSource] = useState<string | null>(null);
  const [error, setError] = useState<AudioError | null>(null);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const persistRef = useRef(0);
  const pendingSeekRef = useRef<number | null>(null);

  const player = useAudioPlayer(source, { updateInterval: 500, keepAudioSessionActive: false });
  const status: AudioStatus | null = useAudioPlayerStatus(player);

  useEffect(() => {
    let mounted = true;
    setError(null);
    setPosition(0);
    setSource(null);

    async function load() {
      try {
        if (CourseData.isCourseMetadataLoaded(course)) {
          setDuration(CourseData.getLessonDuration(course, lesson));
        } else {
          setDuration(0);
        }

        await CourseData.genLoadCourseMetadata(course);
        setDuration(CourseData.getLessonDuration(course, lesson));
        await setAudioModeAsync(AUDIO_MODE);

        const [quality, downloaded, savedProgress] = await Promise.all([
          genPreferenceStreamQuality(),
          DownloadManager.genIsDownloaded(course, lesson),
          genProgressForLesson(course, lesson),
        ]);

        const uri = downloaded
          ? DownloadManager.getDownloadSaveLocation(DownloadManager.getDownloadId(course, lesson))
          : CourseData.getLessonUrl(course, lesson, quality);

        if (!mounted) {
          return;
        }

        pendingSeekRef.current = savedProgress?.progress ?? null;
        setSource(uri);
      } catch (err) {
        if (mounted) {
          setError({ message: err instanceof Error ? err.message : 'Unable to load audio' });
        }
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, [course, lesson]);

  useEffect(() => {
    if (!status) {
      return;
    }

    setPosition(status.currentTime ?? 0);
    if (status.duration) {
      setDuration(status.duration);
    }

    if (pendingSeekRef.current != null && status.isLoaded) {
      const target = pendingSeekRef.current;
      pendingSeekRef.current = null;
      player.seekTo(target).catch(() => {});
      setPosition(target);
    }

    const now = Date.now();
    if (status.playing && now - persistRef.current > 4000) {
      persistRef.current = now;
      genUpdateProgressForLesson(course, lesson, status.currentTime ?? 0);
    }

    if (status.didJustFinish) {
      genMarkLessonFinished(course, lesson);
    }
  }, [status, player, course, lesson]);

  const play = useCallback(async () => {
    if (!status?.isLoaded) {
      return;
    }
    player.play();
  }, [player, status]);

  const pause = useCallback(async () => {
    if (!status?.isLoaded) {
      return;
    }
    player.pause();
  }, [player, status]);

  const toggle = useCallback(async () => {
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
    if (!status?.isLoaded) {
      return;
    }
    await player.seekTo(seconds);
    setPosition(seconds);
    await genUpdateProgressForLesson(course, lesson, seconds);
  }, [course, lesson, player, status]);

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
