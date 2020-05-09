import DeviceInfo from 'react-native-device-info';

import {genPreferenceAllowDataCollection, genMetricsToken} from './persistence';

const LOG_ENDPOINT = 'http://192.168.0.11:6774/log';

export const log = async (data): Promise<void> => {
  const [permitted, user_token] = await Promise.all([
    genPreferenceAllowDataCollection(),
    genMetricsToken(),
  ]);

  if (!permitted) return;

  try {
    await fetch(LOG_ENDPOINT, {
      method: 'POST',
      cache: 'no-cache',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        local_time: +new Date(),
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
