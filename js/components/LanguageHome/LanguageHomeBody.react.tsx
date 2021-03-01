import React, {useState, useCallback} from 'react';
import {StyleSheet, View, Text, Linking, ActivityIndicator} from 'react-native';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {LanguageStackScreenProps} from '../Nav/LanguageNav.react';

import {Icon} from 'react-native-elements';
import {
  TouchableNativeFeedback,
  ScrollView,
} from 'react-native-gesture-handler';
import LanguageHomeTopButton from './LanguageHomeTopButton.react';
import CourseData from '../../course-data';
import {log} from '../../metrics';
import {useCourseContext} from '../Context/CourseContext';

const donationLinksNotAllowedBecauseGooglePlayIsAStinkyPooPoo = true;
let metadataWarningTimeout: NodeJS.Timeout | null = null;

const LanguageHomeBody = () => {
  const {navigate} = useNavigation<LanguageStackScreenProps>();
  const {course} = useCourseContext();
  const [loadingMetadata, setLoadingMetadata] = useState(true);
  const [showMetadataWarning, setShowMetadataWarning] = useState(false);
  const hasMetadata = CourseData.isCourseMetadataLoaded(course);

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
        <LanguageHomeTopButton />

        <View style={styles.additionalButton}>
          <TouchableNativeFeedback
            onPress={() => navigate('All Lessons')}
            useForeground={true}>
            <View style={styles.additionalButtonInner}>
              <Text style={styles.additionalButtonText}>All Lessons</Text>
              <Icon name="list-ol" type="font-awesome-5" />
            </View>
          </TouchableNativeFeedback>
        </View>

        <View style={styles.additionalButton}>
          <TouchableNativeFeedback
            onPress={() => navigate('Data Management')}
            useForeground={true}>
            <View style={styles.additionalButtonInner}>
              <Text style={styles.additionalButtonText}>Data Management</Text>
              <Icon name="tools" type="font-awesome-5" />
            </View>
          </TouchableNativeFeedback>
        </View>

        {donationLinksNotAllowedBecauseGooglePlayIsAStinkyPooPoo ? (
          <View style={styles.additionalButton}>
            <TouchableNativeFeedback
              onPress={() => {
                log({
                  action: 'visit_website',
                  surface: 'language_home',
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
        ) : (
          <View style={styles.additionalButton}>
            <TouchableNativeFeedback
              onPress={() => {
                log({
                  action: 'open_patreon',
                  surface: 'language_home',
                  course,
                });
                Linking.openURL('https://www.patreon.com/languagetransfer');
              }}
              useForeground={true}>
              <View style={styles.additionalButtonInner}>
                <Text style={styles.additionalButtonText}>
                  Support Language Transfer
                </Text>
                <Icon name="patreon" type="font-awesome-5" />
              </View>
            </TouchableNativeFeedback>
          </View>
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
