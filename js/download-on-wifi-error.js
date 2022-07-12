import NetInfo from '@react-native-community/netinfo';
import {genPreferenceDownloadOnlyOnWifi} from './persistence';
import { Alert } from 'react-native';

export default async function downloadOnWifiError(){
    const [wifiOnly, network] = await Promise.all([
        genPreferenceDownloadOnlyOnWifi(),
        NetInfo.fetch(),
      ]);
    
      if (wifiOnly && network.type !== 'wifi') {
        Alert.alert(`Waiting for wi-fi to start download.\n
        To download now, uncheck Settings > Download only on wi-fi.`);
      }
}