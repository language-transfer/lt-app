import {useCallback} from 'react';
import {StatusBar, StatusBarStyle, Platform} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import changeNavigationBarColor from 'react-native-navigation-bar-color';

const isAndroid = Platform.OS === 'android';

export default function useStatusBarStyle(
  backgroundColor: string,
  style: StatusBarStyle,
  navBarColor?: string,
) {
  useFocusEffect(
    useCallback(() => {
      if (isAndroid) {
        StatusBar.setBackgroundColor(backgroundColor);
      }

      StatusBar.setBarStyle(style, true);
      changeNavigationBarColor(navBarColor || backgroundColor, true, true);
    }, [backgroundColor, navBarColor, style]),
  );
}
