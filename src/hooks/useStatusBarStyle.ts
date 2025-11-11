import { useCallback } from 'react';
import { Platform, StatusBar, StatusBarStyle } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

export function useSetStatusBarStyle() {
  return useCallback((backgroundColor: string, style: StatusBarStyle) => {
    if (Platform.OS === 'android') {
      StatusBar.setBackgroundColor(backgroundColor);
      StatusBar.setTranslucent(true);
    }

    StatusBar.setBarStyle(style, true);
  }, []);
}

export default function useStatusBarStyle(backgroundColor: string, style: StatusBarStyle) {
  const setStatusBarStyle = useSetStatusBarStyle();
  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle(backgroundColor, style);
    }, [backgroundColor, setStatusBarStyle, style]),
  );
}
