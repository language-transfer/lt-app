import React from 'react';
import {
  SafeAreaView,
  StyleSheet,
  ScrollView,
  View,
  Text,
  StatusBar,
  Image,
  Button,
  ImageBackground,
} from 'react-native';

import languageData from '../../../languageData';
import {TouchableNativeFeedback} from 'react-native-gesture-handler';

const LanguageButton = (props) => {
  return (
    <View style={styles.sectionWrapper}>
      <ImageBackground
        source={languageData[props.course].image}
        style={styles.imageBackground}
        imageStyle={styles.image}>
        <View style={styles.rippleWrapper}>
          <TouchableNativeFeedback onPress={props.onPress} useForeground={true}>
            <View style={styles.sectionContainer}>
              <Text style={styles.courseTitle}>
                {languageData[props.course].title}
              </Text>
              <Text style={styles.courseDetails}>
                {languageData[props.course].lessons} lessons
              </Text>
            </View>
          </TouchableNativeFeedback>
        </View>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  sectionWrapper: {
    width: 150,
    height: 150,
    margin: 15,
  },
  sectionContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontWeight: '600',
    paddingVertical: 40,
    width: '100%',
    height: '100%',
  },
  imageBackground: {
    resizeMode: 'cover',
    borderRadius: 10,
  },
  rippleWrapper: {
    overflow: 'hidden',
    borderRadius: 10,
  },
  image: {
    borderRadius: 10,
    opacity: 0.2,
  },
  courseTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'black',
  },
  courseDetails: {
    fontSize: 16,
  },
});

export default LanguageButton;
