import React, {useEffect, useCallback, useState} from 'react';
import {StyleSheet, StatusBarStyle} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import ListenHeader from './ListenHeader.react';
import ListenBody from './ListenBody.react';
import TrackPlayer, {
  STATE_PLAYING,
  TrackPlayerEvents,
  usePlaybackStateIs,
  useTrackPlayerEvents,
} from 'react-native-track-player';
import CourseData from '../../course-data';
import {genStopPlaying, genEnqueueFile} from '../../audio-service';
import {genProgressForLesson} from '../../persistence';
import {log} from '../../metrics';
import {useSetStatusBarStyle} from '../../hooks/useStatusBarStyle';

const Listen = (props: any) => {
  const {course, lesson} = props.route.params;
  const [bottomSheetOpen, setBottomSheetOpen] = useState(false);

  const playing = usePlaybackStateIs(STATE_PLAYING);

  // go back to the previous screen when the user stops
  // the music from outside the app
  useTrackPlayerEvents([TrackPlayerEvents.REMOTE_STOP], () =>
    props.navigation.pop(),
  );

  // adjust the status bar style according to the course colors,
  // and the bottom sheet visibility
  const setStatusBarStyle = useSetStatusBarStyle();
  useEffect(() => {
    const navBarLight =
      !bottomSheetOpen && CourseData.getCourseUIColors(course).text === 'black';
    setStatusBarStyle(
      CourseData.getCourseUIColors(course).background,
      ((navBarLight ? 'dark' : 'light') + '-content') as StatusBarStyle,
      navBarLight,
    );
  }, [
    setStatusBarStyle,
    bottomSheetOpen,
    course,
  ]);

  // load & queue audio file, find the last heard offset, and start
  // the lesson
  useFocusEffect(
    useCallback(() => {
      async function playLesson() {
        await genEnqueueFile(course, lesson);
        const progress = await genProgressForLesson(course, lesson);
        await TrackPlayer.seekTo(progress!.progress || 0);
        await TrackPlayer.play();
      }

      playLesson();

      // stop playing when leaving this screen
      return () => {
        genStopPlaying();
      };

      // we only want this happening once... not everytime the {course,lesson} pair
      // changes... so ignore param changes!
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  const toggle = async () => {
    if (!playing) {
      TrackPlayer.play();

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

  const seekTo = async (seconds: number) => {
    log({
      action: 'change_await TrackPlayer.getPosition()',
      surface: 'listen_screen',
      course,
      lesson,
      position: await TrackPlayer.getPosition(),
    });

    TrackPlayer.seekTo(seconds);
  };

  const skipBack = async () => {
    log({
      action: 'jump_backward',
      surface: 'listen_screen',
      course,
      lesson,
      position: await TrackPlayer.getPosition(),
    });

    TrackPlayer.seekTo(Math.max(0, await TrackPlayer.getPosition() - 10));
  };

  return (
    <>
      <ListenHeader course={course} />
      <ListenBody
        course={course}
        lesson={lesson}
        setBottomSheetOpen={setBottomSheetOpen}
        toggle={toggle}
        skipBack={skipBack}
        seekTo={seekTo}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
});

export default Listen;
