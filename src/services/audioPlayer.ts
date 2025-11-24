import { useCallback, useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import TrackPlayer, {
  AppKilledPlaybackBehavior,
  Capability,
  IOSCategory,
  IOSCategoryMode,
  IOSCategoryOptions,
  State,
  type AddTrack,
  useActiveTrack,
  usePlaybackState,
  useProgress,
  AndroidAudioContentType,
} from "react-native-track-player";

import CourseData from "@/src/data/courseData";
import DownloadManager from "@/src/services/downloadManager";
import {
  genMarkLessonFinished,
  genPreferenceStreamQuality,
  genProgressForLesson,
  genUpdateProgressForLesson,
} from "@/src/storage/persistence";
import type { Course } from "@/src/types";
import { log } from "@/src/utils/log";

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
  seekTo: (seconds: number, options?: { log?: boolean }) => Promise<void>;
  skipBack: (seconds?: number) => Promise<void>;
};

const CAPABILITIES = [
  Capability.Play,
  Capability.Pause,
  Capability.JumpBackward,
  Capability.Stop,
];
const COMPACT_CAPABILITIES = [
  Capability.Play,
  Capability.Pause,
  Capability.JumpBackward,
];
const BASE_UPDATE_OPTIONS = {
  android: {
    appKilledPlaybackBehavior:
      AppKilledPlaybackBehavior.StopPlaybackAndRemoveNotification,
    alwaysPauseOnInterruption: true,
  },
  capabilities: CAPABILITIES,
  compactCapabilities: COMPACT_CAPABILITIES,
  notificationCapabilities: CAPABILITIES,
  backwardJumpInterval: 10,
  progressUpdateEventInterval: 2,
};

type LessonTrack = AddTrack & {
  course: Course;
  lesson: number;
};

let playerSetupPromise: Promise<void> | null = null;

const ensurePlayer = async () => {
  if (!playerSetupPromise) {
    playerSetupPromise = (async () => {
      await TrackPlayer.setupPlayer({
        iosCategory: IOSCategory.Playback,
        iosCategoryMode: IOSCategoryMode.Default,
        iosCategoryOptions: [
          IOSCategoryOptions.AllowBluetooth,
          IOSCategoryOptions.AllowBluetoothA2DP,
          IOSCategoryOptions.DuckOthers,
        ],
        // let TrackPlayer handle interruptions from GPS or whatever. the default behavior is good
        autoHandleInterruptions: true,
        androidAudioContentType: AndroidAudioContentType.Speech,
        // notification update is handled by TrackPlayer
        autoUpdateMetadata: true,
        // Android-only: we can specify how much should be retained behind us
        backBuffer: 15,
      });
      await TrackPlayer.updateOptions(BASE_UPDATE_OPTIONS);
    })().catch((err) => {
      playerSetupPromise = null;
      throw err;
    });
  }

  return playerSetupPromise;
};

const trackMatchesLesson = (
  track: LessonTrack | undefined,
  course: Course,
  lesson: number
) => {
  return track?.course === course && track?.lesson === lesson;
};

const colorToInt = (hex: string): number | undefined => {
  const parsed = Number.parseInt(hex.replace("#", ""), 16);
  return Number.isNaN(parsed) ? undefined : parsed;
};

export const useLessonAudio = (
  course: Course,
  lesson: number
): LessonAudioControls => {
  const [playerReady, setPlayerReady] = useState(false);
  const [duration, setDuration] = useState(0);
  const [loadError, setLoadError] = useState<AudioError | null>(null);
  const persistRef = useRef(0);

  const playbackState = usePlaybackState();
  const progress = useProgress(500);
  const activeTrack = useActiveTrack() as LessonTrack | undefined;
  const isCurrentLessonActive = trackMatchesLesson(activeTrack, course, lesson);
  const playbackStatus = playbackState.state;

  useEffect(() => {
    let cancelled = false;
    setPlayerReady(false);
    setLoadError(null);
    persistRef.current = 0;

    const load = async () => {
      try {
        await CourseData.genLoadCourseMetadata(course);
        const lessonDuration = CourseData.getLessonDuration(course, lesson);
        if (!cancelled) {
          setDuration(lessonDuration);
        }

        await ensurePlayer();
        const existingTrack = (await TrackPlayer.getActiveTrack()) as
          | LessonTrack
          | undefined;
        if (
          existingTrack &&
          trackMatchesLesson(existingTrack, course, lesson)
        ) {
          if (!cancelled) {
            setPlayerReady(true);
          }
          return;
        }

        const [quality, downloaded, savedProgress] = await Promise.all([
          genPreferenceStreamQuality(),
          DownloadManager.genIsDownloaded(course, lesson),
          genProgressForLesson(course, lesson),
        ]);

        let uri: string | number;
        if (downloaded) {
          uri = DownloadManager.getDownloadSaveLocation(
            DownloadManager.getDownloadId(course, lesson)
          );
        } else {
          const bundled =
            lesson === 0 && Platform.OS === "ios"
              ? CourseData.getBundledFirstLesson(course)
              : null;
          uri = bundled ?? CourseData.getLessonUrl(course, lesson, quality);
        }

        await TrackPlayer.reset();
        const colors = CourseData.getCourseUIColors(course);
        const color = colorToInt(colors.background);
        await TrackPlayer.updateOptions(
          color != null
            ? { ...BASE_UPDATE_OPTIONS, color }
            : BASE_UPDATE_OPTIONS
        );

        const track: LessonTrack = {
          id: CourseData.getLessonId(course, lesson),
          url: uri as LessonTrack["url"],
          title: CourseData.getLessonTitle(course, lesson),
          artist: "Language Transfer",
          artwork: CourseData.getCourseImageWithText(
            course
          ) as LessonTrack["artwork"],
          duration: lessonDuration,
          course,
          lesson,
        };

        await TrackPlayer.add(track);
        const savedPosition =
          typeof savedProgress?.progress === "number"
            ? savedProgress.progress
            : null;
        if (savedPosition && savedPosition > 0) {
          await TrackPlayer.seekTo(savedPosition);
          persistRef.current = Date.now();
        }

        if (!cancelled) {
          setPlayerReady(true);
        }

        await TrackPlayer.play().catch(() => {});
      } catch (err) {
        if (!cancelled) {
          setLoadError({
            message:
              err instanceof Error ? err.message : "Unable to load audio",
          });
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [course, lesson]);

  // TODO: worried about frequent wakes here
  useEffect(() => {
    if (!isCurrentLessonActive) {
      return;
    }

    if (playbackStatus !== State.Playing) {
      return;
    }

    const now = Date.now();
    if (now - persistRef.current < 4000) {
      return;
    }

    persistRef.current = now;
    genUpdateProgressForLesson(course, lesson, progress.position).catch(
      () => {}
    );
  }, [
    course,
    lesson,
    isCurrentLessonActive,
    playbackStatus,
    progress.position,
  ]);

  useEffect(() => {
    if (!isCurrentLessonActive) {
      return;
    }

    if (playbackStatus !== State.Ended) {
      return;
    }

    const finishedPosition = duration > 0 ? duration : progress.duration;
    genMarkLessonFinished(course, lesson).catch(() => {});
    genUpdateProgressForLesson(course, lesson, finishedPosition).catch(
      () => {}
    );
  }, [
    course,
    lesson,
    duration,
    isCurrentLessonActive,
    playbackStatus,
    progress.duration,
  ]);

  const logPlayerEvent = useCallback(
    (action: string, positionOverride?: number) => {
      log({
        action,
        surface: "listen_screen",
        course,
        lesson,
        position:
          positionOverride ?? (isCurrentLessonActive ? progress.position : 0),
      });
    },
    [course, lesson, isCurrentLessonActive, progress.position]
  );

  const play = useCallback(async () => {
    if (!playerReady || !isCurrentLessonActive) {
      return;
    }
    await TrackPlayer.play();
    logPlayerEvent("play");
  }, [isCurrentLessonActive, playerReady, logPlayerEvent]);

  const pause = useCallback(async () => {
    if (!playerReady || !isCurrentLessonActive) {
      return;
    }
    await TrackPlayer.pause();
    logPlayerEvent("pause");
  }, [isCurrentLessonActive, playerReady, logPlayerEvent]);

  const toggle = useCallback(async () => {
    if (!isCurrentLessonActive || !playerReady) {
      return;
    }

    if (playbackStatus === State.Playing) {
      await pause();
    } else {
      await play();
    }
  }, [isCurrentLessonActive, pause, play, playbackStatus, playerReady]);

  const seekTo = useCallback(
    async (seconds: number, options?: { log?: boolean }) => {
      if (!playerReady || !isCurrentLessonActive) {
        return;
      }
      await TrackPlayer.seekTo(seconds);
      persistRef.current = Date.now();
      await genUpdateProgressForLesson(course, lesson, seconds);
      if (options?.log !== false) {
        logPlayerEvent("change_position", seconds);
      }
    },
    [course, lesson, isCurrentLessonActive, logPlayerEvent, playerReady]
  );

  const skipBack = useCallback(
    async (seconds = 10) => {
      const currentPosition = isCurrentLessonActive ? progress.position : 0;
      const newPosition = Math.max(0, currentPosition - seconds);
      logPlayerEvent("jump_backward");
      await seekTo(newPosition, { log: false });
    },
    [isCurrentLessonActive, progress.position, seekTo, logPlayerEvent]
  );

  const playbackError =
    playbackStatus === State.Error ? playbackState.error : null;
  const error =
    loadError ?? (playbackError ? { message: playbackError.message } : null);

  const position = isCurrentLessonActive ? progress.position : 0;
  const resolvedDuration =
    duration > 0 ? duration : isCurrentLessonActive ? progress.duration : 0;

  return {
    ready: Boolean(
      playerReady &&
        isCurrentLessonActive &&
        playbackStatus !== State.Loading &&
        playbackStatus !== State.None
    ),
    playing: Boolean(isCurrentLessonActive && playbackStatus === State.Playing),
    buffering: Boolean(
      isCurrentLessonActive &&
        (playbackStatus === State.Buffering || playbackStatus === State.Loading)
    ),
    duration: resolvedDuration,
    position,
    error,
    play,
    pause,
    toggle,
    seekTo,
    skipBack,
  };
};
