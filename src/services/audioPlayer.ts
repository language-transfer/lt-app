import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
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
import { log } from '@/src/utils/log';

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
  const [source, setSource] = useState<string | number | null>(null);
  const [error, setError] = useState<AudioError | null>(null);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const persistRef = useRef(0);
  const pendingSeekRef = useRef<number | null>(null);
  const autoStartRef = useRef(false);

  const player = useAudioPlayer(source, { updateInterval: 500, keepAudioSessionActive: false });
  const status: AudioStatus | null = useAudioPlayerStatus(player);

  useEffect(() => {
    let mounted = true;
    setError(null);
    setPosition(0);
    setSource(null);
    autoStartRef.current = false;

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

        let uri: string | number;
        if (downloaded) {
          uri = DownloadManager.getDownloadSaveLocation(
            DownloadManager.getDownloadId(course, lesson),
          );
        } else {
          const bundled =
            lesson === 0 && Platform.OS === 'ios'
              ? CourseData.getBundledFirstLesson(course)
              : null;
          uri = bundled ?? CourseData.getLessonUrl(course, lesson, quality);
        }

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
      (async () => {
        try {
          await player.seekTo(target);
          setPosition(target);
        } catch {
          // ignore seek errors
        }
      })();
    }

    if (status.isLoaded && !autoStartRef.current) {
      autoStartRef.current = true;
      try {
        player.play();
      } catch {
        // ignore auto-play errors
      }
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

  const logPlayerEvent = useCallback(
    (action: string, positionOverride?: number) => {
      log({
        action,
        surface: 'listen_screen',
        course,
        lesson,
        position: positionOverride ?? status?.currentTime ?? 0,
      });
    },
    [course, lesson, status?.currentTime],
  );

  const play = useCallback(async () => {
    if (!status?.isLoaded) {
      return;
    }
    player.play();
    logPlayerEvent('play');
  }, [player, status, logPlayerEvent]);

  const pause = useCallback(async () => {
    if (!status?.isLoaded) {
      return;
    }
    player.pause();
    logPlayerEvent('pause');
  }, [player, status, logPlayerEvent]);

  const toggle = useCallback(async () => {
    const currentStatus = status;
    if (!currentStatus?.isLoaded) {
      return;
    }
    if (currentStatus.playing) {
      await pause();
    } else {
      await play();
    }
  }, [pause, play, status]);

  const seekTo = useCallback(
    async (seconds: number, options?: { log?: boolean }) => {
      if (!status?.isLoaded) {
        return;
      }
      await player.seekTo(seconds);
      setPosition(seconds);
      await genUpdateProgressForLesson(course, lesson, seconds);
      if (options?.log !== false) {
        logPlayerEvent('change_position', seconds);
      }
    },
    [course, lesson, player, status, logPlayerEvent],
  );

  const skipBack = useCallback(
    async (seconds = 10) => {
      const newPosition = Math.max(0, position - seconds);
      logPlayerEvent('jump_backward');
      await seekTo(newPosition, { log: false });
    },
    [logPlayerEvent, position, seekTo],
  );

  return {
    ready: Boolean(status?.isLoaded),
    playing: Boolean(status?.isLoaded && status.playing),
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
