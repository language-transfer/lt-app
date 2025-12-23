import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

import {
  genPreferenceAllowDataCollection,
  genPreferenceAutoDeleteFinished,
  genPreferenceDownloadOnlyOnWifi,
  genPreferenceDownloadQuality,
  genPreferenceStreamQuality,
  genDeleteMetricsToken,
  genSetPreferenceAllowDataCollection,
  genSetPreferenceAutoDeleteFinished,
  genSetPreferenceDownloadOnlyOnWifi,
  genSetPreferenceDownloadQuality,
  genSetPreferenceStreamQuality,
} from '@/src/storage/persistence';
import { log } from '@/src/utils/log';

type SettingsState = {
  autoDeleteFinished: boolean;
  streamQuality: 'high' | 'low';
  downloadQuality: 'high' | 'low';
  downloadOnlyOnWifi: boolean;
  allowDataCollection: boolean;
};

const SettingsScreen = () => {
  const [settings, setSettings] = useState<SettingsState | null>(null);
  const [loading, setLoading] = useState(true);

  const loadSettings = async () => {
    setLoading(true);
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
    setLoading(false);
  };

  useEffect(() => {
    loadSettings();
  }, []);

  if (loading || !settings) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator />
      </View>
    );
  }

  const toggle = async (key: keyof SettingsState, updater: () => Promise<void>) => {
    await updater();
    await loadSettings();
  };

  return (
    <ScrollView style={styles.body} contentContainerStyle={styles.container}>
      <SettingRow
        title="Automatically delete finished downloads"
        description="Delete downloaded lessons when you mark them finished."
        accessory={
          <Checkbox checked={settings.autoDeleteFinished} />
        }
        onPress={() =>
          toggle('autoDeleteFinished', () =>
            genSetPreferenceAutoDeleteFinished(!settings.autoDeleteFinished).then(
              () =>
                log({
                  action: 'set_preference',
                  surface: 'auto-delete-finished',
                  setting_value: !settings.autoDeleteFinished,
                }).then(),
            ),
          )
        }
      />
      <SettingRow
        title="Download only on Wi‑Fi"
        description="When enabled, background downloads will only start on Wi‑Fi connections."
        accessory={<Checkbox checked={settings.downloadOnlyOnWifi} />}
        onPress={() =>
          toggle('downloadOnlyOnWifi', () =>
            genSetPreferenceDownloadOnlyOnWifi(!settings.downloadOnlyOnWifi).then(
              () =>
                log({
                  action: 'set_preference',
                  surface: 'download-only-on-wifi',
                  setting_value: !settings.downloadOnlyOnWifi,
                }).then(),
            ),
          )
        }
      />
      <SettingRow
        title="Streaming quality"
        description="Audio quality used when streaming lessons."
        accessory={<Text style={styles.valueText}>{settings.streamQuality}</Text>}
        onPress={() =>
          toggle('streamQuality', () =>
            genSetPreferenceStreamQuality(settings.streamQuality === 'high' ? 'low' : 'high').then(
              () =>
                log({
                  action: 'set_preference',
                  surface: 'stream-quality',
                  setting_value: settings.streamQuality === 'high' ? 'low' : 'high',
                }).then(),
            ),
          )
        }
      />
      <SettingRow
        title="Download quality"
        description="Audio quality used for downloads."
        accessory={<Text style={styles.valueText}>{settings.downloadQuality}</Text>}
        onPress={() =>
          toggle('downloadQuality', () =>
            genSetPreferenceDownloadQuality(settings.downloadQuality === 'high' ? 'low' : 'high').then(
              () =>
                log({
                  action: 'set_preference',
                  surface: 'download-quality',
                  setting_value: settings.downloadQuality === 'high' ? 'low' : 'high',
                }).then(),
            ),
          )
        }
      />
      <SettingRow
        title="Allow data collection"
        description="Send anonymous usage data to help us improve the app."
        accessory={<Checkbox checked={settings.allowDataCollection} />}
        onPress={() =>
          toggle('allowDataCollection', async () => {
            await genSetPreferenceAllowDataCollection(!settings.allowDataCollection);
            log({
              action: 'set_preference',
              surface: 'allow-data-collection',
              setting_value: !settings.allowDataCollection,
            }).then();
            await genDeleteMetricsToken();
          })
        }
      />
    </ScrollView>
  );
};

const Checkbox = ({ checked }: { checked: boolean }) => (
  <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
    {checked ? <FontAwesome5 name="check" size={12} color="#fff" /> : null}
  </View>
);

const SettingRow = ({
  title,
  description,
  accessory,
  onPress,
}: {
  title: string;
  description: string;
  accessory?: React.ReactNode;
  onPress: () => void;
}) => (
  <Pressable style={styles.settingsRow} onPress={onPress}>
    <View style={styles.settingsText}>
      <Text style={styles.settingsTitle}>{title}</Text>
      <Text style={styles.settingsDescription}>{description}</Text>
    </View>
    <View style={styles.accessory}>{accessory}</View>
  </Pressable>
);

const styles = StyleSheet.create({
  body: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    paddingBottom: 24,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsRow: {
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingsText: {
    flex: 1,
    paddingRight: 12,
  },
  settingsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 6,
  },
  settingsDescription: {
    fontSize: 14,
    color: '#555',
  },
  accessory: {
    minWidth: 80,
    alignItems: 'flex-end',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#2980b9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#2980b9',
  },
  valueText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SettingsScreen;
