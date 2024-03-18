import React, {useEffect, useState} from 'react';
import {
  StyleSheet,
  View,
  Text,
  Linking,
  TouchableNativeFeedback,
} from 'react-native';
import {Icon} from 'react-native-elements';
import CourseData from '../../course-data';
import DownloadManager from '../../download-manager';
import {genMarkLesson, genProgressForLesson, Progress} from '../../persistence';
import {genStopPlaying} from '../../audio-service';
import {useNavigation} from '@react-navigation/native';
import {useProgress} from 'react-native-track-player';
import {log} from '../../metrics';
import formatDuration from 'format-duration';
import {MainNavigationProp} from '../App.react';

interface Props {
  course: Course;
  lesson: number;
  downloaded: boolean | null;
}

const ListenBottomSheet = ({course, lesson, downloaded}: Props) => {
  const {position} = useProgress();
  const {pop} = useNavigation<MainNavigationProp<'Listen'>>();
  const [progress, setProgress] = useState<Progress | null>(null);

  useEffect(() => {
    (async () => {
      const progressResp = await genProgressForLesson(course, lesson);
      setProgress(progressResp);
    })();
  }, [course, lesson]);

  const finished = progress?.finished;

  return (
    <>
      <TouchableNativeFeedback
        onPress={async () => {
          log({
            action: `mark_${finished ? 'unfinished' : 'finished'}`,
            surface: 'listen_bottom_sheet',
            course,
            lesson,
            position,
          });
          await genMarkLesson(course, lesson, !finished);
          pop();
        }}>
        <View style={styles.bottomSheetRow}>
          <Text style={styles.rowText}>{`Mark as ${
            finished ? 'unfinished' : 'finished'
          }`}</Text>
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
      {downloaded ? (
        <TouchableNativeFeedback
          onPress={async () => {
            log({
              action: 'delete_download',
              surface: 'listen_bottom_sheet',
              course,
              lesson,
              position,
            });

            await genStopPlaying();
            await DownloadManager.genDeleteDownload(course, lesson);
            pop();
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
        onPress={() =>
          Linking.openURL(
            'mailto:info@languagetransfer.org' +
              `?subject=${encodeURIComponent(
                `Feedback about ${CourseData.getCourseFullTitle(course)}`,
              )}&body=${encodeURIComponent(
                `Hi! I found a problem with the ${
                  CourseData.getCourseFullTitle(course)
                } course within the Language Transfer app:<br>
                <br>
                <br>
                ---<br>
                <br>
                Course: ${CourseData.getCourseFullTitle(course)}<br>
                ${CourseData.getLessonTitle(course, lesson)}<br>
                Position: ${formatDuration(position * 1000)}`,
              )}`,
          )
        }>
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

const styles = StyleSheet.create({
  bottomSheetRow: {
    flexDirection: 'row',
    paddingVertical: 18,
    paddingLeft: 36,
    paddingRight: 30,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowIcon: {},
  rowText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  iconContainer: {
    width: 48,
  },
});

export default ListenBottomSheet;
