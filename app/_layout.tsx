import { DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { useGlobalSearchParams, usePathname } from "expo-router";
import { Drawer } from "expo-router/drawer";
import { StatusBar } from "expo-status-bar";
import { Suspense, use, useEffect, useRef } from "react";
import {
  ActivityIndicator,
  AppState,
  AppStateStatus,
  LogBox,
  StyleSheet,
  View,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";

import DrawerContent from "@/src/components/navigation/DrawerContent";
import { queryClient } from "@/src/data/queryClient";
import useListenNavigationSync from "@/src/hooks/useListenNavigationSync";
import { appMigrationsReady } from "@/src/storage/appMigrations";
import { useLogger } from "@/src/utils/log";
import { QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";

if (process.env.EXPO_PUBLIC_E2E_TEST_SUPPRESS_LOGBOX) {
  LogBox.ignoreAllLogs();
}

const RootLayoutContent = () => {
  use(appMigrationsReady);

  // const colorScheme = useColorScheme();
  useListenNavigationSync();
  const pathname = usePathname();
  const params = useGlobalSearchParams();
  const lastNavigationRef = useRef<string | null>(null);
  const log = useLogger();

  useEffect(() => {
    const handleAppState = (state: AppStateStatus) => {
      log({
        action: "app_state_change",
        surface: state,
      });
    };

    const subscription = AppState.addEventListener("change", handleAppState);
    return () => subscription.remove();
  }, [log]);

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
    });
  }, [params.course, params.lesson, pathname, log]);

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
};

const MigrationFallback = () => (
  <View style={styles.migrationFallback}>
    <ActivityIndicator size="large" />
  </View>
);

export default function RootLayout() {
  return (
    <Suspense fallback={<MigrationFallback />}>
      <RootLayoutContent />
    </Suspense>
  );
}

const styles = StyleSheet.create({
  migrationFallback: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
});
