import React from 'react';
import {StyleSheet, View, Text, StatusBar, Linking} from 'react-native';

import {Icon} from 'react-native-elements';
import {TouchableNativeFeedback} from 'react-native-gesture-handler';

const ListenBody = (props) => {
  return (
    <View style={styles.body}>
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

export default ListenBody;
