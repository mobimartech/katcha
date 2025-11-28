// App.tsx
import React from 'react';
import RootNavigator from './src/navigation/RootNavigator';
import { ThemeProvider } from './src/theme/ThemeProvider';
import { useEffect } from 'react';
import { setupForegroundNotificationListeners } from './src/notifications/messaging';
import { setBaseUrl, setApiCredentials } from './src/utils/storage.ts';
import { initializeRevenueCat } from './src/config/revenueCat.js';

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
  return (
    <ThemeProvider>
      <RootNavigator />
    </ThemeProvider>
  );
}
