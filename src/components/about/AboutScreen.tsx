import { useLogger } from "@/src/utils/log";
import { FontAwesome5 } from "@expo/vector-icons";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import type { ComponentProps, ReactNode } from "react";
import React from "react";
import {
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableNativeFeedback,
  View,
} from "react-native";

type Section = "Language Transfer" | "Privacy" | "LT App";
type IconName = ComponentProps<typeof FontAwesome5>["name"];

const ICON_SIZE = 24;

const Icon = ({
  name,
  size = ICON_SIZE,
}: {
  name: IconName;
  size?: number;
}) => <FontAwesome5 name={name} size={size} />;

const SectionCard = ({
  title,
  children,
}: {
  title: Section;
  children: ReactNode;
}) => (
  <View>
    <Text style={styles.sectionTitle}>{title}</Text>
    <View style={styles.sectionCard}>{children}</View>
  </View>
);

const AboutScreen = () => {
  const router = useRouter();
  const log = useLogger({
    surface: "about",
  });

  // TODO: get this from the build environment
  const donationLinksNotAllowedBecauseGooglePlayIsAStinkyPooPoo = true;
  const appVersion =
    Constants.expoConfig?.version ?? Constants.manifest?.version ?? "unknown";

  return (
    <ScrollView style={styles.body} contentContainerStyle={styles.container}>
      <View style={styles.sectionStack}>
        <SectionCard title="Language Transfer">
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
                Eleftheriou. There’s no LT team, though many volunteers have
                helped along the way.
              </Text>

              <Text style={styles.bodyText}>
                The free model reflects a desire to play a cooperative and
                caring role in society, rather than a competitive one.
              </Text>

              <Text style={[styles.bodyText, styles.bodyTextAboveButton]}>
                Contributions from individuals comprise 100% of Language
                Transfer’s funding. If Language Transfer has helped you, and you
                are able, please consider contributing to the project.
              </Text>

              <View style={styles.additionalButton}>
                <TouchableNativeFeedback
                  onPress={() => {
                    log({
                      action: "open_patreon",
                    });
                    Linking.openURL("https://www.patreon.com/languagetransfer");
                  }}
                  useForeground={true}
                >
                  <View style={styles.additionalButtonInner}>
                    <Text style={styles.additionalButtonText}>
                      Contribute on Patreon
                    </Text>
                    <Icon name="patreon" />
                  </View>
                </TouchableNativeFeedback>
              </View>

              <View style={styles.additionalButton}>
                <TouchableNativeFeedback
                  onPress={() => {
                    log({
                      action: "visit_donate_page",
                    });
                    Linking.openURL(
                      "https://www.languagetransfer.org/donations"
                    );
                  }}
                  useForeground={true}
                >
                  <View style={styles.additionalButtonInner}>
                    <Text style={styles.additionalButtonText}>
                      Make a one-time contribution to Language Transfer
                    </Text>
                    <Icon name="donate" />
                  </View>
                </TouchableNativeFeedback>
              </View>
            </>
          )}

          <View style={styles.additionalButton}>
            <TouchableNativeFeedback
              onPress={() => {
                log({
                  action: "visit_website",
                });
                Linking.openURL("https://www.languagetransfer.org/about");
              }}
              useForeground={true}
            >
              <View style={styles.additionalButtonInner}>
                <Text style={styles.additionalButtonText}>
                  Visit languagetransfer.org
                </Text>
                <Icon name="link" />
              </View>
            </TouchableNativeFeedback>
          </View>

          <View style={styles.additionalButton}>
            <TouchableNativeFeedback
              onPress={() => {
                log({
                  action: "open_substack",
                });
                Linking.openURL("https://languagetransfer.substack.com/");
              }}
              useForeground={true}
            >
              <View style={styles.additionalButtonInner}>
                <Text style={styles.additionalButtonText}>Substack blog</Text>
                <Icon name="blog" />
              </View>
            </TouchableNativeFeedback>
          </View>
        </SectionCard>

        <SectionCard title="Privacy">
          <Text style={styles.bodyText}>
            We collect anonymous usage information so we can learn about how
            best to improve the app. You’re welcome to opt out of data
            collection in the Settings pane of this app.
          </Text>
          <Text style={styles.bodyText}>
            This usage information does not identify you or single you out in
            any way; we do not (and cannot) sell your personal information.
            Here’s what we do track:
          </Text>

          <Text style={styles.listElement}>
            {"\u2022"} Your timezone and country, which is derived from your IP
            address.
          </Text>
          <Text style={styles.listElement}>
            {"\u2022"} Your device operating system and operating system
            version, as well as the version of the LT app you’re using.
          </Text>
          <Text style={styles.listElement}>
            {"\u2022"} The actions you take within the app. We remember your
            device uniquely (without any identifying information) so we can
            understand users’ behavior across multiple sessions using the app.
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
        </SectionCard>

        <SectionCard title="LT App">
          <Text style={styles.bodyText}>
            To help us understand where pauses occur in the course audio, we use
            this app to collect data about listening patterns (for example,
            where users are most likely to pause the course audio). By using the
            Thinking Method, you’re helping us learn about how real people
            engage with the Language Transfer course audio. To learn more about
            what data we collect (and about how you can turn off this data
            collection), see the ‘Privacy’ section on this About page.
          </Text>

          <Text style={[styles.bodyText, styles.bodyTextAboveButton]}>
            If you have any feedback that you’d like to share about how we can
            improve the Language Transfer app, feel free to send an email:
          </Text>

          <View style={styles.additionalButton}>
            <TouchableNativeFeedback
              onPress={() => {
                Linking.openURL(
                  "mailto:info@languagetransfer.org" +
                    `?subject=${encodeURIComponent(
                      "Feedback about the Language Transfer app"
                    )}`
                );
              }}
              useForeground={true}
            >
              <View style={styles.additionalButtonInner}>
                <Text style={styles.additionalButtonText}>Contact us</Text>
                <Icon name="envelope" />
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
            ]}
          >
            <TouchableNativeFeedback
              onPress={() => {
                log({
                  action: "open_github",
                });
                Linking.openURL("https://www.github.com/language-transfer");
              }}
              useForeground={true}
            >
              <View style={styles.additionalButtonInner}>
                <Text style={styles.additionalButtonText}>Visit on GitHub</Text>
                <Icon name="github" />
              </View>
            </TouchableNativeFeedback>
          </View>
          <View style={[styles.additionalButton]}>
            <TouchableNativeFeedback
              onPress={() => router.push("/licenses")}
              useForeground={true}
            >
              <View style={styles.additionalButtonInner}>
                <Text style={styles.additionalButtonText}>Licenses</Text>
                <Icon name="osi" />
              </View>
            </TouchableNativeFeedback>
          </View>

          <Text style={styles.bodyText}>
            The app’s core maintainers are Timothy&nbsp;J.&nbsp;Aveni and
            Josh&nbsp;Fayer.
          </Text>
          <Text style={styles.bodyText}>
            This is version {appVersion} of the Language Transfer app.
          </Text>
        </SectionCard>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  body: {
    flex: 1,
    backgroundColor: "#f7f7f7",
  },
  container: {
    paddingBottom: 32,
    paddingHorizontal: 18,
    paddingTop: 28,
  },
  sectionStack: {
    gap: 24,
  },
  sectionCard: {
    backgroundColor: "white",
    borderRadius: 8,
    paddingVertical: 22,
    paddingHorizontal: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 7,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 14,
  },
  bodyText: {
    fontSize: 18,
    lineHeight: 28,
    marginBottom: 12,
  },
  bodyTextAboveButton: {
    marginBottom: 18,
  },

  listElement: {
    fontSize: 17,
    marginLeft: 30,
    marginRight: 10,
    marginBottom: 10,
    lineHeight: 24,
  },

  additionalButton: {
    marginBottom: 20,
    borderRadius: 12,
    backgroundColor: "white",
    overflow: "hidden",
    elevation: 2,
    borderColor: "#ececec",
    borderWidth: StyleSheet.hairlineWidth,
    alignSelf: "stretch",
  },
  additionalButtonExtraMargin: {
    marginTop: 14,
  },
  additionalButtonInner: {
    paddingVertical: 16,
    paddingHorizontal: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  additionalButtonText: {
    fontSize: 18,
    maxWidth: "90%",
  },
});

export default AboutScreen;
