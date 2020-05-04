import React, {useEffect} from 'react';
import {StyleSheet, View, Text} from 'react-native';
import ProgressCircle from 'react-native-progress-circle';

import {Icon} from 'react-native-elements';
import {TouchableNativeFeedback} from 'react-native-gesture-handler';

import languageData from '../../../languageData';
import DownloadManager, {useDownloadStatus} from '../../download-manager';

const renderDownloadProgress = (progress) => {
  const percent =
    progress.totalBytes === null
      ? 0
      : (progress.bytesWritten / progress.totalBytes) * 100;

  return (
    <ProgressCircle
      percent={percent}
      radius={17}
      borderWidth={4}
      color="#333"
      shadowColor="#ddd"
      bgColor="white">
      <Text style={styles.progressCircleText}>{Math.floor(percent)}</Text>
    </ProgressCircle>
  );
};

const LanguageHomeDownloadButton = (props) => {
  const progress = useDownloadStatus(props.course, props.lesson);

  // If progress updates, the root component needs to know so it can look
  // for the file again and potentially remove the download button
  useEffect(() => {
    props.setDownloadState(progress);
  }, [progress]);

  const downloading = progress && !progress.error && !progress.finished;
  const errored = progress && progress.error;

  return (
    <View
      style={{
        ...styles.lessonPlayBox,
        ...(downloading ? styles.disabled : {}),
      }}>
      <TouchableNativeFeedback
        useForeground={true}
        onPress={() => {
          if (!downloading)
            DownloadManager.startDownload(props.course, props.lesson);
        }}>
        <View style={styles.lessonPlayBoxInner}>
          <View style={styles.textPlayFlex}>
            <Text style={styles.downloadText}>
              Download{downloading && 'ing'}{' '}
              {languageData[props.course].meta.lessons[props.lesson].title}
            </Text>
            {errored ? (
              <Icon name="exclamation" type="font-awesome-5" size={32} />
            ) : downloading ? (
              renderDownloadProgress(progress)
            ) : (
              <Icon name="download" type="font-awesome-5" size={32} />
            )}
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
    alignItems: 'center',
  },
  downloadText: {
    fontSize: 22,
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
  progressCircleText: {
    fontSize: 12,
  },
});

export default LanguageHomeDownloadButton;
