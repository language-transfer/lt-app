import React, {useEffect, useState} from 'react';
import {StyleSheet, View, Text, StatusBar, Linking} from 'react-native';

import {Icon} from 'react-native-elements';
import {TouchableNativeFeedback} from 'react-native-gesture-handler';
import {
  genMostRecentListenedLessonForCourse,
  genProgressForLesson,
} from '../../persistence';

import RNBackgroundDownloader from 'react-native-background-downloader';
import RNFS, {exists} from 'react-native-fs';

import languageData from '../../../languageData';
import DownloadManager, {useDownloadStatus} from '../../download-manager';

const LanguageHomeDownloadButton = (props) => {
  const progress = useDownloadStatus(props.course, props.lesson);

  // If progress updates, the root component needs to know so it can look
  // for the file again and potentially remove the download button
  useEffect(() => {
    props.setDownloadState(progress);
  }, [progress]);

  return (
    <View style={styles.lessonPlayBox}>
      <TouchableNativeFeedback
        useForeground={true}
        onPress={() =>
          DownloadManager.startDownload(props.course, props.lesson)
        }
        disabled={progress !== null}>
        <View style={styles.lessonPlayBoxInner}>
          <View style={styles.textPlayFlex}>
            <Text style={styles.lessonTitle}>
              Download{' '}
              {languageData[props.course].meta.lessons[props.lesson].name}
            </Text>
            <Icon name="download" type="font-awesome-5" size={32} />
          </View>
        </View>
      </TouchableNativeFeedback>
    </View>
  );
};

const styles = StyleSheet.create({
  lessonPlayBox: {
    margin: 25,
    borderRadius: 10,
    backgroundColor: 'white',
    overflow: 'hidden',
    elevation: 4,
  },
  lessonPlayBoxInner: {
    padding: 25,
  },
  textPlayFlex: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  lessonTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  progressBar: {
    height: 4,
    width: '100%',
    marginTop: 50,
    marginBottom: 15,
    flexDirection: 'row',
  },
  progressMade: {
    height: 4,
    flex: 2 * 60 + 40,
    backgroundColor: '#aaa',
  },
  progressLeft: {
    height: 4,
    flex: 7 * 60 + 2 - (2 * 60 + 40),
    backgroundColor: '#ddd',
  },
  progressText: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});

export default LanguageHomeDownloadButton;
