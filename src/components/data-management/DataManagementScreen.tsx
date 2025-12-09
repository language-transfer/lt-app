import React from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import CourseData from "@/src/data/courseData";
import DownloadManager from "@/src/services/downloadManager";
import { genDeleteProgressForCourse } from "@/src/storage/persistence";
import type { Course } from "@/src/types";
import { Pressable } from "react-native-gesture-handler";

const sections: {
  key: string;
  title: (courseTitle: string) => string;
  description: string;
  action: (
    course: Course,
    router: ReturnType<typeof useRouter>
  ) => Promise<void>;
  destructive: boolean;
}[] = [
  {
    key: "refresh",
    title: (courseTitle: string) => `Refresh ${courseTitle} metadata`,
    description:
      "Reload the lesson list in case new tracks have been published.",
    action: async (course: Course) => {
      await CourseData.genLoadCourseMetadata(course, true);
      Alert.alert("Metadata refreshed");
    },
    destructive: false,
  },
  {
    key: "progress",
    title: (courseTitle: string) => `Delete ${courseTitle} progress`,
    description:
      "Marks every lesson as unfinished and forgets where you left off.",
    action: async (course: Course) => {
      await genDeleteProgressForCourse(course);
      Alert.alert("Progress deleted.");
    },
    destructive: true,
  },
  {
    key: "finished-downloads",
    title: (courseTitle: string) => `Delete finished ${courseTitle} downloads`,
    description: "Removes downloaded lessons you have marked as finished.",
    action: async (course: Course) => {
      await DownloadManager.genDeleteFinishedDownloadsForCourse(course);
      Alert.alert("Finished downloads deleted.");
    },
    destructive: false, // lil bit
  },
  {
    key: "all-downloads",
    title: (courseTitle: string) => `Delete all ${courseTitle} downloads`,
    description: "Removes every downloaded lesson for this course.",
    action: async (course: Course) => {
      DownloadManager.stopAllDownloadsForCourse(course);
      await DownloadManager.genDeleteAllDownloadsForCourse(course);
      Alert.alert("All downloads deleted.");
    },
    destructive: true,
  },
  {
    key: "all-data",
    title: (courseTitle: string) => `Delete all ${courseTitle} data`,
    description:
      "Deletes downloads, metadata, and progress. You will return to the course picker afterwards.",
    action: async (course: Course, router: ReturnType<typeof useRouter>) => {
      DownloadManager.stopAllDownloadsForCourse(course);
      await Promise.all([
        DownloadManager.genDeleteAllDownloadsForCourse(course),
        genDeleteProgressForCourse(course),
      ]);
      // genDeleteProgressForCourse depends on the metadata being present
      await CourseData.clearCourseMetadata(course);
      router.replace("/");
      Alert.alert("All course data deleted.");
    },
    destructive: true,
  },
];

const DataManagementScreen = () => {
  const params = useLocalSearchParams<{ course: string }>();
  const course = (params.course ?? "spanish") as Course;
  const router = useRouter();
  const title = CourseData.getCourseShortTitle(course);

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
              if (
                section.destructive &&
                !(await confirm(section.title(title)))
              ) {
                return;
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
