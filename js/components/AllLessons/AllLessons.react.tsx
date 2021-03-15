import React, {useState, useCallback, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableNativeFeedback,
  Alert,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {FlatList} from 'react-native-gesture-handler';
import LessonRow, {LESSON_ROW_HEIGHT} from './LessonRow.react';
import StaticLessonRow from './StaticLessonRow.react';
import useStatusBarStyle from '../../hooks/useStatusBarStyle';
import CourseData from '../../course-data';
import DownloadManager from '../../download-manager';
import prettyBytes from 'pretty-bytes';
import {usePreference} from '../../persistence';

const AllLessons = ({route}) => {
  useStatusBarStyle('white', 'dark-content');
  const {course} = route.params;
  const indices = CourseData.getLessonIndices(course);

  const downloadQuality = usePreference<Quality>('download-quality', 'high');
  const [showDownloadAll, setShowDownloadAll] = useState(true);
  const downloadAll = useCallback(() => {
    // TODO(ios-merge): downloadQuality can be null
    const courseTitle = CourseData.getCourseShortTitle(course);

    // calculate size needed for all lessons
    const totalBytes = indices
      // no need to calculate the first lesson, its prebundled
      .filter((lesson) => lesson > 0)
      .map((lesson) =>
        CourseData.getLessonSizeInBytes(course, lesson, downloadQuality),
      )
      .reduce((acc, val) => acc + val, 0);

    Alert.alert(
      'Download all lessons?',
      `This will download all ${
        indices.length
      } ${courseTitle} lessons (${prettyBytes(
        totalBytes,
      )}) to your device for offline playback.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'OK',
          onPress: () => {
            indices
              // no need to download the first lesson, its prebundled
              .filter((lesson) => lesson > 0)
              .forEach((lesson) =>
                DownloadManager.startDownload(course, lesson),
              );
            setShowDownloadAll(false);
          },
        },
      ],
    );
  }, [course, indices, downloadQuality]);

  // hide the Download All button if everything is
  // already downloaded
  useEffect(() => {
    async function isEverythingAlreadyDownloaded() {
      const everythingIsDownloaded = (
        await Promise.all(
          indices.map((lesson) =>
            DownloadManager.genIsDownloadedForDownloadId(
              DownloadManager.getDownloadId(course, lesson),
            ),
          ),
        )
      ).reduce((_, val) => val, true);
      setShowDownloadAll(!everythingIsDownloaded);
    }

    isEverythingAlreadyDownloaded();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  useFocusEffect(
    useCallback(() => {
      setLastUpdateTime(new Date());
    }, []),
  );

  return (
    <FlatList
      ListHeaderComponent={
        showDownloadAll ? (
          <View style={styles.allContainer}>
            <TouchableNativeFeedback onPress={downloadAll}>
              <View style={styles.allButton}>
                <Text style={styles.allText}>
                  Download All {indices.length} Lessons
                </Text>
              </View>
            </TouchableNativeFeedback>
          </View>
        ) : null
      }
      data={indices}
      renderItem={({item}) =>
        item === 0 ? (
          <StaticLessonRow
            course={course}
            lesson={item}
            lastUpdateTime={lastUpdateTime}
          />
        ) : (
          <LessonRow
            course={course}
            lesson={item}
            lastUpdateTime={lastUpdateTime}
          />
        )
      }
      keyExtractor={(lesson) => String(lesson)}
      getItemLayout={(_, index) => ({
        length: LESSON_ROW_HEIGHT,
        offset: LESSON_ROW_HEIGHT * index,
        index,
      })}
    />
  );
};

const styles = StyleSheet.create({
  allContainer: {
    backgroundColor: '#eee',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderBottomColor: 'lightgray',
    borderBottomWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
  },
  allButton: {
    backgroundColor: '#3498db',
    borderColor: '#2980b9',
    flex: 0,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  allText: {
    color: 'white',
    fontSize: 16,
  },
});

export default AllLessons;
