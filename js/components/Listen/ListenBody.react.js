import React, {useRef, useState, useEffect} from 'react';
import {
  StyleSheet,
  View,
  Text,
  StatusBar,
  Dimensions,
  ActivityIndicator,
} from 'react-native';

import {Icon} from 'react-native-elements';
import {TouchableNativeFeedback} from 'react-native-gesture-handler';
import RBSheet from 'react-native-raw-bottom-sheet';

import ListenBottomSheet from './ListenBottomSheet.react';

import CourseData from '../../course-data';
import ListenScrubber from './ListenScrubber.react';
import DownloadManager from '../../download-manager';

import TrackPlayer from 'react-native-track-player';
import {log} from '../../metrics';

const ListenBody = (props) => {
  const bottomSheet = useRef();

  const {course, lesson} = props.route.params;

  const [downloaded, setDownloaded] = useState(null);
  useEffect(() => {
    (async () => {
      const downloaded = await DownloadManager.genIsDownloaded(course, lesson);
      setDownloaded(downloaded);
    })();
  }, []);

  if (downloaded === null) {
    return (
      <ActivityIndicator
        size={64}
        style={{marginTop: 64}}
        color={CourseData.getCourseUIColors(course).text}
      />
    );
  }

  const styles = StyleSheet.create({
    body: {
      backgroundColor: CourseData.getCourseUIColors(course).background,
      height:
        // 56 + SB.height is the header. 48 is the bottom nav height
        Dimensions.get('screen').height - (56 + StatusBar.currentHeight) - 48,
      alignItems: 'center',
      justifyContent: 'space-around',
    },

    lessonName: {
      alignItems: 'center',
    },

    courseTitle: {
      fontWeight: 'bold',
      fontSize: 48,
      color: CourseData.getCourseUIColors(course).text,
    },
    lesson: {
      fontSize: 32,
      color: CourseData.getCourseUIColors(course).text,
    },

    icons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      width: '100%',
      paddingHorizontal: '10%',
      alignItems: 'center',
    },

    scrubber: {
      paddingHorizontal: '10%',
    },
    progressBar: {
      height: 4,
      width: '100%',
      marginBottom: 15,
      flexDirection: 'row',
    },
    progressMade: {
      height: 4,
      flex: 2 * 60 + 40,
      backgroundColor: CourseData.getCourseUIColors(course).text,
    },
    progressLeft: {
      height: 4,
      flex: 7 * 60 + 2 - (2 * 60 + 40),
      backgroundColor: CourseData.getCourseUIColors(course).backgroundAccent,
    },
    progressTextContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    progressText: {
      color: CourseData.getCourseUIColors(course).text,
    },

    bottomButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      width: '100%',
      paddingHorizontal: '10%',
      alignItems: 'center',
    },

    bottomButton: {
      maxWidth: 72,
    },
  });

  return (
    <>
      <View style={styles.body}>
        <View style={styles.lessonName}>
          <Text style={styles.courseTitle}>
            {CourseData.getCourseShortTitle(course)}
          </Text>
          <Text style={styles.lesson}>
            {CourseData.getLessonTitle(course, lesson)}
          </Text>
        </View>

        <View style={styles.icons}>
          <TouchableNativeFeedback
            background={TouchableNativeFeedback.Ripple(null, true)}
            onPress={props.skipBack}>
            <Icon
              name="replay-10"
              type="material"
              accessibilityLabel="skip backwards ten seconds"
              size={72}
              color={CourseData.getCourseUIColors(course).text}
            />
          </TouchableNativeFeedback>
          {props.ready ? (
            <TouchableNativeFeedback
              background={TouchableNativeFeedback.Ripple(null, true)}
              onPress={props.toggle}>
              <Icon
                name={props.playing ? 'pause' : 'play-arrow'}
                accessibilityLabel={props.playing ? 'pause' : 'play'}
                type="material"
                size={172}
                color={CourseData.getCourseUIColors(course).text}
              />
            </TouchableNativeFeedback>
          ) : (
            <ActivityIndicator
              size={172}
              color={CourseData.getCourseUIColors(course).text}
            />
          )}
          <TouchableNativeFeedback
            background={TouchableNativeFeedback.Ripple(null, true)}
            onPress={() => {
              bottomSheet.current.open();
            }}>
            <Icon
              name="settings"
              type="material"
              accessibilityLabel="other actions for this lesson"
              size={72}
              color={CourseData.getCourseUIColors(course).text}
            />
          </TouchableNativeFeedback>
        </View>

        <ListenScrubber
          colors={CourseData.getCourseUIColors(course)}
          course={course}
          lesson={lesson}
          playing={props.playing}
        />
      </View>
      <RBSheet
        ref={bottomSheet}
        height={downloaded ? 236 : 164}
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
          props.setBottomSheetOpen(true);
        }}
        onClose={async () => {
          log({
            action: 'close_bottom_sheet',
            surface: 'listen_screen',
            course,
            lesson,
            position: await TrackPlayer.getPosition(),
          });
          props.setBottomSheetOpen(false);
        }}>
        <ListenBottomSheet
          course={course}
          lesson={lesson}
          navigation={props.navigation}
          downloaded={downloaded}
          onClose={() => props.setBottomSheetOpen(false)}
        />
      </RBSheet>
    </>
  );
};

export default ListenBody;
