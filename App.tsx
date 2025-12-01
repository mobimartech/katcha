// App.tsx
import React from 'react';
import RootNavigator from './src/navigation/RootNavigator';
import { ThemeProvider } from './src/theme/ThemeProvider';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { setupForegroundNotificationListeners } from './src/notifications/messaging';
import { setBaseUrl, setApiCredentials } from './src/utils/storage.ts';
import { initializeRevenueCat } from './src/config/revenueCat.js';
import {
  requestTrackingPermission,
  getTrackingStatus,
} from 'react-native-tracking-transparency';

export default function App(): React.ReactElement {
  useEffect(() => {
    const unsubscribe = setupForegroundNotificationListeners();
    return unsubscribe;
  }, []);

  useEffect(() => {
    // initializeRevenueCat('appl_bwytOJSXqaDnJTPBMncYDShpOIn');
    initializeRevenueCat('appl_bwytOJSXqaDnJTPBMncYDShpOIn');

    // Initialize API config from provided Postman collection values for dev.  /appl_bwytOJSXqaDnJTPBMncYDShpOIn
    void (async () => {
      await setBaseUrl('https://katchaapp.org');
      await setApiCredentials({
        apiKey:
          'd4f25ac2a42f35bf7a130dd3743f6e86b2b08f77d13edd116cfcaaadb81ab196',
        apiSecret:
          'f832fa058fca30a795b57ed79b8c9574323ff6e20ac0a91a02fd11f4e7f7e6c1',
      });
    })();
  }, []);

  // Request App Tracking Transparency permission
  useEffect(() => {
    const requestATTPermission = async () => {
      if (Platform.OS === 'ios') {
        
        try {
          // Add a small delay to ensure app is fully loaded
          await new Promise((resolve) => setTimeout(resolve, 1000));

          // Check current tracking status
          const currentStatus = await getTrackingStatus();
          console.log('Current ATT status:', currentStatus);

          // Request permission if not determined yet
          if (currentStatus === 'not-determined') {
            const trackingStatus = await requestTrackingPermission();
            console.log('ATT permission result:', trackingStatus);

            // Handle the permission result
            if (trackingStatus === 'authorized') {
              console.log('User authorized tracking');
              // Initialize any tracking/analytics services here if needed
            } else {
              console.log('User did not authorize tracking:', trackingStatus);
              // Use privacy-preserving analytics only
            }
          }
        } catch (error) {
          console.error('Error requesting ATT permission:', error);
        }
      }
    };

    requestATTPermission();
  }, []);

  return (
    <ThemeProvider>
      <RootNavigator />
    </ThemeProvider>
  );
}
