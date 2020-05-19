import TrackPlayer, {STATE_PLAYING} from 'react-native-track-player';
import BackgroundTimer from 'react-native-background-timer';
import {
  genAutopause,
  genUpdateProgressForLesson,
  genMarkLessonFinished,
  genPreferenceStreamQuality,
} from './persistence';
import CourseData, {Course} from './course-data';
import DownloadManager from './download-manager';
import {navigate, pop} from './navigation-ref';
import {log} from './metrics';

let currentlyPlaying = null;
let updateInterval = null;

export let audioServiceSubscriptions = [];

// when we enqueue then skip, it acts like we skipped from track 1 to track n. suppress the event
let suppressTrackChange = false;

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

  const quality = await genPreferenceStreamQuality();

  const tracks = await Promise.all(
    CourseData.getLessonIndices(course).map((l) =>
      (async (thisLesson) => {
        let url = CourseData.getLessonUrl(course, thisLesson, quality);
        if (await DownloadManager.genIsDownloaded(course, thisLesson)) {
          url = DownloadManager.getDownloadSaveLocation(
            DownloadManager.getDownloadId(course, thisLesson),
          );
        }

        return {
          id: CourseData.getLessonId(course, thisLesson),
          url,
          title: `${CourseData.getLessonTitle(
            course,
            thisLesson,
          )}: ${CourseData.getCourseFullTitle(course)}`,
          artist: 'Language Transfer',
          artwork: CourseData.getCourseImageWithText(course),
        };
      })(l),
    ),
  );

  // Add a track to the queue
  if (lesson !== 0) {
    // we get an event for skipping that needs to be suppressed, UNLESS we're legitimately trying to play lesson 1
    suppressTrackChange = true;
  }
  await TrackPlayer.add(tracks);
  await TrackPlayer.skip(CourseData.getLessonId(course, lesson));

  currentlyPlaying = {course, lesson};
};

export const genStopPlaying = async () => {
  currentlyPlaying = null;
  await TrackPlayer.pause(); // might fix bugs where sometimes the notification goes away but keeps playing
  await TrackPlayer.destroy();
};

export default async () => {
  audioServiceSubscriptions.forEach((s) => s.remove());

  audioServiceSubscriptions = [
    TrackPlayer.addEventListener('remote-play', async () => {
      await TrackPlayer.play();
      const position = await TrackPlayer.getPosition();
      log({
        action: 'play',
        surface: 'remote',
        course: currentlyPlaying?.course,
        lesson: currentlyPlaying?.lesson,
        position,
      });
    }),

    TrackPlayer.addEventListener('remote-pause', async () => {
      await TrackPlayer.pause();
      const position = await TrackPlayer.getPosition();
      log({
        action: 'pause',
        surface: 'remote',
        course: currentlyPlaying?.course,
        lesson: currentlyPlaying?.lesson,
        position,
      });
    }),

    TrackPlayer.addEventListener('remote-stop', async () => {
      const position = await TrackPlayer.getPosition();
      log({
        action: 'stop',
        surface: 'remote',
        course: currentlyPlaying?.course,
        lesson: currentlyPlaying?.lesson,
        position,
      });
      await genStopPlaying();
    }),

    TrackPlayer.addEventListener('remote-jump-backward', async ({interval}) => {
      const position = await TrackPlayer.getPosition();
      log({
        action: 'jump_backward',
        surface: 'remote',
        course: currentlyPlaying?.course,
        lesson: currentlyPlaying?.lesson,
        position,
      });

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

    // welcome! you've found it. the worst code in the codebase.
    // I have a personal policy of including explicit blame whenever I write code I know someone will curse me for one day.
    // contact me@timothyaveni.com with your complaints.
    TrackPlayer.addEventListener('playback-track-changed', async (params) => {
      const wasPlaying = currentlyPlaying;

      if (params.track === null || wasPlaying === null) {
        // starting to play a track from nothing
        // also lands here if we stop the track explicitly
        return;
      }

      if (suppressTrackChange) {
        suppressTrackChange = false;
        return;
      }

      if (params.nextTrack === null) {
        // the queue is ended. this isn't DRY, but it's tricky to get all the cases right here in a clean way.
        log({
          action: 'finish_lesson',
          course: wasPlaying?.course,
          lesson: wasPlaying?.lesson,
        });
        await genMarkLessonFinished(wasPlaying.course, wasPlaying.lesson);
        await genUpdateProgressForLesson(
          wasPlaying.course,
          wasPlaying.lesson,
          0,
        );
        pop();
        return;
      }

      // ASSUMPTION: we're in the same course as the old track
      currentlyPlaying = {
        course: wasPlaying.course,
        lesson: CourseData.getLessonNumberForId(
          wasPlaying.course,
          params.nextTrack,
        ),
      };

      if (!currentlyPlaying.lesson) {
        // TODO: don't fail silently here? should be impossible, but bugs happen
        return;
      }

      log({
        action: 'track_changed',
        course: wasPlaying.course,
        lesson: wasPlaying.lesson,
        position: params.position,
      });

      const trackDuration = CourseData.getLessonDuration(
        wasPlaying.course,
        wasPlaying.lesson,
      );
      console.log(trackDuration);
      // threshold compare, though in practice it's much smaller than 0.5
      if (params.position < trackDuration - 0.5) {
        // just a skip, track didn't finish
        navigate('Listen', {
          course: currentlyPlaying.course,
          lesson: currentlyPlaying.lesson,
        });
        return;
      }

      log({
        action: 'finish_lesson',
        course: wasPlaying?.course,
        lesson: wasPlaying?.lesson,
      });

      // guess who worked out the hard way that if you do the next two concurrently you get a race condition

      await genMarkLessonFinished(wasPlaying.course, wasPlaying.lesson);

      // otherwise it's very tricky to play it again!
      await genUpdateProgressForLesson(wasPlaying.course, wasPlaying.lesson, 0);

      navigate('Listen', {
        course: currentlyPlaying.course,
        lesson: currentlyPlaying.lesson,
      });
    }),
  ];
};
