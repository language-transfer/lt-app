import * as Device from "expo-device";

import CourseData from "@/src/data/courseData";
import {
  genMetricsToken,
  genPreferenceAllowDataCollection,
} from "@/src/storage/persistence";
import { useCallback, useMemo } from "react";
import { Platform } from "react-native";
import DeviceInfo from "react-native-device-info";
import {
  useCurrentCourseIfPresent,
  useCurrentLessonIfPresent,
} from "../hooks/useCourseLessonData";
const appVersion = DeviceInfo.getVersion();

const LOG_ENDPOINT = "https://metrics.languagetransfer.org/log";

export const log = async (data: Record<string, any>): Promise<void> => {
  const [allowed, user_token] = await Promise.all([
    genPreferenceAllowDataCollection(),
    genMetricsToken(),
  ]);

  if (!allowed) {
    return;
  }

  if (data.course && CourseData.isCourseMetadataLoaded(data.course)) {
    data.metadata_version = CourseData.getMetadataVersion(data.course);
  }

  const withContext = {
    local_time: Date.now(),
    timezone_offset: new Date().getTimezoneOffset(),
    user_token,
    device_os: Device.osName,
    device_os_version: Device.osVersion,
    platform: Platform.OS,
    app_version: appVersion,
    ...data,
  };

  console.log("LOG", withContext);

  try {
    await fetch(LOG_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(withContext),
    });
  } catch {
    // best-effort logging
  }
};

export const useLogger = (defaultData: Record<string, any> = {}) => {
  const currentCourse = useCurrentCourseIfPresent();
  const currentLesson = useCurrentLessonIfPresent();

  // TODO: if defaultData is not a stable ref then this will not memoize

  const defaultDataWithContext = useMemo(
    () => ({
      ...(currentCourse !== null ? { course: currentCourse } : {}),
      ...(currentLesson !== null ? { lesson: currentLesson } : {}),
      ...defaultData,
    }),
    [currentCourse, currentLesson, defaultData]
  );

  const logWithContext = useCallback(
    (data: Record<string, any>) => {
      return log({ ...defaultDataWithContext, ...data }).then();
    },
    [defaultDataWithContext]
  );

  return logWithContext;
};
