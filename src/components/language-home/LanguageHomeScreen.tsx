import { FontAwesome5 } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
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
import useStatusBarStyle from "@/src/hooks/useStatusBarStyle";
import type { CourseName } from "@/src/types";
import { log } from "@/src/utils/log";

const LanguageHomeScreen = () => {
  const { course } = useLocalSearchParams<{ course: CourseName }>();
  const router = useRouter();
  const [loadingMetadata, setLoadingMetadata] = useState(true);
  const [showWarning, setShowWarning] = useState(false);
  const metadataLoaded = CourseData.isCourseMetadataLoaded(course);

  useStatusBarStyle("white", "dark-content");

  useFocusEffect(
    useCallback(() => {
      let active = true;
      let timeout: ReturnType<typeof setTimeout> | null = null;

      const load = async () => {
        setLoadingMetadata(true);
        timeout = setTimeout(() => {
          if (active) {
            log({
              action: "show_metadata_warning",
              surface: "language_home",
              course,
            });
            setShowWarning(true);
          }
        }, 5000);

        try {
          await CourseData.loadCourseMetadata(course);
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
    }, [course])
  );

  if (loadingMetadata || !metadataLoaded) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" />
        {showWarning ? (
          <Text style={styles.warningText}>
            If this screen does not load, check your Internet connection or try
            reinstalling the Language Transfer app.
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
        log({ action: "visit_website", surface: "language_home", course });
        Linking.openURL("https://www.languagetransfer.org/");
      },
    },
  ];

  return (
    <ScrollView style={styles.body}>
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
