import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import CourseData from '@/src/data/courseData';
import ListenBody from '@/src/components/listen/ListenBody';
import ListenHeader from '@/src/components/listen/ListenHeader';
import type { Course } from '@/src/types';

const ListenScreen = () => {
  const params = useLocalSearchParams<{ course: string; lesson: string }>();
  const course = (params.course ?? 'spanish') as Course;
  const lesson = Number(params.lesson ?? 0);
  const [ready, setReady] = useState(CourseData.isCourseMetadataLoaded(course));

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
      <ListenBody course={course} lesson={lesson} />
    </View>
  );
};

export default ListenScreen;
