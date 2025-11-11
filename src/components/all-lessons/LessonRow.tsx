import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import formatDuration from 'format-duration';
import prettyBytes from 'pretty-bytes';

import CourseData from '@/src/data/courseData';
import DownloadManager, { useDownloadStatus } from '@/src/services/downloadManager';
import { genProgressForLesson, Progress, usePreference } from '@/src/storage/persistence';
import type { Course } from '@/src/types';
import { useRouter } from 'expo-router';

type Props = {
  course: Course;
  lesson: number;
  onDownloadStateChange: () => void;
};

const LessonRow = ({ course, lesson, onDownloadStateChange }: Props) => {
  const [progress, setProgress] = useState<Progress | null>(null);
  const [downloaded, setDownloaded] = useState<boolean | null>(null);
  const downloadState = useDownloadStatus(course, lesson);
  const downloadQuality = usePreference<'high' | 'low'>('download-quality', 'high');
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const [progressResp, downloadedResp] = await Promise.all([
        genProgressForLesson(course, lesson),
        DownloadManager.genIsDownloaded(course, lesson),
      ]);
      if (mounted) {
        setProgress(progressResp);
        setDownloaded(downloadedResp);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [course, lesson, downloadState]);

  const downloading =
    downloadState && downloadState.state === 'downloading' && !downloadState.errorMessage;

  const handleDownloadClick = async () => {
    if (downloading) {
      DownloadManager.stopDownload(DownloadManager.getDownloadId(course, lesson));
      return;
    }

    if (downloaded) {
      await DownloadManager.genDeleteDownload(course, lesson);
      onDownloadStateChange();
      return;
    }

    await DownloadManager.startDownload(course, lesson);
    onDownloadStateChange();
  };

  const renderDownloadAccessory = () => {
    if (downloaded) {
      return <FontAwesome5 name="trash" size={18} color="#555" />;
    }

    if (downloading && downloadState?.totalBytes) {
      const percent = Math.round((downloadState.bytesWritten / downloadState.totalBytes) * 100);
      return (
        <Text style={styles.progressText}>{percent}%</Text>
      );
    }

    if (downloadState?.errorMessage) {
      return <FontAwesome5 name="exclamation-triangle" size={18} color="#e74c3c" />;
    }

    return <FontAwesome5 name="download" size={18} color="#555" />;
  };

  const finished = progress?.finished;

  return (
    <View style={styles.row}>
      <Pressable
        style={styles.lessonBox}
        onPress={() =>
          router.push({
            pathname: '/course/[course]/listen/[lesson]',
            params: { course, lesson: lesson.toString() },
          })
        }
      >
        <View style={styles.text}>
          <FontAwesome5
            name="check"
            size={16}
            color="#2ecc71"
            style={[styles.finishedIcon, { opacity: finished ? 1 : 0 }]}
          />
          <View>
            <Text style={styles.lessonTitleText}>{CourseData.getLessonTitle(course, lesson)}</Text>
            <Text style={styles.lessonDurationText}>
              {formatDuration(CourseData.getLessonDuration(course, lesson) * 1000)}
            </Text>
          </View>
        </View>
      </Pressable>
      <Pressable style={styles.downloadBox} onPress={handleDownloadClick}>
        {downloadQuality === null || downloaded === null ? (
          <ActivityIndicator size="small" color="#888" />
        ) : (
          <>
            {renderDownloadAccessory()}
            <Text style={styles.lessonSizeText}>
              {prettyBytes(CourseData.getLessonSizeInBytes(course, lesson, downloadQuality))}
            </Text>
          </>
        )}
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
  },
  lessonBox: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomColor: '#ccc',
    borderBottomWidth: 1,
    flex: 1,
  },
  downloadBox: {
    width: 72,
    borderBottomColor: '#ccc',
    borderBottomWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  text: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  lessonTitleText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  lessonDurationText: {
    fontSize: 14,
    color: '#555',
  },
  lessonSizeText: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  finishedIcon: {
    width: 16,
  },
  progressText: {
    fontSize: 16,
    fontVariant: ['tabular-nums'],
  },
});

export default LessonRow;
