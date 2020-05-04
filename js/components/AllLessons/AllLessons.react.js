import React, {useState, useEffect} from 'react';
import {View, Text, StatusBar} from 'react-native';

import changeNavigationBarColor from 'react-native-navigation-bar-color';
import {ScrollView} from 'react-native-gesture-handler';
import LessonRow from './LessonRow.react';

import CourseData from '../../course-data';
import {genProgressForLesson} from '../../persistence';
import DownloadManager from '../../download-manager';

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

  // useEffect(() => {
  //   const update = async () => {
  //     const [progress, downloads] = await Promise.all([
  //       Promise.all(
  //         CourseData.getLessonIndices(course).map((lesson) =>
  //           genProgressForLesson(course, lesson),
  //         ),
  //       ),
  //       Promise.all(
  //         CourseData.getLessonIndices(course).map((lesson) =>
  //           DownloadManager.genIsDownloaded(course, lesson),
  //         ),
  //       ),
  //     ]);

  //     setLessonData({progress, downloads});
  //   };

  //   update();

  //   props.navigation.addListener('focus', update); TODO
  // }, [setLessonData, lastDownloadUpdate, props.navigation]);

  // if (lessonData === null) {
  //   return null; // TODO do we need a loading indicator here? or is it fast enough (yes we need a loading indicator)
  // }

  return (
    <ScrollView>
      {CourseData.getLessonIndices(course).map((lesson) => (
        <LessonRow
          navigation={props.navigation}
          course={course}
          lesson={lesson}
          lastUpdateTime={lastUpdateTime}
          key={lesson}
        />
      ))}
    </ScrollView>
  );
};

export default AllLessons;
