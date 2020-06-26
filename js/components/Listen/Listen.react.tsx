import React, {useEffect, useCallback, useState, useMemo} from 'react';
import {StyleSheet, StatusBarStyle} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {StackScreenProps} from '@react-navigation/stack';
import {LanguageStackParamList} from '../Nav/LanguageNav.react';
import {SafeAreaView} from 'react-native-safe-area-context';
import ListenHeader from './ListenHeader.react';
import ListenBody from './ListenBody.react';
import TrackPlayer, {
  STATE_PLAYING,
  TrackPlayerEvents,
  usePlaybackStateIs,
  useTrackPlayerProgress,
  useTrackPlayerEvents,
} from 'react-native-track-player';
import CourseData from '../../course-data';
import {useCourseContext} from '../Context/CourseContext';
import {LessonProvider} from '../Context/LessonContext';
import {genStopPlaying, genEnqueueFile} from '../../audio-service';
import {genProgressForLesson} from '../../persistence';
import {log} from '../../metrics';
import {useSetStatusBarStyle} from '../../hooks/useStatusBarStyle';

type Props = StackScreenProps<LanguageStackParamList, 'Listen'>;

const Listen = (props: Props) => {
  const {course, courseData} = useCourseContext();
  const {lesson} = props.route.params;
  const [bottomSheetOpen, setBottomSheetOpen] = useState(false);

  const {position} = useTrackPlayerProgress();
  const playing = usePlaybackStateIs(STATE_PLAYING);

  // const [] = useState(false);

  // go back to the previous screen when the user stops
  // the music remotely (from the locked screen view?)
  useTrackPlayerEvents([TrackPlayerEvents.REMOTE_STOP], () =>
    props.navigation.pop(),
  );

  // adjust the status bar style according to the course colors,
  // and the bottom sheet visibility
  const setStatusBarStyle = useSetStatusBarStyle();
  useEffect(() => {
    const navBarLight =
      !bottomSheetOpen && courseData.uiColors.text === 'black';
    setStatusBarStyle(
      courseData.uiColors.background,
      ((navBarLight ? 'dark' : 'light') + '-content') as StatusBarStyle,
      'transparent',
      navBarLight,
    );
  }, [
    setStatusBarStyle,
    bottomSheetOpen,
    courseData.uiColors.text,
    courseData.uiColors.background,
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

  const toggle = useCallback(() => {
    if (!playing) {
      TrackPlayer.play();

      log({
        action: 'play',
        surface: 'listen_screen',
        course,
        lesson,
        position,
      });
    } else {
      TrackPlayer.pause();

      log({
        action: 'pause',
        surface: 'listen_screen',
        course,
        lesson,
        position,
      });
    }
  }, [course, lesson, playing, position]);

  const seekTo = useCallback(
    (seconds) => {
      log({
        action: 'change_position',
        surface: 'listen_screen',
        course,
        lesson,
        position,
      });

      TrackPlayer.seekTo(seconds);
    },
    [course, lesson, position],
  );

  const skipBack = useCallback(() => {
    log({
      action: 'jump_backward',
      surface: 'listen_screen',
      course,
      lesson,
      position,
    });

    TrackPlayer.seekTo(Math.max(0, position - 10));
  }, [course, lesson, position]);

  const lessonData = useMemo(() => CourseData.getLessonData(course, lesson), [
    course,
    lesson,
  ]);

  return (
    <LessonProvider lesson={lesson} lessonData={lessonData}>
      <SafeAreaView
        style={[
          styles.container,
          {backgroundColor: courseData.uiColors.background},
        ]}>
        <ListenHeader />
        <ListenBody
          setBottomSheetOpen={setBottomSheetOpen}
          toggle={toggle}
          skipBack={skipBack}
          seekTo={seekTo}
        />
      </SafeAreaView>
    </LessonProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 30,
  },
});

export default Listen;
