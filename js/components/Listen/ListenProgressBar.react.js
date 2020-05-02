import React, {useEffect, useState} from 'react';
import {StyleSheet, View, Text} from 'react-native';

import TrackPlayer from 'react-native-track-player';

import formatDuration from 'format-duration';

const ListenScrubber = (props) => {
  const [{position, duration}, setState] = useState({
    position: 0,
    duration: 0,
  });

  useEffect(() => {
    const interval = window.setInterval(async () => {
      const [position, duration] = await Promise.all([
        TrackPlayer.getPosition(),
        TrackPlayer.getDuration(),
      ]);

      setState({position: position || 0, duration: duration || 0});
    }, 500);
    return () => {
      window.clearInterval(interval);
    };
  }, []);
  position;
  const styles = StyleSheet.create({
    scrubber: {
      paddingHorizontal: '10%',
    },
    progressBar: {
      height: 4,
      width: '100%',
      marginBottom: 15,
      flexDirection: 'row',
    },
    progressMade: {
      height: 4,
      flex: position,
      backgroundColor: props.colors.text,
    },
    progressLeft: {
      height: 4,
      flex: duration === 0 ? 1 : duration - position,
      backgroundColor: props.colors.backgroundAccent,
    },
    progressTextContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    progressText: {
      color: props.colors.text,
    },
  });

  return (
    <View style={styles.scrubber}>
      <View style={styles.progressBar}>
        <View style={styles.progressMade} />
        <View style={styles.progressLeft} />
      </View>
      <View style={styles.progressTextContainer}>
        <Text style={styles.progressText}>
          {formatDuration(position * 1000)}
        </Text>
        <Text style={styles.progressText}>
          {duration > 0 ? formatDuration(duration * 1000) : '?:??'}
        </Text>
      </View>
    </View>
  );
};

export default ListenScrubber;
