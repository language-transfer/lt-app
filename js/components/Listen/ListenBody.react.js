import React, {useRef} from 'react';
import {StyleSheet, View, Text, StatusBar, Dimensions} from 'react-native';

import {Icon} from 'react-native-elements';
import {TouchableNativeFeedback} from 'react-native-gesture-handler';
import RBSheet from 'react-native-raw-bottom-sheet';

import ListenBottomSheet from './ListenBottomSheet.react';

import languageData from '../../../languageData';
import ListenScrubber from './ListenProgressBar.react';

const ListenBody = (props) => {
  const bottomSheet = useRef();

  const {course, lesson} = props.route.params;

  const styles = StyleSheet.create({
    body: {
      backgroundColor: languageData[course].uiColors.background,
      height:
        // 56 + SB.height is the header. 48 is the bottom nav height
        Dimensions.get('screen').height - (56 + StatusBar.currentHeight) - 48,
      alignItems: 'center',
      justifyContent: 'space-around',
    },

    lessonName: {
      alignItems: 'center',
    },

    courseTitle: {
      fontWeight: 'bold',
      fontSize: 48,
      color: languageData[course].uiColors.text,
    },
    lesson: {
      fontSize: 32,
      color: languageData[course].uiColors.text,
    },

    icons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      width: '100%',
      paddingHorizontal: '10%',
      alignItems: 'center',
    },

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
      flex: 2 * 60 + 40,
      backgroundColor: languageData[course].uiColors.text,
    },
    progressLeft: {
      height: 4,
      flex: 7 * 60 + 2 - (2 * 60 + 40),
      backgroundColor: languageData[course].uiColors.backgroundAccent,
    },
    progressTextContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    progressText: {
      color: languageData[course].uiColors.text,
    },

    bottomButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      width: '100%',
      paddingHorizontal: '10%',
      alignItems: 'center',
    },

    bottomButton: {
      maxWidth: 72,
    },
  });

  return (
    <>
      <View style={styles.body}>
        <View style={styles.lessonName}>
          <Text style={styles.courseTitle}>{languageData[course].title}</Text>
          <Text style={styles.lesson}>Lesson {lesson}</Text>
        </View>

        <View style={styles.icons}>
          <TouchableNativeFeedback
            background={TouchableNativeFeedback.Ripple(null, true)}
            onPress={props.skipBack}>
            <Icon
              name="replay-10"
              type="material"
              size={72}
              color={languageData[course].uiColors.text}
            />
          </TouchableNativeFeedback>
          <TouchableNativeFeedback
            background={TouchableNativeFeedback.Ripple(null, true)}
            onPress={props.toggle}>
            <Icon
              name={props.playing ? 'pause' : 'play-arrow'}
              type="material"
              size={172}
              color={languageData[course].uiColors.text}
            />
          </TouchableNativeFeedback>
          <TouchableNativeFeedback
            background={TouchableNativeFeedback.Ripple(null, true)}
            onPress={() => {
              bottomSheet.current.open();
            }}>
            <Icon
              name="settings"
              type="material"
              size={72}
              color={languageData[course].uiColors.text}
            />
          </TouchableNativeFeedback>
        </View>

        <ListenScrubber colors={languageData[course].uiColors} />
      </View>
      <RBSheet
        ref={bottomSheet}
        height={210}
        duration={250}
        customStyles={{
          container: {
            borderTopLeftRadius: 15,
            borderTopRightRadius: 15,
          },
        }}
        // closeOnDragDown={true}
        onOpen={() => props.setBottomSheetOpen(true)}
        onClose={() => props.setBottomSheetOpen(false)}>
        <ListenBottomSheet />
      </RBSheet>
    </>
  );
};

export default ListenBody;
