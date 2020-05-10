import React, {useState, useEffect} from 'react';
import {StatusBar} from 'react-native';

import changeNavigationBarColor from 'react-native-navigation-bar-color';
import {FlatList} from 'react-native-gesture-handler';
import LessonRow, {LESSON_ROW_HEIGHT} from './LessonRow.react';

import CourseData from '../../course-data';

const AllLessons = (props) => {
  useEffect(() => {
    return props.navigation.addListener('focus', () => {
      StatusBar.setBackgroundColor('white');
      StatusBar.setBarStyle('dark-content', true);
      changeNavigationBarColor('white', true);
    });
  }, [props.navigation]);

  const {course} = props.route.params;

  const [lastUpdateTime, setLastUpdateTime] = useState(null);
  useEffect(() => {
    return props.navigation.addListener('focus', () =>
      setLastUpdateTime(new Date()),
    );
  }, []);

  return (
    <FlatList
      data={CourseData.getLessonIndices(course)}
      renderItem={({item}) => (
        <LessonRow
          navigation={props.navigation}
          course={course}
          lesson={item}
        />
      )}
      keyExtractor={(lesson) => lesson}
      extraData={course + lastUpdateTime}
      getItemLayout={(_, index) => ({
        length: LESSON_ROW_HEIGHT,
        offset: LESSON_ROW_HEIGHT * index,
        index,
      })}
    />
  );
};

export default AllLessons;
