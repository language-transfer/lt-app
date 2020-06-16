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

let metadataWarningTimeout: NodeJS.Timeout | null = null;

const LanguageHomeBody = () => {
  const {navigate} = useNavigation<LanguageStackScreenProps>();
  const {course} = useCourseContext();

  // @TOOD: why do we need this state?
  const [, setMetadataLoadedForCourse] = useState<Course | null>(null);
  const [showMetadataWarning, setShowMetadataWarning] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        if (metadataWarningTimeout !== null) {
          clearTimeout(metadataWarningTimeout);
        }

        metadataWarningTimeout = setTimeout(() => {
          log({
            action: 'show_metadata_warning',
            surface: 'language_home',
            course,
          });
          setShowMetadataWarning(true);
        }, 5000);

        await CourseData.genLoadCourseMetadata(course);
        setMetadataLoadedForCourse(course);
        clearTimeout(metadataWarningTimeout);
        setShowMetadataWarning(false);
      };

      load();

      return () => {
        // just throwing this everywhere to see what sticks
        if (metadataWarningTimeout !== null) {
          clearTimeout(metadataWarningTimeout);
        }
      };
    }, [course]),
  );

  if (!CourseData.isCourseMetadataLoaded(course)) {
    return (
      <View style={styles.body}>
        <View style={styles.loading}>
          <ActivityIndicator size={96} />
          <View
            style={[
              styles.metadataWarning,
              !showMetadataWarning && styles.metadataWarningHidden,
            ]}>
            <Text style={styles.metadataWarningText}>
              If this screen does not load, check your Internet connection or
              try updating or reinstalling the Language Transfer app.
            </Text>
          </View>
        </View>
      </View>
    );
  }

  const donationLinksNotAllowedBecauseGooglePlayIsAStinkyPooPoo = true;

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
  metadataWarningHidden: {
    opacity: 0,
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
