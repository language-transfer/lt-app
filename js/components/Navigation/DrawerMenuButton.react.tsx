import React from 'react';
import {StyleSheet} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {DrawerNavigationProp} from '@react-navigation/drawer';
import {AppParamList} from '../App.react';
import {TouchableNativeFeedback} from 'react-native-gesture-handler';
import {Icon} from 'react-native-elements';

type Props = DrawerNavigationProp<AppParamList>;

const DrawerMenuButton = () => {
  const {openDrawer} = useNavigation<Props>();

  return (
    <TouchableNativeFeedback
      style={styles.container}
      onPress={() => openDrawer()}
      // rn-gesture-handler is missing typings of the Ripple static method
      // @ts-ignore
      background={TouchableNativeFeedback.Ripple(null, true)}>
      <Icon style={styles.icon} name="menu" size={28} />
    </TouchableNativeFeedback>
  );
};

const styles = StyleSheet.create({
  container: {},
  icon: {
    marginLeft: 10,
  },
});

export default DrawerMenuButton;
