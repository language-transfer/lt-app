import React, {useState, useCallback} from 'react';
import {StyleSheet, View, Text} from 'react-native';
import {useFocusEffect, useNavigation} from '@react-navigation/native';

import {Icon} from 'react-native-elements';
import {TouchableNativeFeedback} from 'react-native-gesture-handler';
import {
  genMostRecentListenedLessonForCourse,
  genProgressForLesson,
  Progress,
} from '../../persistence';

import CourseData from '../../course-data';

import formatDuration from 'format-duration';
import { MainNavigationProp } from '../App.react';

const getNextLesson = (
  course: Course,
  lastLesson: number,
  progress: Progress,
): number => {
  if (lastLesson === null) {
    return 0;
  }

  if (!progress.finished) {
    return lastLesson;
  }

  const nextLesson = CourseData.getNextLesson(course, lastLesson);
  if (nextLesson === null) {
    return lastLesson;
  }
  return nextLesson;
};

const LanguageHomeTopButton = ({course}: {course: Course}) => {
  const {navigate} = useNavigation<MainNavigationProp<'Language Home'>>();
  const [lastListenState, setLastListenState] = useState<any>(null);

  useFocusEffect(
    useCallback(() => {
      const update = async () => {
        const lesson = await genMostRecentListenedLessonForCourse(course);
        const progress = await genProgressForLesson(course, lesson);

        let nextLesson = getNextLesson(course, lesson!, progress!);

        const progressForThisLesson =
          nextLesson === lesson && progress ? progress.progress : 0;

        setLastListenState({
          nextLesson,
          progressForThisLesson,
        });
      };

      update();
    }, [course]),
  );

  // TODO: kinda temp, but at least it doesn't look awful. should add a loading thingy.
  // just make sure it's the same height as the actual button
  if (lastListenState === null) {
    return <View style={[styles.lessonPlayBox, styles.invisible]}>
      <View style={styles.lessonPlayBoxInner}>
        <View style={styles.textPlayFlex}>
          <Text style={styles.lessonTitle}>
            -
          </Text>
          <Icon name="play" type="font-awesome-5" />
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressMade, { flex: 0 }]} />
          <View
            style={[
              styles.progressLeft,
              { flex: 1 },
            ]}
          />
        </View>
        <View style={styles.progressText}>
          <Text>-</Text>
          <Text>
            -
          </Text>
        </View>
      </View>
    </View>;
  }
  
  const progress = lastListenState.progressForThisLesson;
  const lesson = lastListenState.nextLesson;

  return (
    <View style={styles.lessonPlayBox}>
      <TouchableNativeFeedback
        useForeground={true}
        onPress={() => navigate('Listen', {course, lesson})}>
        <View style={styles.lessonPlayBoxInner}>
          <View style={styles.textPlayFlex}>
            <Text style={styles.lessonTitle}>
              {CourseData.getLessonTitle(course, lesson)}
            </Text>
            <Icon name="play" type="font-awesome-5" />
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressMade, {flex: progress}]} />
            <View
              style={[
                styles.progressLeft,
                {flex: CourseData.getLessonDuration(course, lesson) - progress},
              ]}
            />
          </View>
          <View style={styles.progressText}>
            <Text>{formatDuration((progress || 0) * 1000)}</Text>
            <Text>
              {formatDuration(
                CourseData.getLessonDuration(course, lesson) * 1000,
              )}
            </Text>
          </View>
        </View>
      </TouchableNativeFeedback>
    </View>
  );
};

const styles = StyleSheet.create({
  invisible: {
    opacity: 0,
  },
  lessonPlayBox: {
    margin: 25,
    borderRadius: 10,
    backgroundColor: 'white',
    overflow: 'hidden',
    elevation: 4,
  },
  lessonPlayBoxInner: {
    padding: 25,
  },
  textPlayFlex: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  lessonTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  progressBar: {
    height: 4,
    width: '100%',
    marginTop: 50,
    marginBottom: 15,
    flexDirection: 'row',
  },
  progressMade: {
    height: 4,
    backgroundColor: '#aaa',
  },
  progressLeft: {
    height: 4,
    backgroundColor: '#ddd',
  },
  progressText: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});

export default LanguageHomeTopButton;
