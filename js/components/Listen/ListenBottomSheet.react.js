import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  StatusBar,
  Button,
  Linking,
  TouchableNativeFeedback,
} from 'react-native';

import {Icon} from 'react-native-elements';

import languageData from '../../../languageData';
import DownloadManager from '../../download-manager';
import {genMarkLessonFinished} from '../../persistence';

const ListenBottomSheet = (props) => {
  const styles = StyleSheet.create({
    bottomSheetRow: {
      flexDirection: 'row',
      paddingVertical: 18,
      paddingLeft: 36,
      paddingRight: 30,
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    rowText: {
      fontSize: 18,
      fontWeight: 'bold',
    },
    iconContainer: {
      width: 48,
    },
  });

  return (
    <>
      <TouchableNativeFeedback
        onPress={async () => {
          await genMarkLessonFinished(props.course, props.lesson);
          props.navigation.pop();
        }}>
        <View style={styles.bottomSheetRow}>
          <Text style={styles.rowText}>Mark as finished</Text>
          <View style={styles.iconContainer}>
            <Icon
              style={styles.rowIcon}
              name="check"
              type="font-awesome-5"
              size={32}
            />
          </View>
        </View>
      </TouchableNativeFeedback>
      <TouchableNativeFeedback
        onPress={async () => {
          await DownloadManager.genDeleteDownload(props.course, props.lesson);
          props.navigation.pop();
        }}>
        <View style={styles.bottomSheetRow}>
          <Text style={styles.rowText}>Delete download</Text>
          <View style={styles.iconContainer}>
            <Icon
              style={styles.rowIcon}
              name="trash"
              type="font-awesome-5"
              size={32}
            />
          </View>
        </View>
      </TouchableNativeFeedback>
      <TouchableNativeFeedback
        onPress={() => {
          Linking.openURL(
            'mailto:info@languagetransfer.org' +
              `?subject=${encodeURIComponent(
                `Feedback about ${languageData[props.course].title} ${
                  languageData[props.course].meta.lessons[props.lesson].title
                }`,
              )}`,
          );
        }}>
        <View style={styles.bottomSheetRow}>
          <Text style={styles.rowText}>Report a problem</Text>
          <View style={styles.iconContainer}>
            <Icon
              style={styles.rowIcon}
              name="exclamation-triangle"
              type="font-awesome-5"
              size={32}
            />
          </View>
        </View>
      </TouchableNativeFeedback>
    </>
  );
};

export default ListenBottomSheet;
