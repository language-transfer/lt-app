import React from 'react';
import {StyleSheet, View, Text, StatusBar, Button} from 'react-native';

import {Icon} from 'react-native-elements';

import languageData from '../../../languageData';
import {TouchableNativeFeedback} from 'react-native-gesture-handler';

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
    <View>
      <TouchableNativeFeedback onPress={() => {}}>
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
      <TouchableNativeFeedback>
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
      <TouchableNativeFeedback>
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
    </View>
  );

  // return (
  //   <View>
  //     <TouchableNativeFeedback onPress={() => {}}>
  //       <View style={styles.bottomSheetRow}>
  //         <Text style={styles.rowText}>Mark as finished</Text>
  //         <Icon
  //           style={styles.rowIcon}
  //           name="check"
  //           type="font-awesome-5"
  //           size={32}
  //         />
  //       </View>
  //     </TouchableNativeFeedback>
  //     <TouchableNativeFeedback>
  //       <View style={styles.bottomSheetRow}>
  //         <Text style={styles.rowText}>Delete download</Text>
  //         <Icon
  //           style={styles.rowIcon}
  //           name="trash"
  //           type="font-awesome-5"
  //           size={32}
  //         />
  //       </View>
  //     </TouchableNativeFeedback>
  //     <TouchableNativeFeedback>
  //       <View style={styles.bottomSheetRow}>
  //         <Text style={styles.rowText}>Report a problem</Text>
  //         <Icon
  //           style={styles.rowIcon}
  //           name="exclamation-triangle"
  //           type="font-awesome-5"
  //           size={32}
  //         />
  //       </View>
  //     </TouchableNativeFeedback>
  //   </View>
  // );
};

export default ListenBottomSheet;
