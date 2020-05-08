import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StatusBar,
  StyleSheet,
  TouchableNativeFeedback,
} from 'react-native';

import changeNavigationBarColor from 'react-native-navigation-bar-color';
import {ScrollView} from 'react-native-gesture-handler';

import {
  genPreferenceAutoplay,
  genSetPreferenceAutoplay,
  genPreferenceAutoplayNonDownloaded,
  genSetPreferenceAutoplayNonDownloaded,
  genSetPreferenceAutoDeleteFinished,
  genPreferenceAutoDeleteFinished,
} from '../../persistence';
import {Icon} from 'react-native-elements';

const Settings = (props) => {
  useEffect(() => {
    return props.navigation.addListener('focus', () => {
      StatusBar.setBackgroundColor('white');
      StatusBar.setBarStyle('dark-content', true);
      changeNavigationBarColor('white', true);
    });
  }, [props.navigation]);

  const [needsUpdate, setNeedsUpdate] = useState(true);
  const [settings, setSettings] = useState(null);
  useEffect(() => {
    (async () => {
      if (needsUpdate) {
        const [
          autoplay,
          autoplayNonDownloaded,
          autoDeleteFinished,
        ] = await Promise.all([
          genPreferenceAutoplay(),
          genPreferenceAutoplayNonDownloaded(),
          genPreferenceAutoDeleteFinished(),
        ]);

        setSettings({
          autoplay,
          autoplayNonDownloaded,
          autoDeleteFinished,
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
    <ScrollView>
      <View style={styles.body}>
        <TouchableNativeFeedback
          onPress={async () => {
            if (settings.autoplayNonDownloaded && settings.autoplay) {
              await genSetPreferenceAutoplayNonDownloaded(false);
            }
            await genSetPreferenceAutoplay(!settings.autoplay);
            setNeedsUpdate(true);
          }}>
          <View style={styles.settingsRow}>
            <View style={styles.settingsCheckContainer}>
              <Icon
                style={{
                  ...styles.settingsCheck,
                  ...(settings.autoplay ? {} : {opacity: 0}),
                }}
                name="check"
                type="font-awesome-5"
              />
            </View>
            <View style={styles.settingsText}>
              <Text style={styles.settingsTitle}>Autoplay</Text>
              <Text style={styles.settingsDescription}>
                Automatically advance to the next lesson when each lesson
                finishes.
              </Text>
            </View>
          </View>
        </TouchableNativeFeedback>

        <TouchableNativeFeedback
          onPress={async () => {
            await genSetPreferenceAutoplayNonDownloaded(
              !settings.autoplayNonDownloaded,
            );
            setNeedsUpdate(true);
          }}
          disabled={!settings.autoplay}>
          <View
            style={{
              ...styles.settingsRow,
              ...(settings.autoplay ? {} : {opacity: 0.3}),
            }}>
            <View style={styles.settingsCheckContainer}>
              <Icon
                style={{
                  ...styles.settingsCheck,
                  ...(settings.autoplayNonDownloaded ? {} : {opacity: 0}),
                }}
                name="check"
                type="font-awesome-5"
              />
            </View>
            <View style={styles.settingsText}>
              <Text style={styles.settingsTitle}>
                Autoplay non-downloaded tracks
              </Text>
              <Text style={styles.settingsDescription}>
                Autoplay even if the next track isn't downloaded to the device.
                Turning this off can help you avoid using mobile data if you
                prefer to download lessons in advance.
              </Text>
            </View>
          </View>
        </TouchableNativeFeedback>

        <TouchableNativeFeedback
          onPress={async () => {
            await genSetPreferenceAutoDeleteFinished(
              !settings.autoDeleteFinished,
            );
            setNeedsUpdate(true);
          }}>
          <View style={styles.settingsRow}>
            <View style={styles.settingsCheckContainer}>
              <Icon
                style={{
                  ...styles.settingsCheck,
                  ...(settings.autoDeleteFinished ? {} : {opacity: 0}),
                }}
                name="check"
                type="font-awesome-5"
              />
            </View>
            <View style={styles.settingsText}>
              <Text style={styles.settingsTitle}>
                Delete finished downloads
              </Text>
              <Text style={styles.settingsDescription}>
                Automatically delete downloaded lessons when you finish
                listening to them. Checking this box will not remove any
                existing downloads; to do that, use the Data Management screen.
              </Text>
            </View>
          </View>
        </TouchableNativeFeedback>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  body: {
    backgroundColor: 'white',
  },
  settingsRow: {
    paddingVertical: 30,
    flexDirection: 'row',
    width: '100%',
    borderBottomColor: '#ddd',
    borderBottomWidth: 1,
  },
  settingsCheckContainer: {
    width: '20%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsText: {
    width: '80%',
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
