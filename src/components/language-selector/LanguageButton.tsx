import React from "react";
import { ImageBackground, StyleSheet, Text, View } from "react-native";
import { TouchableNativeFeedback } from "react-native-gesture-handler";

import CourseData from "@/src/data/courseData";
import type { CourseName } from "@/src/types";

type Props = {
  course: CourseName;
  width: number;
  onPress: () => void;
};

const BUTTON_IMAGE_PADDING = 5;

const LanguageButton = ({ course, width, onPress }: Props) => {
  const imageSize = width - 2 * BUTTON_IMAGE_PADDING;

  const info = CourseData.getCourseData(course);
  const colors = CourseData.getCourseUIColors(course);

  return (
    <View style={[styles.sectionWrapper, { width, height: width + 50 }]}>
      <ImageBackground
        source={info.image}
        style={[
          styles.imageBackground,
          {
            backgroundColor: colors.softBackground,
          },
        ]}
        imageStyle={[
          styles.image,
          {
            width: imageSize,
            height: imageSize,
          },
        ]}
      >
        <View style={styles.rippleWrapper}>
          <TouchableNativeFeedback onPress={onPress} useForeground>
            <View style={styles.sectionContainer}>
              <Text
                style={[
                  styles.courseType,
                  {
                    color: colors.backgroundAccent,
                  },
                ]}
              >
                {info.courseType}
              </Text>
              <Text style={styles.courseTitle}>{info.shortTitle}</Text>
              <Text style={styles.courseDetails}>
                {info.fallbackLessonCount} lessons
              </Text>
            </View>
          </TouchableNativeFeedback>
        </View>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  sectionWrapper: {},
  sectionContainer: {
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
    fontWeight: "600",
    paddingTop: 40,
    paddingBottom: 10,
    width: "100%",
    height: "100%",
  },
  imageBackground: {
    borderRadius: 10,
    elevation: 3,
  },
  rippleWrapper: {
    overflow: "hidden",
    borderRadius: 10,
  },
  image: {
    borderRadius: 10,
    top: BUTTON_IMAGE_PADDING,
    left: BUTTON_IMAGE_PADDING,
  },
  courseType: {
    fontSize: 14,
    // color: 'rgba(0, 0, 0, 0.5)',
    lineHeight: 14,
    textTransform: "uppercase",
  },
  courseTitle: {
    fontSize: 28,
    lineHeight: 32,
    fontWeight: "bold",
    color: "black",
    textAlign: "center",
  },
  courseDetails: {
    fontSize: 16,
    color: "black",
  },
});

export default LanguageButton;
