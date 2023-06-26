import React, {useRef} from 'react';
import {
  StyleSheet,
  View,
  StatusBar,
  Dimensions,
  Animated,
  TouchableNativeFeedback,
  Text,
} from 'react-native';
import useStatusBarStyle from '../../hooks/useStatusBarStyle';
import LanguageButton from './LanguageButton.react';
import CourseData from '../../course-data';
import {Icon} from 'react-native-elements';
import { useNavigation } from '@react-navigation/core';
import { MainNavigationProp } from '../App.react';

const SCREEN_HEIGHT = Dimensions.get('screen').height;
const IMAGE_HEIGHT = 0.4 * SCREEN_HEIGHT;
const CARDS_MARGIN_TOP = IMAGE_HEIGHT + 80 + 40;

const LanguageSelector = () => {
  const {navigate} = useNavigation<MainNavigationProp<'Language Selector'>>();
  useStatusBarStyle('white', 'dark-content');

  const scrollAnim = useRef(new Animated.Value(0)).current;
  const logo = require('../../../resources/LT-logo-text.png');

  return (
    <View style={styles.screenWrapper}>
      <View style={styles.pageWrapper}>
        <Animated.Image
          source={logo}
          style={[
            styles.headerImage,
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
          resizeMode="contain"
          accessibilityLabel="Language Transfer"
        />

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
            {useNativeDriver: false},
          )}>
          <View style={styles.courseList}>
            <View style={styles.sectionHeaderFirst}>
              <Text style={styles.sectionHeaderText}>
                New!
              </Text>
            </View>
            <LanguageButton
              course="music"
              onPress={() =>
                navigate('Language Home', {course: "music"})
              }
            />

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionHeaderText}>
                Language courses
              </Text>
            </View>
            <LanguageButton
              course="spanish"
              onPress={() =>
                navigate('Language Home', {course: "spanish"})
              }
            />
            <LanguageButton
              course="arabic"
              onPress={() =>
                navigate('Language Home', {course: "arabic"})
              }
            />
            <LanguageButton
              course="turkish"
              onPress={() =>
                navigate('Language Home', {course: "turkish"})
              }
            />
            <LanguageButton
              course="german"
              onPress={() =>
                navigate('Language Home', {course: "german"})
              }
            />
            <LanguageButton
              course="greek"
              onPress={() =>
                navigate('Language Home', {course: "greek"})
              }
            />
            <LanguageButton
              course="italian"
              onPress={() =>
                navigate('Language Home', {course: "italian"})
              }
            />
            <LanguageButton
              course="swahili"
              onPress={() =>
                navigate('Language Home', {course: "swahili"})
              }
            />
            <LanguageButton
              course="french"
              onPress={() =>
                navigate('Language Home', {course: "french"})
              }
            />

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionHeaderText}>
                For Spanish speakers
              </Text>
            </View>
            <LanguageButton
              course="ingles"
              onPress={() =>
                navigate('Language Home', {course: "ingles"})
              }
            />
            <View style={styles.aboutSectionHr} />
            <View style={styles.aboutSectionWrapper}>
              <View style={styles.aboutSection}>
                <Text style={styles.aboutSectionText}>
                  Language Transfer is the work of just one guy! Mihalis is
                  trying to build a team of course writers. Find out more:
                </Text>
                <View style={styles.additionalButton}>
                  <TouchableNativeFeedback
                    // @see https://github.com/react-navigation/react-navigation/issues/6931
                    // @ts-ignore
                    onPress={() => navigate('About')}
                    useForeground={true}>
                    <View style={styles.additionalButtonInner}>
                      <Text style={styles.additionalButtonText}>
                        About Language Transfer
                      </Text>
                      <Icon name="info" type="font-awesome-5" />
                    </View>
                  </TouchableNativeFeedback>
                </View>
              </View>
            </View>
          </View>
        </Animated.ScrollView>
      </View>
      <View style={styles.topTranslucent} />
      <Animated.View style={[
        styles.scrollIndicator,
        {
          opacity: scrollAnim.interpolate({
            inputRange: [0, 100],
            outputRange: [1, 0],
          }),
        }
      ]}>
        <Text style={styles.scrollIndicatorText}>scroll for more</Text>
        <Icon name="angle-double-down" type="font-awesome-5" color="#999" size={14} />
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
  headerImage: {
    alignSelf: 'center',
    position: 'absolute',
    marginTop: 80,
  },
  courseList: {
    marginTop: CARDS_MARGIN_TOP,
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  sectionHeaderFirst: {
    width: '100%',
    textAlign: 'center',
  },
  sectionHeader: {
    width: '100%',
    textAlign: 'center',
    marginTop: 10,
  },
  sectionHeaderText: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  topTranslucent: {
    height: StatusBar.currentHeight,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  aboutSectionHr: {
    width: '100%',
    height: 4,
    backgroundColor: '#ddd',
    marginTop: 40,
  },
  aboutSectionWrapper: {
    backgroundColor: '#eee',
  },
  aboutSection: {
    marginHorizontal: 40,
    marginVertical: 40,
  },
  aboutSectionText: {
    fontSize: 16,
    marginBottom: 24,
  },
  additionalButton: {
    borderRadius: 10,
    backgroundColor: 'white',
    overflow: 'hidden',
    elevation: 3,
  },
  additionalButtonInner: {
    padding: 25,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  additionalButtonText: {
    fontSize: 20,
    maxWidth: '90%',
  },
  scrollIndicator: {
    position: 'absolute',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'center',
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    padding: 6,
  },
  scrollIndicatorText: {
    fontSize: 14,
    color: '#666',
    marginRight: 14,
  },
});

export default LanguageSelector;
