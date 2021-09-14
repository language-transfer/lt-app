import React from 'react';
import {StyleSheet, View, StatusBar} from 'react-native';

import {Icon} from 'react-native-elements';

import {useNavigation} from '@react-navigation/native';
import {TouchableNativeFeedback} from 'react-native-gesture-handler';
import CourseData from '../../course-data';
import { MainNavigationProp } from '../App.react';

const ListenHeader = ({course}: {course: Course}) => {
  const {pop} = useNavigation<MainNavigationProp<'Listen'>>();

  return (
    <View
      style={[
        styles.header,
        {backgroundColor: CourseData.getCourseUIColors(course).background},
      ]}>
      <TouchableNativeFeedback
        style={styles.backButton}
        onPress={() => pop()}
        // @ts-ignore
        background={TouchableNativeFeedback.Ripple(null, true)}>
        <Icon
          name="arrow-left"
          type="font-awesome-5"
          size={18}
          color={CourseData.getCourseUIColors(course).text}
        />
      </TouchableNativeFeedback>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    alignItems: 'flex-start',
    marginTop: StatusBar.currentHeight,
  },
  backButton: {
    width: 56,
    height: 56,
    justifyContent: 'center',
    borderRadius: 28,
  },
});

export default ListenHeader;
