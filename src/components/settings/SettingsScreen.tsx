import { FontAwesome5 } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  genDeleteMetricsToken,
  genSetPreferenceAllowDataCollection,
  genSetPreferenceAutoDeleteFinished,
  genSetPreferenceDownloadOnlyOnWifi,
  genSetPreferenceDownloadQuality,
  genSetPreferenceStreamQuality,
  usePreferenceAllowDataCollection,
  usePreferenceAutoDeleteFinished,
  usePreferenceDownloadOnlyOnWifi,
  usePreferenceDownloadQuality,
  usePreferenceStreamQuality,
} from "@/src/storage/persistence";
import { useLogger } from "@/src/utils/log";

type SettingsState = {
  autoDeleteFinished: boolean;
  streamQuality: "high" | "low";
  downloadQuality: "high" | "low";
  downloadOnlyOnWifi: boolean;
  allowDataCollection: boolean;
};

type NullableSettingsState = {
  [K in keyof SettingsState]: SettingsState[K] | null;
};

const settingsLoaded = (s: NullableSettingsState): s is SettingsState =>
  Object.values(s).every((v) => v !== null);

const SettingsScreen = () => {
  const [
    autoDeleteFinished,
    streamQuality,
    downloadQuality,
    downloadOnlyOnWifi,
    allowDataCollection,
  ] = [
    usePreferenceAutoDeleteFinished(),
    usePreferenceStreamQuality(),
    usePreferenceDownloadQuality(),
    usePreferenceDownloadOnlyOnWifi(),
    usePreferenceAllowDataCollection(),
  ];

  const log = useLogger();

  const settings: NullableSettingsState = {
    autoDeleteFinished,
    streamQuality,
    downloadQuality,
    downloadOnlyOnWifi,
    allowDataCollection,
  };

  // TODO - this flickers the screen while reloading. consider SWR
  // (actually, i'm not sure it really does anymore now that we've switched to the hooks --
  //   possible that asyncstorage query refresh is essentially instant)
  if (!settingsLoaded(settings)) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <ScrollView style={styles.body} contentContainerStyle={styles.container}>
      <SettingRow
        title="Automatically delete finished downloads"
        description="Delete downloaded lessons when you mark them finished."
        accessory={<Checkbox checked={settings.autoDeleteFinished} />}
        onPress={async () => {
          await genSetPreferenceAutoDeleteFinished(
            !settings.autoDeleteFinished
          );

          log({
            action: "set_preference",
            surface: "auto-delete-finished",
            setting_value: !settings.autoDeleteFinished,
          }).then();
        }}
      />
      <SettingRow
        title="Download only on Wi‑Fi"
        description="When enabled, track downloads will only start on Wi‑Fi connections."
        accessory={<Checkbox checked={settings.downloadOnlyOnWifi} />}
        onPress={async () => {
          await genSetPreferenceDownloadOnlyOnWifi(
            !settings.downloadOnlyOnWifi
          );

          log({
            action: "set_preference",
            surface: "download-only-on-wifi",
            setting_value: !settings.downloadOnlyOnWifi,
          }).then();
        }}
      />
      <SettingRow
        title="Streaming quality"
        description="Audio quality used when streaming lessons."
        accessory={
          <Text style={styles.valueText}>{settings.streamQuality}</Text>
        }
        onPress={async () => {
          const newValue = settings.streamQuality === "high" ? "low" : "high";
          await genSetPreferenceStreamQuality(newValue);

          log({
            action: "set_preference",
            surface: "stream-quality",
            setting_value: newValue,
          }).then();
        }}
      />
      <SettingRow
        title="Download quality"
        description="Audio quality used for downloads."
        accessory={
          <Text style={styles.valueText}>{settings.downloadQuality}</Text>
        }
        onPress={async () => {
          const newValue = settings.downloadQuality === "high" ? "low" : "high";
          await genSetPreferenceDownloadQuality(newValue);

          log({
            action: "set_preference",
            surface: "download-quality",
            setting_value: newValue,
          }).then();
        }}
      />
      <SettingRow
        title="Allow data collection"
        description="Send anonymous usage data to help us improve the app."
        accessory={<Checkbox checked={settings.allowDataCollection} />}
        onPress={async () => {
          await genSetPreferenceAllowDataCollection(
            !settings.allowDataCollection
          );

          log({
            action: "set_preference",
            surface: "allow-data-collection",
            setting_value: !settings.allowDataCollection,
          }).then();

          await genDeleteMetricsToken();
        }}
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
    backgroundColor: "#fff",
  },
  container: {
    paddingBottom: 24,
  },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  settingsRow: {
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    flexDirection: "row",
    alignItems: "center",
  },
  settingsText: {
    flex: 1,
    paddingRight: 12,
  },
  settingsTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 6,
  },
  settingsDescription: {
    fontSize: 14,
    color: "#555",
  },
  accessory: {
    minWidth: 80,
    alignItems: "flex-end",
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#2980b9",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: "#2980b9",
  },
  valueText: {
    fontSize: 16,
    fontWeight: "600",
  },
});

export default SettingsScreen;
