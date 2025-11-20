import React from 'react';
import { ImageBackground, StyleSheet, Text, View } from 'react-native';
import { TouchableNativeFeedback } from 'react-native-gesture-handler';

import CourseData from '@/src/data/courseData';
import type { Course } from '@/src/types';

type Props = {
  course: Course;
  onPress: () => void;
};

const LanguageButton = ({ course, onPress }: Props) => {
  const info = CourseData.getCourseData(course);

  return (
    <View style={styles.sectionWrapper}>
      <ImageBackground
        source={info.image}
        style={[
          styles.imageBackground,
          { backgroundColor: CourseData.getCourseUIColors(course).softBackground },
        ]}
        imageStyle={styles.image}
      >
        <View style={styles.rippleWrapper}>
          <TouchableNativeFeedback onPress={onPress} useForeground>
            <View style={styles.sectionContainer}>
              <Text
                style={[
                  styles.courseType,
                  { color: CourseData.getCourseUIColors(course).backgroundAccent },
                ]}
              >
                {info.courseType}
              </Text>
              <Text style={styles.courseTitle}>{info.shortTitle}</Text>
              <Text style={styles.courseDetails}>{info.fallbackLessonCount} lessons</Text>
            </View>
          </TouchableNativeFeedback>
        </View>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  sectionWrapper: {
    width: 150,
    height: 200,
    margin: 15,
  },
  sectionContainer: {
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    fontWeight: '600',
    paddingTop: 40,
    paddingBottom: 10,
    width: '100%',
    height: '100%',
  },
  imageBackground: {
    borderRadius: 10,
    elevation: 3,
  },
  rippleWrapper: {
    overflow: 'hidden',
    borderRadius: 10,
  },
  image: {
    borderRadius: 10,
    width: 140,
    height: 140,
    top: 5,
    left: 5,
  },
  courseType: {
    fontSize: 14,
    // color: 'rgba(0, 0, 0, 0.5)',
    lineHeight: 14,
    textTransform: 'uppercase',
  },
  courseTitle: {
    fontSize: 28,
    lineHeight: 32,
    fontWeight: 'bold',
    color: 'black',
    textAlign: 'center',
  },
  courseDetails: {
    fontSize: 16,
    color: 'black',
  },
});

export default LanguageButton;
