import React, {useEffect} from 'react';
import {StyleSheet, ScrollView, View, StatusBar, Image} from 'react-native';

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

  return (
    <View style={styles.wrapper}>
      <ScrollView style={styles.scrollView}>
        <Image
          source={logo}
          style={styles.headerImage}
          resizeMode="contain"
          accessibilityLabel="Language Transfer"
        />
        <View style={styles.courseList}>
          {CourseData.getCourseList().map((course) => (
            <LanguageButton
              course={course}
              key={course}
              onPress={() => navigation.navigate('Language Home', {course})}
            />
          ))}
        </View>
      </ScrollView>
      <View style={styles.topTranslucent}></View>
      <View style={styles.bottomTranslucent}></View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    height: '100%',
    justifyContent: 'space-between',
  },
  scrollView: {
    backgroundColor: 'white',
    position: 'absolute',
    width: '100%',
    height: '100%',
    top: 0,
  },
  headerImage: {
    alignSelf: 'center',
    marginTop: 80,
    width: '80%',
    maxHeight: '40%',
  },
  courseList: {
    marginTop: 50,
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

export default LanguageSelector;
