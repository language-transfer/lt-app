import TrackPlayer from 'react-native-track-player';

export default async () => {
  TrackPlayer.addEventListener('remote-play', () => TrackPlayer.play());

  TrackPlayer.addEventListener('remote-pause', () => TrackPlayer.pause());

  TrackPlayer.addEventListener('remote-stop', () => TrackPlayer.destroy());

  TrackPlayer.addEventListener('remote-jump-backward', async ({interval}) => {
    console.log(interval);
    const position = await TrackPlayer.getPosition();
    await TrackPlayer.seekTo(Math.max(0, position - interval));
  });
};
