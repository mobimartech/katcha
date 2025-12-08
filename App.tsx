// App.tsx
import React from 'react';
import RootNavigator from './src/navigation/RootNavigator';
import { ThemeProvider } from './src/theme/ThemeProvider';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { setupForegroundNotificationListeners } from './src/notifications/messaging';
import { setBaseUrl, setApiCredentials } from './src/utils/storage.ts';
import { initializeRevenueCat } from './src/config/revenueCat.js';
import appsFlyer from 'react-native-appsflyer';
import {
  requestTrackingPermission,
  getTrackingStatus,
} from 'react-native-tracking-transparency';

export default function App(): React.ReactElement {
  useEffect(() => {
    // Request ATT permission first, then initialize AppsFlyer
    requestATTPermission();
    const unsubscribe = setupForegroundNotificationListeners();
    return unsubscribe;
  }, []);

  const requestATTPermission = async () => {
    if (Platform.OS === 'ios') {
      try {
        // Check current tracking status
        const trackingStatus = await getTrackingStatus();
        console.log('📊 Current tracking status:', trackingStatus);

        // If not determined, request permission
        if (trackingStatus === 'not-determined') {
          const status = await requestTrackingPermission();
          console.log('✅ ATT Permission status:', status);

          // Initialize AppsFlyer after ATT response
          initializeAppsFlyer();
        } else {
          // Already determined, initialize AppsFlyer immediately
          console.log('ℹ️ Tracking status already determined:', trackingStatus);
          initializeAppsFlyer();
        }
      } catch (error) {
        console.error('❌ Error requesting ATT permission:', error);
        // Initialize AppsFlyer anyway
        initializeAppsFlyer();
      }
    } else {
      // Android doesn't need ATT, initialize directly
      initializeAppsFlyer();
    }
  };

  const initializeAppsFlyer = () => {
    console.log('🚀 Initializing AppsFlyer...');

    appsFlyer.initSdk(
      {
        devKey: 'vGXE7RD5b5hdMrgwWi7vFX', // Replace with your actual dev key
        isDebug: __DEV__,
        appId: Platform.OS === 'ios' ? '6755113314' : '', // iOS App ID only
        onInstallConversionDataListener: true,
        onDeepLinkListener: true,
        timeToWaitForATTUserAuthorization: 10, // Wait for ATT popup
      },
      (result) => {
        console.log('✅ AppsFlyer initialized successfully:', result);
      },
      (error) => {
        console.error('❌ AppsFlyer initialization error:', error);
      }
    );

    // OneLink deep link listener
    appsFlyer.onDeepLink((res) => {
      console.log('🔗 OneLink Deep Link Data:', JSON.stringify(res, null, 2));

      if (res?.data) {
        const dlData = res.data;

        // Track first launch via OneLink
        if (dlData.is_first_launch) {
          console.log('📱 First launch via OneLink');
          logAppsFlyerEvent('af_first_launch_onelink', {
            campaign: dlData.campaign || '',
            media_source: dlData.media_source || '',
            deep_link_value: dlData.deep_link_value || '',
          });
        }

        // Log all OneLink parameters
        console.log('📊 OneLink Attribution Data:', {
          campaign: dlData.campaign,
          media_source: dlData.media_source,
          af_sub1: dlData.af_sub1,
          af_sub2: dlData.af_sub2,
          af_sub3: dlData.af_sub3,
          af_sub4: dlData.af_sub4,
          af_sub5: dlData.af_sub5,
          deep_link_value: dlData.deep_link_value,
        });

        // Handle deep link routing if needed
        // if (dlData.deep_link_value) {
        //   // Navigate to specific screen
        // }
      }
    });

    // Install conversion data listener
    appsFlyer.onInstallConversionData((data) => {
      console.log('📊 Install Conversion Data:', JSON.stringify(data, null, 2));

      const conversionData = data?.data;

      if (conversionData) {
        const isOrganic = conversionData.af_status === 'Organic';

        console.log(
          isOrganic ? '🌱 Organic install' : '💰 Non-organic install'
        );

        if (!isOrganic) {
          console.log('Campaign:', conversionData.campaign);
          console.log('Media source:', conversionData.media_source);
          console.log('Ad Set:', conversionData.adset);
          console.log('Ad:', conversionData.ad);
        }

        // Log install attribution event
        logAppsFlyerEvent('af_install_attribution', {
          af_status: conversionData.af_status,
          campaign: conversionData.campaign || '',
          media_source: conversionData.media_source || '',
          install_time: new Date().toISOString(),
        });
      }
    });

    // Track app open event
    logAppsFlyerEvent('af_app_opened', {
      timestamp: new Date().toISOString(),
      platform: Platform.OS,
    });
  };

  useEffect(() => {
    initializeRevenueCat('appl_bwytOJSXqaDnJTPBMncYDShpOIn');

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

// Helper function to log AppsFlyer events
export const logAppsFlyerEvent = (eventName: string, eventValues: object) => {
  appsFlyer.logEvent(
    eventName,
    eventValues,
    (res) => {
      console.log(`✅ Event "${eventName}" logged successfully`);
    },
    (err) => {
      console.error(`❌ Error logging event "${eventName}":`, err);
    }
  );
};
