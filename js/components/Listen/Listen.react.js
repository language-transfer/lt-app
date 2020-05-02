import React, {useEffect, useState, useContext} from 'react';
import {StyleSheet, View} from 'react-native';

import ListenHeader from './ListenHeader.react';
import ListenBody from './ListenBody.react';
import TrackPlayer, {
  STATE_NONE,
  STATE_PLAYING,
  STATE_PAUSED,
} from 'react-native-track-player';

import languageData from '../../../languageData';
import changeNavigationBarColor from 'react-native-navigation-bar-color';

const Listen = (props) => {
  const [bottomSheetOpen, setBottomSheetOpen] = useState(false);

  useEffect(() => {
    changeNavigationBarColor(
      'transparent',
      !bottomSheetOpen &&
        languageData[props.route.params.course].uiColors.text === 'black',
    );
  }, [props.route.params.course, bottomSheetOpen]);

  useEffect(() => {
    return props.navigation.addListener('blur', () => {
      TrackPlayer.destroy();
    });
  }, [props.nagivation]);

  const [playbackState, setPlaybackState] = useState(STATE_NONE);

  useEffect(() => {
    return props.navigation.addListener('focus', async () => {
      TrackPlayer.setupPlayer();

      TrackPlayer.updateOptions({
        stopWithApp: false,
        capabilities: [
          TrackPlayer.CAPABILITY_PLAY,
          TrackPlayer.CAPABILITY_PAUSE,
          TrackPlayer.CAPABILITY_STOP,
        ],
        compactCapabilities: [
          TrackPlayer.CAPABILITY_PLAY,
          TrackPlayer.CAPABILITY_PAUSE,
        ],
      });

      await TrackPlayer.removeUpcomingTracks();

      // Add a track to the queue
      await TrackPlayer.add({
        id: 'spanish03',
        url: require('../../../resources/spanish03.mp3'),
        title: 'Lesson 3: Spanish',
        artist: 'Language Transfer',
        // artwork: require('track.png'),
      });

      TrackPlayer.addEventListener('playback-state', ({state}) => {
        setPlaybackState(state);
      });

      TrackPlayer.addEventListener('remote-stop', () => {
        props.navigation.navigate('Language Home', {
          course: props.route.params.course,
        });
      });
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
