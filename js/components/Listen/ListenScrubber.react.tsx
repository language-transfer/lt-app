import React, {useState, useRef, useEffect, useCallback, useMemo} from 'react';
import {StyleSheet, View, Text, Animated, Dimensions} from 'react-native';
import {useTrackPlayerProgress} from 'react-native-track-player';
import formatDuration from 'format-duration';
import CourseData from '../../course-data';
import {useCourseContext} from '../Context/CourseContext';
import {useLessonContext} from '../Context/LessonContext';
import {
  PanGestureHandler,
  State,
  PanGestureHandlerStateChangeEvent,
  PanGestureHandlerGestureEvent,
} from 'react-native-gesture-handler';
import {useNavigation} from '@react-navigation/native';

interface IProps {
  seekTo: CallbackWithParam<number>;
}

const ListenScrubber = ({seekTo}: IProps) => {
  const {setOptions} = useNavigation();
  const {course} = useCourseContext();
  const {lesson} = useLessonContext();
  const {position, duration} = useTrackPlayerProgress(200);
  const [dragging, setDragging] = useState(false);
  const [width, setWidth] = useState(0);

  // we'll use this seconds:"pixels" ratio & the scrubber's
  // offset to determine how much to seek, when the
  // user drags the scrubber handle
  const secondsPerScreenPoint = useMemo(() => duration / width, [
    duration,
    width,
  ]);
  const scrubberOffset = useMemo(
    // this is basically a calculation of how far from the left edge
    // the scrubber is located
    () => (Dimensions.get('screen').width - width) / 2,
    [width],
  );

  // keep our animated value up-to-date with the
  // player's progress, except when the user is actively
  // dragging the scrubber
  const animVal = useRef(new Animated.Value(position));
  useEffect(() => {
    if (!dragging) {
      animVal.current.setValue(position);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [position]);

  // translate %Seconds% to %Width%
  const progressWidth = animVal.current.interpolate({
    inputRange: [0, duration],
    outputRange: [0, width],
    extrapolate: 'clamp',
  });

  const onGestureEvent = useCallback(
    (event: PanGestureHandlerGestureEvent) => {
      const x = event.nativeEvent.absoluteX - scrubberOffset;
      const newPosition = x * secondsPerScreenPoint;
      // dragged position can't be beyond the lesson's duration
      const boundedNewPosition = Math.max(0, Math.min(duration, newPosition));
      animVal.current.setValue(boundedNewPosition);
    },
    [secondsPerScreenPoint, scrubberOffset, duration],
  );

  const onHandlerStateChange = useCallback(
    (event: PanGestureHandlerStateChangeEvent) => {
      if (event.nativeEvent.state === State.BEGAN) {
        setDragging(true);
        // disable screen gestures (only meaningful on iOS; mostly so that the left
        // drawer doesn't open with the drag) and highlight the handle,
        // as soon as the user touches the handle...
        // we don't want to wait for PanHandler's ACTIVE state cos that might "feel weird"
        setOptions({gestureEnabled: false});
      } else if (event.nativeEvent.state === State.END) {
        setDragging(false);
        // @ts-ignore
        seekTo(animVal.current._value);
        // when the user releases the handle, re-enable screen gestures,
        // and seek the player to the desired seconds position
        setOptions({gestureEnabled: true});
      }
    },
    [seekTo, setOptions],
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
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
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
          hitSlop={{top: 20, bottom: 20, left: 20, right: 20}}
          onGestureEvent={onGestureEvent}
          onHandlerStateChange={onHandlerStateChange}>
          <Animated.View
            style={[
              styles.progressHandle,
              dragging && styles.progressHandleActive,
              {backgroundColor: CourseData.getCourseUIColors(course).text},
              {left: progressWidth},
            ]}
          />
        </PanGestureHandler>
      </View>

      <View style={styles.progressTextContainer}>
        <Text
          style={{
            color: CourseData.getCourseUIColors(course).text,
          }}>
          {
            // @ts-ignore
            formatDuration(animVal.current._value * 1000)
          }
        </Text>
        <Text
          style={{
            color: CourseData.getCourseUIColors(course).text,
          }}>
          {/* downloaded metadata should be fine for track duration, since it can't
            get out of sync if we don't reuse filenames (IDs) */}
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
    backgroundColor: 'green',
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
