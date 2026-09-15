import React from "react";
import { ImageBackground, StyleSheet, Text, View } from "react-native";
import { TouchableNativeFeedback } from "react-native-gesture-handler";

import CourseData from "@/src/data/courseData";
import { useCourseIndex } from "@/src/data/courseIndex";
import { SourceLanguage, type CourseName, type CourseType } from "@/src/types";

type Props = {
  course: CourseName;
  width: number;
  onPress: () => void;
};

const BUTTON_IMAGE_PADDING = 5;

const COURSE_BADGES: Record<
  SourceLanguage,
  Record<CourseType, { label: string; afterTitle: boolean }>
> = {
  [SourceLanguage.ENGLISH]: {
    intro: { label: "intro", afterTitle: false },
    complete: { label: "complete", afterTitle: false },
  },
  [SourceLanguage.SPANISH]: {
    intro: { label: "introducción a", afterTitle: false },
    complete: { label: "completo", afterTitle: true },
  },
};

const LanguageButton = ({ course, width, onPress }: Props) => {
  const imageSize = width - 2 * BUTTON_IMAGE_PADDING;

  const info = CourseData.getCourseData(course);
  const colors = CourseData.getCourseUIColors(course);
  const { data: index } = useCourseIndex();
  const lessonCount =
    index?.courses.find((entry) => entry.id === course)?.lessons ??
    info.fallbackLessonCount;
  const badge = COURSE_BADGES[info.sourceLanguage][info.courseType];
  const title = <Text style={styles.courseTitle}>{info.shortTitle}</Text>;
  const accessibleTitle = badge.afterTitle
    ? `${info.shortTitle} ${badge.label}`
    : `${badge.label} ${info.shortTitle}`;

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
          <TouchableNativeFeedback
            accessibilityLabel={`${accessibleTitle}${
              lessonCount ? `, ${lessonCount} lessons` : ""
            }`}
            accessibilityRole="button"
            onPress={onPress}
            useForeground
          >
            <View style={styles.sectionContainer}>
              {badge.afterTitle ? title : null}
              <Text
                style={[
                  styles.courseType,
                  badge.afterTitle && styles.courseTypeAfterTitle,
                  {
                    color: colors.backgroundAccent,
                  },
                ]}
              >
                {badge.label}
              </Text>
              {badge.afterTitle ? null : title}
              {lessonCount ? (
                <Text style={styles.courseDetails}>{lessonCount} lessons</Text>
              ) : null}
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
  courseTypeAfterTitle: {
    marginTop: 4,
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
