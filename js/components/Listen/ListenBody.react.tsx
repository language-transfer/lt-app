import React, {useRef} from 'react';
import {
  StyleSheet,
  View,
  Text,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import {Icon} from 'react-native-elements';
import {TouchableNativeFeedback} from 'react-native-gesture-handler';
import RBSheet from 'react-native-raw-bottom-sheet';
import ListenBottomSheet from './ListenBottomSheet.react';
import CourseData from '../../course-data';
import ListenScrubber from './ListenScrubber.react';
import TrackPlayer, {
  usePlaybackStateIs,
  STATE_READY,
  STATE_PLAYING,
  STATE_PAUSED,
} from 'react-native-track-player';
import {log} from '../../metrics';
import useIsLessonDownloaded from '../../hooks/useIsLessonDownloaded';

interface Props {
  course: Course,
  lesson: number,
  setBottomSheetOpen: (val: boolean) => any;
  skipBack: () => any;
  seekTo: (pos: number) => any;
  toggle: () => any;
}

const smallIconSize = 0.175 * Dimensions.get('screen').width;
const largeIconSize = 0.4 * Dimensions.get('screen').width;

const ListenBody = ({course, lesson, setBottomSheetOpen, skipBack, seekTo, toggle}: Props) => {
  const ready = usePlaybackStateIs(STATE_READY);
  const playing = usePlaybackStateIs(STATE_PLAYING);
  const paused = usePlaybackStateIs(STATE_PAUSED);
  const bottomSheet = useRef<RBSheet | null>(null);

  const downloaded = useIsLessonDownloaded(course, lesson);
  if (downloaded === null) {
    return (
      <ActivityIndicator
        size={64}
        style={styles.loader}
        color={CourseData.getCourseUIColors(course).text}
      />
    );
  }

  return (
    <>
      <View
        style={[
          styles.body,
          {
            backgroundColor: CourseData.getCourseUIColors(course).background,
          },
        ]}>
        <View style={styles.lessonName}>
          <Text style={[styles.courseTitle, {color: CourseData.getCourseUIColors(course).text}]}>
            {CourseData.getCourseShortTitle(course)}
          </Text>
          <Text style={[styles.lesson, {color: CourseData.getCourseUIColors(course).text}]}>
            {CourseData.getLessonTitle(course, lesson)}
          </Text>
        </View>

        <View style={styles.icons}>
          <TouchableNativeFeedback
            // @ts-ignore
            background={TouchableNativeFeedback.Ripple(null, true)}
            onPress={skipBack}>
            <Icon
              name="replay-10"
              type="material"
              accessibilityLabel="skip backwards ten seconds"
              size={smallIconSize}
              color={CourseData.getCourseUIColors(course).text}
            />
          </TouchableNativeFeedback>
          {ready || playing || paused ? (
            <TouchableNativeFeedback
              // @ts-ignore
              background={TouchableNativeFeedback.Ripple(null, true)}
              onPress={toggle}>
              <Icon
                name={playing ? 'pause' : 'play-arrow'}
                accessibilityLabel={playing ? 'pause' : 'play'}
                type="material"
                size={largeIconSize}
                color={CourseData.getCourseUIColors(course).text}
              />
            </TouchableNativeFeedback>
          ) : (
            <ActivityIndicator
              size={largeIconSize}
              color={CourseData.getCourseUIColors(course).text}
            />
          )}
          <TouchableNativeFeedback
            // @ts-ignore
            background={TouchableNativeFeedback.Ripple(null, true)}
            onPress={() => {
              bottomSheet.current?.open();
            }}>
            <Icon
              name="settings"
              type="material"
              accessibilityLabel="other actions for this lesson"
              size={smallIconSize}
              color={CourseData.getCourseUIColors(course).text}
            />
          </TouchableNativeFeedback>
        </View>

        <ListenScrubber course={course} lesson={lesson} seekTo={seekTo} />
      </View>

      <RBSheet
        ref={bottomSheet}
        height={downloaded ? 236 : 164}
        // is there such a prop `duration`?
        // @ts-ignore
        duration={250}
        customStyles={{
          container: {
            borderTopLeftRadius: 15,
            borderTopRightRadius: 15,
          },
        }}
        closeOnDragDown={true}
        onOpen={async () => {
          log({
            action: 'open_bottom_sheet',
            surface: 'listen_screen',
            course,
            lesson,
            position: await TrackPlayer.getPosition(),
          });
          setBottomSheetOpen(true);
        }}
        onClose={async () => {
          log({
            action: 'close_bottom_sheet',
            surface: 'listen_screen',
            course,
            lesson,
            position: await TrackPlayer.getPosition(),
          });
          setBottomSheetOpen(false);
        }}>
        <ListenBottomSheet course={course} lesson={lesson} downloaded={downloaded} />
      </RBSheet>
    </>
  );
};

const styles = StyleSheet.create({
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 24,
  },

  lessonName: {
    alignItems: 'center',
  },

  courseTitle: {
    fontWeight: 'bold',
    fontSize: 48,
  },
  lesson: {
    fontSize: 32,
  },

  icons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  loader: {
    marginTop: 64,
  },
});

export default ListenBody;
