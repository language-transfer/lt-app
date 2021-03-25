import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet, TouchableNativeFeedback} from 'react-native';
import ProgressCircle from 'react-native-progress-circle';

import {Icon} from 'react-native-elements';
import formatDuration from 'format-duration';
import prettyBytes from 'pretty-bytes';
import {genProgressForLesson, Progress} from '../../persistence';
import DownloadManager, {useDownloadStatus} from '../../download-manager';
import CourseData from '../../course-data';
import {usePreference} from '../../persistence';
import {log} from '../../metrics';
import { useNavigation } from '@react-navigation/core';
import { StackNavigationProp } from '@react-navigation/stack';
import { MainNavigationProp } from '../App.react';

export const LESSON_ROW_HEIGHT = 72;

const renderDownloadProgress = (
  downloaded: boolean,
  downloadState: Download,
  downloading: boolean,
) => {
  if (downloaded) {
    return (
      <Icon
        name="trash"
        type="font-awesome-5"
        accessibilityLabel="delete download"
        size={24}
      />
    );
  }

  const errored = downloadState && downloadState.error;

  if (errored) {
    return (
      <Icon
        name="exclamation"
        type="font-awesome-5"
        accessibilityLabel="download error"
        size={24}
      />
    );
  }

  if (downloading) {
    const percent =
      downloadState.totalBytes === null
        ? 0
        : (downloadState.bytesWritten / downloadState.totalBytes) * 100;

    return (
      <ProgressCircle
        percent={percent}
        radius={20}
        borderWidth={5}
        color="#333"
        shadowColor="#ddd"
        bgColor="white">
        <Text
          style={styles.progressCircleText}
          accessibilityLabel={
            Math.floor(percent) + ' percent downloaded. tap to cancel.'
          }>
          {Math.floor(percent)}
        </Text>
      </ProgressCircle>
    );
  }

  return (
    <View style={styles.downloadButton}>
      <Icon
        name="download"
        type="font-awesome-5"
        accessibilityLabel="download"
        size={24}
      />
    </View>
  );
};

const handleDownloadClick = async (
  course: Course,
  lesson: number,
  downloaded: boolean,
  downloading: boolean,
  setLastDeletionAction: (val: number | null) => void,
  setLastChildUpdateTime: (val: Date) => void,
) => {
  if (downloading) {
    log({
      action: 'cancel_download',
      surface: 'all_lessons',
      course,
      lesson,
    });
    DownloadManager.stopDownload(DownloadManager.getDownloadId(course, lesson));
  } else if (!downloaded) {
    log({
      action: 'download_lesson',
      surface: 'all_lessons',
      course,
      lesson,
    });
    DownloadManager.startDownload(course, lesson);
  } else {
    log({
      action: 'delete_download',
      surface: 'all_lessons',
      course,
      lesson,
    });
    await DownloadManager.genDeleteDownload(course, lesson);
    setLastDeletionAction(+new Date());
    setLastChildUpdateTime(new Date());
  }
};

const LessonRow = ({
  course,
  lesson,
  lastUpdateTime,
  setLastChildUpdateTime,
}: {
  course: Course;
  lesson: number;
  lastUpdateTime: Date | null;
  setLastChildUpdateTime: (time: Date) => void,
}) => {
  const downloadState = useDownloadStatus(course, lesson);
  const downloadQuality = usePreference<Quality>('download-quality', 'high');

  const [progress, setProgress] = useState<Progress | null>(null);
  const [downloaded, setDownloaded] = useState<boolean | null>(null);
  const [lastDeletionAction, setLastDeletionAction] = useState<number | null>(null);

  const {navigate} = useNavigation<MainNavigationProp<'Listen'>>();

  useEffect(() => {
    (async () => {
      const [progressResp, downloadedResp] = await Promise.all([
        genProgressForLesson(course, lesson),
        DownloadManager.genIsDownloaded(course, lesson),
      ]);

      setProgress(progressResp);
      setDownloaded(downloadedResp);
    })();
  }, [course, downloadState, lastDeletionAction, lesson, lastUpdateTime]);

  useEffect(() => {
    setLastChildUpdateTime(new Date());
  }, [downloadState]);

  const ready = progress !== null && downloaded !== null;

  const finished = progress?.finished;
  const downloading =
    downloadState && !downloadState.error && !downloadState.finished;

  return (
    <View style={styles.row}>
      <TouchableNativeFeedback
        onPress={() => {
          navigate('Listen', {course, lesson});
        }}>
        <View style={styles.lessonBox}>
          {ready ? (
            <View style={styles.text}>
              <Icon
                style={{
                  ...styles.finishedIcon,
                  ...(finished ? {} : {opacity: 0}),
                }}
                name="check"
                type="font-awesome-5"
                accessibilityLabel={finished ? 'finished' : 'not finished'}
                size={24}
              />
              <Text style={styles.lessonTitleText}>
                {CourseData.getLessonTitle(course, lesson)}
              </Text>
              <Text style={styles.lessonDurationText}>
                {formatDuration(
                  CourseData.getLessonDuration(course, lesson) * 1000,
                )}
              </Text>
            </View>
          ) : null}
        </View>
      </TouchableNativeFeedback>
      <TouchableNativeFeedback
        onPress={() => {
          handleDownloadClick(
            course,
            lesson,
            downloaded!,
            downloading,
            setLastDeletionAction,
            setLastChildUpdateTime,
          );
        }}>
        <View style={styles.downloadBox}>
          {ready
            ? renderDownloadProgress(downloaded!, downloadState, downloading)
            : null}
          {ready
            ? <Text style={styles.lessonSizeText}>
                {prettyBytes(
                  CourseData.getLessonSizeInBytes(course, lesson, downloadQuality),
                )}
              </Text>
            : null
          }
        </View>
      </TouchableNativeFeedback>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
  },
  lessonBox: {
    paddingHorizontal: 20,
    backgroundColor: 'white',
    borderBottomColor: '#ccc',
    borderBottomWidth: 1,
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  downloadBox: {
    width: LESSON_ROW_HEIGHT,
    height: LESSON_ROW_HEIGHT,
    backgroundColor: 'white',
    borderColor: '#ccc',
    borderBottomWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lessonTitleText: {
    fontSize: 22,
    fontWeight: 'bold',
    marginRight: 24,
  },
  lessonDurationText: {
    fontSize: 16,
  },
  lessonSizeText: {
    fontSize: 12,
    color: 'gray',
  },

  finishedIcon: {
    marginRight: 24,
  },
  progressCircleText: {
    fontSize: 16,
  },

  downloadButton: {
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
  },
});

export default LessonRow;
