import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  StatusBar,
  Linking,
  Dimensions,
} from 'react-native';

import {Icon} from 'react-native-elements';
import {TouchableNativeFeedback} from 'react-native-gesture-handler';

import languageData from '../../../languageData';

const ListenBody = (props) => {
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
      // fontWeight: 'bold',
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
    <View style={styles.body}>
      <View style={styles.lessonName}>
        <Text style={styles.courseTitle}>{languageData[course].title}</Text>
        <Text style={styles.lesson}>Lesson {lesson}</Text>
      </View>

      <View style={styles.icons}>
        <TouchableNativeFeedback
          background={TouchableNativeFeedback.Ripple(null, true)}>
          <Icon
            name="replay-10"
            type="material"
            size={72}
            color={languageData[course].uiColors.text}
          />
        </TouchableNativeFeedback>
        <TouchableNativeFeedback
          background={TouchableNativeFeedback.Ripple(null, true)}>
          <Icon
            name="pause"
            type="material"
            size={172}
            color={languageData[course].uiColors.text}
          />
        </TouchableNativeFeedback>
        <TouchableNativeFeedback
          background={TouchableNativeFeedback.Ripple(null, true)}>
          <Icon
            name="forward-10"
            type="material"
            size={72}
            color={languageData[course].uiColors.text}
          />
        </TouchableNativeFeedback>
      </View>

      <View style={styles.scrubber}>
        <View style={styles.progressBar}>
          <View style={styles.progressMade} />
          <View style={styles.progressLeft} />
        </View>
        <View style={styles.progressTextContainer}>
          <Text style={styles.progressText}>2:40</Text>
          <Text style={styles.progressText}>7:02</Text>
        </View>
      </View>

      <View style={styles.bottomButtons}>
        <TouchableNativeFeedback
          style={styles.bottomButton}
          background={TouchableNativeFeedback.Ripple(null, true)}>
          <Icon
            name="delete"
            type="material"
            size={48}
            color={languageData[course].uiColors.text}
          />
          <Text>Delete download</Text>
        </TouchableNativeFeedback>
        <TouchableNativeFeedback
          style={styles.bottomButton}
          background={TouchableNativeFeedback.Ripple(null, true)}>
          <Icon
            name="check"
            type="material"
            size={48}
            color={languageData[course].uiColors.text}
          />
          <Text>Mark as finished</Text>
        </TouchableNativeFeedback>
        <TouchableNativeFeedback
          style={styles.bottomButton}
          background={TouchableNativeFeedback.Ripple(null, true)}>
          <Icon
            name="report-problem"
            type="material"
            size={48}
            color={languageData[course].uiColors.text}
          />
          <Text>Report a problem</Text>
        </TouchableNativeFeedback>
      </View>
    </View>
  );
};

export default ListenBody;
