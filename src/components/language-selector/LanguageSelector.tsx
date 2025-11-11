import React, { useRef } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import logo from '../../../legacy/resources/LT-logo-text.png';
import LanguageButton from '@/src/components/language-selector/LanguageButton';
import useStatusBarStyle from '@/src/hooks/useStatusBarStyle';
import type { Course } from '@/src/types';

const SCREEN_HEIGHT = Dimensions.get('screen').height;
const IMAGE_HEIGHT = 0.4 * SCREEN_HEIGHT;
const CARDS_MARGIN_TOP = IMAGE_HEIGHT + 80 + 40;

const LanguageSelector = () => {
  const scrollAnim = useRef(new Animated.Value(0)).current;
  const router = useRouter();
  useStatusBarStyle('white', 'dark-content');
  StatusBar.setTranslucent(true);

  const goToCourse = (course: string) => {
    router.push({
      pathname: '/course/[course]',
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
              opacity: scrollAnim.interpolate({
                inputRange: [0, CARDS_MARGIN_TOP / 1.5],
                outputRange: [1, 0],
              }),
              height: scrollAnim.interpolate({
                inputRange: [0, CARDS_MARGIN_TOP / 1.5],
                outputRange: [IMAGE_HEIGHT, 0.9 * IMAGE_HEIGHT],
              }),
            },
          ]}
        >
          <Image source={logo} style={styles.headerImage} resizeMode="contain" accessibilityLabel="Language Transfer" />
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
            { useNativeDriver: false },
          )}
          scrollEventThrottle={16}
        >
          <View style={styles.courseList}>
            <View style={styles.sectionHeaderFirst}>
              <Text style={styles.sectionHeaderText}>New!</Text>
            </View>
            <LanguageButton course="music" onPress={() => goToCourse('music')} />

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionHeaderText}>Language courses</Text>
            </View>
            {[
              'spanish',
              'arabic',
              'turkish',
              'german',
              'greek',
              'italian',
              'swahili',
              'french',
            ].map((course) => (
              <LanguageButton key={course} course={course as Course} onPress={() => goToCourse(course)} />
            ))}

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionHeaderText}>For Spanish speakers</Text>
            </View>
            <LanguageButton course="ingles" onPress={() => goToCourse('ingles')} />

            <View style={styles.aboutSectionHr} />
            <View style={styles.aboutSectionWrapper}>
              <View style={styles.aboutSection}>
                <Text style={styles.aboutSectionText}>
                  Language Transfer is the work of just one guy! Mihalis is trying to build a team of course writers.
                  Find out more:
                </Text>
                <TouchableOpacity
                  style={styles.additionalButton}
                  onPress={() => router.push('/about')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.additionalButtonText}>About Language Transfer</Text>
                  <FontAwesome5 name="info-circle" size={20} color="#333" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Animated.ScrollView>
      </View>
      <View style={styles.topTranslucent} />
      <Animated.View
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
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  scrollView: {},
  screenWrapper: {
    width: '100%',
    height: '100%',
    justifyContent: 'space-between',
    backgroundColor: 'white',
  },
  pageWrapper: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    top: 0,
  },
  headerImageWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 32,
  },
  headerImage: {
    width: '80%',
    height: '100%',
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
    textTransform: 'uppercase',
    color: '#555',
  },
  aboutSectionWrapper: {
    paddingHorizontal: 20,
    marginTop: 12,
  },
  aboutSectionHr: {
    marginHorizontal: 20,
    marginTop: 30,
    borderBottomColor: '#eee',
    borderBottomWidth: 1,
  },
  aboutSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    elevation: 2,
  },
  aboutSectionText: {
    fontSize: 16,
    color: '#333',
  },
  additionalButton: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  additionalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
  },
  topTranslucent: {
    height: 120,
    backgroundColor: 'white',
    opacity: 0.9,
  },
  scrollIndicator: {
    alignItems: 'center',
    paddingBottom: 24,
  },
  scrollIndicatorText: {
    color: '#777',
    marginBottom: 4,
  },
});

export default LanguageSelector;
