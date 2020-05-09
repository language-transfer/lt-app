import React from 'react';
import {StyleSheet, View, Text, StatusBar} from 'react-native';

import {Icon} from 'react-native-elements';

import CourseData from '../../course-data';
import {TouchableNativeFeedback} from 'react-native-gesture-handler';
import {log} from '../../metrics';

const LanguageHomeHeader = (props) => {
  return (
    <View style={styles.header}>
      <TouchableNativeFeedback
        style={styles.menuButton}
        onPress={() => props.onOpenMenu()}
        background={TouchableNativeFeedback.Ripple(null, true)}>
        <Icon style={styles.menuButton} name="menu" size={28} />
      </TouchableNativeFeedback>
      <Text style={styles.headerText}>
        {CourseData.getCourseTitle(props.route.params.course)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingTop: StatusBar.currentHeight,
    height: 56 + StatusBar.currentHeight,
    alignItems: 'center',
    flexDirection: 'row',
    position: 'absolute',
    elevation: 5,
    backgroundColor: 'white',
    top: 0,
    width: '100%',
  },
  menuButton: {
    width: 56,
    height: 56,
    justifyContent: 'center',
    borderRadius: 28,
  },
  headerText: {
    fontFamily: 'sans-serif-medium',
    fontWeight: 'normal',
    fontSize: 20,
    marginLeft: 16,
  },
});

export default LanguageHomeHeader;
