import React, {useEffect, useState} from 'react';
import {
  SafeAreaView,
  StyleSheet,
  ScrollView,
  View,
  Text,
  StatusBar,
  Image,
} from 'react-native';

import SideMenu from 'react-native-side-menu';

import languageData from '../../../languageData';
import {TouchableNativeFeedback} from 'react-native-gesture-handler';

const LeftDrawer = (props) => {
  return (
    <View style={styles.leftDrawer}>
      <Text style={styles.header}>Language Transfer</Text>
      <TouchableNativeFeedback
        onPress={() => props.navigation.navigate('Language Selector')}>
        <Text style={styles.menuButton}>All Languages</Text>
      </TouchableNativeFeedback>
      <TouchableNativeFeedback>
        <Text style={styles.menuButton}>Settings</Text>
      </TouchableNativeFeedback>
      <TouchableNativeFeedback>
        <Text style={styles.menuButton}>About</Text>
      </TouchableNativeFeedback>
    </View>
  );
};

const styles = StyleSheet.create({
  leftDrawer: {
    marginTop: StatusBar.currentHeight,
    backgroundColor: '#eee',
    height: '100%',
  },
  header: {
    fontWeight: 'bold',
    fontSize: 20,
    paddingVertical: 15,
    paddingHorizontal: 30,
  },
  menuButton: {
    fontSize: 20,
    paddingVertical: 15,
    paddingHorizontal: 50,
  },
});

export default LeftDrawer;
