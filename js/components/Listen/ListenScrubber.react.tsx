import React from 'react';
import {StyleSheet, View, Text} from 'react-native';
import {useProgress} from 'react-native-track-player';
import formatDuration from 'format-duration';
import {useCourseContext} from '../Context/CourseContext';
import {useLessonContext} from '../Context/LessonContext';

const ListenScrubber = () => {
  const {courseData} = useCourseContext();
  const {lessonData} = useLessonContext();
  const {position} = useProgress(200);

  return (
    <View style={styles.scrubber}>
      <View style={styles.progressBar}>
        <View
          style={[
            styles.progressMade,
            {
              flex: position,
              backgroundColor: courseData.uiColors.text,
            },
          ]}
        />
        <View
          style={[
            styles.progressLeft,
            // eslint-disable-next-line react-native/no-inline-styles
            {
              flex:
                lessonData.duration === null
                  ? 1
                  : lessonData.duration - position,
              backgroundColor: courseData.uiColors.backgroundAccent,
            },
          ]}
        />
      </View>
      <View style={styles.progressTextContainer}>
        <Text
          style={{
            color: courseData.uiColors.text,
          }}>
          {formatDuration(position * 1000)}
        </Text>
        <Text
          style={{
            color: courseData.uiColors.text,
          }}>
          {/* downloaded metadata should be fine for track duration, since it can't
            get out of sync if we don't reuse filenames (IDs) */}
          {formatDuration(lessonData.duration * 1000)}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  scrubber: {},
  progressBar: {
    height: 4,
    width: '100%',
    marginBottom: 15,
    flexDirection: 'row',
  },
  progressMade: {
    height: 4,
  },
  progressLeft: {
    height: 4,
  },
  progressTextContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});

export default ListenScrubber;
