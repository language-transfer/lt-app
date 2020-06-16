import React, {useEffect, useCallback, useState, useMemo} from 'react';
import {StyleSheet, StatusBar, StatusBarStyle} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {StackScreenProps} from '@react-navigation/stack';
import {LanguageStackParamList} from '../Nav/LanguageNav.react';
import {SafeAreaView} from 'react-native-safe-area-context';
import ListenHeader from './ListenHeader.react';
import ListenBody from './ListenBody.react';
// the typings for this library are just awful...
import TrackPlayer, {
  State,
  Event,
  usePlaybackState,
  useProgress,
  useTrackPlayerEvents,
} from 'react-native-track-player';
import CourseData from '../../course-data';
import {useCourseContext} from '../Context/CourseContext';
import {LessonProvider} from '../Context/LessonContext';
import changeNavigationBarColor from 'react-native-navigation-bar-color';
import {genStopPlaying, genEnqueueFile} from '../../audio-service';
import {genProgressForLesson} from '../../persistence';
import {log} from '../../metrics';

type Props = StackScreenProps<LanguageStackParamList, 'Listen'>;

const Listen = (props: Props) => {
  const {course, courseData} = useCourseContext();
  const {lesson} = props.route.params;
  const [bottomSheetOpen, setBottomSheetOpen] = useState(false);

  const {position} = useProgress();
  const playbackState = usePlaybackState();

  // go back to the previos screen when the user stops
  // the music remotely (from the locked screen view?)
  useTrackPlayerEvents([Event.RemoteStop], () => props.navigation.pop());

  // ready state isn't exactly what you'd expect... so we'll make up our
  // own definition of "Ready"
  const ready =
    playbackState !== State.None && playbackState !== State.Connecting;
  const playing = playbackState === State.Playing;

  // adjust the status bar style according to the course colors,
  // and the bottom sheet visibility
  useEffect(() => {
    const light = !bottomSheetOpen && courseData.uiColors.text === 'black';
    StatusBar.setBackgroundColor(courseData.uiColors.background);
    // please excuse this ternary I honestly have no idea which is which anymore
    StatusBar.setBarStyle(
      ((light ? 'dark' : 'light') + '-content') as StatusBarStyle,
      true,
    );
    changeNavigationBarColor('transparent', light, true);
  }, [
    bottomSheetOpen,
    courseData.uiColors.text,
    courseData.uiColors.background,
  ]);

  // load & queue audio file
  useFocusEffect(
    useCallback(() => {
      genEnqueueFile(course, lesson);

      // stop playing when leaving this screen
      return () => {
        genStopPlaying();
      };

      // we only want this happening once... not everytime the {course,lesson} pair
      // changes... so ignore param changes!
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  // auto play when ready, & skip to last saved offset
  useEffect(() => {
    async function startAndSkip() {
      const progress = await genProgressForLesson(course, lesson);
      await TrackPlayer.seekTo(progress!.progress || 0);
      await TrackPlayer.play();
    }

    if (playbackState === State.Ready) {
      startAndSkip();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playbackState]);

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
          ready={ready}
          playing={playing}
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
