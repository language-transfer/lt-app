import { DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { useGlobalSearchParams, usePathname } from "expo-router";
import { Drawer } from "expo-router/drawer";
import { useEffect, useRef } from "react";
import { AppState, AppStateStatus } from "react-native";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";

import DrawerContent from "@/src/components/navigation/DrawerContent";
import { queryClient } from "@/src/data/queryClient";
import useListenNavigationSync from "@/src/hooks/useListenNavigationSync";
import { log } from "@/src/utils/log";
import { QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function RootLayout() {
  // const colorScheme = useColorScheme();
  useListenNavigationSync();
  const pathname = usePathname();
  const params = useGlobalSearchParams();
  const lastNavigationRef = useRef<string | null>(null);

  useEffect(() => {
    const handleAppState = (state: AppStateStatus) => {
      log({
        action: "app_state_change",
        surface: state,
      }).then();
    };

    const subscription = AppState.addEventListener("change", handleAppState);
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (!pathname) {
      return;
    }

    const course =
      typeof params.course === "string" ? params.course : undefined;
    const lessonParam =
      typeof params.lesson === "string" ? params.lesson : undefined;
    const lesson = lessonParam ? Number.parseInt(lessonParam, 10) : undefined;
    const normalizedLesson =
      lesson !== undefined && !Number.isNaN(lesson) ? lesson : undefined;
    const key = `${pathname}|${course ?? ""}|${normalizedLesson ?? ""}`;
    if (lastNavigationRef.current === key) {
      return;
    }
    lastNavigationRef.current = key;

    log({
      action: "navigate",
      surface: pathname,
      course,
      lesson: normalizedLesson,
    }).then();
  }, [params.course, params.lesson, pathname]);

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ThemeProvider
          // value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
          value={DefaultTheme}
        >
          <SafeAreaProvider>
            <Drawer
              screenOptions={{
                headerShown: false,
              }}
              drawerContent={(props) => <DrawerContent {...props} />}
            >
              <Drawer.Screen name="(main)" options={{ title: "Home" }} />
            </Drawer>
            <StatusBar style="auto" />
          </SafeAreaProvider>
        </ThemeProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
