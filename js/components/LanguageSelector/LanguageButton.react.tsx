import React from 'react';
import {StyleSheet, View, Text, ImageBackground} from 'react-native';

import CourseData from '../../course-data';
import {TouchableNativeFeedback} from 'react-native-gesture-handler';

interface IProps {
  course: Course;
  onPress: () => void;
}

const LanguageButton = ({course, onPress}: IProps) => {
  const lessonCount = CourseData.getFallbackLessonCount(course);

  return (
    <View style={styles.sectionWrapper}>
      <ImageBackground
        source={CourseData.getCourseImage(course)}
        style={{
          ...styles.imageBackground,
          backgroundColor: CourseData.getCourseUIColors(course).softBackground,
        }}
        imageStyle={styles.image}>
        <View style={styles.rippleWrapper}>
          <TouchableNativeFeedback onPress={onPress} useForeground={true}>
            <View style={styles.sectionContainer}>
              <Text style={styles.courseTitle}>
                {CourseData.getCourseShortTitle(course)}
              </Text>
              <Text style={styles.courseDetails}>{lessonCount} lessons</Text>
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
    height: 185,
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
  courseTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'black',
  },
  courseDetails: {
    fontSize: 16,
    color: 'black',
  },
});

export default LanguageButton;