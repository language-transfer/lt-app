import React from 'react';
import {StyleSheet, View, Text, StatusBar} from 'react-native';

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
      <TouchableNativeFeedback
        onPress={() => props.navigation.navigate('About')}>
        <Text style={styles.menuButton}>About</Text>
      </TouchableNativeFeedback>
    </View>
  );
};

const styles = StyleSheet.create({
  leftDrawer: {
    marginTop: StatusBar.currentHeight,
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
