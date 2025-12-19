import { useCallback, useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import TrackPlayer, {
  AndroidAudioContentType,
  AppKilledPlaybackBehavior,
  Capability,
  IOSCategory,
  IOSCategoryMode,
  IOSCategoryOptions,
  State,
  useActiveTrack,
  usePlaybackState,
  useProgress,
  type AddTrack,
} from "react-native-track-player";

import CourseData from "@/src/data/courseData";
import {
  CourseDownloadManager,
  getLocalObjectPath,
} from "@/src/services/downloadManager";
import {
  genMarkLessonFinished,
  genPreferenceStreamQuality,
  genProgressForLesson,
  genUpdateProgressForLesson,
} from "@/src/storage/persistence";
import type { CourseName, Quality } from "@/src/types";
import { log } from "@/src/utils/log";
import { PROGRESS_PERSIST_INTERVAL_MS } from "./trackPlayerService";

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
  Capability.SkipToNext,
  Capability.SkipToPrevious,
  Capability.JumpBackward,
  Capability.Stop,
];
const COMPACT_CAPABILITIES = [
  Capability.Play,
  Capability.Pause,
  Capability.SkipToNext,
  Capability.SkipToPrevious,
];
const NOTIFICATION_CAPABILITIES = [
  Capability.Play,
  Capability.Pause,
  Capability.SkipToNext,
  Capability.SkipToPrevious,
  Capability.JumpBackward,
  Capability.Stop,
];
const BASE_UPDATE_OPTIONS = {
  android: {
    appKilledPlaybackBehavior:
      AppKilledPlaybackBehavior.StopPlaybackAndRemoveNotification,
    alwaysPauseOnInterruption: true,
  },
  capabilities: CAPABILITIES,
  compactCapabilities: COMPACT_CAPABILITIES,
  notificationCapabilities: NOTIFICATION_CAPABILITIES,
  backwardJumpInterval: 10,
  progressUpdateEventInterval: 2,
};

type LessonTrack = AddTrack & {
  course: CourseName;
  lesson: number;
};

let playerSetupPromise: Promise<void> | null = null;
const LESSON_AUDIO_CANCELLED = Symbol("lesson_audio_cancelled");

const stopPlayback = async () => {
  try {
    await TrackPlayer.stop();
  } catch {
    // Ignore stop errors when player is idle/uninitialized.
  }

  try {
    await TrackPlayer.reset();
  } catch {
    // Ignore reset errors when player is not ready.
  }
};

export const stopLessonAudio = () => stopPlayback();

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
      // this is probably not a stable API but I'm pretty sure this only ever failed in dev mode / HMR
      //   (because the setup promise gets reset, but not the track player state)
      // so I don't mind if this starts breaking again in the future
      if (
        err.message ===
        "The player has already been initialized via setupPlayer."
      ) {
        return;
      }
      throw err;
    });
  }

  return playerSetupPromise;
};

const trackMatchesLesson = (
  track: LessonTrack | undefined,
  course: CourseName,
  lesson: number
) => {
  return track?.course === course && track?.lesson === lesson;
};

const colorToInt = (hex: string): number | undefined => {
  const parsed = Number.parseInt(hex.replace("#", ""), 16);
  return Number.isNaN(parsed) ? undefined : parsed;
};

const buildLessonQueue = async (
  course: CourseName,
  targetLesson: number,
  quality: Quality
): Promise<{ tracks: LessonTrack[]; targetIndex: number }> => {
  const lessons = CourseData.getLessonIndices(course);
  const targetIndex = lessons.indexOf(targetLesson);
  if (targetIndex === -1) {
    throw new Error(`Lesson ${targetLesson} is not available in ${course}`);
  }

  const artwork = CourseData.getCourseImageWithText(
    course
  ) as LessonTrack["artwork"];

  const tracks = await Promise.all(
    lessons.map(async (lessonNumber, index) => {
      let uri: string | number;
      const downloadStatus = await CourseDownloadManager.getDownloadStatus(
        course,
        lessonNumber
      );
      const isDownloaded = downloadStatus === "downloaded";

      if (isDownloaded) {
        uri = getLocalObjectPath(
          await CourseDownloadManager.getLessonPointer(course, lessonNumber)
        );
      } else {
        const bundled =
          lessonNumber === 0 && Platform.OS === "ios"
            ? CourseData.getBundledFirstLesson(course)
            : null;
        uri =
          bundled ??
          (await CourseData.getLessonUrl(course, lessonNumber, quality));
      }

      return {
        id: CourseData.getLessonId(course, lessonNumber),
        url: uri as LessonTrack["url"],
        contentType: CourseData.getLessonMimeType(
          course,
          lessonNumber,
          quality
        ),
        title: CourseData.getLessonTitle(course, lessonNumber),
        artist: "Language Transfer",
        artwork,
        duration: CourseData.getLessonDuration(course, lessonNumber),
        course,
        lesson: lessonNumber,
      };
    })
  );

  console.log(tracks);

  return { tracks, targetIndex };
};

export const useLessonAudio = (
  course: CourseName,
  lesson: number
): LessonAudioControls => {
  const [playerReady, setPlayerReady] = useState(false);
  const [duration, setDuration] = useState(0);
  const [loadError, setLoadError] = useState<AudioError | null>(null);
  const lastPersistTimeRef = useRef(0);

  const playbackState = usePlaybackState();
  const progress = useProgress(500);
  const activeTrack = useActiveTrack() as LessonTrack | undefined;
  // not sure when isCurrentLessonActive is false -- looks like at the beginning, before RNTP has gotten the memo
  const isCurrentLessonActive = trackMatchesLesson(activeTrack, course, lesson);
  const playbackStatus = playbackState.state;

  useEffect(() => {
    let cancelled = false;
    const checkCancel = () => {
      // throw if cancelled
      if (cancelled) {
        throw LESSON_AUDIO_CANCELLED;
      }
    };
    setPlayerReady(false);
    setLoadError(null);
    lastPersistTimeRef.current = 0;

    const load = async () => {
      try {
        await CourseData.loadCourseMetadata(course);
        checkCancel();
        const lessonDuration = CourseData.getLessonDuration(course, lesson);
        setDuration(lessonDuration);

        await ensurePlayer();
        checkCancel();

        const existingTrack = (await TrackPlayer.getActiveTrack()) as
          | LessonTrack
          | undefined;
        checkCancel();

        if (
          existingTrack &&
          trackMatchesLesson(existingTrack, course, lesson)
        ) {
          setPlayerReady(true);
          return;
        }

        const [quality, savedProgress] = await Promise.all([
          genPreferenceStreamQuality(),
          genProgressForLesson(course, lesson),
        ]);
        checkCancel();

        const { tracks, targetIndex } = await buildLessonQueue(
          course,
          lesson,
          quality
        );
        checkCancel();

        await TrackPlayer.reset();
        checkCancel();

        const colors = CourseData.getCourseUIColors(course);
        const color = colorToInt(colors.background);
        await TrackPlayer.updateOptions(
          color != null
            ? { ...BASE_UPDATE_OPTIONS, color }
            : BASE_UPDATE_OPTIONS
        );
        checkCancel();

        await TrackPlayer.add(tracks);
        checkCancel();

        if (targetIndex > 0) {
          await TrackPlayer.skip(targetIndex);
          checkCancel();
        }

        const savedPosition =
          typeof savedProgress?.progress === "number"
            ? savedProgress.progress
            : null;
        if (savedPosition && savedPosition > 0) {
          await TrackPlayer.seekTo(savedPosition);
          checkCancel();
          lastPersistTimeRef.current = Date.now();
        }

        setPlayerReady(true);

        await TrackPlayer.play().catch(() => {});
        checkCancel();
      } catch (err) {
        if (err === LESSON_AUDIO_CANCELLED) {
          return;
        }
        if (!cancelled && err) {
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

  useEffect(() => {
    if (!isCurrentLessonActive) {
      return;
    }

    if (playbackStatus !== State.Playing) {
      return;
    }

    const now = Date.now();
    if (now - lastPersistTimeRef.current < PROGRESS_PERSIST_INTERVAL_MS) {
      return;
    }

    lastPersistTimeRef.current = now;
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

    genMarkLessonFinished(course, lesson).catch(() => {});
    genUpdateProgressForLesson(course, lesson, 0).catch(() => {});
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
      lastPersistTimeRef.current = Date.now();
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
