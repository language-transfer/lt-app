import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Animated, Dimensions, StyleSheet, Text, View } from 'react-native';
import {
  PanGestureHandler,
  PanGestureHandlerGestureEvent,
  PanGestureHandlerStateChangeEvent,
  State,
} from 'react-native-gesture-handler';
import formatDuration from 'format-duration';

import CourseData from '@/src/data/courseData';
import type { CourseName } from '@/src/types';
import type { LessonAudioControls } from '@/src/services/audioPlayer';

type Props = {
  course: CourseName;
  lesson: number;
  position: number;
  duration: number;
  seekTo: LessonAudioControls['seekTo'];
};

const ListenScrubber = ({ course, lesson, position, duration, seekTo }: Props) => {
  const [dragging, setDragging] = useState(false);
  const [width, setWidth] = useState(0);
  const animVal = useRef(new Animated.Value(position)).current;

  React.useEffect(() => {
    if (!dragging) {
      animVal.setValue(position);
    }
  }, [dragging, position, animVal]);

  const secondsPerPoint = useMemo(() => {
    if (width === 0) {
      return 0;
    }
    return duration / width;
  }, [duration, width]);

  const scrubberOffset = useMemo(
    () => (Dimensions.get('screen').width - width) / 2,
    [width],
  );

  const progressWidth = animVal.interpolate({
    inputRange: [0, Math.max(duration, 1)],
    outputRange: [0, width],
    extrapolate: 'clamp',
  });

  const onGestureEvent = useCallback(
    (event: PanGestureHandlerGestureEvent) => {
      const x = event.nativeEvent.absoluteX - scrubberOffset;
      const newPosition = Math.max(0, Math.min(duration, x * secondsPerPoint));
      animVal.setValue(newPosition);
    },
    [duration, secondsPerPoint, scrubberOffset, animVal],
  );

  const onHandlerStateChange = useCallback(
    (event: PanGestureHandlerStateChangeEvent) => {
      if (event.nativeEvent.state === State.BEGAN) {
        setDragging(true);
      } else if (event.nativeEvent.state === State.END) {
        setDragging(false);
        seekTo((animVal as any)._value);
      }
    },
    [seekTo, animVal],
  );

  return (
    <View style={styles.scrubber}>
      <View
        style={[
          styles.progressBar,
          {
            backgroundColor: CourseData.getCourseUIColors(course).backgroundAccent,
          },
        ]}
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      >
        <Animated.View
          style={[
            styles.progressMade,
            {
              backgroundColor: CourseData.getCourseUIColors(course).text,
              width: progressWidth,
            },
          ]}
        />
        <PanGestureHandler
          maxPointers={1}
          minDist={0}
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          onGestureEvent={onGestureEvent}
          onHandlerStateChange={onHandlerStateChange}
        >
          <Animated.View
            style={[
              styles.progressHandle,
              dragging && styles.progressHandleActive,
              { backgroundColor: CourseData.getCourseUIColors(course).text },
              { left: progressWidth },
            ]}
          />
        </PanGestureHandler>
      </View>

      <View style={styles.progressTextContainer}>
        <Text style={{ color: CourseData.getCourseUIColors(course).text }}>
          {formatDuration(position * 1000)}
        </Text>
        <Text style={{ color: CourseData.getCourseUIColors(course).text }}>
          {formatDuration(CourseData.getLessonDuration(course, lesson) * 1000)}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  scrubber: {
    width: '100%',
  },
  progressBar: {
    height: 4,
    width: '100%',
    marginBottom: 15,
    flexDirection: 'row',
  },
  progressMade: {
    height: 4,
    width: 0,
  },
  progressHandle: {
    position: 'absolute',
    top: -4,
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  progressHandleActive: {
    width: 16,
    height: 16,
    top: -6,
    borderRadius: 8,
  },
  progressTextContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});

export default ListenScrubber;
