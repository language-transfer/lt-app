import React from 'react';
import {StyleSheet, Text, View, Image} from 'react-native';
import {DrawerContentScrollView, DrawerItem} from '@react-navigation/drawer';
import {Icon} from 'react-native-elements';
import {navigate} from '../../navigation-ref';

const Drawer = (props: any) => {
  // since we're using an independent NavigationContext for the Stack navigator,
  // we need to explicitly close the drawer when we navigate
  const navigateAndCloseDrawer = (screen: any) => () => {
    props.navigation.closeDrawer();
    navigate(screen);
  };

  return (
    <DrawerContentScrollView {...props}>
      <View style={styles.headerContainer}>
        <Image
          style={styles.headerImage}
          source={require('../../../resources/LT-logo-text.png')}
        />
      </View>

      <DrawerItem
        // why not just use a simple string and the `icon` prop as well? because react-navigation
        // enforces a strict 32pt margin between the icon & the label... and i really didn't want that
        label={() => (
          <View style={styles.menuItemContainer}>
            <Icon
              name="home"
              type="font-awesome-5"
              style={styles.menuItemIcon}
              color={'gray'}
            />
            <Text style={styles.menuItemText}>All Languages</Text>
          </View>
        )}
        onPress={navigateAndCloseDrawer('Language Selector')}
      />
      <DrawerItem
        label={() => (
          <View style={styles.menuItemContainer}>
            <Icon
              name="cog"
              type="font-awesome-5"
              style={styles.menuItemIcon}
              color={'gray'}
            />
            <Text style={styles.menuItemText}>Settings</Text>
          </View>
        )}
        onPress={navigateAndCloseDrawer('Settings')}
      />
      <DrawerItem
        label={() => (
          <View style={styles.menuItemContainer}>
            <Icon
              name="info-circle"
              type="font-awesome-5"
              style={styles.menuItemIcon}
              color={'gray'}
            />
            <Text style={styles.menuItemText}>About</Text>
          </View>
        )}
        onPress={navigateAndCloseDrawer('About')}
      />
    </DrawerContentScrollView>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomColor: 'lightgray',
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingBottom: 20,
    marginBottom: 20,
  },
  headerImage: {
    marginTop: 20,
    width: 150,
    height: 200,
    resizeMode: 'contain',
  },
  headerText: {
    fontWeight: '600',
    fontSize: 20,
    textAlign: 'center',
  },
  menuItemContainer: {
    padding: 0,
    margin: 0,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  menuItemIcon: {
    paddingRight: 10,
  },
  menuItemText: {
    fontSize: 18,
    padding: 0,
    margin: 0,
  },
});

export default Drawer;
