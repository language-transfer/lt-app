import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Linking,
  TouchableNativeFeedback,
} from 'react-native';
import {Icon} from 'react-native-elements';
import {useCourseContext} from '../Context/CourseContext';
import {useLessonContext} from '../Context/LessonContext';
import DownloadManager from '../../download-manager';
import {genMarkLessonFinished} from '../../persistence';
import {genStopPlaying} from '../../audio-service';
import {useNavigation} from '@react-navigation/native';
import {LanguageStackScreenProps} from '../Nav/LanguageNav.react';
import {useTrackPlayerProgress} from 'react-native-track-player';
import {log} from '../../metrics';
import formatDuration from 'format-duration';

interface IProps {
  downloaded: Maybe<boolean>;
}

const ListenBottomSheet = ({downloaded}: IProps) => {
  const {position} = useTrackPlayerProgress();
  const {pop} = useNavigation<LanguageStackScreenProps>();
  const {course, courseData} = useCourseContext();
  const {lesson, lessonData} = useLessonContext();

  return (
    <>
      <TouchableNativeFeedback
        onPress={async () => {
          log({
            action: 'mark_finished',
            surface: 'listen_bottom_sheet',
            course,
            lesson,
            position,
          });

          await genMarkLessonFinished(course, lesson);
          pop();
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
                `Feedback about ${courseData.fullTitle}`,
              )}&body=${encodeURIComponent(
                `Hi! I found a problem with the ${
                  courseData.fullTitle
                } course within the Language Transfer app:<br>
                <br>
                <br>
                ---<br>
                <br>
                Course: ${courseData.fullTitle}<br>
                ${lessonData.title}<br>
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
