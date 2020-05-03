import TrackPlayer, {STATE_PLAYING} from 'react-native-track-player';
import BackgroundTimer from 'react-native-background-timer';
import {genAutopause, genUpdateProgressForLesson} from './persistence';

let currentlyPlaying = null;
let updateInterval = null;

export let audioServiceSubscriptions = [];

export const setCurrentlyPlaying = (obj) => (currentlyPlaying = obj);

export default async () => {
  audioServiceSubscriptions.forEach((s) => s.remove());

  audioServiceSubscriptions = [
    TrackPlayer.addEventListener('remote-play', () => TrackPlayer.play()),

    TrackPlayer.addEventListener('remote-pause', () => TrackPlayer.pause()),

    TrackPlayer.addEventListener('remote-stop', () => TrackPlayer.destroy()),

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
            console.log('CLEAR INTERVAL B', updateInterval);
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
  ];
};
