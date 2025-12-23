import React from "react";
import { ActivityIndicator, View } from "react-native";

import ListenBody from "@/src/components/listen/ListenBody";
import ListenHeader from "@/src/components/listen/ListenHeader";
import { useCourseMetadata } from "@/src/data/courseData";
import { useCurrentCourse } from "@/src/hooks/useCourseLessonData";

const ListenScreen = () => {
  const course = useCurrentCourse();
  const ready = !!useCourseMetadata(course);

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <ListenHeader />
      <ListenBody />
    </View>
  );
};

export default ListenScreen;
