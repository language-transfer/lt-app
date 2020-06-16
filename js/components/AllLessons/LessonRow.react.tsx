import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableNativeFeedback,
  Dimensions,
  Platform,
} from 'react-native';
import ProgressCircle from 'react-native-progress-circle';
import {useNavigation} from '@react-navigation/native';
import {LanguageStackScreenProps} from '../Nav/LanguageNav.react';

import {Icon} from 'react-native-elements';
import formatDuration from 'format-duration';
import {genProgressForLesson, IProgress} from '../../persistence';
import DownloadManager, {
  useDownloadStatus,
  DownloadProgress,
} from '../../download-manager';
import CourseData from '../../course-data';

import {log} from '../../metrics';

export const LESSON_ROW_HEIGHT = 72;

const renderDownloadProgress = (
  downloaded: boolean,
  downloadState: DownloadProgress,
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
  setLastDeletionAction: (val: any) => void,
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

const LessonRow = ({
  course,
  lesson,
  lastUpdateTime,
}: {
  course: Course;
  lesson: number;
  lastUpdateTime: Date | null;
}) => {
  const {navigate} = useNavigation<LanguageStackScreenProps>();
  const downloadState = useDownloadStatus(course, lesson);

  const [progress, setProgress] = useState<IProgress | null>(null);
  const [downloaded, setDownloaded] = useState<boolean | null>(null);
  const [lastDeletionAction, setLastDeletionAction] = useState(null);

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

  const ready = progress !== null && downloaded !== null;

  const finished = progress?.finished;
  const downloading =
    downloadState && !downloadState.error && !downloadState.finished;

  return (
    <View style={styles.row}>
      <TouchableNativeFeedback
        onPress={() => {
          navigate('Listen', {lesson});
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
          );
        }}>
        <View style={styles.downloadBox}>
          {ready
            ? renderDownloadProgress(downloaded!, downloadState, downloading)
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
    // do we actually need 28p padding for Anroid
    padding: Platform.select({ios: 0, android: 28}),
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
