import React from 'react';
import {StyleSheet, Text} from 'react-native';
import {DrawerContentScrollView, DrawerItem} from '@react-navigation/drawer';

const Drawer = (props: any) => {
  return (
    <DrawerContentScrollView {...props}>
      <Text style={styles.header}>Language Transfer</Text>

      <DrawerItem
        label={'All Languages'}
        onPress={() =>
          props.navigation.navigate('Home', {screen: 'Language Selector'})
        }
        labelStyle={styles.menuItemText}
        style={styles.menuItemContainer}
      />
      <DrawerItem
        label={'Settings'}
        onPress={() => props.navigation.navigate('Home', {screen: 'Settings'})}
        labelStyle={styles.menuItemText}
        style={styles.menuItemContainer}
      />
      <DrawerItem
        label={'About'}
        onPress={() => props.navigation.navigate('Home', {screen: 'About'})}
        labelStyle={styles.menuItemText}
        style={styles.menuItemContainer}
      />
    </DrawerContentScrollView>
  );
};

const styles = StyleSheet.create({
  header: {
    fontWeight: 'bold',
    fontSize: 20,
    paddingVertical: 15,
    paddingHorizontal: 30,
  },
  menuItemContainer: {
    // paddingVertical: 15,
    // paddingHorizontal: 50,
  },
  menuItemText: {
    fontSize: 18,
  },
});

export default Drawer;
