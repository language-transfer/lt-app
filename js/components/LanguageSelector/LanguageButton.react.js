import React from 'react';
import {
  SafeAreaView,
  StyleSheet,
  ScrollView,
  View,
  Text,
  StatusBar,
  Image,
  Button,
  ImageBackground,
} from 'react-native';

import CourseData from '../../course-data';
import {TouchableNativeFeedback} from 'react-native-gesture-handler';

const LanguageButton = (props) => {
  const lessonCount = CourseData.getFallbackLessonCount(props.course);

  return (
    <View style={styles.sectionWrapper}>
      <ImageBackground
        source={CourseData.getCourseImage(props.course)}
        style={styles.imageBackground}
        imageStyle={styles.image}>
        <View style={styles.rippleWrapper}>
          <TouchableNativeFeedback onPress={props.onPress} useForeground={true}>
            <View style={styles.sectionContainer}>
              <Text style={styles.courseTitle}>
                {CourseData.getCourseTitle(props.course)}
              </Text>
              <Text style={styles.courseDetails}>
                {/* TODO: figure out what to do about these numbers. probably hardcode them with icons and such, but use up-to-date meta and only hardcoded numbers as a fallback */}
                {lessonCount} lessons
              </Text>
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
    height: 175,
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
    backgroundColor: 'white',
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
  },
});

export default LanguageButton;
