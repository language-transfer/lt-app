import React, {useEffect} from 'react';
import {
  View,
  Text,
  StatusBar,
  StyleSheet,
  Image,
  TouchableNativeFeedback,
  Linking,
} from 'react-native';

import changeNavigationBarColor from 'react-native-navigation-bar-color';
import {ScrollView} from 'react-native-gesture-handler';

import DeviceInfo from 'react-native-device-info';

import logo from '../../../resources/LT-logo-text.png';
import {Icon} from 'react-native-elements';
import {log} from '../../metrics';

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
        <Text style={styles.headerText}>Language Transfer</Text>

        <Text style={styles.bodyText}>
          Language Transfer audio courses capture real life learning experiences
          in which you can participate fully, wherever you are in the world!
          Just engage, pause, think and answer out loud, the rest will take care
          of itself!
        </Text>

        <Text style={styles.bodyText}>
          Language Transfer is totally free, developed by Mihalis Eleftheriou.
          There's no LT team, though many volunteers have helped along the way.
        </Text>

        <Text style={styles.bodyText}>
          Contributions from individuals comprise 100% of Language Transfer's
          funding. If Language Transfer has helped you, and you are able, please
          consider contributing to the project.
        </Text>

        <View style={{...styles.additionalButton, marginTop: 24}}>
          <TouchableNativeFeedback
            onPress={() => {
              log({
                action: 'visit_website',
                surface: 'about',
              });
              Linking.openURL('https://www.languagetransfer.org/');
            }}
            useForeground={true}>
            <View style={styles.additionalButtonInner}>
              <Text style={styles.additionalButtonText}>
                Visit languagetransfer.org
              </Text>
              <Icon name="link" type="font-awesome-5" />
            </View>
          </TouchableNativeFeedback>
        </View>

        <View style={styles.additionalButton}>
          <TouchableNativeFeedback
            onPress={() => {
              log({
                action: 'open_facebook',
                surface: 'about',
              });
              Linking.openURL('https://www.facebook.com/languagetransfer');
            }}
            useForeground={true}>
            <View style={styles.additionalButtonInner}>
              <Text style={styles.additionalButtonText}>Visit on Facebook</Text>
              <Icon name="facebook-f" type="font-awesome-5" />
            </View>
          </TouchableNativeFeedback>
        </View>

        <View style={styles.additionalButton}>
          <TouchableNativeFeedback
            onPress={() => {
              log({
                action: 'open_patreon',
                surface: 'about',
              });
              Linking.openURL('https://www.patreon.com/languagetransfer');
            }}
            useForeground={true}>
            <View style={styles.additionalButtonInner}>
              <Text style={styles.additionalButtonText}>
                Contribute on Patreon
              </Text>
              <Icon name="patreon" type="font-awesome-5" />
            </View>
          </TouchableNativeFeedback>
        </View>

        <View style={styles.additionalButton}>
          <TouchableNativeFeedback
            onPress={() => {
              log({
                action: 'visit_donate_page',
                surface: 'about',
              });
              Linking.openURL('https://www.languagetransfer.org/donations');
            }}
            useForeground={true}>
            <View style={styles.additionalButtonInner}>
              <Text style={styles.additionalButtonText}>
                Make a one-time contribution
              </Text>
              <Icon name="donate" type="font-awesome-5" />
            </View>
          </TouchableNativeFeedback>
        </View>

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

        <Text style={styles.headerText}>Privacy</Text>

        <Text style={styles.bodyText}>
          We will never sell your data. If you do not opt out of data collection
          (in the Settings pane of this app), we collect anonymous usage
          information so we can learn about how best to improve the app. This
          usage information does not identify you or single you out in any way.
          Here's what we do track:
        </Text>

        <Text style={styles.listElement}>
          {'\u2022'} Your timezone and country, which is derived from your IP
          address.
        </Text>
        <Text style={styles.listElement}>
          {'\u2022'} Your device operating system and operating system version,
          as well as the version of the LT app you're using.
        </Text>
        <Text style={styles.listElement}>
          {'\u2022'} The actions you take within the app. We remember your
          device uniquely (without any identifying information) so we can
          understand users' behavior across multiple sessions using the app.
        </Text>

        <Text style={styles.bodyText}>
          We do not store your IP address permanently, though it may be kept for
          a short period after your usage of the app to that we can protect our
          servers from malicious use.
        </Text>

        <Text style={styles.bodyText}>
          If you choose to report a problem from within the app, we may retain
          any information you send to us indefinitely so we can address the
          problem.
        </Text>

        <Text style={styles.headerText}>LT App</Text>

        <Text style={styles.bodyText}>
          The Language Transfer app is free, open-source software. You can find
          its source code on GitHub:
        </Text>
        <View style={{...styles.additionalButton, marginTop: 24}}>
          <TouchableNativeFeedback
            onPress={() => {
              log({
                action: 'open_github',
                surface: 'about',
              });
              Linking.openURL('https://www.github.com/language-transfer');
            }}
            useForeground={true}>
            <View style={styles.additionalButtonInner}>
              <Text style={styles.additionalButtonText}>Visit on GitHub</Text>
              <Icon name="github" type="font-awesome-5" />
            </View>
          </TouchableNativeFeedback>
        </View>

        <Text style={styles.bodyText}>
          The app's core maintainer is Timothy J. Aveni.
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

  listElement: {
    fontSize: 20,
    marginLeft: 16,
  },

  additionalButton: {
    marginBottom: 25,
    borderRadius: 10,
    backgroundColor: 'white',
    overflow: 'hidden',
    elevation: 3,
  },
  additionalButtonInner: {
    padding: 25,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  additionalButtonText: {
    fontSize: 20,
  },
});

export default About;
