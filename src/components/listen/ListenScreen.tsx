import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';

import CourseData from '@/src/data/courseData';
import ListenBody from '@/src/components/listen/ListenBody';
import ListenHeader from '@/src/components/listen/ListenHeader';
import type { Course } from '@/src/types';
import { useSetStatusBarStyle } from '@/src/hooks/useStatusBarStyle';

const ListenScreen = () => {
  const params = useLocalSearchParams<{ course: string; lesson: string }>();
  const course = (params.course ?? 'spanish') as Course;
  const lesson = Number(params.lesson ?? 0);
  const [ready, setReady] = useState(CourseData.isCourseMetadataLoaded(course));
  const setStatusBarStyle = useSetStatusBarStyle();
  const isFocused = useIsFocused();

  useEffect(() => {
    setReady(CourseData.isCourseMetadataLoaded(course));
  }, [course]);

  useEffect(() => {
    let mounted = true;
    if (!ready) {
      CourseData.genLoadCourseMetadata(course).then(() => {
        if (mounted) {
          setReady(true);
        }
      });
    }
    return () => {
      mounted = false;
    };
  }, [course, ready]);

  useEffect(() => {
    if (!ready) {
      return;
    }
    const colors = CourseData.getCourseUIColors(course);
    const barStyle = colors.text === 'black' ? 'dark-content' : 'light-content';
    setStatusBarStyle(colors.background, barStyle);
  }, [course, ready, setStatusBarStyle]);

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <ListenHeader course={course} />
      <ListenBody course={course} lesson={lesson} isActive={Boolean(isFocused)} />
    </View>
  );
};

export default ListenScreen;
