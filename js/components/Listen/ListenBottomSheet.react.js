import React, {useState, useEffect} from 'react';
import {
  StyleSheet,
  View,
  Text,
  StatusBar,
  Button,
  Linking,
  TouchableNativeFeedback,
  ActivityIndicator,
} from 'react-native';

import {Icon} from 'react-native-elements';

import CourseData from '../../course-data';
import DownloadManager from '../../download-manager';
import {genMarkLessonFinished} from '../../persistence';
import {genStopPlaying} from '../../audio-service';

import TrackPlayer from 'react-native-track-player';
import {log} from '../../metrics';

const ListenBottomSheet = (props) => {
  const styles = StyleSheet.create({
    bottomSheetRow: {
      flexDirection: 'row',
      paddingVertical: 18,
      paddingLeft: 36,
      paddingRight: 30,
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    rowText: {
      fontSize: 18,
      fontWeight: 'bold',
    },
    iconContainer: {
      width: 48,
    },
  });

  return (
    <>
      <TouchableNativeFeedback
        onPress={async () => {
          log({
            action: 'mark_finished',
            surface: 'listen_bottom_sheet',
            course: props.course,
            lesson: props.lesson,
            position: await TrackPlayer.getPosition(),
          });

          await genMarkLessonFinished(props.course, props.lesson);
          props.navigation.pop();
        }}>
        <View style={styles.bottomSheetRow}>
          <Text style={styles.rowText}>Mark as finished</Text>
          <View style={styles.iconContainer}>
            <Icon
              style={styles.rowIcon}
              name="check"
              type="font-awesome-5"
              size={32}
            />
          </View>
        </View>
      </TouchableNativeFeedback>
      {props.downloaded ? (
        <TouchableNativeFeedback
          onPress={async () => {
            log({
              action: 'delete_download',
              surface: 'listen_bottom_sheet',
              course: props.course,
              lesson: props.lesson,
              position: await TrackPlayer.getPosition(),
            });

            await genStopPlaying();
            await DownloadManager.genDeleteDownload(props.course, props.lesson);
            props.navigation.pop();
          }}>
          <View style={styles.bottomSheetRow}>
            <Text style={styles.rowText}>Delete download</Text>
            <View style={styles.iconContainer}>
              <Icon
                style={styles.rowIcon}
                name="trash"
                type="font-awesome-5"
                size={32}
              />
            </View>
          </View>
        </TouchableNativeFeedback>
      ) : null}
      <TouchableNativeFeedback
        onPress={async () => {
          log({
            action: 'report_problem',
            surface: 'listen_bottom_sheet',
            course: props.course,
            lesson: props.lesson,
            position: await TrackPlayer.getPosition(),
          });

          Linking.openURL(
            'mailto:info@languagetransfer.org' +
              `?subject=${encodeURIComponent(
                `Feedback about ${CourseData.getCourseTitle(
                  props.course,
                )} ${CourseData.getLessonTitle(props.course, props.lesson)}`,
              )}`,
          );
        }}>
        <View style={styles.bottomSheetRow}>
          <Text style={styles.rowText}>Report a problem</Text>
          <View style={styles.iconContainer}>
            <Icon
              style={styles.rowIcon}
              name="exclamation-triangle"
              type="font-awesome-5"
              size={32}
            />
          </View>
        </View>
      </TouchableNativeFeedback>
    </>
  );
};

export default ListenBottomSheet;
