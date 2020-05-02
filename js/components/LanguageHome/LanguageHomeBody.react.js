import React from 'react';
import {StyleSheet, View, Text, StatusBar, Linking} from 'react-native';

import {Icon} from 'react-native-elements';
import {TouchableNativeFeedback} from 'react-native-gesture-handler';

const LanguageHomeBody = (props) => {
  return (
    <View style={styles.body}>
      <View style={styles.lessonPlayBox}>
        <TouchableNativeFeedback
          useForeground={true}
          onPress={() => props.navigation.navigate('Listen')}>
          <View style={styles.lessonPlayBoxInner}>
            <View style={styles.textPlayFlex}>
              <Text style={styles.lessonTitle}>Lesson 19</Text>
              <Icon name="play" type="font-awesome-5" />
            </View>
            <View style={styles.progressBar}>
              <View style={styles.progressMade} />
              <View style={styles.progressLeft} />
            </View>
            <View style={styles.progressText}>
              <Text>2:40</Text>
              <Text>7:02</Text>
            </View>
          </View>
        </TouchableNativeFeedback>
      </View>

      <View style={styles.additionalButton}>
        <TouchableNativeFeedback onPress={props.onPress} useForeground={true}>
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
    </View>
  );
};

const styles = StyleSheet.create({
  body: {
    backgroundColor: '#eee',
    height: '100%',
    marginTop: 56 + StatusBar.currentHeight, // header is absolutely positioned so we get elevation
  },
  lessonPlayBox: {
    margin: 25,
    borderRadius: 10,
    backgroundColor: 'white',
    overflow: 'hidden',
    elevation: 4,
  },
  lessonPlayBoxInner: {
    padding: 25,
  },
  textPlayFlex: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  lessonTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  progressBar: {
    height: 4,
    width: '100%',
    marginTop: 50,
    marginBottom: 15,
    flexDirection: 'row',
  },
  progressMade: {
    height: 4,
    flex: 2 * 60 + 40,
    backgroundColor: '#aaa',
  },
  progressLeft: {
    height: 4,
    flex: 7 * 60 + 2 - (2 * 60 + 40),
    backgroundColor: '#ddd',
  },
  progressText: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
