import React, {useEffect, useState} from 'react';
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

  const [sections, setSections] = useState({
    'Language Transfer': true,
    Privacy: false,
    'LT App': false,
  });

  const shownSection = (title) => (sections[title] ? {} : {display: 'none'});

  const header = (title) => {
    return (
      <TouchableNativeFeedback
        onPress={() => {
          setSections((prevSections) => ({
            ...prevSections,
            [title]: !prevSections[title],
          }));
        }}>
        <View style={styles.headerSection}>
          <Text style={styles.headerText}>{title}</Text>
          {!sections[title] ? (
            <Icon name="plus" type="font-awesome-5" size={24} />
          ) : null}
          {sections[title] ? (
            <Icon name="minus" type="font-awesome-5" size={24} />
          ) : null}
        </View>
      </TouchableNativeFeedback>
    );
  };

  return (
    <ScrollView>
      <View style={styles.body}>
        {/* <Image
          source={logo}
          style={styles.headerImage}
          resizeMode="contain"
          accessibilityLabel="Language Transfer logo"
        /> */}
        {header('Language Transfer')}
        <View style={[styles.bodySection, shownSection('Language Transfer')]}>
          <Text style={styles.bodyText}>
            Language Transfer audio courses capture real life learning
            experiences in which you can participate fully, wherever you are in
            the world! Just engage, pause, think and answer out loud, the rest
            will take care of itself!
          </Text>

          <Text style={styles.bodyText}>
            Language Transfer is totally free, developed by Mihalis Eleftheriou.
            There's no LT team, though many volunteers have helped along the
            way.
          </Text>

          <Text style={styles.bodyText}>
            Contributions from individuals comprise 100% of Language Transfer's
            funding. If Language Transfer has helped you, and you are able,
            please consider contributing to the project.
          </Text>

          <Text style={styles.bodyText}>
            The free model reflects a desire to play a cooperative and caring
            role in society, rather than a competitive one.
          </Text>

          <View style={[styles.additionalButton, {marginTop: 24}]}>
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

          <View style={styles.additionalButton}>
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
                <Text style={styles.additionalButtonText}>
                  Visit on Facebook
                </Text>
                <Icon name="facebook-f" type="font-awesome-5" />
              </View>
            </TouchableNativeFeedback>
          </View>
        </View>
        {header('Privacy')}
        <View style={[styles.bodySection, shownSection('Privacy')]}>
          <Text style={styles.bodyText}>
            We will never sell your data. If you do not opt out of data
            collection (in the Settings pane of this app), we collect anonymous
            usage information so we can learn about how best to improve the app.
            This usage information does not identify you or single you out in
            any way. Here's what we do track:
          </Text>

          <Text style={styles.listElement}>
            {'\u2022'} Your timezone and country, which is derived from your IP
            address.
          </Text>
          <Text style={styles.listElement}>
            {'\u2022'} Your device operating system and operating system
            version, as well as the version of the LT app you're using.
          </Text>
          <Text style={styles.listElement}>
            {'\u2022'} The actions you take within the app. We remember your
            device uniquely (without any identifying information) so we can
            understand users' behavior across multiple sessions using the app.
          </Text>

          <Text style={styles.bodyText}>
            We do not store your IP address permanently, though it may be kept
            for a short period after your usage of the app to that we can
            protect our servers from malicious use.
          </Text>

          <Text style={styles.bodyText}>
            If you choose to report a problem from within the app, we may retain
            any information you send to us indefinitely so we can address the
            problem.
          </Text>
        </View>

        {header('LT App')}
        <View style={[styles.bodySection, shownSection('LT App')]}>
          <Text style={styles.bodyText}>
            The Language Transfer app is free, open-source software. You can
            find its source code on GitHub:
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
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  body: {
    backgroundColor: 'white',
    height: '100%',
  },
  headerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    justifyContent: 'space-between',
    paddingHorizontal: 30,
  },
  headerText: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  bodyText: {
    fontSize: 20,
    marginVertical: 10,
    paddingHorizontal: 30,
  },

  listElement: {
    fontSize: 20,
    marginLeft: 16 + 30,
    marginRight: 30,
  },

  additionalButton: {
    marginBottom: 25,
    borderRadius: 10,
    backgroundColor: 'white',
    overflow: 'hidden',
    elevation: 3,
    marginHorizontal: 30,
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
