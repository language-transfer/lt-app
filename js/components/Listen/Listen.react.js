import React from 'react';
import {StyleSheet, View} from 'react-native';

import ListenHeader from './ListenHeader.react';
import ListenBody from './ListenBody.react';

const Listen = (props) => {
  return (
    <>
      <ListenHeader navigation={props.navigation} route={props.route} />
      <ListenBody />
    </>
  );
};

export default Listen;
