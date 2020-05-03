import React, {useEffect, useState, useContext} from 'react';
import {StyleSheet, View, StatusBar} from 'react-native';

import ListenHeader from './ListenHeader.react';
import ListenBody from './ListenBody.react';
import TrackPlayer, {
  STATE_NONE,
  STATE_PLAYING,
  STATE_PAUSED,
  STATE_READY,
} from 'react-native-track-player';

import languageData from '../../../languageData';
import changeNavigationBarColor from 'react-native-navigation-bar-color';
import DownloadManager from '../../download-manager';
import {
  setCurrentlyPlaying,
  audioServiceSubscriptions,
} from '../../audio-service';
import {genProgressForLesson} from '../../persistence';

let fresh = true; // have we autoplayed for this screen already?

const Listen = (props) => {
  const [bottomSheetOpen, setBottomSheetOpen] = useState(false);

  useEffect(() => {}, []);

  useEffect(() => {
    const light =
      !bottomSheetOpen &&
      languageData[props.route.params.course].uiColors.text === 'black';

    StatusBar.setBackgroundColor(
      languageData[props.route.params.course].uiColors.background,
    );
    // please excuse this ternary I honestly have no idea which is which anymore
    StatusBar.setBarStyle((light ? 'dark' : 'light') + '-content', true);
    changeNavigationBarColor('transparent', light);
  }, [props.route.params.course, bottomSheetOpen]);

  useEffect(() => {
    return props.navigation.addListener('blur', () => {
      // fresh = true;
      TrackPlayer.destroy();
    });
  }, [props.nagivation]);

  const [playbackState, setPlaybackState] = useState(STATE_NONE);

  useEffect(() => {
    return props.navigation.addListener('focus', async () => {
      fresh = true; // initial mount only
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
      });

      await TrackPlayer.removeUpcomingTracks();

      // Add a track to the queue
      const {course, lesson} = props.route.params;
      await TrackPlayer.add({
        id: DownloadManager.getDownloadId(course, lesson),
        url: DownloadManager.getDownloadSaveLocation(course, lesson),
        title: `${languageData[course].meta.lessons[lesson].name}: ${languageData[course].title}`,
        artist: 'Language Transfer',
        // artwork: require('track.png'),
      });

      // global state for the audio service
      setCurrentlyPlaying({course, lesson});

      audioServiceSubscriptions.push(
        TrackPlayer.addEventListener('playback-state', async ({state}) => {
          setPlaybackState(state);
          if (state === STATE_READY && fresh) {
            const progress = await genProgressForLesson(course, lesson);
            await TrackPlayer.seekTo(progress.progress || 0);
            await TrackPlayer.play();
            fresh = false;
          }
        }),
      );

      audioServiceSubscriptions.push(
        TrackPlayer.addEventListener('remote-stop', () => {
          props.navigation.navigate('Language Home', {
            course: props.route.params.course,
          });
        }),
      );
    });
  }, [setPlaybackState, props.navigation, props.route.params.course]);

  const styles = StyleSheet.create({
    background: {
      // without this, there's a small gap between header and body during animation
      backgroundColor:
        languageData[props.route.params.course].uiColors.background,
      height: '100%',
    },
  });

  const playing = playbackState === STATE_PLAYING;

  const toggle = () => {
    if (!playing) {
      TrackPlayer.play();
    } else {
      TrackPlayer.pause();
    }
  };

  const skipBack = async () => {
    const position = await TrackPlayer.getPosition();
    TrackPlayer.seekTo(Math.max(0, position - 10));
  };

  return (
    <View style={styles.background}>
      <ListenHeader navigation={props.navigation} route={props.route} />
      <ListenBody
        navigation={props.navigation}
        route={props.route}
        setBottomSheetOpen={setBottomSheetOpen}
        toggle={toggle}
        skipBack={skipBack}
        playing={playing}
      />
    </View>
  );
};

export default Listen;
