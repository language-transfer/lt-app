import React, {useRef} from 'react';
import {
  StyleSheet,
  View,
  StatusBar,
  Dimensions,
  Animated,
  Text,
  ImageSourcePropType,
} from 'react-native';
import useStatusBarStyle from '../../hooks/useStatusBarStyle';
import LanguageButton from './LanguageButton.react';
import logo from '../../../resources/LT-logo-text.png';
import {Icon} from 'react-native-elements';
import {useNavigation} from '@react-navigation/core';
import {MainNavigationProp} from '../App.react';

import {
  Props as AdditionalButtonProps,
  AdditionalButton as RawAdditionalButton,
} from '../LanguageHome/AdditionalButton.react';

const SCREEN_HEIGHT = Dimensions.get('screen').height;
const IMAGE_HEIGHT = 0.4 * SCREEN_HEIGHT;
const CARDS_MARGIN_TOP = IMAGE_HEIGHT + 80 + 40;

const AdditionalButton = ({...rest}: AdditionalButtonProps) => (
  <RawAdditionalButton
    customStyles={{
      additionalButton: styles.additionalButton,
      additionalButtonInner: styles.additionalButtonInner,
      additionalButtonText: styles.additionalButtonText,
    }}
    {...rest}
  />
);

const LanguageSelector = () => {
  const {navigate} = useNavigation<MainNavigationProp<'Language Selector'>>();
  useStatusBarStyle('white', 'dark-content');

  const languageButtonData: {course: Course}[] = [
    {course: 'spanish'},
    {course: 'arabic'},
    {course: 'turkish'},
    {course: 'german'},
    {course: 'greek'},
    {course: 'italian'},
    {course: 'swahili'},
    {course: 'french'},
  ];

  const scrollAnim = useRef(new Animated.Value(0)).current;

  return (
    <View style={styles.screenWrapper}>
      <View style={styles.pageWrapper}>
        <Animated.Image
          source={logo as ImageSourcePropType}
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
              <Text style={styles.sectionHeaderText}>New!</Text>
            </View>
            <LanguageButton
              course="music"
              onPress={() => navigate('Language Home', {course: 'music'})}
            />

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionHeaderText}>Language courses</Text>
            </View>

            {languageButtonData.map(({course}) => (
              <LanguageButton
                course={course}
                onPress={() => navigate('Language Home', {course})}
              />
            ))}

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionHeaderText}>For Spanish speakers</Text>
            </View>
            <LanguageButton
              course="ingles"
              onPress={() => navigate('Language Home', {course: 'ingles'})}
            />
            <View style={styles.aboutSectionHr} />
            <View style={styles.aboutSectionWrapper}>
              <View style={styles.aboutSection}>
                <Text style={styles.aboutSectionText}>
                  Language Transfer is the work of just one guy! Mihalis is
                  trying to build a team of course writers. Find out more:
                </Text>

                <AdditionalButton
                  title="About Language Transfer"
                  onPress={() => navigate('About')}
                  icon="info"
                  useForeground
                />
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
        ]}>
        <Text style={styles.scrollIndicatorText}>scroll for more</Text>
        <Icon
          name="angle-double-down"
          type="font-awesome-5"
          color="#999"
          size={14}
        />
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
