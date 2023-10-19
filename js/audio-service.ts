import {Platform, EmitterSubscription} from 'react-native'; 
import TrackPlayer, {State, Event, Capability} from 'react-native-track-player';
import BackgroundTimer, {IntervalId} from 'react-native-background-timer';
import {
  genAutopause,
  genUpdateProgressForLesson,
  genMarkLessonFinished,
  genPreferenceStreamQuality,
} from './persistence';
import CourseData from './course-data';
import DownloadManager from './download-manager';
import {navigate, pop} from './navigation-ref';
import {log} from './metrics';

type CurrentPlaying = {
  course: Course;
  lesson: number;
};

let currentlyPlaying: CurrentPlaying | null = null;
let updateInterval: IntervalId | null = null;
let audioServiceSubscriptions: EmitterSubscription[] = [];

// when we enqueue then skip, it acts like we skipped from track 1 to track n. suppress the event
let suppressTrackChange = false;

interface PlaybackTrackChangedEventParams {
    track: string | null;
    position: number;
    nextTrack: string | null;
}

export const genEnqueueFile = async (
  course: Course,
  lesson: number,
): Promise<void> => {
  await TrackPlayer.setupPlayer();

  TrackPlayer.updateOptions({
    stopWithApp: false,
    capabilities: [
      Capability.Play,
      Capability.Pause,
      Capability.JumpBackward,
      Capability.Stop,
    ],
    compactCapabilities: [
      Capability.Play,
      Capability.Pause,
      Capability.JumpBackward,
    ],
    notificationCapabilities: [
      Capability.Play,
      Capability.Pause,
      Capability.JumpBackward,
    ],
    backwardJumpInterval: 10,
    alwaysPauseOnInterruption: true,
    color: parseInt(
      CourseData.getCourseUIColors(course).background.substring(1),
      16,
    ),
  });

  await TrackPlayer.removeUpcomingTracks();

  const quality = await genPreferenceStreamQuality();

  const tracks = await Promise.all(
    CourseData.getLessonIndices(course)
    .slice(Platform.OS === 'ios' ? lesson : 0)
    .map((l) =>
      (async (thisLesson) => {
        let resource;
        if (thisLesson === 0 && CourseData.getBundledFirstLesson(course)) {
          resource = CourseData.getBundledFirstLesson(course);
        } else {
          resource = CourseData.getLessonUrl(course, thisLesson, quality);
          if (await DownloadManager.genIsDownloaded(course, thisLesson)) {
            resource = DownloadManager.getDownloadSaveLocation(
              DownloadManager.getDownloadId(course, thisLesson),
            );
          }
        }

        return {
          id: CourseData.getLessonId(course, thisLesson),
          url: resource,
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
  if (lesson !== 0 && Platform.OS === 'android') {
    // we get an event for skipping that needs to be suppressed, UNLESS we're legitimately trying to play lesson 1
    // only suppress on android as this was breaking iOS
    // when we call the skip function in a few lines, on android the trackchanged event
    // is happening asynchronously and currentlyPlaying is getting set BEFORE
    // the trackchanged event is fired.
    // However, on iOS currentlyPlaying gets set AFTER the trackchanged event is fired.
    // this causes suppressChange not to be necessary on iOS because currentlyPlaying is null, and
    // the event handler already returns early.
    suppressTrackChange = true;
  }
  await TrackPlayer.add(tracks);
  if (Platform.OS === 'ios') {
    await TrackPlayer.skip(0);
  } else {
    await TrackPlayer.skip(lesson);
  }

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
    TrackPlayer.addEventListener(Event.RemotePlay, async () => {
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

    TrackPlayer.addEventListener(Event.RemotePause, async () => {
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

    TrackPlayer.addEventListener(Event.RemoteStop, async () => {
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

    TrackPlayer.addEventListener(
      Event.RemoteJumpBackward,
      async ({interval}) => {
        const position = await TrackPlayer.getPosition();
        log({
          action: 'jump_backward',
          surface: 'remote',
          course: currentlyPlaying?.course,
          lesson: currentlyPlaying?.lesson,
          position,
        });

        await TrackPlayer.seekTo(Math.max(0, position - interval));
      },
    ),

    TrackPlayer.addEventListener(
      Event.PlaybackState,
      async ({state}) => {
        if (state !== State.Playing) {
          return;
        }

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
      },
    ),

    TrackPlayer.addEventListener(
      Event.PlaybackState,
      async ({state}) => {
        if (state === State.Playing) {
          if (updateInterval) {
            BackgroundTimer.clearInterval(updateInterval);
          }

          const update = async () => {
            const [position, currState] = await Promise.all([
              TrackPlayer.getPosition(),
              TrackPlayer.getState(),
            ]);

            if (currState !== State.Playing) {
              // happens sometimes. /shrug
              if (updateInterval) {
                BackgroundTimer.clearInterval(updateInterval);
              }
              return;
            }

            if (position !== null && currentlyPlaying) {
              await genUpdateProgressForLesson(
                currentlyPlaying.course,
                currentlyPlaying.lesson,
                position as number,
              );
            }
          };

          // #419 seems to say that window.setInterval should work here, but... it doesn't
          updateInterval = BackgroundTimer.setInterval(update, 3000); // don't wake up the CPU too often, if we can help it
          update();
        } else {
          if (updateInterval) {
            BackgroundTimer.clearInterval(updateInterval);
          }
        }
      },
    ),


    // welcome! you've found it. the worst code in the codebase.
    // I have a personal policy of including explicit blame whenever I write code I know someone will curse me for one day.
    // contact me@timothyaveni.com with your complaints.
    TrackPlayer.addEventListener(
      Event.PlaybackTrackChanged,
      async (params: PlaybackTrackChangedEventParams) => {
        const wasPlaying = currentlyPlaying;

        if (params.track == null || wasPlaying === null) {
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
        // this is a little silly because we set wasPlaying to currentlyPlaying at the top
        // and now we're setting currentlyPlaying to the contents of wasPlaying
        // but I'm still doing that instead of deleting this and only referencing wasPlaying
        // because currentlyPlaying is used elsewhere and that might screw things up
        currentlyPlaying = {
          course: wasPlaying.course,
          lesson: wasPlaying.lesson + 1,
        };

        if (currentlyPlaying === undefined || currentlyPlaying.lesson === null) {
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
        await genUpdateProgressForLesson(
          wasPlaying.course,
          wasPlaying.lesson,
          0,
        );

        navigate('Listen', {
          course: currentlyPlaying.course,
          lesson: currentlyPlaying.lesson,
        });
      },
    ),
  ];
};
