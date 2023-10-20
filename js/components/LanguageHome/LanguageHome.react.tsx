import React, {useState, useCallback} from 'react';
import {StyleSheet, View, Text, Linking, ActivityIndicator} from 'react-native';
import {useFocusEffect, useNavigation} from '@react-navigation/native';

import {ScrollView} from 'react-native-gesture-handler';
import LanguageHomeTopButton from './LanguageHomeTopButton.react';
import CourseData from '../../course-data';
import {log} from '../../metrics';
import useStatusBarStyle from '../../hooks/useStatusBarStyle';
import {MainNavigationProp} from '../App.react';
import {AdditionalButton} from './AdditionalButton.react';

const donationLinksNotAllowedBecauseGooglePlayIsAStinkyPooPoo = true;
let metadataWarningTimeout: NodeJS.Timeout | null = null;

const LanguageHomeBody = ({route}: {route: any}) => {
  const {course} = route.params;
  const {navigate} = useNavigation<MainNavigationProp<'Language Home'>>();
  const [loadingMetadata, setLoadingMetadata] = useState(true);
  const [showMetadataWarning, setShowMetadataWarning] = useState(false);
  const hasMetadata = CourseData.isCourseMetadataLoaded(course);

  useStatusBarStyle('white', 'dark-content');

  useFocusEffect(
    useCallback(() => {
      async function loadMetadata() {
        setLoadingMetadata(true);

        if (metadataWarningTimeout !== null) {
          clearTimeout(metadataWarningTimeout);
        }

        // if metadata hasn't loaded after 5s, show a
        // preemptive connection warning
        metadataWarningTimeout = setTimeout(() => {
          log({
            action: 'show_metadata_warning',
            surface: 'language_home',
            course,
          });
          setShowMetadataWarning(true);
        }, 5000);

        await CourseData.genLoadCourseMetadata(course);
        clearTimeout(metadataWarningTimeout);
        setShowMetadataWarning(false);
        setLoadingMetadata(false);
      }

      loadMetadata();

      return () => {
        // hopefully metadata has loaded by now, and there's nothing to clear out
        if (metadataWarningTimeout !== null) {
          clearTimeout(metadataWarningTimeout);
        }
      };
    }, [course]),
  );

  if (loadingMetadata || !hasMetadata) {
    return (
      <View style={styles.body}>
        <View style={styles.loading}>
          <ActivityIndicator size={96} />

          {showMetadataWarning && (
            <View style={styles.metadataWarning}>
              <Text style={styles.metadataWarningText}>
                If this screen does not load, check your Internet connection or
                try updating or reinstalling the Language Transfer app.
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.body}>
      <ScrollView>
        <LanguageHomeTopButton course={course} />
        <AdditionalButton
          title="All lessons"
          onPress={() => navigate('All Lessons', {course})}
          icon="list-ol"
          useForeground
        />

        <AdditionalButton
          title="Data Management"
          onPress={() => navigate('Data Management', {course})}
          icon="tools"
          useForeground
        />

        {donationLinksNotAllowedBecauseGooglePlayIsAStinkyPooPoo ? (
          <AdditionalButton
            title="Visit languagetransfer.org"
            onPress={() => {
              log({
                action: 'visit_website',
                surface: 'language_home',
              });
              Linking.openURL('https://www.languagetransfer.org/');
            }}
            icon="link"
            useForeground
          />
        ) : (
          <AdditionalButton
            title="Support Language Transfer"
            onPress={() => {
              log({
                action: 'open_patreon',
                surface: 'language_home',
                course,
              });
              Linking.openURL('https://www.patreon.com/languagetransfer');
            }}
            icon="patreon"
            useForeground
          />
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  body: {
    flex: 1,
    backgroundColor: '#eee',
  },
  loading: {
    marginTop: 128,
  },
  metadataWarning: {
    width: '80%',
    alignSelf: 'center',
    marginTop: 24,
  },
  metadataWarningText: {textAlign: 'center'},

  additionalButton: {
    marginHorizontal: 25,
    marginBottom: 25,
    borderRadius: 10,
    backgroundColor: 'white',
    overflow: 'hidden',
    elevation: 1,
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

export default LanguageHomeBody;
