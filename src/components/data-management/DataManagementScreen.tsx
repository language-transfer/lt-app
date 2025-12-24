import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";

import CourseData from "@/src/data/courseData";
import { CourseDownloadManager } from "@/src/services/downloadManager";
import { deleteProgressForCourse } from "@/src/storage/persistence";
import type { CourseName } from "@/src/types";
import { useLogger } from "@/src/utils/log";
import { Pressable } from "react-native-gesture-handler";
const sections: {
  key: string;
  title: (courseTitle: string) => string;
  description: string;
  action: (
    course: CourseName,
    router: ReturnType<typeof useRouter>
  ) => Promise<void>;
  destructive: boolean;
  logAction: string;
  confirmAction?: string;
  dismissAction?: string;
}[] = [
  {
    key: "refresh",
    title: (courseTitle: string) => `Refresh ${courseTitle} metadata`,
    description:
      "This will check to see if new lessons have been added. " +
      "If you're having trouble downloading tracks, try this.",
    action: async (course: CourseName) => {
      await CourseData.loadCourseMetadata(course, true);
      Alert.alert("Metadata refreshed");
    },
    destructive: false, // lil bit
    logAction: "refresh_course_metadata",
  },
  {
    key: "progress",
    title: (courseTitle: string) => `Clear ${courseTitle} progress`,
    description:
      "If you've marked any lessons as finished, this will mark them all unfinished " +
      "and start you back at Lesson 1. It will also forget where you left off in each track.",
    action: async (course: CourseName) => {
      await deleteProgressForCourse(course);
      Alert.alert("Progress deleted.");
    },
    destructive: true,
    logAction: "delete_course_progress",
    confirmAction: "delete_course_progress_confirm",
    dismissAction: "delete_course_progress_explicit_dismiss",
  },
  {
    key: "finished-downloads",
    title: (courseTitle: string) => `Delete finished ${courseTitle} downloads`,
    description:
      "If you have downloaded lessons that you've finished listening to, " +
      "this will delete those downloads.",
    action: async (course: CourseName) => {
      await CourseDownloadManager.unrequestAllFinishedDownloadsForCourse(
        course
      );
      Alert.alert("Finished downloads deleted.");
    },
    destructive: false,
    logAction: "delete_finished_course_downloads",
    confirmAction: "delete_finished_course_downloads_confirm",
    dismissAction: "delete_finished_course_downloads_explicit_dismiss",
  },
  {
    key: "all-downloads",
    title: (courseTitle: string) => `Delete all ${courseTitle} downloads`,
    description:
      "This will delete all lessons you've downloaded.",
    action: async (course: CourseName) => {
      // TODO: this probably ought to cancel in-progress downloads too
      await CourseDownloadManager.unrequestAllDownloadsForCourse(course);
      Alert.alert("All downloads deleted.");
    },
    destructive: true,
    logAction: "delete_course_downloads",
    confirmAction: "delete_course_downloads_confirm",
    dismissAction: "delete_course_downloads_explicit_dismiss",
  },
  {
    key: "all-data",
    title: (courseTitle: string) => `Delete all ${courseTitle} data`,
    description:
      "This will clear your progress, delete all downloads, " +
      "and remove its metadata from your device.",
    action: async (
      course: CourseName,
      router: ReturnType<typeof useRouter>
    ) => {
      // TODO
      // DownloadManager.stopAllDownloadsForCourse(course);
      await Promise.all([
        deleteProgressForCourse(course),
        CourseDownloadManager.unrequestAllDownloadsForCourse(course),
      ]);
      await CourseData.loadCourseMetadata(course, true);
      router.replace("/");
      Alert.alert("All course data deleted.");
    },
    destructive: true,
    logAction: "delete_all_course_data",
    confirmAction: "delete_all_course_data_confirm",
    dismissAction: "delete_all_course_data_explicit_dismiss",
  },
];

const DataManagementScreen = () => {
  const params = useLocalSearchParams<{ course: string }>();
  const course = (params.course ?? "spanish") as CourseName;
  const router = useRouter();
  const title = CourseData.getCourseShortTitle(course);
  const log = useLogger({
    surface: "data_management",
  });

  const confirm = (messageTitle: string) =>
    new Promise((done) =>
      Alert.alert(
        messageTitle,
        "Are you sure you want to delete this data?",
        [
          {
            text: "No",
            style: "cancel",
            onPress: () => done(false),
          },
          { text: "Yes", onPress: () => done(true) },
        ],
        { cancelable: true }
      )
    );

  return (
    <ScrollView style={styles.body}>
      <View style={styles.container}>
        {sections.map((section) => (
          <Pressable
            key={section.key}
            style={styles.card}
            onPress={async () => {
              log({
                action: section.logAction,
              }).then();
              if (section.destructive) {
                const confirmed = await confirm(section.title(title));
                if (!confirmed) {
                  if (section.dismissAction) {
                    log({
                      action: section.dismissAction,
                    }).then();
                  }
                  return;
                }
                if (section.confirmAction) {
                  log({
                    action: section.confirmAction,
                  }).then();
                }
              }
              await section.action(course, router);
            }}
          >
            <Text style={styles.cardTitle}>{section.title(title)}</Text>
            <Text style={styles.cardDescription}>{section.description}</Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  body: {
    flex: 1,
  },
  container: {
    paddingVertical: 20,
  },
  card: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 12,
    backgroundColor: "#fff",
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 15,
    color: "#555",
  },
});

export default DataManagementScreen;
