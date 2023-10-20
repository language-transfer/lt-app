import React from 'react';
import {View, Text, StyleSheet} from 'react-native';

import {Icon} from 'react-native-elements';
import {TouchableNativeFeedback} from 'react-native-gesture-handler';

export interface Props {
  onPress: () => void;
  title: string;
  icon: string;
  useForeground: boolean;
  customStyles?: {
    additionalButton?: {};
    additionalButtonInner?: {};
    additionalButtonText?: {};
  };
}

export const AdditionalButton = ({
  title,
  onPress,
  icon,
  useForeground,
  customStyles = {
    additionalButton: {},
    additionalButtonInner: {},
    additionalButtonText: {},
  },
}: Props) => {
  return (
    <View style={[styles.additionalButton, customStyles.additionalButton]}>
      <TouchableNativeFeedback onPress={onPress} useForeground={useForeground}>
        <View
          style={[
            styles.additionalButtonInner,
            customStyles.additionalButtonInner,
          ]}>
          <Text
            style={[
              styles.additionalButtonText,
              customStyles.additionalButtonText,
            ]}>
            {title}
          </Text>
          <Icon name={icon} type="font-awesome-5" />
        </View>
      </TouchableNativeFeedback>
    </View>
  );
};

const styles = StyleSheet.create({
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
