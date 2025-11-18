/**
 * @format
 */

import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import messaging from '@react-native-firebase/messaging';

// Background/quit state message handler
messaging().setBackgroundMessageHandler(async remoteMessage => {
  // TODO: Optionally show a local notification here
  // console.log('FCM Background Message:', JSON.stringify(remoteMessage));
});

AppRegistry.registerComponent(appName, () => App);
