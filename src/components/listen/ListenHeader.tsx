import React from 'react';
import { StyleSheet, View } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import CourseData from '@/src/data/courseData';
import type { Course } from '@/src/types';

type Props = {
  course: Course;
};

const ListenHeader = ({ course }: Props) => {
  const router = useRouter();
  return (
    <View style={[styles.header, { backgroundColor: CourseData.getCourseUIColors(course).background }]}>
      <View style={styles.backButtonContainer}>
        <FontAwesome5.Button
          name="arrow-left"
          backgroundColor="transparent"
          color={CourseData.getCourseUIColors(course).text}
          onPress={() => router.back()}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingTop: 40,
    paddingHorizontal: 16,
  },
  backButtonContainer: {
    width: 48,
  },
});

export default ListenHeader;
