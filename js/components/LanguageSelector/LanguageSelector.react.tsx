import React, {useRef} from 'react';
import {
  StyleSheet,
  View,
  StatusBar,
  Dimensions,
  Animated,
  TouchableNativeFeedback,
  Text,
  Platform,
} from 'react-native';
import useStatusBarStyle from '../../hooks/useStatusBarStyle';
import LanguageButton from './LanguageButton.react';
import logo from '../../../resources/LT-logo-text.png';
import CourseData from '../../course-data';
import {Icon} from 'react-native-elements';
import { useNavigation } from '@react-navigation/core';
import { MainNavigationProp } from '../App.react';

const BOTTOM_NAV_HEIGHT = Platform.select({ios: 0, android: 48});
const SCREEN_HEIGHT = Dimensions.get('screen').height;
const IMAGE_HEIGHT = 0.4 * SCREEN_HEIGHT;
const CARDS_MARGIN_TOP = IMAGE_HEIGHT + 80 + 40;

const LanguageSelector = () => {
  const {navigate} = useNavigation<MainNavigationProp<'Language Selector'>>();
  useStatusBarStyle('white', 'dark-content', 'transparent');

  const scrollAnim = useRef(new Animated.Value(0)).current;

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
            {CourseData.getCourseList().map((course) => (
              <LanguageButton
                course={course}
                key={course}
                onPress={() =>
                  navigate('Language Home', {course})
                }
              />
            ))}
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
});

export default LanguageSelector;
