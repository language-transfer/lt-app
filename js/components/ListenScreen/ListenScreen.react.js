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

import ListenScreenHeader from './ListenScreenHeader.react';
import LeftDrawer from './LeftDrawer.react';

const ListenScreen = (props) => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <SideMenu
      menu={<LeftDrawer navigation={props.navigation} />}
      isOpen={menuOpen}
      onChange={(open) => setMenuOpen(open)}>
      <View style={styles.wrapper}>
        <ListenScreenHeader onOpenMenu={() => setMenuOpen(true)} />
        <Text>hey there</Text>
      </View>
    </SideMenu>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    height: '100%',
    backgroundColor: 'white',
  },
});

export default ListenScreen;
