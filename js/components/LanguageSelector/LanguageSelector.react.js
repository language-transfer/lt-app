import React, {useEffect, useRef} from 'react';
import {
  StyleSheet,
  View,
  StatusBar,
  Dimensions,
  Animated,
  TouchableNativeFeedback,
  Text,
} from 'react-native';

import LanguageButton from './LanguageButton.react';
import logo from '../../../resources/LT-logo-text.png';
import CourseData from '../../course-data';
import changeNavigationBarColor from 'react-native-navigation-bar-color';
import {Icon} from 'react-native-elements';

const BOTTOM_NAV_HEIGHT = 48;

const LanguageSelector = ({navigation}) => {
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      StatusBar.setBackgroundColor('white');
      StatusBar.setBarStyle('dark-content', true);
      StatusBar.setTranslucent(true);
      changeNavigationBarColor('transparent', true);
    });

    return unsubscribe;
  }, [navigation]);

  const scrollAnim = useRef(new Animated.Value(0)).current;
  const imageHeight = 0.4 * Dimensions.get('screen').height;
  const cardsMarginTop = imageHeight + 80 + 40;

  const styles = StyleSheet.create({
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
      marginTop: cardsMarginTop,
      marginBottom: BOTTOM_NAV_HEIGHT,
      display: 'flex',
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
    },
    topTranslucent: {
      height: StatusBar.currentHeight,
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
    },
    bottomTranslucent: {
      height: BOTTOM_NAV_HEIGHT,
      backgroundColor: 'rgba(255, 255, 255, 0.6)',
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

  return (
    <View style={styles.screenWrapper}>
      <View style={styles.pageWrapper}>
        <Animated.Image
          source={logo}
          style={[
            styles.headerImage,
            {
              opacity: scrollAnim.interpolate({
                inputRange: [0, cardsMarginTop / 1.5],
                outputRange: [1, 0],
              }),
              height: scrollAnim.interpolate({
                inputRange: [0, cardsMarginTop / 1.5],
                outputRange: [imageHeight, 0.9 * imageHeight],
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
                onPress={() => navigation.navigate('Language Home', {course})}
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
                    onPress={() => navigation.navigate('About')}
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
      <View style={styles.topTranslucent}></View>
      <View style={styles.bottomTranslucent}></View>
    </View>
  );
};

export default LanguageSelector;
