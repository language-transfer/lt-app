import {AppRegistry} from 'react-native';
import App from './js/components/App.react';
import {name as appName} from './app.json';
import TrackPlayer from 'react-native-track-player';

import audioService from './js/audio-service';
import DownloadManager from './js/download-manager';

AppRegistry.registerComponent(appName, () => App);
TrackPlayer.registerPlaybackService(() => audioService);
DownloadManager.resumeDownloads();

console.disableYellowBox = true; // not my fault, I swear, the side-menu library is the culprit
