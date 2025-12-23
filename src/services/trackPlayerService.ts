import TrackPlayer, { Event } from "react-native-track-player";

import {
  markLessonFinished,
  updateProgressForLesson,
} from "@/src/storage/persistence";
import type { CourseName } from "@/src/types";
import { log } from "@/src/utils/log";

type LessonContext = {
  course: CourseName;
  lesson: number;
  trackId?: string | number;
};

type LessonTrackMetadata = {
  id?: string | number;
  course?: CourseName;
  lesson?: number;
};

const getLessonContextForTrack = async (
  trackIndex?: number
): Promise<LessonContext | null> => {
  const resolvedIndex =
    typeof trackIndex === "number"
      ? trackIndex
      : (await TrackPlayer.getActiveTrackIndex()) ?? undefined;

  if (resolvedIndex == null) {
    return null;
  }

  const track = (await TrackPlayer.getTrack(resolvedIndex)) as
    | LessonTrackMetadata
    | undefined;
  const course = track?.course;
  const lesson = track?.lesson;

  if (!course || typeof lesson !== "number") {
    return null;
  }

  return { course, lesson, trackId: track?.id };
};

const logRemoteAction = async (action: string, positionOverride?: number) => {
  const [context, progress] = await Promise.all([
    getLessonContextForTrack(),
    TrackPlayer.getProgress(),
  ]);

  log({
    action,
    surface: "remote",
    course: context?.course,
    lesson: context?.lesson,
    position: positionOverride ?? progress.position,
  }).then();
};

const persistProgress = async (context: LessonContext, position: number) => {
  await updateProgressForLesson(context.course, context.lesson, position);
};

export const PROGRESS_PERSIST_INTERVAL_MS = 3000;
const FINISH_THRESHOLD_SECONDS = 5;

let lastPersistTs = 0;
let lastCompletedTrackId: string | number | null = null;
let lastActiveTrackId: string | number | null = null;
let lastProgress: {
  context: LessonContext;
  position: number;
  duration: number;
} | null = null;

const runSafe = <Args extends any[]>(fn: (...args: Args) => Promise<void>) => {
  return async (...args: Args) => {
    try {
      await fn(...args);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_e) {
      // console.log(e);
      // Avoid crashing the playback service if a background task fails.
    }
  };
};

const trackPlayerService = async (): Promise<void> => {
  TrackPlayer.addEventListener(
    Event.RemotePlay,
    runSafe(async () => {
      await TrackPlayer.play();
      logRemoteAction("play").then();
    })
  );

  TrackPlayer.addEventListener(
    Event.RemotePause,
    runSafe(async () => {
      await TrackPlayer.pause();
      logRemoteAction("pause").then();
    })
  );

  TrackPlayer.addEventListener(
    Event.RemoteStop,
    runSafe(async () => {
      logRemoteAction("stop").then();
      await TrackPlayer.stop();
      await TrackPlayer.reset();
    })
  );

  TrackPlayer.addEventListener(
    Event.RemoteJumpBackward,
    runSafe(async ({ interval }) => {
      const [context, progress] = await Promise.all([
        getLessonContextForTrack(),
        TrackPlayer.getProgress(),
      ]);

      const nextPosition = Math.max(0, progress.position - interval);
      await TrackPlayer.seekTo(nextPosition);
      logRemoteAction("jump_backward", nextPosition).then();
      if (context) {
        await persistProgress(context, nextPosition);
      }
    })
  );

  TrackPlayer.addEventListener(
    Event.RemoteNext,
    runSafe(async () => {
      const [queue, activeIndex] = await Promise.all([
        TrackPlayer.getQueue(),
        TrackPlayer.getActiveTrackIndex(),
      ]);
      if (activeIndex == null || activeIndex >= queue.length - 1) {
        return;
      }

      await TrackPlayer.skipToNext();
      logRemoteAction("skip_next", 0).then();
    })
  );

  TrackPlayer.addEventListener(
    Event.RemotePrevious,
    runSafe(async () => {
      const activeIndex = await TrackPlayer.getActiveTrackIndex();
      if (activeIndex == null || activeIndex <= 0) {
        return;
      }

      await TrackPlayer.skipToPrevious();
      logRemoteAction("skip_previous", 0).then();
    })
  );

  TrackPlayer.addEventListener(
    Event.RemoteSeek,
    runSafe(async ({ position }) => {
      const context = await getLessonContextForTrack();
      await TrackPlayer.seekTo(position);
      logRemoteAction("change_position", position).then();
      if (context) {
        await persistProgress(context, position);
      }
    })
  );

  TrackPlayer.addEventListener(
    Event.PlaybackProgressUpdated,
    runSafe(async ({ position, duration, track }) => {
      const context = await getLessonContextForTrack(track);
      if (!context) {
        return;
      }

      lastProgress = {
        context,
        position,
        duration: typeof duration === "number" ? duration : 0,
      };

      const now = Date.now();
      if (now - lastPersistTs < PROGRESS_PERSIST_INTERVAL_MS) {
        return;
      }

      lastPersistTs = now;
      await persistProgress(context, position);
    })
  );

  TrackPlayer.addEventListener(
    Event.PlaybackActiveTrackChanged,
    runSafe(async () => {
      if (!lastProgress) {
        return;
      }

      const currentContext = await getLessonContextForTrack();
      if (
        currentContext?.trackId !== undefined &&
        lastProgress.context.trackId !== undefined &&
        currentContext.trackId !== lastProgress.context.trackId &&
        lastProgress.context.trackId !== lastActiveTrackId
      ) {
        log({
          action: "track_changed",
          course: lastProgress.context.course,
          lesson: lastProgress.context.lesson,
          position: lastProgress.position,
        }).then();
      }
      lastActiveTrackId = currentContext?.trackId ?? null;

      const { context, position, duration } = lastProgress;
      if (
        duration > 0 &&
        duration - position <= FINISH_THRESHOLD_SECONDS &&
        context.trackId !== undefined &&
        context.trackId !== lastCompletedTrackId
      ) {
        lastCompletedTrackId = context.trackId;
        log({
          action: "finish_lesson",
          course: context.course,
          lesson: context.lesson,
        }).then();
        await markLessonFinished(context.course, context.lesson);
        await persistProgress(context, 0);
      }
    })
  );

  TrackPlayer.addEventListener(
    Event.PlaybackQueueEnded,
    runSafe(async () => {
      if (!lastProgress) {
        return;
      }

      const { context, position, duration } = lastProgress;
      if (
        duration > 0 &&
        duration - position <= FINISH_THRESHOLD_SECONDS &&
        context.trackId !== undefined &&
        context.trackId !== lastCompletedTrackId
      ) {
        lastCompletedTrackId = context.trackId;
        log({
          action: "finish_lesson",
          course: context.course,
          lesson: context.lesson,
        }).then();
        await markLessonFinished(context.course, context.lesson);
        await persistProgress(context, 0);
      }
    })
  );
};

export default trackPlayerService;
