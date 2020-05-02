import React, {useEffect, useState, useContext} from 'react';
import {StyleSheet, View} from 'react-native';

import ListenHeader from './ListenHeader.react';
import ListenBody from './ListenBody.react';

import languageData from '../../../languageData';
import changeNavigationBarColor from 'react-native-navigation-bar-color';

const Listen = (props) => {
  const [bottomSheetOpen, setBottomSheetOpen] = useState(false);

  useEffect(() => {
    changeNavigationBarColor(
      'transparent',
      !bottomSheetOpen &&
        languageData[props.route.params.course].uiColors.text === 'black',
    );
  }, [props.route.params.course, bottomSheetOpen]);

  const styles = StyleSheet.create({
    background: {
      // without this, there's a small gap between header and body during animation
      backgroundColor:
        languageData[props.route.params.course].uiColors.background,
      height: '100%',
    },
  });

  return (
    <View style={styles.background}>
      <ListenHeader navigation={props.navigation} route={props.route} />
      <ListenBody
        navigation={props.navigation}
        route={props.route}
        setBottomSheetOpen={setBottomSheetOpen}
      />
    </View>
  );
};

export default Listen;
