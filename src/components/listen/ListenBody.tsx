import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import formatDuration from 'format-duration';
import { useRouter } from 'expo-router';

import CourseData from '@/src/data/courseData';
import ListenScrubber from '@/src/components/listen/ListenScrubber';
import DownloadManager from '@/src/services/downloadManager';
import { useLessonAudio } from '@/src/services/audioPlayer';
import { genMarkLessonFinished } from '@/src/storage/persistence';
import type { Course } from '@/src/types';
import useIsLessonDownloaded from '@/src/hooks/useIsLessonDownloaded';
import { log } from '@/src/utils/log';

type Props = {
  course: Course;
  lesson: number;
  isActive: boolean;
};

const ListenBody = ({ course, lesson, isActive }: Props) => {
  const controls = useLessonAudio(course, lesson, { active: isActive });
  const downloaded = useIsLessonDownloaded(course, lesson);
  const [busyAction, setBusyAction] = useState<'download' | 'delete' | null>(null);
  const router = useRouter();

  const lessonTitle = CourseData.getLessonTitle(course, lesson);
  const duration = CourseData.getLessonDuration(course, lesson);
  const colors = CourseData.getCourseUIColors(course);

  const reportMailto = useMemo(() => {
    return (
      'mailto:info@languagetransfer.org' +
      `?subject=${encodeURIComponent(`Feedback about ${CourseData.getCourseFullTitle(course)}`)}` +
      `&body=${encodeURIComponent(
        `Hi! I found a problem with the ${CourseData.getCourseFullTitle(course)} course:\n\nLesson: ${lessonTitle}\nPosition: ${formatDuration(
          controls.position * 1000,
        )}`,
      )}`
    );
  }, [controls.position, course, lessonTitle]);

  const handleDownloadToggle = async () => {
    if (downloaded === null) {
      return;
    }

    setBusyAction(downloaded ? 'delete' : 'download');
    try {
      if (downloaded) {
        log({
          action: 'delete_download',
          surface: 'listen_screen',
          course,
          lesson,
        });
        await DownloadManager.genDeleteDownload(course, lesson);
      } else {
        log({
          action: 'download_lesson',
          surface: 'listen_screen',
          course,
          lesson,
        });
        await DownloadManager.startDownload(course, lesson);
      }
    } catch (err) {
      Alert.alert(
        downloaded ? 'Unable to delete download' : 'Unable to download lesson',
        err instanceof Error ? err.message : 'Unknown error',
      );
      log({
        action: downloaded ? 'delete_download_error' : 'download_error',
        course,
        lesson,
        surface: 'listen_screen',
        message: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setBusyAction(null);
    }
  };

  const handleMarkFinished = async () => {
    log({
      action: 'mark_finished',
      surface: 'listen_screen',
      course,
      lesson,
      position: controls.position,
    });
    await genMarkLessonFinished(course, lesson);
    router.back();
  };

  if (controls.error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{controls.error.message}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.body, { backgroundColor: colors.background }]}>
      <View style={styles.lessonName}>
        <Text style={[styles.courseTitle, { color: colors.text }]}>
          {CourseData.getCourseShortTitle(course)}
        </Text>
        <Text style={[styles.lesson, { color: colors.text }]}>{lessonTitle}</Text>
      </View>

      <View style={styles.icons}>
        <Pressable
          onPress={() => controls.skipBack()}
          android_ripple={{ color: 'rgba(255,255,255,0.2)', borderless: true }}
        >
          <MaterialIcons name="replay-10" size={42} color={colors.text} />
        </Pressable>

        {controls.ready ? (
          <Pressable
            onPress={() => controls.toggle()}
            android_ripple={{ color: 'rgba(255,255,255,0.2)', borderless: true }}
            style={styles.playButton}
          >
            <FontAwesome5
              name={controls.playing ? 'pause' : 'play'}
              size={64}
              color={colors.text}
            />
          </Pressable>
        ) : (
          <ActivityIndicator size={64} color={colors.text} />
        )}

        <Pressable
          onPress={handleMarkFinished}
          android_ripple={{ color: 'rgba(255,255,255,0.2)', borderless: true }}
        >
          <FontAwesome5 name="check" size={42} color={colors.text} />
        </Pressable>
      </View>

      <ListenScrubber
        course={course}
        lesson={lesson}
        position={controls.position}
        duration={duration}
        seekTo={controls.seekTo}
      />

      <View style={styles.actionRow}>
        <Pressable
          style={styles.actionButton}
          onPress={handleDownloadToggle}
          disabled={busyAction !== null || downloaded === null}
        >
          {busyAction || downloaded === null ? (
            <ActivityIndicator size="small" color="#555" />
          ) : (
            <FontAwesome5 name={downloaded ? 'trash' : 'download'} size={18} color="#555" />
          )}
          <Text style={styles.actionButtonText}>{downloaded ? 'Delete download' : 'Download for offline'}</Text>
        </Pressable>
        <Pressable style={styles.actionButton} onPress={() => Linking.openURL(reportMailto)}>
          <FontAwesome5 name="exclamation-triangle" size={18} color="#555" />
          <Text style={styles.actionButtonText}>Report a problem</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  lessonName: {
    alignItems: 'center',
  },
  courseTitle: {
    fontWeight: 'bold',
    fontSize: 48,
  },
  lesson: {
    fontSize: 32,
  },
  icons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  playButton: {
    paddingHorizontal: 20,
  },
  actionRow: {
    width: '100%',
    marginTop: 24,
    gap: 12,
  },
  actionButton: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionButtonText: {
    fontSize: 16,
    color: '#333',
    flexShrink: 1,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: '#fff',
  },
});

export default ListenBody;
