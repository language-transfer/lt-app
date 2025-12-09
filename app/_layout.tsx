import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Drawer } from "expo-router/drawer";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import DrawerContent from "@/src/components/navigation/DrawerContent";
import { useColorScheme } from "@/hooks/use-color-scheme";
import useListenNavigationSync from "@/src/hooks/useListenNavigationSync";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/src/data/queryClient";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  useListenNavigationSync();

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ThemeProvider
          value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
        >
          <Drawer
            screenOptions={{
              headerShown: false,
            }}
            drawerContent={(props) => <DrawerContent {...props} />}
          >
            <Drawer.Screen name="(main)" options={{ title: "Home" }} />
          </Drawer>
          <StatusBar style="auto" />
        </ThemeProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
