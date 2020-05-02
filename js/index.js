/**
 * @format
 */

import {AppRegistry} from 'react-native';
import App from './components/App.react';
import {name as appName} from '../app.json';
import TrackPlayer from 'react-native-track-player';

import audioService from './audio-service';

AppRegistry.registerComponent(appName, () => App);
TrackPlayer.registerPlaybackService(() => audioService);
console.disableYellowBox = true; // not my fault, I swear, the side-menu library is the culprit
