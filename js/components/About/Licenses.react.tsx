import React from 'react';
import {WebView} from 'react-native-webview';
import DeviceInfo from 'react-native-device-info';
import useStatusBarStyle from '../../hooks/useStatusBarStyle';

const LICENSE_URL = 'https://downloads.languagetransfer.org/licenses/NOTICE';

const Licenses = () => {
  useStatusBarStyle('white', 'dark-content');

  const licenseUrlWithTag = `${LICENSE_URL}?v=android-${DeviceInfo.getVersion()}`;

  return <WebView source={{uri: licenseUrlWithTag}} />;
};

export default Licenses;
