import { DrawerToggleButton } from "@react-navigation/drawer";
import { Stack, useLocalSearchParams } from "expo-router";

import LanguageHomeScreen from "@/src/components/language-home/LanguageHomeScreen";
import CourseData from "@/src/data/courseData";
import type { Course } from "@/src/types";

export default function CourseHome() {
  const { course } = useLocalSearchParams<{ course?: Course }>();
  if (!course) {
    throw new Error("Course parameter is missing");
  }

  const title = CourseData.getCourseFullTitle(course);

  return (
    <>
      <Stack.Screen
        options={{
          title,
          headerLeft: (props) => <DrawerToggleButton {...props} />,
        }}
      />
      <LanguageHomeScreen />
    </>
  );
}
