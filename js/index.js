/**
 * @format
 */

import {AppRegistry} from 'react-native';
import App from './components/App.react';
import {name as appName} from '../app.json';

AppRegistry.registerComponent(appName, () => App);
console.disableYellowBox = true; // not my fault, I swear, the side-menu library is the culprit
