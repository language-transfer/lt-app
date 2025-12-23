import { FontAwesome5, MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import formatDuration from "format-duration";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Linking,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import ListenScrubber from "@/src/components/listen/ListenScrubber";
import CourseData from "@/src/data/courseData";
import {
  useCurrentCourse,
  useCurrentCourseColors,
  useCurrentLesson,
} from "@/src/hooks/useCourseLessonData";
import { stopLessonAudio, useLessonAudio } from "@/src/services/audioPlayer";
import {
  CourseDownloadManager,
  useLessonDownloadStatus,
} from "@/src/services/downloadManager";
import { genMarkLessonFinished } from "@/src/storage/persistence";
import { useLogger } from "@/src/utils/log";
import { SafeAreaView } from "react-native-safe-area-context";

const ListenBody = () => {
  const course = useCurrentCourse();
  const lesson = useCurrentLesson();
  const controls = useLessonAudio(course, lesson);
  const downloadStatus = useLessonDownloadStatus(course, lesson);
  const downloaded = downloadStatus === "downloaded";
  const [busyAction, setBusyAction] = useState<"download" | "delete" | null>(
    null
  );
  const [sheetOpen, setSheetOpen] = useState(false);
  const router = useRouter();
  const latestPositionRef = useRef(0);
  const sheetAnim = useRef(new Animated.Value(0)).current;

  const lessonTitle = CourseData.getLessonTitle(course, lesson);
  const duration = CourseData.getLessonDuration(course, lesson);
  const colors = useCurrentCourseColors();
  const log = useLogger({
    surface: "listen_screen",
  });

  useEffect(() => {
    latestPositionRef.current = controls.position;
  }, [controls.position]);

  const reportMailto = useMemo(() => {
    return (
      "mailto:info@languagetransfer.org" +
      `?subject=${encodeURIComponent(
        `Feedback about ${CourseData.getCourseFullTitle(course)}`
      )}` +
      `&body=${encodeURIComponent(
        `Hi! I found a problem with the ${CourseData.getCourseFullTitle(
          course
        )} course:\n\nLesson: ${lessonTitle}\nPosition: ${formatDuration(
          controls.position * 1000
        )}`
      )}`
    );
  }, [controls.position, course, lessonTitle]);

  const openSheet = () => {
    if (sheetOpen) {
      return;
    }
    log({
      action: "open_bottom_sheet",
      position: latestPositionRef.current,
    });
    sheetAnim.setValue(0);
    setSheetOpen(true);
    requestAnimationFrame(() => {
      Animated.timing(sheetAnim, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
    });
  };

  const closeSheet = () => {
    if (!sheetOpen) {
      return;
    }
    log({
      action: "close_bottom_sheet",
      position: latestPositionRef.current,
    });
    Animated.timing(sheetAnim, {
      toValue: 0,
      duration: 200,
      easing: Easing.in(Easing.ease),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        setSheetOpen(false);
      }
    });
  };

  const handleDownloadToggle = async () => {
    if (downloaded === null) {
      return;
    }

    setBusyAction(downloaded ? "delete" : "download");
    try {
      if (downloaded) {
        log({
          action: "delete_download",
          surface: "listen_bottom_sheet",
        });
        await stopLessonAudio();
        await CourseDownloadManager.unrequestDownload(course, lesson);
      } else {
        log({
          action: "download_lesson",
          surface: "listen_bottom_sheet",
        });
        await CourseDownloadManager.requestDownload(course, lesson);
      }
    } catch (err) {
      Alert.alert(
        downloaded ? "Unable to delete download" : "Unable to download lesson",
        err instanceof Error ? err.message : "Unknown error"
      );
      log({
        action: downloaded ? "delete_download_error" : "download_error",
        surface: "listen_bottom_sheet",
        message: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setBusyAction(null);
    }
  };

  const handleMarkFinished = async () => {
    closeSheet();
    log({
      action: "mark_finished",
      surface: "listen_bottom_sheet",
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
    <View style={[styles.body, { backgroundColor: colors?.background }]}>
      <View style={styles.lessonName}>
        <Text style={[styles.courseTitle, { color: colors?.text }]}>
          {CourseData.getCourseShortTitle(course)}
        </Text>
        <Text style={[styles.lesson, { color: colors?.text }]}>
          {lessonTitle}
        </Text>
      </View>

      <View style={styles.icons}>
        <Pressable
          onPress={() => controls.skipBack()}
          android_ripple={{ color: "rgba(255,255,255,0.2)", borderless: true }}
        >
          <MaterialIcons name="replay-10" size={42} color={colors?.text} />
        </Pressable>

        {controls.ready ? (
          <Pressable
            onPress={() => controls.toggle()}
            android_ripple={{
              color: "rgba(255,255,255,0.2)",
              borderless: true,
            }}
            style={styles.playButton}
          >
            <FontAwesome5
              name={controls.playing ? "pause" : "play"}
              size={64}
              color={colors?.text}
            />
          </Pressable>
        ) : (
          <ActivityIndicator size={64} color={colors?.text} />
        )}

        <Pressable
          onPress={openSheet}
          android_ripple={{ color: "rgba(255,255,255,0.2)", borderless: true }}
        >
          <MaterialIcons name="settings" size={42} color={colors?.text} />
        </Pressable>
      </View>

      <ListenScrubber
        course={course}
        lesson={lesson}
        position={controls.position}
        duration={duration}
        seekTo={controls.seekTo}
      />

      {sheetOpen ? (
        <Modal
          animationType="none"
          transparent
          visible={sheetOpen}
          onRequestClose={closeSheet}
        >
          <SafeAreaView style={{ flex: 1 }}>
            <View style={styles.sheetOverlay}>
              <Animated.View
                style={[
                  styles.sheetBackdrop,
                  {
                    opacity: sheetAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 0.35],
                    }),
                  },
                ]}
              >
                <Pressable
                  style={StyleSheet.absoluteFill}
                  onPress={closeSheet}
                />
              </Animated.View>
              <Animated.View
                style={[
                  styles.sheetContainer,
                  {
                    transform: [
                      {
                        translateY: sheetAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [400, 0],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <View style={styles.sheetHandle} />
                <SheetRow
                  label="Mark as finished"
                  icon={<FontAwesome5 name="check" size={20} color="#222" />}
                  onPress={handleMarkFinished}
                />
                <SheetRow
                  label={
                    downloaded ? "Delete download" : "Download for offline"
                  }
                  icon={
                    busyAction || downloaded === null ? (
                      <ActivityIndicator size="small" color="#555" />
                    ) : (
                      <FontAwesome5
                        name={downloaded ? "trash" : "download"}
                        size={18}
                        color="#222"
                      />
                    )
                  }
                  disabled={busyAction !== null || downloaded === null}
                  onPress={async () => {
                    await handleDownloadToggle();
                    closeSheet();
                  }}
                />
                <SheetRow
                  label="Report a problem"
                  icon={
                    <FontAwesome5
                      name="exclamation-triangle"
                      size={18}
                      color="#222"
                    />
                  }
                  onPress={() => {
                    Linking.openURL(reportMailto);
                    closeSheet();
                  }}
                />
              </Animated.View>
            </View>
          </SafeAreaView>
        </Modal>
      ) : null}
    </View>
  );
};

const SheetRow = ({
  label,
  icon,
  onPress,
  disabled,
}: {
  label: string;
  icon: React.ReactNode;
  onPress: () => void | Promise<void>;
  disabled?: boolean;
}) => (
  <Pressable
    android_ripple={{ color: "rgba(0,0,0,0.08)" }}
    onPress={onPress}
    disabled={disabled}
  >
    <View style={[styles.sheetRow, disabled && styles.sheetRowDisabled]}>
      <Text style={styles.sheetRowText}>{label}</Text>
      <View style={styles.sheetRowIcon}>{icon}</View>
    </View>
  </Pressable>
);

const styles = StyleSheet.create({
  body: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  lessonName: {
    alignItems: "center",
  },
  courseTitle: {
    fontWeight: "bold",
    fontSize: 48,
  },
  lesson: {
    fontSize: 32,
  },
  icons: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
  },
  playButton: {
    paddingHorizontal: 20,
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    color: "#fff",
  },
  sheetOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  sheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000",
  },
  sheetContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingVertical: 8,
    paddingBottom: 24,
    paddingHorizontal: 8,
    gap: 4,
  },
  sheetHandle: {
    alignSelf: "center",
    width: 48,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#ccc",
    marginVertical: 8,
  },
  sheetRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  sheetRowDisabled: {
    opacity: 0.5,
  },
  sheetRowText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111",
  },
  sheetRowIcon: {
    width: 28,
    alignItems: "flex-end",
  },
});

export default ListenBody;
