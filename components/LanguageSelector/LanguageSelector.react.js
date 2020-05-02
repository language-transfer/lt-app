/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */

import React from 'react';
import {
  SafeAreaView,
  StyleSheet,
  ScrollView,
  View,
  Text,
  StatusBar,
  Image,
} from 'react-native';

import LanguageButton from './LanguageButton.react';
import logo from '../../resources/LT-logo-text.png';
import languageData from '../../languageData';

const BOTTOM_NAV_HEIGHT = 48;

const App = () => {
  return (
    <>
      <View style={styles.wrapper}>
        <ScrollView style={styles.scrollView}>
          <Image
            source={logo}
            style={styles.headerImage}
            resizeMode="contain"></Image>
          <View style={styles.courseList}>
            {Object.keys(languageData).map((course) => (
              <LanguageButton course={course} key={course} />
            ))}
          </View>
        </ScrollView>
        <View style={styles.topTranslucent}></View>
        <View style={styles.bottomTranslucent}></View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    height: '100%',
    display: 'flex',
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

export default App;
