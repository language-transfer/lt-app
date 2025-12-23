import { FontAwesome5 } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import formatDuration from "format-duration";
import React, { useCallback, useState } from "react";
import {
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import CourseData from "@/src/data/courseData";
import { useCurrentCourseColors } from "@/src/hooks/useCourseLessonData";
import {
  genMostRecentListenedLessonForCourse,
  genPreferenceRatingButtonDismissed,
  genProgressForLesson,
  genSetPreferenceRatingButtonDismissed,
} from "@/src/storage/persistence";
import type { CourseName, Progress } from "@/src/types";
import { log } from "@/src/utils/log";

type Props = {
  course: CourseName;
};

const getNextLesson = (
  course: CourseName,
  lastLesson: number | null,
  progress: Progress | null
) => {
  if (lastLesson === null || progress === null) {
    return 0;
  }

  if (!progress.finished) {
    return lastLesson;
  }

  const next = CourseData.getNextLesson(course, lastLesson);
  return next === null ? lastLesson : next;
};

const LanguageHomeTopButton = ({ course }: Props) => {
  const router = useRouter();
  const [state, setState] = useState<{
    nextLesson: number;
    progressForThisLesson: number;
  } | null>(null);
  const [ratingDismissed, setRatingDismissed] = useState<boolean | null>(null);
  const colors = useCurrentCourseColors();

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      const load = async () => {
        const lesson = await genMostRecentListenedLessonForCourse(course);
        const [progressValue, ratingPref] = await Promise.all([
          genProgressForLesson(course, lesson),
          genPreferenceRatingButtonDismissed(),
        ]);

        if (!mounted) {
          return;
        }

        const targetLesson = getNextLesson(course, lesson, progressValue);
        const progressForLesson =
          targetLesson === lesson && progressValue
            ? progressValue.progress || 0
            : 0;
        setState({
          nextLesson: targetLesson ?? 0,
          progressForThisLesson: progressForLesson,
        });
        setRatingDismissed(Boolean(ratingPref.dismissed));
      };

      load();
      return () => {
        mounted = false;
      };
    }, [course])
  );

  if (!state || ratingDismissed === null) {
    return <View style={[styles.lessonPlayBox, styles.invisible]} />;
  }

  const nextLessonTitle = CourseData.getLessonTitle(course, state.nextLesson);
  const lessonDuration = CourseData.getLessonDuration(course, state.nextLesson);
  const hasPrompt =
    Platform.OS === "android" && state.nextLesson + 1 >= 10 && !ratingDismissed;

  return (
    <View style={styles.lessonPlayBox}>
      <Pressable
        android_ripple={{ color: "rgba(0,0,0,0.1)" }}
        onPress={() =>
          router.push({
            pathname: "/course/[course]/listen/[lesson]",
            params: { course, lesson: state.nextLesson.toString() },
          })
        }
      >
        <View style={styles.lessonPlayBoxInner}>
          <View style={styles.textPlayFlex}>
            <Text style={styles.lessonTitle}>{nextLessonTitle}</Text>
            <FontAwesome5 name="play" size={18} />
          </View>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressMade,
                { flex: state.progressForThisLesson },
                { backgroundColor: colors?.background },
              ]}
            />
            <View
              style={[
                styles.progressLeft,
                {
                  flex: Math.max(
                    0,
                    lessonDuration - state.progressForThisLesson
                  ),
                },
              ]}
            />
          </View>
          <View style={styles.progressText}>
            <Text>
              {formatDuration((state.progressForThisLesson || 0) * 1000)}
            </Text>
            <Text>{formatDuration(lessonDuration * 1000)}</Text>
          </View>
        </View>
      </Pressable>
      {hasPrompt ? (
        <View style={styles.ratingBanner}>
          <Text style={styles.ratingPrompt}>
            Help people find Language Transfer!
          </Text>
          <Pressable
            style={styles.ratingButton}
            onPress={() => {
              log({
                action: "open_google_play",
                surface: "rate_button",
              });
              genSetPreferenceRatingButtonDismissed({
                dismissed: true,
                surface: "LanguageHomeTopButton",
                explicit: false,
                time: Date.now(),
              }).then();
              setRatingDismissed(true);
              Linking.openURL(
                "https://play.google.com/store/apps/details?id=org.languagetransfer"
              );
            }}
          >
            <FontAwesome5 name="star" size={14} color="#fff" />
            <Text style={styles.ratingButtonText}>Rate</Text>
          </Pressable>
          <Pressable
            style={styles.dismissButton}
            onPress={async () => {
              await genSetPreferenceRatingButtonDismissed({
                dismissed: true,
                surface: "LanguageHomeTopButton",
                explicit: true,
                time: Date.now(),
              });
              setRatingDismissed(true);
            }}
          >
            <FontAwesome5 name="times" size={12} color="#fff" />
          </Pressable>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  invisible: {
    opacity: 0,
    height: 160,
  },
  lessonPlayBox: {
    margin: 25,
    borderRadius: 10,
    backgroundColor: "white",
    elevation: 3,
    overflow: "hidden",
  },
  lessonPlayBoxInner: {
    paddingHorizontal: 25,
    paddingVertical: 20,
  },
  textPlayFlex: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  lessonTitle: {
    fontSize: 24,
    fontWeight: "700",
    flexShrink: 1,
    paddingRight: 12,
  },
  progressBar: {
    flexDirection: "row",
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
    backgroundColor: "#ddd",
    marginTop: 36,
  },
  progressMade: {
    backgroundColor: "#2980b9",
  },
  progressLeft: {
    backgroundColor: "#eee",
  },
  progressText: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
    fontVariant: ["tabular-nums"],
  },
  ratingBanner: {
    backgroundColor: "#0289ee",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  ratingPrompt: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 13,
    flex: 1,
  },
  ratingButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  ratingButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 13,
  },
  dismissButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    // backgroundColor: 'rgba(255,255,255,0.3)',
  },
});

export default LanguageHomeTopButton;
