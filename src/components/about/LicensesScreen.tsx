import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import WebView from 'react-native-webview';
import * as Device from 'expo-device';

const LICENSE_URL = 'https://downloads.languagetransfer.org/licenses/NOTICE';

const LicensesScreen = () => {
  const versionTag = Device.osName ? `${Device.osName}-${Device.osVersion}` : 'unknown';
  const source = `${LICENSE_URL}?v=${versionTag}`;

  return (
    <SafeAreaView style={styles.container}>
      <WebView source={{ uri: source }} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default LicensesScreen;
