import { FontAwesome5 } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import LanguageHomeTopButton from "@/src/components/language-home/LanguageHomeTopButton";
import CourseData from "@/src/data/courseData";
import { useCurrentCourse } from "@/src/hooks/useCourseLessonData";
import useStatusBarStyle from "@/src/hooks/useStatusBarStyle";
import {
  PreferenceCompleteInglesLaunchBannerDismissed,
  setPreference,
  usePreference,
} from "@/src/storage/persistence";
import { useLogger } from "@/src/utils/log";

const LANGUAGE_HOME_LOG_CONTEXT = {
  surface: "language_home",
};

const LanguageHomeScreen = () => {
  const course = useCurrentCourse();
  const router = useRouter();
  const [loadingMetadata, setLoadingMetadata] = useState(true);
  const [showWarning, setShowWarning] = useState(false);
  const [metadataError, setMetadataError] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const metadataLoaded = CourseData.isCourseMetadataLoaded(course);
  const launchBannerDismissed = usePreference(
    PreferenceCompleteInglesLaunchBannerDismissed
  );
  const log = useLogger(LANGUAGE_HOME_LOG_CONTEXT);

  useStatusBarStyle("white", "dark-content");

  useFocusEffect(
    useCallback(() => {
      let active = true;
      let timeout: ReturnType<typeof setTimeout> | null = null;

      const load = async () => {
        setLoadingMetadata(true);
        setMetadataError(false);
        timeout = setTimeout(() => {
          if (active) {
            log({
              action: "show_metadata_warning",
            });
            setShowWarning(true);
          }
        }, 5000);

        try {
          await CourseData.loadCourseMetadata(course, loadAttempt > 0);
        } catch (error) {
          console.warn(`Failed to load metadata for ${course}`, error);
          log({ action: "load_metadata_error" });
          if (active) {
            setMetadataError(true);
          }
        } finally {
          if (timeout !== null) {
            clearTimeout(timeout);
          }
          if (active) {
            setLoadingMetadata(false);
            setShowWarning(false);
          }
        }
      };

      load();

      return () => {
        active = false;
        if (timeout !== null) {
          clearTimeout(timeout);
        }
      };
    }, [course, loadAttempt, log])
  );

  if (metadataError) {
    return (
      <View style={styles.loaderContainer}>
        <FontAwesome5 name="exclamation-circle" size={32} color="#555" />
        <Text style={styles.errorTitle}>Unable to load this course</Text>
        <Text style={styles.errorText}>
          Check your Internet connection, then try again.
        </Text>
        <Pressable
          accessibilityRole="button"
          android_ripple={{ color: "rgba(0,0,0,0.08)" }}
          onPress={() => setLoadAttempt((attempt) => attempt + 1)}
          style={styles.retryButton}
        >
          <Text style={styles.retryButtonText}>Try Again</Text>
        </Pressable>
      </View>
    );
  }

  if (loadingMetadata || !metadataLoaded) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" />
        {showWarning ? (
          <Text style={styles.warningText}>
            This is taking longer than expected. Check your Internet connection
            or try again in a moment.
          </Text>
        ) : null}
      </View>
    );
  }

  const extraButtons = [
    {
      label: "All Lessons",
      icon: "list-ol",
      action: () =>
        router.push({
          pathname: "/course/[course]/all-lessons",
          params: { course },
        }),
    },
    {
      label: "Data Management",
      icon: "tools",
      action: () =>
        router.push({
          pathname: "/course/[course]/data",
          params: { course },
        }),
    },
    {
      label: "Visit languagetransfer.org",
      icon: "link",
      action: () => {
        log({ action: "visit_website" });
        Linking.openURL("https://www.languagetransfer.org/");
      },
    },
  ];

  return (
    <ScrollView style={styles.body}>
      {course === "ingles_completo" && launchBannerDismissed === false ? (
        <View style={styles.launchBanner}>
          <View style={styles.launchBannerHeader}>
            <FontAwesome5 name="info-circle" size={18} color="#33436e" />
            <View style={styles.launchBannerTextContainer}>
              <Text style={styles.launchBannerTitle}>¡Nuevo curso!</Text>
              <Text style={styles.launchBannerText}>
                ¡&apos;Inglés Completo&apos; ya se está lanzando!
              </Text>
              <Text style={styles.launchBannerText}>
                Empieza desde el principio de este nuevo curso
              </Text>
            </View>
            <Pressable
              accessibilityLabel="Cerrar anuncio del nuevo curso"
              accessibilityRole="button"
              hitSlop={10}
              onPress={() => {
                log({ action: "dismiss_complete_ingles_launch_banner" });
                void setPreference(
                  PreferenceCompleteInglesLaunchBannerDismissed,
                  true
                );
              }}
              style={styles.launchBannerDismiss}
            >
              <FontAwesome5 name="times" size={16} color="#33436e" />
            </Pressable>
          </View>
        </View>
      ) : null}
      <LanguageHomeTopButton course={course} />
      {extraButtons.map((button) => (
        <Pressable
          key={button.label}
          android_ripple={{ color: "rgba(0,0,0,0.08)" }}
          style={styles.additionalButton}
          onPress={button.action}
        >
          <Text style={styles.additionalButtonText}>{button.label}</Text>
          <FontAwesome5 name={button.icon as any} size={18} />
        </Pressable>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  body: {
    flex: 1,
    backgroundColor: "#eee",
  },
  loaderContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  warningText: {
    marginTop: 16,
    textAlign: "center",
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 16,
  },
  errorText: {
    color: "#555",
    fontSize: 16,
    marginTop: 8,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "white",
    borderRadius: 8,
    elevation: 2,
    marginTop: 20,
    overflow: "hidden",
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  launchBanner: {
    backgroundColor: "#d5daee",
    borderRadius: 12,
    marginHorizontal: 25,
    marginTop: 25,
    padding: 18,
  },
  launchBannerHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
  },
  launchBannerTextContainer: {
    flex: 1,
    gap: 4,
    marginHorizontal: 12,
  },
  launchBannerTitle: {
    color: "#263556",
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 24,
  },
  launchBannerText: {
    color: "#263556",
    fontSize: 16,
    lineHeight: 22,
  },
  launchBannerDismiss: {
    alignItems: "center",
    height: 32,
    justifyContent: "center",
    marginRight: -8,
    marginTop: -8,
    width: 32,
  },
  additionalButton: {
    marginHorizontal: 25,
    marginBottom: 20,
    borderRadius: 12,
    backgroundColor: "white",
    elevation: 2,
    padding: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  additionalButtonText: {
    fontSize: 20,
    fontWeight: "600",
  },
});

export default LanguageHomeScreen;
