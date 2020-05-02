import React, {useEffect} from 'react';
import {
  SafeAreaView,
  StyleSheet,
  ScrollView,
  View,
  Text,
  StatusBar,
  Image,
  TouchableHighlight,
} from 'react-native';

import {Icon} from 'react-native-elements';

import languageData from '../../../languageData';
import {TouchableNativeFeedback} from 'react-native-gesture-handler';

const ListenScreenHeader = (props) => {
  // headerTitle: 'Spanish',
  // headerStatusBarHeight: 16,
  // headerStyle: {
  //   elevation: 0,
  // },
  // headerLeft: () => <Button title="menu" onPress={() => {}} />,

  return (
    <View style={styles.header}>
      <TouchableNativeFeedback
        style={styles.menuButton}
        onPress={() => {
          props.onOpenMenu();
        }}
        background={TouchableNativeFeedback.Ripple(null, true)}>
        <Icon style={styles.menuButton} name="menu" size={28} />
      </TouchableNativeFeedback>
      <Text style={styles.headerText}>
        {languageData[props.route.params.course].title}
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
    marginLeft: 32,
  },
});

export default ListenScreenHeader;
