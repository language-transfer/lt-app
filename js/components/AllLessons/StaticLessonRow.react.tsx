import React from 'react';
import {View, Text, StyleSheet, TouchableNativeFeedback} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {LanguageStackScreenProps} from '../Nav/LanguageNav.react';

import {Icon} from 'react-native-elements';
import formatDuration from 'format-duration';
import CourseData from '../../course-data';
import {LESSON_ROW_HEIGHT} from './LessonRow.react';

const StaticLessonRow = ({
  course,
  lesson,
}: {
  course: Course;
  lesson: number;
  lastUpdateTime: Date | null;
}) => {
  const {navigate} = useNavigation<LanguageStackScreenProps>();

  return (
    <View style={styles.row}>
      <TouchableNativeFeedback
        onPress={() => {
          navigate('Listen', {lesson});
        }}>
        <View style={styles.lessonBox}>
          <View style={styles.text}>
            <Icon
              style={styles.finishedIcon}
              name="check"
              type="font-awesome-5"
              accessibilityLabel={'finished'}
              size={24}
            />
            <Text style={styles.lessonTitleText}>
              {CourseData.getLessonTitle(course, lesson)}
            </Text>
            <Text style={styles.lessonDurationText}>
              {formatDuration(
                CourseData.getLessonDuration(course, lesson) * 1000,
              )}
            </Text>
          </View>
        </View>
      </TouchableNativeFeedback>
      <View style={styles.downloadBox} />
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
  },
  lessonBox: {
    paddingHorizontal: 20,
    backgroundColor: 'white',
    borderBottomColor: '#ccc',
    borderBottomWidth: 1,
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  downloadBox: {
    width: LESSON_ROW_HEIGHT,
    height: LESSON_ROW_HEIGHT,
    backgroundColor: 'white',
    borderColor: '#ccc',
    borderBottomWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lessonTitleText: {
    fontSize: 22,
    fontWeight: 'bold',
    marginRight: 24,
  },
  lessonDurationText: {
    fontSize: 16,
  },

  finishedIcon: {
    marginRight: 24,
  },
});

export default StaticLessonRow;
