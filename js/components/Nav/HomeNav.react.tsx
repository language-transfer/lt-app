import React from 'react';
import {
  createStackNavigator,
  StackNavigationProp,
} from '@react-navigation/stack';
import {CompositeNavigationProp} from '@react-navigation/native';
import {AppParamList} from '../App.react';
import {DrawerNavigationProp} from '@react-navigation/drawer';

import DrawerMenuButton from './DrawerMenuButton.react';
import LanguageSelector from '../LanguageSelector/LanguageSelector.react';
import About from '../About/About.react';
import Settings from '../Settings/Settings.react';

export type HomeStackParamList = {
  'Language Selector': undefined;
  About: undefined;
  Settings: undefined;
};
export type HomeStackScreenProps = CompositeNavigationProp<
  DrawerNavigationProp<AppParamList, 'Home'>,
  StackNavigationProp<HomeStackParamList>
>;

const Stack = createStackNavigator<HomeStackParamList>();

const HomeNav = () => (
  <Stack.Navigator initialRouteName={'Language Selector'}>
    <Stack.Screen
      name="Language Selector"
      component={LanguageSelector}
      options={({route}) => ({
        headerShown: false,
        // disable drawer swipe in home screen
        gestureEnabled: route.name !== 'Language Selector',
      })}
    />
    <Stack.Screen
      name="About"
      component={About}
      options={{
        title: 'About',
        headerLeft: () => <DrawerMenuButton />,
      }}
    />
    <Stack.Screen
      name="Settings"
      component={Settings}
      options={{
        headerTitle: 'Settings',
        headerLeft: () => <DrawerMenuButton />,
      }}
    />
  </Stack.Navigator>
);

export default HomeNav;
