import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableNativeFeedback,
  Linking,
  ViewStyle,
} from 'react-native';
import {ScrollView} from 'react-native-gesture-handler';
import useStatusBarStyle from '../../hooks/useStatusBarStyle';
import DeviceInfo from 'react-native-device-info';
import {Icon} from 'react-native-elements';
import {log} from '../../metrics';
import {useNavigation} from '@react-navigation/native';
import {MainNavigationProp} from '../App.react';

type Section = 'Language Transfer' | 'Privacy' | 'LT App';

const About = () => {
  useStatusBarStyle('white', 'dark-content');
  const {navigate} = useNavigation<MainNavigationProp<'Licenses'>>();

  const [sections, setSections] = useState<{[key in Section]: boolean}>({
    'Language Transfer': true,
    Privacy: false,
    'LT App': false,
  });

  const shownSection = (title: Section): ViewStyle =>
    sections[title] ? {} : {display: 'none'};

  const header = (title: Section) => {
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

  // TODO: get this from the build environment
  const donationLinksNotAllowedBecauseGooglePlayIsAStinkyPooPoo = true;

  return (
    <ScrollView style={styles.body} contentContainerStyle={styles.container}>
      <View>
        {header('Language Transfer')}
        <View style={shownSection('Language Transfer')}>
          <Text style={styles.bodyText}>
            Language Transfer audio courses capture real life learning
            experiences in which you can participate fully, wherever you are in
            the world! Just engage, pause, think and answer out loud, the rest
            will take care of itself!
          </Text>

          {donationLinksNotAllowedBecauseGooglePlayIsAStinkyPooPoo ? (
            <>
              <Text style={[styles.bodyText, styles.bodyTextAboveButton]}>
                Language Transfer is a unique project in more ways than one.
                Learn more about Language Transfer here:
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.bodyText}>
                Language Transfer is totally free, developed by Mihalis
                Eleftheriou. There's no LT team, though many volunteers have
                helped along the way.
              </Text>

              <Text style={styles.bodyText}>
                The free model reflects a desire to play a cooperative and
                caring role in society, rather than a competitive one.
              </Text>

              <Text style={[styles.bodyText, styles.bodyTextAboveButton]}>
                Contributions from individuals comprise 100% of Language
                Transfer's funding. If Language Transfer has helped you, and you
                are able, please consider contributing to the project.
              </Text>

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
                    Linking.openURL(
                      'https://www.languagetransfer.org/donations',
                    );
                  }}
                  useForeground={true}>
                  <View style={styles.additionalButtonInner}>
                    <Text style={styles.additionalButtonText}>
                      Make a one-time contribution to Language Transfer
                    </Text>
                    <Icon name="donate" type="font-awesome-5" />
                  </View>
                </TouchableNativeFeedback>
              </View>
            </>
          )}

          <View style={styles.additionalButton}>
            <TouchableNativeFeedback
              onPress={() => {
                log({
                  action: 'visit_website',
                  surface: 'about',
                });
                Linking.openURL('https://www.languagetransfer.org/about');
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
        <View style={shownSection('Privacy')}>
          <Text style={styles.bodyText}>
            We collect anonymous usage information so we can learn about how
            best to improve the app. You're welcome to opt out of data
            collection in the Settings pane of this app.
          </Text>
          <Text style={styles.bodyText}>
            This usage information does not identify you or single you out in
            any way; we do not (and cannot) sell your personal information.
            Here's what we do track:
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
            for a short period after your usage of the app so that we can
            protect our servers from malicious use.
          </Text>

          <Text style={styles.bodyText}>
            If you choose to contact us or report a problem from within the app,
            we may retain any information you send to us indefinitely so that we
            can take action on your feedback.
          </Text>
        </View>

        {header('LT App')}
        <View style={shownSection('LT App')}>
          <Text style={styles.bodyText}>
            Here's some of what we're planning for the future of the app:
          </Text>

          <Text style={styles.listElement}>
            {'\u2022'} Arabic vocabulary cards, including audio from native
            speakers of Arabic.
          </Text>
          <Text style={styles.listElement}>
            {'\u2022'} Ways to share Language Transfer and your progress with
            your friends on social media.
          </Text>
          <Text style={styles.listElement}>
            {'\u2022'} Intelligent automatic pausing when the teacher asks a
            question.
          </Text>

          <Text style={styles.bodyText}>
            To help us understand where pauses occur in the course audio, we
            collect data about listening patterns. By using the Thinking Method,
            you're helping us learn about how real people engage with the
            Language Transfer course audio. To learn more about what data we
            collect (and about how you can turn off this data collection), see
            the 'Privacy' section on this About page.
          </Text>

          <Text style={[styles.bodyText, styles.bodyTextAboveButton]}>
            If you have any feedback that you'd like to share about how we can
            improve the Language Transfer app, feel free to send an email:
          </Text>

          <View style={styles.additionalButton}>
            <TouchableNativeFeedback
              onPress={() => {
                Linking.openURL(
                  'mailto:info@languagetransfer.org' +
                    `?subject=${encodeURIComponent(
                      'Feedback about the Language Transfer app',
                    )}`,
                );
              }}
              useForeground={true}>
              <View style={styles.additionalButtonInner}>
                <Text style={styles.additionalButtonText}>Contact us</Text>
                <Icon name="envelope" type="font-awesome-5" />
              </View>
            </TouchableNativeFeedback>
          </View>

          <Text style={styles.bodyText}>
            The Language Transfer app is free, open-source software. You can
            find its source code on GitHub:
          </Text>
          <View
            style={[
              styles.additionalButton,
              styles.additionalButtonExtraMargin,
            ]}>
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
          <View style={[styles.additionalButton]}>
            <TouchableNativeFeedback
              onPress={() => navigate('Licenses')}
              useForeground={true}>
              <View style={styles.additionalButtonInner}>
                <Text style={styles.additionalButtonText}>Licenses</Text>
                <Icon name="osi" type="font-awesome-5" />
              </View>
            </TouchableNativeFeedback>
          </View>

          <Text style={styles.bodyText}>
            The app's core maintainers are Timothy J. Aveni and Josh Fayer.
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
    flex: 1,
    backgroundColor: 'white',
  },
  container: {
    paddingBottom: 20,
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
  bodyTextAboveButton: {
    marginBottom: 24,
  },

  listElement: {
    fontSize: 20,
    marginLeft: 16 + 30,
    marginRight: 30,
    marginBottom: 12,
  },

  additionalButton: {
    marginBottom: 25,
    borderRadius: 10,
    backgroundColor: 'white',
    overflow: 'hidden',
    elevation: 3,
    marginHorizontal: 30,
  },
  additionalButtonExtraMargin: {
    marginTop: 24,
  },
  additionalButtonInner: {
    padding: 25,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  additionalButtonText: {
    fontSize: 20,
    maxWidth: '90%',
  },
});

export default About;
