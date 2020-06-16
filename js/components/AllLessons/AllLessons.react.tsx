import React, {useState, useCallback} from 'react';
import {useFocusEffect} from '@react-navigation/native';
import {FlatList} from 'react-native-gesture-handler';
import LessonRow, {LESSON_ROW_HEIGHT} from './LessonRow.react';
import useStatusBarStyle from '../../hooks/useStatusBarStyle';
import CourseData from '../../course-data';
import {useCourseContext} from '../Context/CourseContext';

const AllLessons = () => {
  useStatusBarStyle('white', 'dark-content');
  const {course} = useCourseContext();
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  useFocusEffect(
    useCallback(() => {
      setLastUpdateTime(new Date());
    }, []),
  );

  return (
    <FlatList
      data={CourseData.getLessonIndices(course)}
      renderItem={({item}) => (
        <LessonRow
          course={course}
          lesson={item}
          lastUpdateTime={lastUpdateTime}
        />
      )}
      keyExtractor={(lesson) => String(lesson)}
      getItemLayout={(_, index) => ({
        length: LESSON_ROW_HEIGHT,
        offset: LESSON_ROW_HEIGHT * index,
        index,
      })}
    />
  );
};

export default AllLessons;
