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

const LanguageHomeBody = (props) => {
  const [metadataLoadedForCourse, setMetadataLoadedForCourse] = useState(false);

  useEffect(() => {
    (async () => {
      await CourseData.genLoadCourseMetadata(props.route.params.course);
      setMetadataLoadedForCourse(props.route.params.course);
    })();
  }, [props.route.params.course, metadataLoadedForCourse]);

  if (!CourseData.isCourseMetadataLoaded(props.route.params.course)) {
    return (
      <View style={styles.body}>
        <View style={styles.loading}>
          <ActivityIndicator size="large" />
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
          <TouchableNativeFeedback onPress={props.onPress} useForeground={true}>
            <View style={styles.additionalButtonInner}>
              <Text style={styles.additionalButtonText}>Data Management</Text>
              <Icon name="tools" type="font-awesome-5" />
            </View>
          </TouchableNativeFeedback>
        </View>

        <View style={styles.additionalButton}>
          <TouchableNativeFeedback
            onPress={() =>
              Linking.openURL('https://www.patreon.com/languagetransfer')
            }
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
  },
  additionalButtonText: {
    fontSize: 20,
  },
});

export default LanguageHomeBody;
