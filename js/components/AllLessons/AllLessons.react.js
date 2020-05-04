import React, {useState, useEffect} from 'react';
import {View, Text, StatusBar} from 'react-native';

import changeNavigationBarColor from 'react-native-navigation-bar-color';
import {ScrollView} from 'react-native-gesture-handler';
import LessonRow from './LessonRow.react';

import languageData from '../../../languageData';
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

  const [lessonData, setLessonData] = useState(null);
  const [lastDownloadUpdate, setLastDownloadUpdate] = useState(null);

  useEffect(() => {
    const update = async () => {
      const [progress, downloads] = await Promise.all([
        Promise.all(
          languageData[course].meta.lessons.map((_, lesson) =>
            genProgressForLesson(course, lesson),
          ),
        ),
        Promise.all(
          languageData[course].meta.lessons.map((_, lesson) =>
            DownloadManager.genIsDownloaded(course, lesson),
          ),
        ),
      ]);

      setLessonData({progress, downloads});
    };

    update();

    props.navigation.addListener('focus', update);
  }, [setLessonData, lastDownloadUpdate, props.navigation]);

  if (lessonData === null) {
    return null; // TODO do we need a loading indicator here? or is it fast enough
  }

  return (
    <ScrollView>
      {languageData[course].meta.lessons.map((lessonObj, lesson) => (
        <LessonRow
          navigation={props.navigation}
          course={course}
          lessonObj={lessonObj}
          lesson={lesson}
          progress={lessonData.progress[lesson]}
          downloaded={lessonData.downloads[lesson]}
          key={lesson}
          // just something to force a re-render. this is the first react
          // app I've built in a long time without redux/context lol
          updateDownloadState={() => setLastDownloadUpdate(new Date())}
        />
      ))}
    </ScrollView>
  );
};

export default AllLessons;
