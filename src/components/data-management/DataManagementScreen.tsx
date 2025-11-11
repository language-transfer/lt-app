import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import CourseData from '@/src/data/courseData';
import DownloadManager from '@/src/services/downloadManager';
import { genDeleteProgressForCourse } from '@/src/storage/persistence';
import type { Course } from '@/src/types';

const sections = [
  {
    key: 'refresh',
    title: (courseTitle: string) => `Refresh ${courseTitle} metadata`,
    description: 'Reload the lesson list in case new tracks have been published.',
    action: async (course: Course) => {
      await CourseData.genLoadCourseMetadata(course, true);
      Alert.alert('Metadata refreshed');
    },
  },
  {
    key: 'progress',
    title: (courseTitle: string) => `Delete ${courseTitle} progress`,
    description: 'Marks every lesson as unfinished and forgets where you left off.',
    action: async (course: Course) => {
      await genDeleteProgressForCourse(course);
      Alert.alert('Progress deleted.');
    },
  },
  {
    key: 'finished-downloads',
    title: (courseTitle: string) => `Delete finished ${courseTitle} downloads`,
    description: 'Removes downloaded lessons you have marked as finished.',
    action: async (course: Course) => {
      await DownloadManager.genDeleteFinishedDownloadsForCourse(course);
      Alert.alert('Finished downloads deleted.');
    },
  },
  {
    key: 'all-downloads',
    title: (courseTitle: string) => `Delete all ${courseTitle} downloads`,
    description: 'Removes every downloaded lesson for this course.',
    action: async (course: Course) => {
      DownloadManager.stopAllDownloadsForCourse(course);
      await DownloadManager.genDeleteAllDownloadsForCourse(course);
      Alert.alert('All downloads deleted.');
    },
  },
  {
    key: 'all-data',
    title: (courseTitle: string) => `Delete all ${courseTitle} data`,
    description:
      'Deletes downloads, metadata, and progress. You will return to the course picker afterwards.',
    action: async (course: Course, router: ReturnType<typeof useRouter>) => {
      DownloadManager.stopAllDownloadsForCourse(course);
      await Promise.all([
        DownloadManager.genDeleteFullCourseFolder(course),
        genDeleteProgressForCourse(course),
        CourseData.clearCourseMetadata(course),
      ]);
      router.replace('/');
      Alert.alert('All course data deleted.');
    },
  },
];

const DataManagementScreen = () => {
  const params = useLocalSearchParams<{ course: string }>();
  const course = (params.course ?? 'spanish') as Course;
  const router = useRouter();
  const title = CourseData.getCourseShortTitle(course);

  const confirm = (message: string) =>
    new Promise<boolean>((resolve) => {
      Alert.alert('Confirm deletion', message, [
        { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
        { text: 'Delete', style: 'destructive', onPress: () => resolve(true) },
      ]);
    });

  return (
    <ScrollView style={styles.body}>
      <View style={styles.container}>
        {sections.map((section) => (
          <View key={section.key} style={styles.card}>
            <Text style={styles.cardTitle}>{section.title(title)}</Text>
            <Text style={styles.cardDescription}>{section.description}</Text>
            <Text
              style={styles.cardAction}
              onPress={async () => {
                const shouldProceed = await confirm(section.title(title));
                if (!shouldProceed) {
                  return;
                }
                await section.action(course, router);
              }}
            >
              Run action
            </Text>
          </View>
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
    backgroundColor: '#fff',
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 15,
    color: '#555',
  },
  cardAction: {
    marginTop: 12,
    color: '#c0392b',
    fontWeight: '600',
  },
});

export default DataManagementScreen;
