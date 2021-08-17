import React from 'react';
import {WebView} from 'react-native-webview';
import useStatusBarStyle from '../../hooks/useStatusBarStyle';

const LICENSE_URL = 'https://downloads.languagetransfer.org/licenses/NOTICE';

const Licenses = () => {
  useStatusBarStyle('white', 'dark-content');

  const licenseUrlWithTag = `${LICENSE_URL}?v=android-1.2.0`;

  return <WebView source={{ uri: licenseUrlWithTag }} />;
};

export default Licenses;
