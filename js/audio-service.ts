import TrackPlayer, {STATE_PLAYING} from 'react-native-track-player';
import BackgroundTimer from 'react-native-background-timer';
import {
  genAutopause,
  genUpdateProgressForLesson,
  genMarkLessonFinished,
  genPreferenceAutoplay,
  genPreferenceAutoplayNonDownloaded,
} from './persistence';
import CourseData, {Course} from './course-data';
import DownloadManager from './download-manager';
import {navigate, pop} from './navigation-ref';

let currentlyPlaying = null;
let updateInterval = null;

export let audioServiceSubscriptions = [];

export const genEnqueueFile = async (
  course: Course,
  lesson: number,
): Promise<void> => {
  TrackPlayer.setupPlayer();

  TrackPlayer.updateOptions({
    stopWithApp: false,
    capabilities: [
      TrackPlayer.CAPABILITY_PLAY,
      TrackPlayer.CAPABILITY_PAUSE,
      TrackPlayer.CAPABILITY_JUMP_BACKWARD,
      TrackPlayer.CAPABILITY_STOP,
    ],
    compactCapabilities: [
      TrackPlayer.CAPABILITY_PLAY,
      TrackPlayer.CAPABILITY_PAUSE,
      TrackPlayer.CAPABILITY_JUMP_BACKWARD,
    ],
    jumpInterval: 10,
    alwaysPauseOnInterruption: true,
    color: parseInt(
      CourseData.getCourseUIColors(course).background.substring(1),
      16,
    ),
  });

  await TrackPlayer.removeUpcomingTracks();

  let url = CourseData.getLessonUrl(course, lesson);
  if (await DownloadManager.genIsDownloaded(course, lesson)) {
    url = DownloadManager.getDownloadSaveLocation(
      DownloadManager.getDownloadId(course, lesson),
    );
  }

  // Add a track to the queue
  await TrackPlayer.add({
    id: CourseData.getLessonId(course, lesson),
    url,
    title: `${CourseData.getLessonTitle(
      course,
      lesson,
    )}: ${CourseData.getCourseTitle(course)}`,
    artist: 'Language Transfer',
    // artwork: require('track.png'),
  });

  currentlyPlaying = {course, lesson};
};

// we need to suppress playback-queue-ended unless it actually played the track through
let intentionalDestroy = false;
export const genStopPlaying = async () => {
  intentionalDestroy = true;
  currentlyPlaying = null;
  await TrackPlayer.destroy();
};

export default async () => {
  audioServiceSubscriptions.forEach((s) => s.remove());

  audioServiceSubscriptions = [
    TrackPlayer.addEventListener('remote-play', () => TrackPlayer.play()),

    TrackPlayer.addEventListener('remote-pause', () => TrackPlayer.pause()),

    TrackPlayer.addEventListener('remote-stop', () => genStopPlaying()),

    TrackPlayer.addEventListener('remote-jump-backward', async ({interval}) => {
      const position = await TrackPlayer.getPosition();
      await TrackPlayer.seekTo(Math.max(0, position - interval));
    }),

    TrackPlayer.addEventListener('playback-state', async ({state}) => {
      if (state !== STATE_PLAYING) return;

      const autopauseConfig = await genAutopause();

      switch (autopauseConfig.type) {
        case 'off':
          return;
        case 'timed':
          return;
        case 'manual':
          return;
      }

      // const position = await TrackPlayer.getPosition();

      // // ...todo. needs to be at least 0.5s or some threshold after current position
      // const nextPause = position + 4000;

      // let nextPauseTimeout = window.setTimeout(() => {
      //   TrackPlayer.pause();
      // }, nextPause - position);
    }),

    TrackPlayer.addEventListener('playback-state', async ({state}) => {
      if (state === STATE_PLAYING) {
        if (updateInterval) {
          BackgroundTimer.clearInterval(updateInterval);
        }

        const update = async () => {
          const [position, state] = await Promise.all([
            TrackPlayer.getPosition(),
            TrackPlayer.getState(),
          ]);

          if (state !== STATE_PLAYING) {
            // happens sometimes. /shrug
            BackgroundTimer.clearInterval(updateInterval);
            return;
          }

          if (position !== null) {
            await genUpdateProgressForLesson(
              currentlyPlaying.course,
              currentlyPlaying.lesson,
              position,
            );
          }
        };

        // #419 seems to say that window.setInterval should work here, but... it doesn't
        updateInterval = BackgroundTimer.setInterval(update, 3000); // don't wake up the CPU too often, if we can help it
        update();
      } else {
        BackgroundTimer.clearInterval(updateInterval);
      }
    }),

    TrackPlayer.addEventListener('playback-queue-ended', async (params) => {
      if (intentionalDestroy) {
        intentionalDestroy = false;
        return;
      }

      if (params.track === null) {
        // honestly not sure why/when this can happen but it can and it's causing problems
        return;
      }

      if (currentlyPlaying === null) {
        // ...what?
        return;
      }

      // guess who worked out the hard way that if you do the next two concurrently you get a race condition

      await genMarkLessonFinished(
        currentlyPlaying.course,
        currentlyPlaying.lesson,
      );

      // otherwise it's very tricky to play it again!
      await genUpdateProgressForLesson(
        currentlyPlaying.course,
        currentlyPlaying.lesson,
        0,
      );

      const nextLesson = CourseData.getNextLesson(
        currentlyPlaying.course,
        currentlyPlaying.lesson,
      );

      if (
        nextLesson === null || // :o you did it!
        !(await genPreferenceAutoplay()) ||
        (!(await genPreferenceAutoplayNonDownloaded()) &&
          !(await DownloadManager.genIsDownloaded(
            currentlyPlaying.course,
            nextLesson,
          )))
      ) {
        // sorry sir, no can do
        pop();
        return;
      }

      await genEnqueueFile(currentlyPlaying.course, nextLesson);
      await TrackPlayer.play();
      // this "I'm not using context" thing is getting out of hand
      navigate('Listen', {course: currentlyPlaying.course, lesson: nextLesson});
    }),
  ];
};
