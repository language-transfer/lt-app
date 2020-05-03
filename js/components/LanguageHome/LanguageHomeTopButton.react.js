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
import LanguageHomeDownloadButton from './LanguageHomeDownloadButton.react';
import DownloadManager from '../../download-manager';

import formatDuration from 'format-duration';

const LanguageHomeTopButton = (props) => {
  const [lastListenState, setLastListenState] = useState(null);
  const [downloadState, setDownloadState] = useState(null);

  useEffect(() => {
    const update = async () => {
      const {course} = props.route.params;
      const lesson = await genMostRecentListenedLessonForCourse(course);
      const progress = await genProgressForLesson(course, lesson);

      let nextLesson = progress.finished
        ? lesson + 1 // todo: wrap, or something
        : lesson === null
        ? 0
        : lesson;

      const downloaded = await exists(
        DownloadManager.getDownloadSaveLocation(course, nextLesson),
      );

      setLastListenState({
        nextLesson,
        progress,
        downloaded,
      });
    };

    update();

    return props.navigation.addListener('focus', update);
  }, [props.navigation, props.route, setLastListenState, downloadState]);

  if (lastListenState === null) {
    return null;
  }

  const lessonMeta =
    languageData[props.route.params.course].meta.lessons[
      lastListenState.nextLesson
    ];

  const progress = lastListenState.progress
    ? lastListenState.progress.progress || 0
    : 0;

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
      flex: progress,
      backgroundColor: '#aaa',
    },
    progressLeft: {
      height: 4,
      flex: lessonMeta.duration - progress,
      backgroundColor: '#ddd',
    },
    progressText: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
  });

  if (lastListenState.downloaded) {
    return (
      <View style={styles.lessonPlayBox}>
        <TouchableNativeFeedback
          useForeground={true}
          onPress={() =>
            props.navigation.navigate('Listen', {
              course: props.route.params.course,
              lesson: lastListenState.nextLesson,
            })
          }>
          <View style={styles.lessonPlayBoxInner}>
            <View style={styles.textPlayFlex}>
              <Text style={styles.lessonTitle}>{lessonMeta.name}</Text>
              <Icon name="play" type="font-awesome-5" />
            </View>
            <View style={styles.progressBar}>
              <View style={styles.progressMade} />
              <View style={styles.progressLeft} />
            </View>
            <View style={styles.progressText}>
              <Text>
                {formatDuration(
                  (lastListenState.progress.progress || 0) * 1000,
                )}
              </Text>
              <Text>{formatDuration(lessonMeta.duration * 1000)}</Text>
            </View>
          </View>
        </TouchableNativeFeedback>
      </View>
    );
  } else {
    return (
      <LanguageHomeDownloadButton
        course={props.route.params.course}
        lesson={lastListenState.nextLesson}
        setDownloadState={setDownloadState} // just to get a refresh on the root component as the download progresses
      />
    );
  }
};

export default LanguageHomeTopButton;
