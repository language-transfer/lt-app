import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet, TouchableNativeFeedback} from 'react-native';
import {genProgressForLesson} from '../../persistence';
import {Icon} from 'react-native-elements';
import formatDuration from 'format-duration';
import CourseData from '../../course-data';
import {LESSON_ROW_HEIGHT} from './LessonRow.react';
import { useNavigation } from '@react-navigation/core';
import { MainNavigationProp } from '../App.react';

const StaticLessonRow = ({
  course,
  lesson,
}: {
  course: Course;
  lesson: number;
  lastUpdateTime: Date | null;
}) => {
  const [finished, setFinished] = useState<boolean>(null!);
  const {navigate} = useNavigation<MainNavigationProp<'All Lessons'>>();

  useEffect(() => {
    (async () => {
      const progressResp = await genProgressForLesson(course, lesson);
      setFinished(progressResp?.finished || false);
    })();
  }, [course, lesson]);

  return (
    <View style={styles.row}>
      <TouchableNativeFeedback
        onPress={() => {
          navigate('Listen', {course, lesson});
        }}>
        <View style={styles.lessonBox}>
          <View style={styles.text}>
            <Icon
              style={{
                ...styles.finishedIcon,
                ...(finished ? {} : {opacity: 0}),
              }}
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
