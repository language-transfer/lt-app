import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableNativeFeedback,
  Alert,
} from 'react-native';
import {ScrollView} from 'react-native-gesture-handler';
import useStatusBarStyle from '../../hooks/useStatusBarStyle';
import CourseData from '../../course-data';
import DownloadManager from '../../download-manager';
import {genDeleteProgressForCourse} from '../../persistence';
import {log} from '../../metrics';
import { useNavigation } from '@react-navigation/core';
import { MainNavigationProp } from '../App.react';

const DataManagement = ({route}) => {
  useStatusBarStyle('white', 'dark-content');
  const {navigate} = useNavigation<MainNavigationProp<'Data Management'>>();

  const {course} = route.params;
  const courseTitle = CourseData.getCourseShortTitle(course);

  const confirm = (message: string) =>
    new Promise((done) =>
      Alert.alert(
        'Confirm deletion',
        message,
        [
          {
            text: 'No',
            style: 'cancel',
            onPress: () => done(false),
          },
          {text: 'Yes', onPress: () => done(true)},
        ],
        {cancelable: true},
      ),
    );

  return (
    <ScrollView>
      <View style={styles.body}>
        <View style={styles.button}>
          <TouchableNativeFeedback
            onPress={async () => {
              log({
                action: 'refresh_course_metadata',
                surface: 'data_management',
                course,
              });
              await CourseData.genLoadCourseMetadata(course, true);
              Alert.alert(`Refreshed course metadata for ${courseTitle}!`);
            }}
            useForeground={true}>
            <View style={styles.buttonInner}>
              <Text style={styles.buttonTextHeader}>
                Refresh {courseTitle} metadata
              </Text>
              <Text style={styles.buttonText}>
                This will check to see if new {courseTitle} lessons have been
                added. If you're having trouble downloading tracks, try this.
              </Text>
            </View>
          </TouchableNativeFeedback>
        </View>

        <View style={styles.button}>
          <TouchableNativeFeedback
            onPress={async () => {
              log({
                action: 'delete_course_progress',
                surface: 'data_management',
                course,
              });
              if (
                await confirm(
                  `Are you sure you want to delete your progress in ${courseTitle}?`,
                )
              ) {
                log({
                  action: 'delete_course_progress_confirm',
                  surface: 'data_management',
                  course,
                });
                await genDeleteProgressForCourse(course);
                Alert.alert(`Deleted all progress for ${courseTitle}.`);
              } else {
                log({
                  action: 'delete_course_progress_explicit_dismiss',
                  surface: 'data_management',
                  course,
                });
              }
            }}
            useForeground={true}>
            <View style={styles.buttonInner}>
              <Text style={styles.buttonTextHeader}>
                Delete {courseTitle} progress
              </Text>
              <Text style={styles.buttonText}>
                If you've marked any {courseTitle} lessons as finished, this
                will mark them all unfinished and start you back at Lesson 1. It
                will also forget where you left off in each track.
              </Text>
            </View>
          </TouchableNativeFeedback>
        </View>

        <View style={styles.button}>
          <TouchableNativeFeedback
            onPress={async () => {
              log({
                action: 'delete_finished_course_downloads',
                surface: 'data_management',
                course,
              });
              if (
                await confirm(
                  `Are you sure you want to delete your finished downloads for ${courseTitle}?`,
                )
              ) {
                log({
                  action: 'delete_finished_course_downloads_confirm',
                  surface: 'data_management',
                  course,
                });
                await DownloadManager.genDeleteFinishedDownloadsForCourse(
                  course,
                );
                Alert.alert(
                  `Deleted all finished downloads for ${courseTitle}.`,
                );
              } else {
                log({
                  action: 'delete_finished_course_downloads_explicit_dismiss',
                  surface: 'data_management',
                  course,
                });
              }
            }}
            useForeground={true}>
            <View style={styles.buttonInner}>
              <Text style={styles.buttonTextHeader}>
                Delete finished {courseTitle} downloads
              </Text>
              <Text style={styles.buttonText}>
                If you have downloaded {courseTitle} lessons that you've
                finished listening to, this will delete those downloads.
              </Text>
            </View>
          </TouchableNativeFeedback>
        </View>

        <View style={styles.button}>
          <TouchableNativeFeedback
            onPress={async () => {
              log({
                action: 'delete_course_downloads',
                surface: 'data_management',
                course,
              });
              if (
                await confirm(
                  `Are you sure you want to delete all your downloads for ${courseTitle}?`,
                )
              ) {
                log({
                  action: 'delete_course_downloads_confirm',
                  surface: 'data_management',
                  course,
                });
                DownloadManager.stopAllDownloadsForCourse(course);
                await DownloadManager.genDeleteAllDownloadsForCourse(course);
                Alert.alert(`Deleted all downloads for ${courseTitle}.`);
              } else {
                log({
                  action: 'delete_course_downloads_explicit_dismiss',
                  surface: 'data_management',
                  course,
                });
              }
            }}
            useForeground={true}>
            <View style={styles.buttonInner}>
              <Text style={styles.buttonTextHeader}>
                Delete all {courseTitle} downloads
              </Text>
              <Text style={styles.buttonText}>
                This will delete all {courseTitle} lessons you've downloaded.
              </Text>
            </View>
          </TouchableNativeFeedback>
        </View>

        <View style={styles.button}>
          <TouchableNativeFeedback
            onPress={async () => {
              log({
                action: 'delete_all_course_data',
                surface: 'data_management',
                course,
              });
              if (
                await confirm(
                  `Are you sure you want to delete all data related to ${courseTitle}?`,
                )
              ) {
                log({
                  action: 'delete_all_course_data_confirm',
                  surface: 'data_management',
                  course,
                });
                DownloadManager.stopAllDownloadsForCourse(course);
                await Promise.all([
                  DownloadManager.genDeleteFullCourseFolder(course),
                  genDeleteProgressForCourse(course),
                ]);
                await CourseData.clearCourseMetadata(course);

                // @see https://github.com/react-navigation/react-navigation/issues/6931
                // @ts-ignore
                navigate('Language Selector');
                Alert.alert(`Deleted all data related to ${courseTitle}.`);
              } else {
                log({
                  action: 'delete_all_course_data_explicit_dismiss',
                  surface: 'data_management',
                  course,
                });
              }
            }}
            useForeground={true}>
            <View style={styles.buttonInner}>
              <Text style={styles.buttonTextHeader}>
                Delete all {courseTitle} data
              </Text>
              <Text style={styles.buttonText}>
                This will clear your progress in {courseTitle}, delete all
                downloads, and remove its metadata from your device.
              </Text>
            </View>
          </TouchableNativeFeedback>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  body: {
    padding: 20,
  },

  button: {
    marginHorizontal: 25,
    marginVertical: 15,
    borderRadius: 10,
    backgroundColor: 'white',
    overflow: 'hidden',
    elevation: 3,
  },
  buttonInner: {
    padding: 25,
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  buttonTextHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  buttonText: {
    fontSize: 16,
  },
});

export default DataManagement;
