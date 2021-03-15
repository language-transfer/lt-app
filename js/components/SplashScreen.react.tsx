import React from 'react';
import {View, Image, StyleSheet} from 'react-native';

function SplashScreen() {
  return (
    <View style={styles.container}>
      <Image
        style={styles.image}
        source={require('../../resources/LT-logo-text.png')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    resizeMode: 'contain',
    width: 200,
    height: 190,
  },
});

export default SplashScreen;
