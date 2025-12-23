import { useCourseColors } from "@/src/hooks/useCourseLessonData";
import { DrawerToggleButton } from "@react-navigation/drawer";
import { Stack, useSegments } from "expo-router";
import "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

// TODO: SafeAreaView should probably be more selective -- allow
//   for statusbar overlay on home screen, for example, and make
//   sure there's sufficient padding
const StackLayout = () => {
  const courseColors = useCourseColors();
  const segments = useSegments();

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor:
          segments.join("/") === "(main)/course/[course]/listen/[lesson]"
            ? courseColors.background
            : undefined,
      }}
      edges={["bottom", "left", "right"]}
    >
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="course/[course]/index" />
        <Stack.Screen
          name="course/[course]/listen/[lesson]"
          // Keep drawer/back gestures off; horizontal swipes here conflict with the scrubber drag.
          options={{ headerShown: false, gestureEnabled: false }}
        />
        <Stack.Screen
          name="course/[course]/all-lessons"
          options={{ title: "All Lessons" }}
        />
        <Stack.Screen
          name="course/[course]/data"
          options={{ title: "Data Management" }}
        />
        <Stack.Screen
          name="about"
          options={{
            title: "About",
            headerLeft: (props) => <DrawerToggleButton {...props} />,
          }}
        />
        <Stack.Screen
          name="licenses"
          options={{
            title: "Licenses",
            headerLeft: (props) => <DrawerToggleButton {...props} />,
          }}
        />
        <Stack.Screen
          name="settings"
          options={{
            title: "Settings",
            headerLeft: (props) => <DrawerToggleButton {...props} />,
          }}
        />
        <Stack.Screen
          name="notification.click"
          options={{ headerShown: false, animation: "none" }}
        />
      </Stack>
    </SafeAreaView>
  );
};

export default StackLayout;
