import React, {useState, useRef, useEffect, useCallback} from 'react';
import {StyleSheet, View, Text, Animated} from 'react-native';
import {useProgress} from 'react-native-track-player';
import formatDuration from 'format-duration';
import {useCourseContext} from '../Context/CourseContext';
import {useLessonContext} from '../Context/LessonContext';
import {
  PanGestureHandler,
  State,
  PanGestureHandlerStateChangeEvent,
} from 'react-native-gesture-handler';
import {useNavigation} from '@react-navigation/native';

interface IProps {
  seekTo: CallbackWithParam<number>;
}

const ListenScrubber = ({seekTo}: IProps) => {
  const {setOptions} = useNavigation();
  const {courseData} = useCourseContext();
  const {lessonData} = useLessonContext();
  const {position, duration} = useProgress(200);
  const [dragging, setDragging] = useState(false);
  const [width, setWidth] = useState(0);

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

  // disable screen gestures (only meaningful on iOS)
  // and highlight the handle, as soon as the user touches
  // the handle... we don't want to wait for PanHandler's ACTIVE
  // state cos that might "feel weird"
  const onHandleTouchStart = useCallback(() => {
    setDragging(true);
    setOptions({gestureEnabled: false});
  }, [setOptions]);

  // when the user releases the handle, re-enable screen gestures,
  // and seek the player to the desired seconds position
  const onPanRelease = useCallback(
    (event: PanGestureHandlerStateChangeEvent) => {
      if (event.nativeEvent.state === State.END) {
        setDragging(false);
        // @ts-ignore
        seekTo(animVal.current._value);
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
            backgroundColor: courseData.uiColors.backgroundAccent,
          },
        ]}
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
        <Animated.View
          style={[
            styles.progressMade,
            {
              backgroundColor: courseData.uiColors.text,
              width: progressWidth,
            },
          ]}
        />
        <PanGestureHandler
          onGestureEvent={Animated.event(
            [{nativeEvent: {absoluteX: animVal.current}}],
            {
              useNativeDriver: false,
            },
          )}
          onHandlerStateChange={onPanRelease}>
          <Animated.View
            onTouchStart={onHandleTouchStart}
            style={[
              styles.progressHandle,
              dragging && styles.progressHandleActive,
              {backgroundColor: courseData.uiColors.text},
              {left: progressWidth},
            ]}
          />
        </PanGestureHandler>
      </View>

      <View style={styles.progressTextContainer}>
        <Text
          style={{
            color: courseData.uiColors.text,
          }}>
          {
            // @ts-ignore
            formatDuration(animVal.current._value * 1000)
          }
        </Text>
        <Text
          style={{
            color: courseData.uiColors.text,
          }}>
          {/* downloaded metadata should be fine for track duration, since it can't
            get out of sync if we don't reuse filenames (IDs) */}
          {formatDuration(lessonData.duration * 1000)}
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
