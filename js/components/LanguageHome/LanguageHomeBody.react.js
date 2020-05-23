import React, {useEffect, useState} from 'react';
import {
  StyleSheet,
  View,
  Text,
  StatusBar,
  Linking,
  ActivityIndicator,
} from 'react-native';

import {Icon} from 'react-native-elements';
import {
  TouchableNativeFeedback,
  ScrollView,
} from 'react-native-gesture-handler';
import LanguageHomeTopButton from './LanguageHomeTopButton.react';
import CourseData from '../../course-data';
import {log} from '../../metrics';

let metadataWarningTimeout = null;

const LanguageHomeBody = (props) => {
  const [metadataLoadedForCourse, setMetadataLoadedForCourse] = useState(false);
  const [showMetadataWarning, setShowMetadataWarning] = useState(false);

  useEffect(() => {
    const load = async () => {
      clearTimeout(metadataWarningTimeout);
      metadataWarningTimeout = setTimeout(() => {
        log({
          action: 'show_metadata_warning',
          surface: 'language_home',
          course: props.route.params.course,
        });
        setShowMetadataWarning(true);
      }, 5000);

      await CourseData.genLoadCourseMetadata(props.route.params.course);
      setMetadataLoadedForCourse(props.route.params.course);
      clearTimeout(metadataWarningTimeout);
      setShowMetadataWarning(false);
    };

    load();

    const subscriptions = [
      props.navigation.addListener('focus', load),
      props.navigation.addListener('blur', () =>
        // just throwing this everywhere to see what sticks
        clearTimeout(metadataWarningTimeout),
      ),
    ];

    return () => subscriptions.forEach((s) => s());
  }, [props.route.params.course, metadataLoadedForCourse]);

  if (!CourseData.isCourseMetadataLoaded(props.route.params.course)) {
    return (
      <View style={styles.body}>
        <View style={styles.loading}>
          <ActivityIndicator size={96} />
          <View
            style={{
              ...styles.metadataWarning,
              opacity: showMetadataWarning ? 1 : 0,
            }}>
            <Text style={styles.metadataWarningText}>
              If this screen does not load, check your Internet connection or
              try updating or reinstalling the Language Transfer app.
            </Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.body}>
      <ScrollView>
        <LanguageHomeTopButton
          navigation={props.navigation}
          route={props.route}
        />

        <View style={styles.additionalButton}>
          <TouchableNativeFeedback
            onPress={() =>
              props.navigation.navigate('All Lessons', {
                course: props.route.params.course,
              })
            }
            useForeground={true}>
            <View style={styles.additionalButtonInner}>
              <Text style={styles.additionalButtonText}>All Lessons</Text>
              <Icon name="list-ol" type="font-awesome-5" />
            </View>
          </TouchableNativeFeedback>
        </View>

        <View style={styles.additionalButton}>
          <TouchableNativeFeedback
            onPress={() =>
              props.navigation.navigate('Data Management', {
                course: props.route.params.course,
              })
            }
            useForeground={true}>
            <View style={styles.additionalButtonInner}>
              <Text style={styles.additionalButtonText}>Data Management</Text>
              <Icon name="tools" type="font-awesome-5" />
            </View>
          </TouchableNativeFeedback>
        </View>

        <View style={styles.additionalButton}>
          <TouchableNativeFeedback
            onPress={() => {
              log({
                action: 'open_patreon',
                surface: 'language_home',
                course: props.route.params.course,
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
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  body: {
    backgroundColor: '#eee',
    height: '100%',
    marginTop: 56 + StatusBar.currentHeight, // header is absolutely positioned so we get elevation
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
