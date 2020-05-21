import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableNativeFeedback,
  Dimensions,
} from 'react-native';
import ProgressCircle from 'react-native-progress-circle';

import {Icon} from 'react-native-elements';
import formatDuration from 'format-duration';
import {genProgressForLesson} from '../../persistence';
import DownloadManager, {useDownloadStatus} from '../../download-manager';
import CourseData from '../../course-data';

import {log} from '../../metrics';

export const LESSON_ROW_HEIGHT = 72;

const renderDownloadProgress = (downloaded, downloadState, downloading) => {
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
  course,
  lesson,
  downloaded,
  downloading,
  setLastDeletionAction,
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
  }
};

const LessonRow = (props) => {
  const downloadState = useDownloadStatus(props.course, props.lesson);

  const [progress, setProgress] = useState(null);
  const [downloaded, setDownloaded] = useState(null);
  const [lastDeletionAction, setLastDeletionAction] = useState(null);

  useEffect(() => {
    (async () => {
      const [progress, downloaded] = await Promise.all([
        genProgressForLesson(props.course, props.lesson),
        DownloadManager.genIsDownloaded(props.course, props.lesson),
      ]);

      setProgress(progress);
      setDownloaded(downloaded);
    })();
  }, [props.lastUpdateTime, downloadState, lastDeletionAction]);

  const ready = progress !== null && downloaded !== null;

  const finished = progress && progress.finished;
  const downloading =
    downloadState && !downloadState.error && !downloadState.finished;

  return (
    <View style={styles.row}>
      <TouchableNativeFeedback
        onPress={() => {
          props.navigation.navigate('Listen', {
            course: props.course,
            lesson: props.lesson,
          });
        }}>
        <View style={styles.lessonRow}>
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
                {CourseData.getLessonTitle(props.course, props.lesson)}
              </Text>
              <Text style={styles.lessonDurationText}>
                {formatDuration(
                  CourseData.getLessonDuration(props.course, props.lesson) *
                    1000,
                )}
              </Text>
            </View>
          ) : null}
        </View>
      </TouchableNativeFeedback>
      <TouchableNativeFeedback
        onPress={() => {
          handleDownloadClick(
            props.course,
            props.lesson,
            downloaded,
            downloading,
            setLastDeletionAction,
          );
        }}>
        <View style={styles.downloadBox}>
          {ready
            ? renderDownloadProgress(downloaded, downloadState, downloading)
            : null}
        </View>
      </TouchableNativeFeedback>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
  },
  lessonRow: {
    padding: 28,
    backgroundColor: 'white',
    borderBottomColor: '#ccc',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: Dimensions.get('screen').width - LESSON_ROW_HEIGHT,
    height: LESSON_ROW_HEIGHT,
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
    paddingHorizontal: 10,
  },
});

export default LessonRow;
