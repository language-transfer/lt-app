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

import CourseData from '../../course-data';
import changeNavigationBarColor from 'react-native-navigation-bar-color';
import DownloadManager from '../../download-manager';
import {
  setCurrentlyPlaying,
  audioServiceSubscriptions,
  genStopPlaying,
} from '../../audio-service';
import {genProgressForLesson} from '../../persistence';
import {genEnqueueFile} from '../../audio-service';

let fresh = true; // have we autoplayed for this screen already?

const Listen = (props) => {
  const [bottomSheetOpen, setBottomSheetOpen] = useState(false);

  useEffect(() => {}, []);

  useEffect(() => {
    const light =
      !bottomSheetOpen &&
      CourseData.getCourseUIColors(props.route.params.course).text === 'black';

    StatusBar.setBackgroundColor(
      CourseData.getCourseUIColors(props.route.params.course).background,
    );
    // please excuse this ternary I honestly have no idea which is which anymore
    StatusBar.setBarStyle((light ? 'dark' : 'light') + '-content', true);
    changeNavigationBarColor('transparent', light);
  }, [props.route.params.course, bottomSheetOpen]);

  useEffect(() => {
    return props.navigation.addListener('blur', () => {
      // fresh = true;
      genStopPlaying();
    });
  }, [props.nagivation]);

  const [playbackState, setPlaybackState] = useState(STATE_NONE);

  useEffect(() => {
    return props.navigation.addListener('focus', async () => {
      fresh = true; // initial mount only
      const {course, lesson} = props.route.params;
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
          CourseData.getCourseUIColors(
            props.route.params.course,
          ).background.substring(1),
          16,
        ),
      });

      await genEnqueueFile(course, lesson);

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
          props.navigation.pop();
        }),
      );
    });
  }, [setPlaybackState, props.navigation, props.route.params.course]);

  const styles = StyleSheet.create({
    background: {
      // without this, there's a small gap between header and body during animation
      backgroundColor: CourseData.getCourseUIColors(props.route.params.course)
        .background,
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
