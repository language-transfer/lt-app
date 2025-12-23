import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

import ListenBody from "@/src/components/listen/ListenBody";
import ListenHeader from "@/src/components/listen/ListenHeader";
import CourseData from "@/src/data/courseData";
import { useCourseLessonData } from "@/src/hooks/useCourseLessonData";
import { useSetStatusBarStyle } from "@/src/hooks/useStatusBarStyle";

// TODO: clean up assertions here (probably useQuery)
const ListenScreen = () => {
  const { course, lesson } = useCourseLessonData();
  const [ready, setReady] = useState(
    CourseData.isCourseMetadataLoaded(course!)
  );
  const setStatusBarStyle = useSetStatusBarStyle();

  useEffect(() => {
    setReady(CourseData.isCourseMetadataLoaded(course!));
  }, [course]);

  useEffect(() => {
    let mounted = true;
    if (!ready) {
      CourseData.loadCourseMetadata(course!).then(() => {
        if (mounted) {
          setReady(true);
        }
      });
    }
    return () => {
      mounted = false;
    };
  }, [course, ready]);

  useEffect(() => {
    if (!ready) {
      return;
    }
    const colors = CourseData.getCourseUIColors(course!);
    const barStyle = colors.text === "black" ? "dark-content" : "light-content";
    setStatusBarStyle(colors.background, barStyle);
  }, [course, ready, setStatusBarStyle]);

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <ListenHeader course={course!} />
      <ListenBody course={course!} lesson={lesson ?? 0} />
    </View>
  );
};

export default ListenScreen;
