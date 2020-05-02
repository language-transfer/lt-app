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

import SideMenu from 'react-native-side-menu';

import languageData from '../../../languageData';
import {useLinkProps} from '@react-navigation/native';
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
      <Text style={styles.headerText}>Spanish</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    marginTop: StatusBar.currentHeight,
    height: 56,
    alignItems: 'center',
    flexDirection: 'row',
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
