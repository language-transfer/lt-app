import DeviceInfo from 'react-native-device-info';

import {genPreferenceAllowDataCollection, genMetricsToken} from './persistence';
import CourseData from './course-data';

const LOG_ENDPOINT = 'http://192.168.0.11:6774/log';

export const log = async (data): Promise<void> => {
  const [permitted, user_token] = await Promise.all([
    genPreferenceAllowDataCollection(),
    genMetricsToken(),
  ]);

  if (!permitted) return;

  if (data.course && CourseData.isCourseMetadataLoaded(data.course)) {
    data.metadata_version = CourseData.getMetadataVersion(data.course);
  }

  try {
    await fetch(LOG_ENDPOINT, {
      method: 'POST',
      cache: 'no-cache',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        local_time: +new Date(),
        timezone_offset: new Date().getTimezoneOffset(),
        user_token,
        device_os: DeviceInfo.getSystemName(),
        device_os_version: DeviceInfo.getSystemVersion(),
        app_version: DeviceInfo.getVersion(),
        ...data,
      }),
    });
  } catch (e) {
    /* ah well. */
  }
};
