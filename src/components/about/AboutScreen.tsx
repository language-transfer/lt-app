import React from 'react';
import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

import { log } from '@/src/utils/log';

const linkButtons = [
  {
    label: 'Visit languagetransfer.org',
    icon: 'link',
    url: 'https://www.languagetransfer.org/about',
    action: 'visit_website',
  },
  {
    label: 'Facebook',
    icon: 'facebook-f',
    url: 'https://www.facebook.com/languagetransfer',
    action: 'open_facebook',
  },
];

const AboutScreen = () => {
  return (
    <ScrollView style={styles.body} contentContainerStyle={styles.container}>
      <View style={styles.section}>
        <Text style={styles.header}>Language Transfer</Text>
        <Text style={styles.paragraph}>
          Language Transfer audio courses capture real-life learning experiences in which you can participate fully,
          wherever you are in the world. Just engage, pause, think, and answer out loud, and the rest takes care of
          itself.
        </Text>
        <Text style={styles.paragraph}>
          Language Transfer is a unique project that remains free thanks to the generosity of learners around the world.
          Learn more about the mission and how to support it:
        </Text>

        {linkButtons.map((button) => (
          <View style={styles.button} key={button.label}>
            <Text
              style={styles.buttonText}
              onPress={() => {
                log({ action: button.action, surface: 'about' });
                Linking.openURL(button.url);
              }}
            >
              <FontAwesome5 name={button.icon as any} size={16} /> {button.label}
            </Text>
          </View>
        ))}
      </View>
      <View style={styles.section}>
        <Text style={styles.header}>Privacy</Text>
        <Text style={styles.paragraph}>
          We collect anonymous usage information so we can understand how to improve the app. You can opt out of data
          collection from the Settings screen at any time.
        </Text>
        <Text style={styles.paragraph}>We collect:</Text>
        <Text style={styles.listItem}>{'\u2022'} Timezone and coarse location, derived from IP address.</Text>
        <Text style={styles.listItem}>{'\u2022'} Device operating system/version and app version.</Text>
        <Text style={styles.listItem}>
          {'\u2022'} Actions taken within the app, tied to a random anonymous identifier.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  body: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    padding: 24,
    gap: 24,
  },
  section: {
    backgroundColor: '#fafafa',
    borderRadius: 12,
    padding: 20,
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 16,
    marginBottom: 12,
  },
  listItem: {
    fontSize: 16,
    marginBottom: 8,
  },
  button: {
    marginTop: 12,
  },
  buttonText: {
    color: '#2980b9',
    fontSize: 16,
  },
});

export default AboutScreen;
