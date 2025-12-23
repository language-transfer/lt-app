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
import { useCurrentCourse } from "@/src/hooks/useCourseLessonData";
import {
  CourseDownloadManager,
  useLessonDownloadStatus,
} from "@/src/services/downloadManager";
import { useLessonProgress, usePreference } from "@/src/storage/persistence";
import { useLogger } from "@/src/utils/log";
import { useRouter } from "expo-router";

type Props = {
  lesson: number;
};

const LessonRow = ({ lesson }: Props) => {
  const course = useCurrentCourse();
  const progress = useLessonProgress(course, lesson);
  const downloadStatus = useLessonDownloadStatus(course, lesson);
  const downloadQuality = usePreference<"high" | "low">(
    "download-quality",
    "high"
  );
  const router = useRouter();
  const bundled = useMemo(
    () => lesson === 0 && Boolean(CourseData.getBundledFirstLesson(course)),
    [course, lesson]
  );
  const log = useLogger({
    surface: "all_lessons",
    lesson,
  });

  const downloaded = downloadStatus === "downloaded";
  const downloading =
    downloadStatus === "downloading" || downloadStatus === "enqueued";

  const handleDownloadClick = async () => {
    if (bundled || downloadStatus === undefined) {
      return;
    }

    if (downloading) {
      log({
        action: "cancel_download",
      });
      // TODO: test
      CourseDownloadManager.unrequestDownload(course, lesson);
      return;
    }

    if (downloaded) {
      log({
        action: "delete_download",
      });
      await CourseDownloadManager.unrequestDownload(course, lesson);
      return;
    }

    log({
      action: "download_lesson",
    });
    try {
      console.log("requesting download", course, lesson);
      await CourseDownloadManager.requestDownload(course, lesson);
    } catch (err) {
      log({
        action: "download_error",
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
      // TODO maybe we can do this idk
      // if (downloadStatus?.totalBytes) {
      //   const percent = Math.round(
      //     (downloadState.bytesWritten / downloadState.totalBytes) * 100
      //   );
      //   return <Text style={styles.progressText}>{percent}%</Text>;
      // }
      return <ActivityIndicator size="small" color="#555" />;
    }

    // if (downloadState?.errorMessage) {
    //   return (
    //     <FontAwesome5 name="exclamation-triangle" size={18} color="#e74c3c" />
    //   );
    // }

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
