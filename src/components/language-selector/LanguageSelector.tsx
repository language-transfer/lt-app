import React, { useRef } from "react";
import {
  Animated,
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import logo from "../../../legacy/resources/LT-logo-text.png";
import LanguageButton from "@/src/components/language-selector/LanguageButton";
import type { CourseName } from "@/src/types";

const SCREEN_HEIGHT = Dimensions.get("screen").height;
const IMAGE_HEIGHT = 0.4 * SCREEN_HEIGHT;
const CARDS_MARGIN_TOP = IMAGE_HEIGHT + 40;

const LanguageSelector = () => {
  const scrollAnim = useRef(new Animated.Value(0)).current;
  const router = useRouter();

  const goToCourse = (course: string) => {
    router.push({
      pathname: "/course/[course]",
      params: { course },
    });
  };

  return (
    <View style={styles.screenWrapper}>
      <View style={styles.pageWrapper}>
        <Animated.View
          style={[
            styles.headerImageWrapper,
            {
              transform: [
                {
                  scale: scrollAnim.interpolate({
                    inputRange: [0, IMAGE_HEIGHT / 1.5],
                    outputRange: [1, 0.9],
                    extrapolate: "clamp",
                  }),
                },
              ],
              opacity: scrollAnim.interpolate({
                inputRange: [0, IMAGE_HEIGHT / 1.5],
                outputRange: [1, 0],
                extrapolate: "clamp",
              }),
              height: IMAGE_HEIGHT,
            },
          ]}
        >
          <Image
            source={logo}
            style={styles.headerImage}
            resizeMode="contain"
            accessibilityLabel="Language Transfer"
          />
        </Animated.View>

        <Animated.ScrollView
          style={styles.scrollView}
          onScroll={Animated.event(
            [
              {
                nativeEvent: {
                  contentOffset: {
                    y: scrollAnim,
                  },
                },
              },
            ],
            { useNativeDriver: false }
          )}
          scrollEventThrottle={16}
        >
          <View style={styles.courseList}>
            <View style={styles.sectionHeaderFirst}>
              <Text style={styles.sectionHeaderText}>Language courses</Text>
            </View>
            <View style={styles.courseGrid}>
              {[
                "spanish",
                "arabic",
                "turkish",
                "german",
                "greek",
                "italian",
                "swahili",
                "french",
              ].map((course) => (
                <LanguageButton
                  key={course}
                  course={course as CourseName}
                  onPress={() => goToCourse(course)}
                />
              ))}
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionHeaderText}>For Spanish speakers</Text>
            </View>
            <View style={styles.courseGrid}>
              <LanguageButton
                course="ingles"
                onPress={() => goToCourse("ingles")}
              />
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionHeaderText}>Other courses</Text>
            </View>
            <View style={styles.courseGrid}>
              <LanguageButton
                course="music"
                onPress={() => goToCourse("music")}
              />
            </View>

            <View style={styles.aboutSectionHr} />
            <View style={styles.aboutSectionWrapper}>
              <View style={styles.aboutSection}>
                <Text style={styles.aboutSectionText}>
                  Find out more about Language Transfer and the Thinking Method:
                </Text>
                <TouchableOpacity
                  style={styles.additionalButton}
                  onPress={() => router.push("/about")}
                  activeOpacity={0.8}
                >
                  <Text style={styles.additionalButtonText}>
                    About Language Transfer
                  </Text>
                  <FontAwesome5 name="info-circle" size={20} color="#333" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Animated.ScrollView>
      </View>
      {/* <View style={styles.topTranslucent} /> */}
      {/* <Animated.View
        style={[
          styles.scrollIndicator,
          {
            opacity: scrollAnim.interpolate({
              inputRange: [0, 100],
              outputRange: [1, 0],
            }),
          },
        ]}
      >
        <Text style={styles.scrollIndicatorText}>scroll for more</Text>
        <FontAwesome5 name="angle-double-down" color="#999" size={14} />
      </Animated.View> */}
    </View>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
  },
  screenWrapper: {
    width: "100%",
    height: "100%",
    justifyContent: "space-between",
    backgroundColor: "white",
  },
  pageWrapper: {
    position: "absolute",
    width: "100%",
    height: "100%",
    top: 0,
  },
  headerImageWrapper: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 48,
  },
  headerImage: {
    width: "100%",
    height: "100%",
  },
  courseList: {
    paddingBottom: 40,
  },
  sectionHeaderFirst: {
    marginTop: CARDS_MARGIN_TOP,
    marginBottom: 10,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    marginTop: 10,
    paddingHorizontal: 20,
  },
  sectionHeaderText: {
    fontSize: 18,
    textTransform: "uppercase",
    color: "#555",
  },
  aboutSectionWrapper: {
    paddingHorizontal: 20,
    marginTop: 12,
  },
  aboutSectionHr: {
    marginHorizontal: 20,
    marginTop: 30,
    borderBottomColor: "#eee",
    borderBottomWidth: 1,
  },
  aboutSection: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    elevation: 2,
  },
  aboutSectionText: {
    fontSize: 16,
    color: "#333",
  },
  additionalButton: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#f5f5f5",
  },
  additionalButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#222",
  },
  courseGrid: {
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  scrollIndicator: {
    alignItems: "center",
    paddingBottom: 24,
  },
  scrollIndicatorText: {
    color: "#777",
    marginBottom: 4,
  },
});

export default LanguageSelector;
