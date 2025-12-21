import { FontAwesome5 } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import prettyBytes from "pretty-bytes";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import LessonRow from "@/src/components/all-lessons/LessonRow";
import CourseData from "@/src/data/courseData";
import useStatusBarStyle from "@/src/hooks/useStatusBarStyle";
import {
  CourseDownloadManager,
  useDownloadCount,
} from "@/src/services/downloadManager";
import { usePreference } from "@/src/storage/persistence";
import type { CourseName } from "@/src/types";

const AllLessonsScreen = () => {
  const params = useLocalSearchParams<{ course: string }>();
  const course = (params.course ?? "spanish") as CourseName;
  useStatusBarStyle("white", "dark-content");
  const [metadataReady, setMetadataReady] = useState(() =>
    CourseData.isCourseMetadataLoaded(course)
  );
  const indices = useMemo(
    () => (metadataReady ? CourseData.getLessonIndices(course) : []),
    [course, metadataReady]
  );
  const downloadedCount = useDownloadCount(course);
  const [downloadAllLoading, setDownloadAllLoading] = useState(false);
  const downloadQuality = usePreference<"high" | "low">(
    "download-quality",
    "high"
  );

  useEffect(() => {
    let active = true;
    const ensureMetadata = async () => {
      if (!CourseData.isCourseMetadataLoaded(course)) {
        setMetadataReady(false);
        await CourseData.loadCourseMetadata(course);
      }
      if (active) {
        setMetadataReady(true);
      }
    };

    ensureMetadata();
    return () => {
      active = false;
    };
  }, [course]);

  const handleDownloadAll = async () => {
    if (!downloadQuality || !metadataReady) {
      return;
    }

    setDownloadAllLoading(true);
    const downloadedMask = await Promise.all(
      indices.map((lesson) =>
        CourseDownloadManager.getDownloadStatus(course, lesson).then(
          (status) => status === "downloaded"
        )
      )
    );
    const missing = indices.filter((_, idx) => !downloadedMask[idx]);
    const totalBytes = missing
      .map((lesson) =>
        CourseData.getLessonSizeInBytes(course, lesson, downloadQuality)
      )
      .reduce((acc, cur) => acc + cur, 0);

    setDownloadAllLoading(false);

    if (missing.length === 0) {
      return;
    }

    const confirmed = await new Promise<boolean>((resolve) => {
      Alert.alert(
        "Download all lessons?",
        `This will download ${missing.length} lessons (${prettyBytes(
          totalBytes
        )}) for offline playback.`,
        [
          { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
          { text: "OK", onPress: () => resolve(true) },
        ]
      );
    });

    if (!confirmed) {
      return;
    }

    missing.forEach((lesson) => {
      CourseDownloadManager.requestDownload(course, lesson).catch(() => {});
    });
  };

  if (!metadataReady || downloadQuality === null) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.listContainer}>
        <FlatList
          data={indices}
          keyExtractor={(lesson) => String(lesson)}
          renderItem={({ item }) => <LessonRow course={course} lesson={item} />}
        />
      </View>
      <View style={styles.bottomBar}>
        <Text style={styles.bottomLeftText}>
          {downloadedCount ?? "-"} / {indices.length} downloaded
        </Text>
        <Pressable
          style={[
            styles.allButton,
            downloadedCount === indices.length && styles.allButtonDisabled,
          ]}
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
    backgroundColor: "#f5f5f5",
  },
  loader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  listContainer: {
    flex: 1,
  },
  bottomBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderTopColor: "#eee",
    borderTopWidth: 1,
  },
  bottomLeftText: {
    fontSize: 16,
  },
  allButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#2980b9",
  },
  allButtonDisabled: {
    opacity: 0.5,
  },
  allText: {
    color: "#2980b9",
    fontWeight: "600",
  },
});

export default AllLessonsScreen;
