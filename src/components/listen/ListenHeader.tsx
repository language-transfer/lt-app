import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import CourseData from '@/src/data/courseData';
import type { Course } from '@/src/types';

type Props = {
  course: Course;
};

const ListenHeader = ({ course }: Props) => {
  const router = useRouter();
  const colors = CourseData.getCourseUIColors(course);

  return (
    <View style={[styles.header, { backgroundColor: colors.background }]}>
      <Pressable
        accessibilityLabel="Go back"
        accessibilityRole="button"
        android_ripple={{ color: 'rgba(0, 0, 0, 0.08)', borderless: true }}
        hitSlop={10}
        onPress={() => router.back()}
        style={styles.backButton}
      >
        <FontAwesome5 name="arrow-left" size={18} color={colors.text} />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingTop: 40,
    paddingHorizontal: 16,
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ListenHeader;
