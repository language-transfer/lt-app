import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { useColorScheme } from '@/hooks/use-color-scheme';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="course/[course]/index" />
          <Stack.Screen name="course/[course]/listen/[lesson]" options={{ headerShown: false }} />
          <Stack.Screen name="course/[course]/all-lessons" options={{ title: 'All Lessons' }} />
          <Stack.Screen name="course/[course]/data" options={{ title: 'Data Management' }} />
          <Stack.Screen name="about" options={{ title: 'About' }} />
          <Stack.Screen name="licenses" options={{ title: 'Licenses' }} />
          <Stack.Screen name="settings" options={{ title: 'Settings' }} />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
