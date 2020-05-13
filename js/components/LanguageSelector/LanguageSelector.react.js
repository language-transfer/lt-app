import React, {useEffect, useState, useRef} from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  StatusBar,
  Image,
  ImageBackground,
  Dimensions,
  Animated,
} from 'react-native';

import LanguageButton from './LanguageButton.react';
import logo from '../../../resources/LT-logo-text.png';
import CourseData from '../../course-data';
import changeNavigationBarColor from 'react-native-navigation-bar-color';

const BOTTOM_NAV_HEIGHT = 48;

const LanguageSelector = ({navigation}) => {
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      StatusBar.setBackgroundColor('white');
      StatusBar.setBarStyle('dark-content', true);
      changeNavigationBarColor('transparent', true);
    });

    return unsubscribe;
  }, [navigation]);

  const scrollAnim = useRef(new Animated.Value(0)).current;
  const imageHeight = 0.4 * Dimensions.get('screen').height;
  const cardsMarginTop = imageHeight + 80 + 20 + 90 + 40;

  const styles = StyleSheet.create({
    wrapper: {
      width: '100%',
      height: '100%',
      justifyContent: 'space-between',
      backgroundColor: 'white',
    },
    wrapper2: {
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
    mottoText: {
      alignSelf: 'center',
      position: 'absolute',
      marginTop: 80 + imageHeight + 50,
      fontSize: 24,
      textAlign: 'center',
      paddingHorizontal: 60,
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
  });

  return (
    <View style={styles.wrapper}>
      <View style={styles.wrapper2}>
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

        <Animated.Text
          style={[
            styles.mottoText,
            {
              opacity: scrollAnim.interpolate({
                inputRange: [0, cardsMarginTop / 10],
                outputRange: [1, 0],
              }),
            },
          ]}>
          Learn a language as if you knew it already!
        </Animated.Text>

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
          </View>
        </Animated.ScrollView>
      </View>
      <View style={styles.topTranslucent}></View>
      <View style={styles.bottomTranslucent}></View>
    </View>
  );
};

export default LanguageSelector;
