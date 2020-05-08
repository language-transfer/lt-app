import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StatusBar,
  StyleSheet,
  Image,
  CheckBox,
  TouchableNativeFeedback,
  Alert,
} from 'react-native';

import changeNavigationBarColor from 'react-native-navigation-bar-color';
import {ScrollView} from 'react-native-gesture-handler';

import CourseData from '../../course-data';
import DownloadManager from '../../download-manager';
import {genDeleteProgressForCourse} from '../../persistence';

const DataManagement = (props) => {
  useEffect(() => {
    return props.navigation.addListener('focus', () => {
      StatusBar.setBackgroundColor('white');
      StatusBar.setBarStyle('dark-content', true);
      changeNavigationBarColor('white', true);
    });
  }, [props.navigation]);

  const {course} = props.route.params;
  const courseTitle = CourseData.getCourseTitle(course);

  const confirm = (message) =>
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
              await CourseData.genLoadCourseMetadata(course, true);
              alert(`Refreshed course metadata for ${courseTitle}!`);
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
              if (
                await confirm(
                  `Are you sure you want to delete your progress in ${courseTitle}?`,
                )
              ) {
                await genDeleteProgressForCourse(course);
                alert(`Deleted all progress for ${courseTitle}.`);
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
              if (
                await confirm(
                  `Are you sure you want to delete your finished downloads for ${courseTitle}?`,
                )
              ) {
                await DownloadManager.genDeleteFinishedDownloadsForCourse(
                  course,
                );
                alert(`Deleted all finished downloads for ${courseTitle}.`);
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
              if (
                await confirm(
                  `Are you sure you want to delete all your downloads for ${courseTitle}?`,
                )
              ) {
                DownloadManager.stopAllDownloadsForCourse(course);
                await DownloadManager.genDeleteAllDownloadsForCourse(course);
                alert(`Deleted all downloads for ${courseTitle}.`);
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
              if (
                await confirm(
                  `Are you sure you want to delete all data related to ${courseTitle}?`,
                )
              ) {
                DownloadManager.stopAllDownloadsForCourse(course);
                await Promise.all([
                  DownloadManager.genDeleteFullCourseFolder(course),
                  genDeleteProgressForCourse(course),
                ]);
                await CourseData.clearCourseMetadata(course);
                props.navigation.navigate('Language Selector');
                alert(`Deleted all data related to ${courseTitle}.`);
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
