import * as Device from 'expo-device';

import CourseData from '@/src/data/courseData';
import { genMetricsToken, genPreferenceAllowDataCollection } from '@/src/storage/persistence';

const LOG_ENDPOINT = 'https://metrics.languagetransfer.org/log';

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

  try {
    await fetch(LOG_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        local_time: Date.now(),
        timezone_offset: new Date().getTimezoneOffset(),
        user_token,
        device_os: Device.osName,
        device_os_version: Device.osVersion,
        ...data,
      }),
    });
  } catch {
    // best-effort logging
  }
};
