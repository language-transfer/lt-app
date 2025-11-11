import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import prettyBytes from 'pretty-bytes';

import CourseData from '@/src/data/courseData';
import LessonRow from '@/src/components/all-lessons/LessonRow';
import DownloadManager from '@/src/services/downloadManager';
import { usePreference } from '@/src/storage/persistence';
import type { Course } from '@/src/types';

const AllLessonsScreen = () => {
  const params = useLocalSearchParams<{ course: string }>();
  const course = (params.course ?? 'spanish') as Course;
  const indices = useMemo(() => CourseData.getLessonIndices(course), [course]);
  const [downloadedCount, setDownloadedCount] = useState<number | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);
  const [downloadAllLoading, setDownloadAllLoading] = useState(false);
  const downloadQuality = usePreference<'high' | 'low'>('download-quality', 'high');

  const refreshCounts = useCallback(async () => {
    const results = await Promise.all(
      indices.map((lesson) =>
        DownloadManager.genIsDownloadedForDownloadId(DownloadManager.getDownloadId(course, lesson)),
      ),
    );
    setDownloadedCount(results.filter(Boolean).length);
  }, [course, indices]);

  useEffect(() => {
    refreshCounts();
  }, [refreshCounts, refreshToken]);

  useFocusEffect(
    useCallback(() => {
      refreshCounts();
    }, [refreshCounts]),
  );

  const handleDownloadAll = async () => {
    if (!downloadQuality) {
      return;
    }

    setDownloadAllLoading(true);
    const downloadedMask = await Promise.all(
      indices.map((lesson) =>
        DownloadManager.genIsDownloadedForDownloadId(DownloadManager.getDownloadId(course, lesson)),
      ),
    );
    const missing = indices.filter((_, idx) => !downloadedMask[idx]);
    const totalBytes = missing
      .map((lesson) => CourseData.getLessonSizeInBytes(course, lesson, downloadQuality))
      .reduce((acc, cur) => acc + cur, 0);

    setDownloadAllLoading(false);

    if (missing.length === 0) {
      return;
    }

    const confirmed = await new Promise<boolean>((resolve) => {
      Alert.alert(
        'Download all lessons?',
        `This will download ${missing.length} lessons (${prettyBytes(totalBytes)}) for offline playback.`,
        [
          { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
          { text: 'OK', onPress: () => resolve(true) },
        ],
      );
    });

    if (!confirmed) {
      return;
    }

    missing.forEach((lesson) => {
      DownloadManager.startDownload(course, lesson).catch(() => {});
    });
  };

  if (downloadQuality === null) {
    return null;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={indices}
        keyExtractor={(lesson) => String(lesson)}
        renderItem={({ item }) => (
          <LessonRow
            course={course}
            lesson={item}
            onDownloadStateChange={() => setRefreshToken((token) => token + 1)}
          />
        )}
      />
      <View style={styles.bottomBar}>
        <Text style={styles.bottomLeftText}>
          {downloadedCount ?? '-'} / {indices.length} downloaded
        </Text>
        <Pressable
          style={[styles.allButton, downloadedCount === indices.length && styles.allButtonDisabled]}
          onPress={handleDownloadAll}
          disabled={downloadedCount === indices.length || downloadAllLoading}
        >
          {downloadAllLoading ? (
            <ActivityIndicator size="small" color="#2980b9" />
          ) : (
            <FontAwesome5 name="download" size={16} color="#2980b9" />
          )}
          <Text style={styles.allText}>Download All</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderTopColor: '#eee',
    borderTopWidth: 1,
  },
  bottomLeftText: {
    fontSize: 16,
  },
  allButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#2980b9',
  },
  allButtonDisabled: {
    opacity: 0.5,
  },
  allText: {
    color: '#2980b9',
    fontWeight: '600',
  },
});

export default AllLessonsScreen;
