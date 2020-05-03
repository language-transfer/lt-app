import React from 'react';
import {StyleSheet, View, Text, StatusBar, Linking} from 'react-native';

import {Icon} from 'react-native-elements';
import {TouchableNativeFeedback} from 'react-native-gesture-handler';
import LanguageHomeTopButton from './LanguageHomeTopButton.react';

const LanguageHomeBody = (props) => {
  return (
    <View style={styles.body}>
      <LanguageHomeTopButton
        navigation={props.navigation}
        route={props.route}
      />

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
