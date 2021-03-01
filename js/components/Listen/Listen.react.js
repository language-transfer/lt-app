import React, {useEffect, useState} from 'react';
import {StyleSheet, View, StatusBar} from 'react-native';

import ListenHeader from './ListenHeader.react';
import ListenBody from './ListenBody.react';
import TrackPlayer, {
  STATE_NONE,
  STATE_PLAYING,
  STATE_READY,
  STATE_CONNECTING,
} from 'react-native-track-player';

import CourseData from '../../course-data';
import changeNavigationBarColor from 'react-native-navigation-bar-color';
import {audioServiceSubscriptions, genStopPlaying} from '../../audio-service';
import {genProgressForLesson} from '../../persistence';
import {genEnqueueFile} from '../../audio-service';

import {log} from '../../metrics';

let fresh = true; // have we (not) autoplayed for this screen already?

const Listen = (props) => {
  const [bottomSheetOpen, setBottomSheetOpen] = useState(false);

  useEffect(() => {
    const light =
      !bottomSheetOpen &&
      CourseData.getCourseUIColors(props.route.params.course).text === 'black';

    StatusBar.setBackgroundColor(
      CourseData.getCourseUIColors(props.route.params.course).background,
    );
    // please excuse this ternary I honestly have no idea which is which anymore
    StatusBar.setBarStyle((light ? 'dark' : 'light') + '-content', true);
    StatusBar.setTranslucent(true);
    changeNavigationBarColor('transparent', light);
  }, [props.route.params.course, bottomSheetOpen]);

  useEffect(() => {
    return props.navigation.addListener('blur', () => {
      genStopPlaying();
    });
  }, [props.nagivation]);

  const [playbackState, setPlaybackState] = useState(STATE_NONE);

  const {course, lesson} = props.route.params;

  useEffect(() => {
    return props.navigation.addListener('focus', async () => {
      fresh = true; // initial mount only

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

  const toggle = async () => {
    if (!playing) {
      await TrackPlayer.play();

      log({
        action: 'play',
        surface: 'listen_screen',
        course,
        lesson,
        position: await TrackPlayer.getPosition(),
      });
    } else {
      TrackPlayer.pause();

      log({
        action: 'pause',
        surface: 'listen_screen',
        course,
        lesson,
        position: await TrackPlayer.getPosition(),
      });
    }
  };

  const skipBack = async () => {
    const position = await TrackPlayer.getPosition();
    log({
      action: 'jump_backward',
      surface: 'listen_screen',
      course,
      lesson,
      position,
    });

    TrackPlayer.seekTo(Math.max(0, position - 10));
  };

  const ready = !(
    playbackState === STATE_NONE || playbackState === STATE_CONNECTING
  );

  return (
    <View style={styles.background}>
      <ListenHeader navigation={props.navigation} route={props.route} />
      <ListenBody
        navigation={props.navigation}
        route={props.route}
        setBottomSheetOpen={setBottomSheetOpen}
        toggle={toggle}
        skipBack={skipBack}
        ready={ready}
        playing={playing}
      />
    </View>
  );
};

export default Listen;
