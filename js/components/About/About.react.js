import React, {useEffect} from 'react';
import {View, Text, StatusBar, StyleSheet, Image} from 'react-native';

import changeNavigationBarColor from 'react-native-navigation-bar-color';
import {ScrollView} from 'react-native-gesture-handler';

import DeviceInfo from 'react-native-device-info';

import logo from '../../../resources/LT-logo-text.png';

const About = (props) => {
  useEffect(() => {
    return props.navigation.addListener('focus', () => {
      StatusBar.setBackgroundColor('white');
      StatusBar.setBarStyle('dark-content', true);
      changeNavigationBarColor('white', true);
    });
  }, [props.navigation]);

  return (
    <ScrollView>
      <View style={styles.body}>
        {/* <Image
          source={logo}
          style={styles.headerImage}
          resizeMode="contain"
          accessibilityLabel="Language Transfer logo"
        /> */}

        <Text style={styles.bodyText}>Visit languagetransfer.org</Text>
        <Text style={styles.bodyText}>Contribute on Patreon</Text>
        <Text style={styles.bodyText}>Make a one-time contribution</Text>
        {/* https://www.languagetransfer.org/donations */}

        <Text style={styles.bodyText}>Visit Language Transfer on Facebook</Text>

        <Text style={styles.headerText}>Language Transfer</Text>

        <Text style={styles.bodyText}>
          Language Transfer audio courses capture real life learning experiences
          in which you can participate fully, wherever you are in the world!
          Just engage, pause, think and answer out loud, the rest will take care
          of itself!
        </Text>

        <Text style={styles.bodyText}>
          Language Transfer is a project by Mihalis Eleftheriou. There's no LT
          team, though many volunteers have helped along the way.
        </Text>
        <Text style={styles.bodyText}>
          The free model reflects a desire to play a cooperative and caring role
          in society, rather than a competitive one.
        </Text>
        <Text style={styles.bodyText}>
          The Thinking Method challenges what we think we know about learning,
          teaching and languages, and what we think we need to know in order to
          really learn.
        </Text>
        <Text style={styles.bodyText}>LT is a non-profit project.</Text>
        <Text style={styles.bodyText}>LT has no sponsors or advertisers.</Text>

        <Text style={styles.headerText}>App</Text>

        <Text style={styles.bodyText}>
          The Language Transfer app is free, open-source software. You can find
          its source code on GitHub at . The app's core maintainer is Timothy J.
          Aveni.
        </Text>
        <Text style={styles.bodyText}>
          This is version {DeviceInfo.getVersion()} of the Language Transfer
          app.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  body: {
    backgroundColor: 'white',
    height: '100%',
    padding: 30,
  },
  headerText: {
    fontSize: 32,
    fontWeight: 'bold',
    marginVertical: 20,
  },
  bodyText: {
    fontSize: 20,
    marginVertical: 10,
  },
});

export default About;
