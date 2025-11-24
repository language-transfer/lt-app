import 'expo-router/entry';

import TrackPlayer from 'react-native-track-player';

import trackPlayerService from './src/services/trackPlayerService';

TrackPlayer.registerPlaybackService(() => trackPlayerService);
