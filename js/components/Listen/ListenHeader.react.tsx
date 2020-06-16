import React from 'react';
import {StyleSheet, View, StatusBar} from 'react-native';

import {Icon} from 'react-native-elements';

import {useCourseContext} from '../Context/CourseContext';
import {useNavigation} from '@react-navigation/native';
import {LanguageStackScreenProps} from '../Nav/LanguageNav.react';
import {TouchableNativeFeedback} from 'react-native-gesture-handler';

const ListenHeader = () => {
  const {pop} = useNavigation<LanguageStackScreenProps>();
  const {courseData} = useCourseContext();

  return (
    <View
      style={[
        styles.header,
        {backgroundColor: courseData.uiColors.background},
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
          color={courseData.uiColors.text}
        />
      </TouchableNativeFeedback>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    alignItems: 'flex-start',
    marginTop: StatusBar.currentHeight,
    paddingTop: 20,
  },
  backButton: {},
});

export default ListenHeader;
