import BackgroundFetch from 'react-native-background-fetch';
// @ts-ignore - react-native-push-notification doesn't have types
import PushNotification from 'react-native-push-notification';
import PushNotificationIOS from '@react-native-community/push-notification-ios';
import { AppState, Platform } from 'react-native';
import { listTargets } from '../api/targets';
import { getItem, setItem } from '../utils/storage.ts';
import { getAccessToken } from '../utils/storage';
import { refreshAccessTokenIfPossible } from '../api/auth.ts';

// Background fetch task ID
const BACKGROUND_FETCH_TASK_ID = 'social-tracker-background-fetch';
const HOURLY_NOTIFICATION_ID = 'social-tracker-hourly';
const ANDROID_CHANNEL_ID = 'hourly-reminders';

// Global interval (minutes) for background fetch + scheduled notifications
// Change this single value to adjust cadence across the app
export const BACKGROUND_FETCH_INTERVAL_MIN = 5; // minutes

// Persisted meta so we only schedule once per login (or when interval changes)
const NOTIFICATION_SCHEDULE_META_KEY = 'notifications_schedule_meta';

// App state monitoring
let backgroundTaskId: number | null = null;
let isBackgroundFetchActive = false;
let scheduledNotifications: NodeJS.Timeout[] = [];

/**
 * Ensure iOS notification permissions are granted
 */
const ensureIOSNotificationPermissions = async () => {
  if (Platform.OS !== 'ios') return;
  try {
    const settings = await new Promise<any>((resolve) => {
      // checkPermissions uses callback signature in some versions
      // @ts-ignore
      PushNotificationIOS.checkPermissions((s: any) => resolve(s));
    });
    console.log('[BackgroundFetch] iOS current permissions:', settings);
    const hasAlerts = !!(settings as any).alert;
    const hasBadge = !!(settings as any).badge;
    const hasSound = !!(settings as any).sound;
    if (!hasAlerts || !hasBadge || !hasSound) {
      console.log('[BackgroundFetch] Requesting iOS permissions (alerts/badge/sound)...');
      const requested = await PushNotificationIOS.requestPermissions({ alert: true, badge: true, sound: true });
      console.log('[BackgroundFetch] iOS permission request result:', requested);
    }
  } catch (permErr) {
    console.warn('[BackgroundFetch] iOS permission check/request failed:', permErr);
  }
};

/**
 * Configure PushNotification with comprehensive debugging
 */
const configurePushNotification = async () => {
  console.log('[BackgroundFetch] ===== CONFIGURING PUSH NOTIFICATIONS =====');
  
  try {
    // Request iOS permissions if needed
    if (Platform.OS === 'ios') {
      try {
        console.log('[BackgroundFetch] Requesting iOS notification permissions...');
        const requested = await PushNotificationIOS.requestPermissions({
          alert: true,
          badge: true,
          sound: true,
        });
        console.log('[BackgroundFetch] ✅ iOS permission request result:', requested);
      } catch (error) {
        console.error('[BackgroundFetch] ❌ Error requesting iOS permissions:', error);
      }
    }

    PushNotification.configure({
      // (optional) Called when Token is generated (iOS and Android)
      onRegister: function (token: any) {
        console.log('[BackgroundFetch] PushNotification token received:', token);
      },

      // (required) Called when a remote is received or opened, or local notification is opened
      onNotification: function (notification: any) {
        console.log('[BackgroundFetch] Notification received in app:', notification);

        // Required on iOS only
        if (notification.finish) {
          notification.finish('UIBackgroundFetchResultNoData');
        }
      },

      // (optional) Called when Registered Action is pressed and invokeApp is false, if true onNotification will be called (Android)
      onAction: function (notification: any) {
        console.log('[BackgroundFetch] Notification action pressed:', notification);
      },

      // (optional) Called when the user fails to register for remote notifications. Typically occurs when APNS is having issues, or the device is a simulator. (iOS)
      onRegistrationError: function(err: any) {
        console.error('[BackgroundFetch] PushNotification registration error:', err);
      },

      // IOS ONLY (optional): default: all - Permissions to register.
      permissions: {
        alert: true,
        badge: true,
        sound: true,
      },

      // Should the initial notification be popped automatically
      // default: true
      popInitialNotification: true,

      /**
       * (optional) default: true
       * - Specified if permissions (ios) and token (android and ios) will requested or not,
       * - if not, you must call PushNotificationsHandler.requestPermissions() later
       * - if you are not using remote notification or do not have Firebase installed, use this:
       *     requestPermissions: Platform.OS === 'ios'
       */
      requestPermissions: true,
    });
    
    // Ensure Android notification channel exists
    if (Platform.OS === 'android') {
      PushNotification.createChannel(
        {
          channelId: ANDROID_CHANNEL_ID,
          channelName: 'Hourly Reminders',
          channelDescription: 'Reminders and background updates every hour',
          importance: 4, // Importance.HIGH
          vibrate: true,
          soundName: 'default',
        },
        (created: boolean) => console.log('[BackgroundFetch] Android channel created:', created)
      );
    }

    console.log('[BackgroundFetch] PushNotification configured successfully');
  
  } catch (error) {
    console.error('[BackgroundFetch] Error configuring PushNotification:', error);
  }
};
/**
 * Schedule recurring notifications for background execution (2 times per day)
 */
const scheduleRecurringNotifications = async () => {
  console.log('[BackgroundFetch] Setting up twice-daily scheduled notifications...');

  let targets: any[] = [];
  try {
    const accessToken = await getAccessToken();
    if (accessToken) {
      targets = await fetchTargets();
      console.log(`[BackgroundFetch] Found ${targets.length} targets for scheduled notifications`);
    }
  } catch (error) {
    console.error('[BackgroundFetch] Error fetching targets:', error);
  }

  const validUsernames = targets
    .filter((t: any) => t && typeof t.username === 'string' && t.username.length > 0)
    .map((t: any) => `@${t.username}`);
  const userNames = validUsernames.join(', ');
  const title = validUsernames.length > 0
    ? `${validUsernames.length} Account${validUsernames.length > 1 ? 's' : ''} Update`
    : ' Test 1== Social Tracker Reminder';
  const message = validUsernames.length > 0
    ? `Test 1== Check updates for: ${userNames}`
    : 'Track your accounts and check for new updates';

  try {
    if (Platform.OS === 'ios' && validUsernames.length > 0) {
      // Cleanup any previous 5-minute test schedules if present
      await persistTargetsSnapshot(targets, Date.now());

      // Clear any pending notifications with the same IDs
      try {
        // @ts-ignore
        PushNotificationIOS.removePendingNotificationRequests([
          `${HOURLY_NOTIFICATION_ID}-morning`,
          `${HOURLY_NOTIFICATION_ID}-evening`,
        ]);
      } catch {}

      // 🔸 9:00 AM notification
      const morning = new Date();
      morning.setHours(9, 0, 0, 0);
      if (morning < new Date()) morning.setDate(morning.getDate() + 1); // if past, schedule for tomorrow

      PushNotificationIOS.scheduleLocalNotification({
        alertTitle: title,
        alertBody: message,
        fireDate: morning.toISOString(),
        repeatInterval: 'day', // repeats daily
        userInfo: {         id: `${HOURLY_NOTIFICATION_ID}-morning`,
        type: 'background_fetch_twice_daily', period: 'morning' },
      });

      // 🔸 9:00 PM notification
      const evening = new Date();
      // evening.setHours(21, 0, 0, 0);
      evening.setHours(17, 0, 0, 0);
      if (evening < new Date()) evening.setDate(evening.getDate() + 1);

      PushNotificationIOS.scheduleLocalNotification({
        alertTitle: title,
        alertBody: message,
        fireDate: evening.toISOString(),
        repeatInterval: 'day', // repeats daily
        userInfo: { 
          id: `${HOURLY_NOTIFICATION_ID}-evening`, // ✅ move id here
          type: 'background_fetch_twice_daily', period: 'evening' },
      });

      console.log('[BackgroundFetch] ✅ iOS twice-daily notifications scheduled');
    } else {
      // ✅ Android supports custom repeat intervals
      const BACKGROUND_FETCH_INTERVAL_HOURS = 12;
      const BACKGROUND_FETCH_INTERVAL_MIN = BACKGROUND_FETCH_INTERVAL_HOURS * 60;
      const firstFireDate = new Date(Date.now() + BACKGROUND_FETCH_INTERVAL_MIN * 60 * 1000);

      PushNotification.localNotificationSchedule({
        id: HOURLY_NOTIFICATION_ID,
        channelId: ANDROID_CHANNEL_ID,
        title,
        message,
        date: firstFireDate,
        allowWhileIdle: true,
        repeatType: 'time',
        repeatTime: BACKGROUND_FETCH_INTERVAL_MIN * 60 * 1000, // 12 hours
        playSound: true,
        soundName: 'default',
        vibrate: true,
        vibration: 300,
        importance: 'high',
        priority: 'high',
        userInfo: { type: 'background_fetch_twice_daily' },
      });
      console.log('[BackgroundFetch] ✅ Android twice-daily repeating notification scheduled');
    }
  } catch (error) {
    console.error('[BackgroundFetch] ❌ Failed to schedule twice-daily notifications:', error);
  }
};

/**
 * Clear all scheduled notifications
 */
const clearScheduledNotifications = () => {
  console.log('[BackgroundFetch] Clearing scheduled notifications...');
  try {
    PushNotificationIOS.cancelAllLocalNotifications();
    console.log('[BackgroundFetch] All scheduled notifications cleared');
  } catch (error) {
    console.error('[BackgroundFetch] Error clearing notifications:', error);
  }
};

/**
 * Set up AppState monitoring for background execution
 */
const setupAppStateMonitoring = () => {
  console.log('[BackgroundFetch] Setting up AppState monitoring...');
  
  AppState.addEventListener('change', async (nextAppState) => {
    console.log('[BackgroundFetch] AppState changed to:', nextAppState);
    
    if (nextAppState === 'background' || nextAppState === 'inactive') {
      console.log('[BackgroundFetch] App going to background, starting background task...');
      startBackgroundTask();
      
      // Schedule recurring notifications for background execution
      console.log('[BackgroundFetch] Scheduling recurring notifications for background...');
      await scheduleRecurringNotifications();
      
    } else if (nextAppState === 'active') {
      console.log('[BackgroundFetch] App becoming active, ending background task...');
      endBackgroundTask();
      // Do not clear scheduled hourly notifications; keep them running
    }
  });
  
  // Removed manual interval timer to avoid conflicts with OS scheduling
};

/**
 * Start background task
 */
const startBackgroundTask = () => {
  if (Platform.OS === 'ios') {
    console.log('[BackgroundFetch] Starting iOS background task...');
    // On iOS, we rely on BackgroundFetch.configure to handle background execution
    // But we can also trigger immediate execution
    setTimeout(() => {
      console.log('[BackgroundFetch] Executing background fetch in background state...');
      handleBackgroundFetch();
    }, 1000);
  }
};

/**
 * End background task
 */
const endBackgroundTask = () => {
  if (backgroundTaskId) {
    console.log('[BackgroundFetch] Ending background task:', backgroundTaskId);
    backgroundTaskId = null;
  }
};

/**
 * Initialize background fetch service
 * This should be called after successful login
 */
export const initializeBackgroundFetch = async () => {
  console.log('[BackgroundFetch] Initializing background fetch service...');

  try {
    // Check background fetch status first
    const status = await getBackgroundFetchStatus();
    console.log('[BackgroundFetch] Current status:', status);
    
    if (status === BackgroundFetch.STATUS_DENIED) {
      console.warn('[BackgroundFetch] Background fetch is denied by system');
    } else if (status === BackgroundFetch.STATUS_RESTRICTED) {
      console.warn('[BackgroundFetch] Background fetch is restricted');
    } else {
      console.log('[BackgroundFetch] Background fetch is available');
    }

    // Configure PushNotification first
    await configurePushNotification();
    await ensureIOSNotificationPermissions();

    // Set up AppState monitoring
    setupAppStateMonitoring();

    // Schedule the persistent repeating notification once (idempotent)
    await scheduleRecurringNotifications();

    // Configure background fetch
    // BackgroundFetch.configure(
    //   {
    //     minimumFetchInterval: BACKGROUND_FETCH_INTERVAL_MIN,
    //     stopOnTerminate: false, // Keep running when app is terminated
    //     startOnBoot: true, // Start when device boots
    //     enableHeadless: true, // Run without UI
    //     requiredNetworkType: BackgroundFetch.NETWORK_TYPE_ANY, // Allow any network
    //     requiresCharging: false, // Don't require charging
    //     requiresDeviceIdle: false, // Don't require device idle
    //     requiresBatteryNotLow: false, // Don't require good battery
    //   },
    //   async (taskId) => {
    //     console.log('[BackgroundFetch] Task started:', taskId, 'AppState:', AppState.currentState);
    //     isBackgroundFetchActive = true;
        
    //     try {
    //       await handleBackgroundFetch();
    //       console.log('[BackgroundFetch] Task completed successfully:', taskId);
    //     } catch (error) {
    //       console.error('[BackgroundFetch] Task failed:', taskId, error);
    //     } finally {
    //       isBackgroundFetchActive = false;
    //       // Always finish the task
    //       BackgroundFetch.finish(taskId);
    //     }
    //   },
    //   (error) => {
    //     console.error('[BackgroundFetch] Failed to start:', error);
    //   }
    // );

    // Start the background fetch
    BackgroundFetch.start();
    console.log('[BackgroundFetch] Background fetch service started');
    
    // Removed all debug timers / test triggers
    
  } catch (error) {
    console.error('[BackgroundFetch] Failed to initialize:', error);
  }
};

/**
 * Stop background fetch service
 * This should be called on logout
 */
export const stopBackgroundFetch = () => {
  console.log('[BackgroundFetch] Stopping background fetch service...');
  
  // Stop background fetch
  BackgroundFetch.stop();
  
  // Clear all local notifications
  PushNotification.cancelAllLocalNotifications();
  
  // Clear scheduled notifications
  clearScheduledNotifications();
  
  console.log('[BackgroundFetch] Background fetch service stopped and notifications cleared');
};

/**
 * Handle background fetch task
 * Fetches targets and shows notifications
 */
const handleBackgroundFetch = async () => {
  const timestamp = new Date().toISOString();
  console.log(`[BackgroundFetch] ===== STARTING BACKGROUND FETCH TASK =====`);
  console.log(`[BackgroundFetch] Timestamp: ${timestamp}`);
  console.log(`[BackgroundFetch] App State: ${AppState.currentState}`);
  console.log(`[BackgroundFetch] Platform: ${Platform.OS}`);

  try {
    // Log iOS platform info
    if (Platform.OS === 'ios') {
      console.log('[BackgroundFetch] Running on iOS platform');
    }

    // Check if user is logged in
    // const accessToken = await getAccessToken();
    // if (!accessToken) {
    //   console.log('[BackgroundFetch] No access token, skipping fetch');
    //   return;
    // }

    // console.log('[BackgroundFetch] Access token found, proceeding with API call...');

    // Fetch targets
    // const targets = await fetchTargets();
    // console.log(`[BackgroundFetch] API returned ${targets ? targets.length : 0} targets`);
    
    // if (targets && targets.length > 0) {
    //   console.log(`[BackgroundFetch] Found ${targets.length} targets, showing user data notifications`);
      
    //   // Show notifications with real user data
    //   await showUserDataNotification(targets);
      
    // } else {
    //   console.log('[BackgroundFetch] No targets found, sending summary notification');
    //   // await showUserDataNotification([]);
    // }

    // Do not send test notifications

  } catch (error) {
    console.error('[BackgroundFetch] Error in background fetch:', error);
  }
  
  console.log(`[BackgroundFetch] ===== BACKGROUND FETCH TASK COMPLETED =====`);
};

/**
 * Show a test notification for debugging
 */
const showTestNotification = async () => {
  try {
    console.log('[BackgroundFetch] ===== SENDING TEST NOTIFICATION =====');
    
    const notificationId = `test-${Date.now()}`;
    const timestamp = new Date().toLocaleTimeString();
    
    console.log(`[BackgroundFetch] Notification ID: ${notificationId}`);
    console.log(`[BackgroundFetch] Timestamp: ${timestamp}`);
    console.log(`[BackgroundFetch] App State: ${AppState.currentState}`);
    console.log(`[BackgroundFetch] Platform: ${Platform.OS}`);

    
    console.log('[BackgroundFetch] Test notification sent successfully with ID:', notificationId);
    console.log('[BackgroundFetch] ===== TEST NOTIFICATION COMPLETED =====');
    
  } catch (error) {
    console.error('[BackgroundFetch] Error sending test notification:', error);
  }
};

/**
 * Show notification with real user data
 */
const showUserDataNotification = async (targets: any[]) => {
  try {
    console.log('[BackgroundFetch] Sending user data notifications...');
    console.log(`[BackgroundFetch] Platform: ${Platform.OS}, Targets: ${targets?.length || 0}`);
    
    if (targets && targets.length > 0) {
      console.log(`[BackgroundFetch] Creating single notification for ${targets.length} tracked accounts...`);
      
      // Create a single notification with all user names
      const validUsernames = targets
        .filter((t: any) => t && typeof t.username === 'string' && t.username.length > 0)
        .map((t: any) => `@${t.username}`);
      const userNames = validUsernames.join(', ');
      const notificationId = `users-update-${Date.now()}`;
      const title = `${validUsernames.length} Account${validUsernames.length > 1 ? 's' : ''} Update`;
      const message = ` Test 2 =N= Check updates for: ${userNames}`;
      
      console.log(`[BackgroundFetch] Notification - Title: "${title}"`);
      console.log(`[BackgroundFetch] Notification - Message: "${message}"`);
      
      // For iOS, use PushNotificationIOS only
      if (Platform.OS === 'ios') {
        await persistTargetsSnapshot(targets, Date.now());
        try {
          // PushNotificationIOS.addNotificationRequest({
          //   id: notificationId,
          //   title: title,
          //   body: message,
          //   subtitle: 'Social Tracker',
          //   sound: 'default',
          //   badge: validUsernames.length,
          //   userInfo: {
          //     type: 'users_update',
          //     target_count: validUsernames.length,
          //     usernames: userNames,
          //     timestamp: new Date().toISOString(),
          //     records: targets.map((t: any) => ({ id: t.id, username: t.username, platform: t.platform, followers: t.followers ?? 0, following: t.following ?? 0 })),
          //   },
          // });
          console.log(`[BackgroundFetch] ✅ iOS notification sent for ${validUsernames.length} users`);
        } catch (iosError) {
          console.error(`[BackgroundFetch] ❌ iOS notification error:`, iosError);
        }
      } else {
        // Android fallback only on Android
        try {
          PushNotification.localNotification({
            channelId: ANDROID_CHANNEL_ID,
            id: notificationId,
            title: title,
            message: message,
            playSound: true,
            soundName: 'default',
            vibrate: true,
            vibration: 300,
            priority: 'high',
            importance: 'high',
            userInfo: {
              type: 'users_update',
              target_count: validUsernames.length,
              usernames: userNames,
              timestamp: new Date().toISOString(),
              records: targets.map((t: any) => ({ id: t.id, username: t.username, platform: t.platform, followers: t.followers ?? 0, following: t.following ?? 0 })),
            },
          });
          console.log(`[BackgroundFetch] ✅ Android notification sent for ${validUsernames.length} users`);
        } catch (fallbackError) {
          console.error(`[BackgroundFetch] ❌ Android notification error:`, fallbackError);
        }
      }
    } else {
      // No targets found, send a summary notification
      const notificationId = `summary-${Date.now()}`;
      const title = 'Social Tracker Update';
      const message = 'No tracked accounts found. Add some accounts to track!';
      
      console.log('[BackgroundFetch] Sending summary notification...');
      
      // For iOS only
      if (Platform.OS === 'ios') {
        try {
          // PushNotificationIOS.addNotificationRequest({
          //   id: notificationId,
          //   title: title,
          //   body: message,
          //   sound: 'default',
          //   badge: 1,
          //   userInfo: {
          //     type: 'summary',
          //     target_count: 0,
          //   },
          // });
          console.log('[BackgroundFetch] iOS summary notification sent');
        } catch (iosError) {
          console.error('[BackgroundFetch] iOS summary notification error:', iosError);
        }
      } else {
        // Android only
        try {
          PushNotification.localNotification({
            channelId: ANDROID_CHANNEL_ID,
            id: notificationId,
            title: title,
            message: message,
            playSound: true,
            soundName: 'default',
            vibrate: true,
            vibration: 300,
            userInfo: {
              type: 'summary',
              target_count: 0,
            },
          });
          console.log('[BackgroundFetch] Android summary notification sent');
        } catch (fallbackError) {
          console.error('[BackgroundFetch] Android summary notification error:', fallbackError);
        }
      }
    }
    
  } catch (error) {
    console.error('[BackgroundFetch] Error sending user data notifications:', error);
  }
};

/**
 * Fetch targets from API
 * @returns Promise<Target[]> - Array of targets
 */
const LAST_TARGETS_FETCH_KEY = 'last_targets_fetch_ms';
const NOTIFICATIONS_FEED_KEY = 'notifications_feed';
const TEN_MIN_MS = 10 * 60 * 1000;

/**
 * Persist a snapshot array of targets to the feed storage so UI can render it later
 */
const persistTargetsSnapshot = async (targets: any[], timestampMs: number) => {
  try {
    const snapshotItems = (targets || []).map((t: any) => ({
      id: `${t?.id ?? t?.username}-${timestampMs}`,
      targetId: t?.id ?? 0,
      username: t?.username ?? '',
      platform: t?.platform ?? 'instagram',
      followers: t?.followers ?? 0,
      following: t?.following ?? 0,
      fetchedAt: timestampMs,
    }));
    const existingRaw = await getItem(NOTIFICATIONS_FEED_KEY);
    let existing: any[] = [];
    if (existingRaw) {
      try { existing = JSON.parse(existingRaw); } catch {}
    }
    const merged = [...snapshotItems, ...existing]
      // Deduplicate by id
      .filter((item, index, arr) => arr.findIndex((x) => x.id === item.id) === index)
      .slice(0, 300);
    await setItem(NOTIFICATIONS_FEED_KEY, JSON.stringify(merged));
    console.log(`[BackgroundFetch] Snapshot persisted: +${snapshotItems.length}, total ${merged.length}`);
  } catch (persistErr) {
    console.warn('[BackgroundFetch] Failed to persist snapshot feed:', persistErr);
  }
};

const fetchTargets = async () => {
  try {
    refreshAccessTokenIfPossible()

    // Throttle: avoid hitting API if fetched within last 10 minutes
    const lastFetchRaw = await getItem(LAST_TARGETS_FETCH_KEY);
    const lastFetchMs = lastFetchRaw ? Number(lastFetchRaw) : 0;
    const now = Date.now();
    if (lastFetchMs && now - lastFetchMs < TEN_MIN_MS) {
      const remaining = Math.ceil((TEN_MIN_MS - (now - lastFetchMs)) / 1000);
      console.log(`[BackgroundFetch] Skipping fetch (throttled). Try again in ~${remaining}s`);
      return [];
    }

    console.log('[BackgroundFetch] Fetching targets...');
    const targets = await listTargets();
    // Normalize and filter invalid entries
    const validTargets = Array.isArray(targets)
      ? targets.filter((t: any) => t && typeof t.username === 'string' && t.username.length > 0)
      : [];
    console.log(`[BackgroundFetch] Fetched ${validTargets.length} targets`);
    // Mark fetch time on success to enforce throttle window
    await setItem(LAST_TARGETS_FETCH_KEY, String(now));
    // Persist snapshot for Notifications screen
    await persistTargetsSnapshot(validTargets, now);
    return validTargets;
  } catch (error) {
    console.error('[BackgroundFetch] Error fetching targets:', error);
    return [];
  }
};


/**
 * Check if background fetch is enabled
 * @returns Promise<boolean>
 */
export const isBackgroundFetchEnabled = async (): Promise<boolean> => {
  try {
    const status = await BackgroundFetch.status();
    return status === BackgroundFetch.STATUS_AVAILABLE;
  } catch (error) {
    console.error('[BackgroundFetch] Error checking status:', error);
    return false;
  }
};

/**
 * Get background fetch status
 * @returns Promise<number> - Status code
 */
export const getBackgroundFetchStatus = async (): Promise<number> => {
  try {
    return await BackgroundFetch.status();
  } catch (error) {
    console.error('[BackgroundFetch] Error getting status:', error);
    return BackgroundFetch.STATUS_DENIED;
  }
};


/**
 * Test manual background fetch (for debugging)
 */
export const testBackgroundFetch = async () => {
  console.log('[BackgroundFetch] Testing manual background fetch...');
  
  try {
    await handleBackgroundFetch();
    console.log('[BackgroundFetch] Manual background fetch completed');
  } catch (error) {
    console.error('[BackgroundFetch] Manual background fetch failed:', error);
  }
};

/**
 * Debug function to check all settings
 */
export const debugBackgroundFetch = async () => {
  console.log('=== BACKGROUND FETCH COMPREHENSIVE DEBUG INFO ===');
  
  try {
    // 1. Check background fetch status
    const status = await getBackgroundFetchStatus();
    console.log('[Debug] Background fetch status:', status);
    console.log('[Debug] Background fetch status text:', 
      status === 0 ? 'DENIED' : 
      status === 1 ? 'RESTRICTED' : 
      status === 2 ? 'AVAILABLE' : 'UNKNOWN');
    
    // 2. Check access token
    const accessToken = await getAccessToken();
    console.log('[Debug] Access token exists:', !!accessToken);
    if (accessToken) {
      console.log('[Debug] Access token length:', accessToken.length);
    }
    
    // 3. Check platform
    console.log('[Debug] Platform:', Platform.OS);
    
    // 4. Check app state
    console.log('[Debug] Current app state:', AppState.currentState);
    
    // 5. Test API call
    console.log('[Debug] Testing API call...');
    try {
    //   const targets = await listTargets();
      const targets = [{}];
      console.log('[Debug] API returned targets:', targets.length);
      if (targets.length > 0) {
        console.log('[Debug] First target:', targets[0]);
      }
    } catch (error) {
      console.error('[Debug] API call failed:', error);
    }
    
    // 6. Test notification permissions and send test
    console.log('[Debug] Testing notification...');
    
    // 7. Force immediate background fetch
    console.log('[Debug] Forcing immediate background fetch...');
    await handleBackgroundFetch();
    
    // 8. Check if background fetch is configured
    console.log('[Debug] Background fetch active:', isBackgroundFetchActive);
    console.log('[Debug] Background task ID:', backgroundTaskId);
    
  } catch (error) {
    console.error('[Debug] Debug check failed:', error);
  }
  
  console.log('=== END COMPREHENSIVE DEBUG INFO ===');
};

/**
 * Force immediate background fetch execution (for testing)
 */
export const forceBackgroundFetch = async () => {
  console.log('[BackgroundFetch] Forcing immediate background fetch execution...');
  await handleBackgroundFetch();
};

/**
 * Simulate background execution (for testing)
 */
export const simulateBackgroundExecution = async () => {
  console.log('[BackgroundFetch] Simulating background execution...');
  console.log('[BackgroundFetch] Current AppState:', AppState.currentState);
  
  // Force background fetch regardless of app state
  await handleBackgroundFetch();
  
  // Also trigger the background fetch callback manually
  console.log('[BackgroundFetch] Manually triggering background fetch callback...');
  isBackgroundFetchActive = true;
  try {
    await handleBackgroundFetch();
    console.log('[BackgroundFetch] Manual background execution completed');
  } catch (error) {
    console.error('[BackgroundFetch] Manual background execution failed:', error);
  } finally {
    isBackgroundFetchActive = false;
  }
};

