import React from 'react';
import {StyleSheet, View, StatusBar} from 'react-native';

import {Icon} from 'react-native-elements';

import CourseData from '../../course-data';
import {TouchableNativeFeedback} from 'react-native-gesture-handler';

const ListenHeader = (props) => {
  const styles = StyleSheet.create({
    header: {
      paddingTop: StatusBar.currentHeight,
      height: 56 + StatusBar.currentHeight,
      alignItems: 'center',
      backgroundColor: CourseData.getCourseUIColors(props.route.params.course)
        .background,
      justifyContent: 'space-between',
      flexDirection: 'row',
    },
    backButton: {
      width: 56,
      height: 56,
      justifyContent: 'center',
      borderRadius: 28,
    },
    headerText: {
      fontFamily: 'sans-serif-medium',
      fontWeight: 'normal',
      fontSize: 20,
      color: CourseData.getCourseUIColors(props.route.params.course).text,
    },
    dummy: {
      // I wanted to use pos:abs on the button but couldn't work it out
      // so we're just flexing and balancing it on the right
      width: 56,
    },
  });

  return (
    <>
      <View style={styles.header}>
        <TouchableNativeFeedback
          style={styles.backButton}
          onPress={() => {
            props.navigation.pop();
          }}
          background={TouchableNativeFeedback.Ripple(null, true)}>
          <Icon
            name="arrow-left"
            type="font-awesome-5"
            size={18}
            color={CourseData.getCourseUIColors(props.route.params.course).text}
          />
        </TouchableNativeFeedback>
        <View style={styles.dummy} />
      </View>
    </>
  );
};

export default ListenHeader;
