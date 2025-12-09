import { FontAwesome5 } from "@expo/vector-icons";
import formatDuration from "format-duration";
import prettyBytes from "pretty-bytes";
import React, { useMemo } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import CourseData from "@/src/data/courseData";
import useIsLessonDownloaded from "@/src/hooks/useIsLessonDownloaded";
import DownloadManager, {
  useDownloadStatus,
} from "@/src/services/downloadManager";
import { genProgressForLesson, usePreference } from "@/src/storage/persistence";
import type { Course } from "@/src/types";
import { log } from "@/src/utils/log";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";

type Props = {
  course: Course;
  lesson: number;
  onDownloadStateChange: () => void;
};

const LessonRow = ({ course, lesson, onDownloadStateChange }: Props) => {
  const { data: progress } = useQuery({
    queryKey: ["@local", "progress", course, lesson],
    queryFn: () => genProgressForLesson(course, lesson),
  });
  const downloaded = useIsLessonDownloaded(course, lesson);
  const downloadState = useDownloadStatus(course, lesson);
  const downloadQuality = usePreference<"high" | "low">(
    "download-quality",
    "high"
  );
  const router = useRouter();
  const bundled = useMemo(
    () => lesson === 0 && Boolean(CourseData.getBundledFirstLesson(course)),
    [course, lesson]
  );

  const downloading =
    downloadState &&
    downloadState.state === "downloading" &&
    !downloadState.errorMessage;

  const handleDownloadClick = async () => {
    if (bundled || downloaded === null) {
      return;
    }

    if (downloading) {
      log({
        action: "cancel_download",
        surface: "all_lessons",
        course,
        lesson,
      });
      DownloadManager.stopDownload(
        DownloadManager.getDownloadId(course, lesson)
      );
      onDownloadStateChange();
      return;
    }

    if (downloaded) {
      log({
        action: "delete_download",
        surface: "all_lessons",
        course,
        lesson,
      });
      await DownloadManager.genDeleteDownload(course, lesson);
      onDownloadStateChange();
      return;
    }

    log({
      action: "download_lesson",
      surface: "all_lessons",
      course,
      lesson,
    });
    try {
      await DownloadManager.startDownload(course, lesson);
      onDownloadStateChange();
    } catch (err) {
      log({
        action: "download_error",
        surface: "all_lessons",
        course,
        lesson,
        message: err instanceof Error ? err.message : String(err),
      });
      Alert.alert(
        "Unable to download lesson",
        err instanceof Error ? err.message : "Unknown error"
      );
    }
  };

  const renderDownloadAccessory = () => {
    if (bundled) {
      return (
        <>
          <FontAwesome5 name="lock" size={16} color="#999" />
          <Text style={styles.lessonSizeText}>Included</Text>
        </>
      );
    }

    if (downloaded) {
      return <FontAwesome5 name="trash" size={18} color="#555" />;
    }

    if (downloading) {
      if (downloadState?.totalBytes) {
        const percent = Math.round(
          (downloadState.bytesWritten / downloadState.totalBytes) * 100
        );
        return <Text style={styles.progressText}>{percent}%</Text>;
      }
      return <ActivityIndicator size="small" color="#555" />;
    }

    if (downloadState?.errorMessage) {
      return (
        <FontAwesome5 name="exclamation-triangle" size={18} color="#e74c3c" />
      );
    }

    return <FontAwesome5 name="download" size={18} color="#555" />;
  };

  const finished = progress?.finished;
  const ready = progress !== null && downloaded !== null;

  return (
    <View style={styles.row}>
      <Pressable
        style={styles.lessonBox}
        onPress={() =>
          router.push({
            pathname: "/course/[course]/listen/[lesson]",
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
            <Text style={styles.lessonTitleText}>
              {CourseData.getLessonTitle(course, lesson)}
            </Text>
            <Text style={styles.lessonDurationText}>
              {formatDuration(
                CourseData.getLessonDuration(course, lesson) * 1000
              )}
            </Text>
          </View>
        </View>
      </Pressable>
      <Pressable
        style={[styles.downloadBox, bundled && styles.downloadBoxDisabled]}
        onPress={handleDownloadClick}
        disabled={bundled}
      >
        {downloadQuality === null || !ready ? (
          <ActivityIndicator size="small" color="#888" />
        ) : (
          <>
            {renderDownloadAccessory()}
            {!bundled ? (
              <Text style={styles.lessonSizeText}>
                {prettyBytes(
                  CourseData.getLessonSizeInBytes(
                    course,
                    lesson,
                    downloadQuality
                  )
                )}
              </Text>
            ) : null}
          </>
        )}
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
  },
  lessonBox: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "white",
    borderBottomColor: "#ccc",
    borderBottomWidth: 1,
    flex: 1,
  },
  downloadBox: {
    width: 72,
    borderBottomColor: "#ccc",
    borderBottomWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    paddingVertical: 8,
    gap: 4,
  },
  downloadBoxDisabled: {
    opacity: 0.5,
  },
  text: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  lessonTitleText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  lessonDurationText: {
    fontSize: 14,
    color: "#555",
  },
  lessonSizeText: {
    fontSize: 12,
    color: "#888",
    marginTop: 4,
  },
  finishedIcon: {
    width: 16,
  },
  progressText: {
    fontSize: 16,
    fontVariant: ["tabular-nums"],
  },
});

export default LessonRow;
