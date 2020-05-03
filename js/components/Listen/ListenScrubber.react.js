import React, {useEffect, useState} from 'react';
import {StyleSheet, View, Text} from 'react-native';

import TrackPlayer from 'react-native-track-player';

import formatDuration from 'format-duration';
import languageData from '../../../languageData';
import {genUpdateProgressForLesson} from '../../persistence';

const ListenScrubber = (props) => {
  const [position, setPosition] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(async () => {
      const position = await TrackPlayer.getPosition();

      setPosition(position || 0);
      // we also do this in a less-frequent service, but while the progress bar is in view let's go fast
      // await genUpdateProgressForLesson(props.course, props.lesson, position);
    }, 200);
    return () => {
      window.clearInterval(interval);
    };
  }, [props.playing]);

  const duration =
    languageData[props.course].meta.lessons[props.lesson].duration;

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
      flex: duration === null ? 1 : duration - position,
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
          {/* downloaded metadata should be fine for track duration, since it can't
            get out of sync if we don't reuse filenames (IDs) */}
          {formatDuration(duration * 1000)}
        </Text>
      </View>
    </View>
  );
};

export default ListenScrubber;
