import React, {useEffect, useState} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {TouchableNativeFeedback} from 'react-native-gesture-handler';
import {ScrollView} from 'react-native-gesture-handler';
import {
  genSetPreferenceAutoDeleteFinished,
  genPreferenceAutoDeleteFinished,
  genPreferenceStreamQuality,
  genPreferenceDownloadQuality,
  genSetPreferenceStreamQuality,
  genSetPreferenceDownloadQuality,
  genPreferenceDownloadOnlyOnWifi,
  genSetPreferenceDownloadOnlyOnWifi,
  genPreferenceAllowDataCollection,
  genSetPreferenceAllowDataCollection,
  genDeleteMetricsToken,
} from '../../persistence';
import {Icon} from 'react-native-elements';
import useStatusBarStyle from '../../hooks/useStatusBarStyle';

interface Settings {
  autoDeleteFinished: boolean;
  streamQuality: Quality;
  downloadQuality: Quality;
  downloadOnlyOnWifi: boolean;
  allowDataCollection: boolean;
}

const Settings = () => {
  useStatusBarStyle('white', 'dark-content');
  const [needsUpdate, setNeedsUpdate] = useState(true);
  const [settings, setSettings] = useState<Settings | null>(null);
  useEffect(() => {
    (async () => {
      if (needsUpdate) {
        const [
          autoDeleteFinished,
          streamQuality,
          downloadQuality,
          downloadOnlyOnWifi,
          allowDataCollection,
        ] = await Promise.all([
          genPreferenceAutoDeleteFinished(),
          genPreferenceStreamQuality(),
          genPreferenceDownloadQuality(),
          genPreferenceDownloadOnlyOnWifi(),
          genPreferenceAllowDataCollection(),
        ]);

        setSettings({
          autoDeleteFinished,
          streamQuality,
          downloadQuality,
          downloadOnlyOnWifi,
          allowDataCollection,
        });

        setNeedsUpdate(false);
      }
    })();
  }, [needsUpdate]);

  if (settings === null) {
    return null;
  }

  return (
    // todo: refactor this. a nice array of settings. like back in the day, on 1332.io.
    <ScrollView style={styles.body} contentContainerStyle={styles.container}>
      <TouchableNativeFeedback
        onPress={async () => {
          await genSetPreferenceAutoDeleteFinished(
            !settings.autoDeleteFinished,
          );
          setNeedsUpdate(true);
        }}>
        <View style={styles.settingsRow}>
          <View style={styles.settingsValueContainer}>
            <Icon
              style={{
                ...styles.settingsCheck,
                ...(settings.autoDeleteFinished ? {} : {opacity: 0}),
              }}
              accessibilityLabel={
                settings.autoDeleteFinished ? 'enabled' : 'disabled'
              }
              name="check"
              type="font-awesome-5"
            />
          </View>
          <View style={styles.settingsText}>
            <Text style={styles.settingsTitle}>
              Automatically delete finished downloads
            </Text>
            <Text style={styles.settingsDescription}>
              Automatically delete downloaded lessons when you finish listening
              to them. Checking this box will not remove any existing downloads;
              to do that, use the Data Management screen.
            </Text>
          </View>
        </View>
      </TouchableNativeFeedback>

      <TouchableNativeFeedback
        onPress={async () => {
          await genSetPreferenceDownloadOnlyOnWifi(
            !settings.downloadOnlyOnWifi,
          );
          setNeedsUpdate(true);
        }}>
        <View style={styles.settingsRow}>
          <View style={styles.settingsValueContainer}>
            <Icon
              style={{
                ...styles.settingsCheck,
                ...(settings.downloadOnlyOnWifi ? {} : {opacity: 0}),
              }}
              accessibilityLabel={
                settings.downloadOnlyOnWifi ? 'enabled' : 'disabled'
              }
              name="check"
              type="font-awesome-5"
            />
          </View>
          <View style={styles.settingsText}>
            <Text style={styles.settingsTitle}>Download only on wi-fi</Text>
            <Text style={styles.settingsDescription}>
              You can always stream tracks directly from the server, even if
              you're not on wi-fi. But if you have this option checked, tracks
              will only be saved to your device while you're connected to wi-fi.
            </Text>
          </View>
        </View>
      </TouchableNativeFeedback>

      <TouchableNativeFeedback
        onPress={async () => {
          await genSetPreferenceStreamQuality(
            {low: 'high', high: 'low'}[settings.streamQuality], // kind of reminds me of permutations from combinatorics class. kind of. @scottsha
          );
          setNeedsUpdate(true);
        }}>
        <View style={styles.settingsRow}>
          <View style={styles.settingsValueContainer}>
            <Text>{settings.streamQuality}</Text>
          </View>
          <View style={styles.settingsText}>
            <Text style={styles.settingsTitle}>Streaming quality</Text>
            <Text style={styles.settingsDescription}>
              When streaming lessons directly from the server, should we use
              high- or low-quality audio? High quality audio uses about 1
              megabyte per minute. Low-quality audio uses about one third of a
              megabyte per minute.
            </Text>
          </View>
        </View>
      </TouchableNativeFeedback>

      <TouchableNativeFeedback
        onPress={async () => {
          await genSetPreferenceDownloadQuality(
            {low: 'high', high: 'low'}[settings.downloadQuality], // kind of reminds me of permutations from combinatorics class. kind of. @scottsha
          );
          setNeedsUpdate(true);
        }}>
        <View style={styles.settingsRow}>
          <View style={styles.settingsValueContainer}>
            <Text>{settings.downloadQuality}</Text>
          </View>
          <View style={styles.settingsText}>
            <Text style={styles.settingsTitle}>Download quality</Text>
            <Text style={styles.settingsDescription}>
              When downloading lessons to your device, should we use high- or
              low-quality audio?
            </Text>
          </View>
        </View>
      </TouchableNativeFeedback>

      <TouchableNativeFeedback
        onPress={async () => {
          await genSetPreferenceAllowDataCollection(
            !settings.allowDataCollection,
          );
          await genDeleteMetricsToken();
          setNeedsUpdate(true);
        }}>
        <View style={styles.settingsRow}>
          <View style={styles.settingsValueContainer}>
            <Icon
              style={{
                ...styles.settingsCheck,
                ...(settings.allowDataCollection ? {} : {opacity: 0}),
              }}
              accessibilityLabel={
                settings.allowDataCollection ? 'enabled' : 'disabled'
              }
              name="check"
              type="font-awesome-5"
            />
          </View>
          <View style={styles.settingsText}>
            <Text style={styles.settingsTitle}>Allow Data Collection</Text>
            <Text style={styles.settingsDescription}>
              Language Transfer records anonymous information about how people
              are using this app, which helps us understand what to prioritize
              when we're thinking about how to make the app better. We never
              store your name or any personal data about you. Still, if you'd
              like us to stop collecting information about how you use Language
              Transfer, you can turn that off here.
            </Text>
          </View>
        </View>
      </TouchableNativeFeedback>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  body: {
    flex: 1,
    backgroundColor: 'white',
  },
  container: {},
  settingsRow: {
    paddingVertical: 30,
    flexDirection: 'row',
    borderBottomColor: '#ddd',
    borderBottomWidth: 1,
  },
  settingsValueContainer: {
    width: '20%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsCheck: {},
  settingsText: {
    flex: 1,
    paddingRight: 30,
  },
  settingsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  settingsDescription: {
    fontSize: 16,
  },
});

export default Settings;
