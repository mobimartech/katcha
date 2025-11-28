import BackgroundFetch from 'react-native-background-fetch';
import PushNotification from 'react-native-push-notification';
import PushNotificationIOS from '@react-native-community/push-notification-ios';
import { Platform } from 'react-native';
import { listTargets } from '../api/targets';
import { getItem, setItem } from '../utils/storage.ts';
import { getAccessToken } from '../utils/storage';
import { refreshAccessTokenIfPossible } from '../api/auth.ts';
import { saveNotification } from '../utils/notificationStorage';

// Storage keys
const TARGETS_SNAPSHOT_KEY = 'targets_snapshot';
const LAST_CHECK_KEY = 'last_background_check';
const ANDROID_CHANNEL_ID = 'change-notifications';

// Background fetch interval: 2 times per day = every 12 hours
export const BACKGROUND_FETCH_INTERVAL_MIN = 720; // 12 hours in minutes

interface TargetSnapshot {
  id: number;
  username: string;
  platform: string;
  followers: number;
  following: number;
  timestamp: number;
}

interface ChangeDetected {
  targetId: number;
  username: string;
  platform: string;
  oldFollowers: number;
  newFollowers: number;
  oldFollowing: number;
  newFollowing: number;
  followersDiff: number;
  followingDiff: number;
}

/**
 * Save initial snapshot when a target is added
 */
export const saveInitialSnapshot = async (target: any) => {
  try {
    console.log(
      '[BackgroundFetch] Saving initial snapshot for:',
      target.username
    );

    const snapshot: TargetSnapshot = {
      id: target.id,
      username: target.username,
      platform: target.platform,
      followers: target.followers || 0,
      following: target.following || 0,
      timestamp: Date.now(),
    };

    // Get existing snapshots
    const existingRaw = await getItem(TARGETS_SNAPSHOT_KEY);
    let snapshots: TargetSnapshot[] = [];

    if (existingRaw) {
      try {
        snapshots = JSON.parse(existingRaw);
      } catch (e) {
        console.error('[BackgroundFetch] Error parsing snapshots:', e);
      }
    }

    // Add or update snapshot
    const existingIndex = snapshots.findIndex((s) => s.id === target.id);
    if (existingIndex >= 0) {
      snapshots[existingIndex] = snapshot;
    } else {
      snapshots.push(snapshot);
    }

    await setItem(TARGETS_SNAPSHOT_KEY, JSON.stringify(snapshots));
    console.log('[BackgroundFetch] ✅ Initial snapshot saved');
  } catch (error) {
    console.error('[BackgroundFetch] Error saving initial snapshot:', error);
  }
};

/**
 * Get stored snapshots
 */
const getStoredSnapshots = async (): Promise<TargetSnapshot[]> => {
  try {
    const raw = await getItem(TARGETS_SNAPSHOT_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (error) {
    console.error('[BackgroundFetch] Error getting snapshots:', error);
    return [];
  }
};

/**
 * Update snapshots with new data
 */
const updateSnapshots = async (newTargets: any[]) => {
  try {
    const snapshots: TargetSnapshot[] = newTargets.map((target) => ({
      id: target.id,
      username: target.username,
      platform: target.platform,
      followers: target.followers || 0,
      following: target.following || 0,
      timestamp: Date.now(),
    }));

    await setItem(TARGETS_SNAPSHOT_KEY, JSON.stringify(snapshots));
    console.log('[BackgroundFetch] ✅ Snapshots updated');
  } catch (error) {
    console.error('[BackgroundFetch] Error updating snapshots:', error);
  }
};

/**
 * Compare old and new data to detect changes
 */
const detectChanges = (
  oldSnapshots: TargetSnapshot[],
  newTargets: any[]
): ChangeDetected[] => {
  const changes: ChangeDetected[] = [];

  newTargets.forEach((newTarget) => {
    const oldSnapshot = oldSnapshots.find((s) => s.id === newTarget.id);

    if (!oldSnapshot) {
      console.log('[BackgroundFetch] No old snapshot for:', newTarget.username);
      return;
    }

    const newFollowers = newTarget.followers || 0;
    const newFollowing = newTarget.following || 0;
    const oldFollowers = oldSnapshot.followers || 0;
    const oldFollowing = oldSnapshot.following || 0;

    // Check if there are differences
    if (newFollowers !== oldFollowers || newFollowing !== oldFollowing) {
      const change: ChangeDetected = {
        targetId: newTarget.id,
        username: newTarget.username,
        platform: newTarget.platform,
        oldFollowers,
        newFollowers,
        oldFollowing,
        newFollowing,
        followersDiff: newFollowers - oldFollowers,
        followingDiff: newFollowing - oldFollowing,
      };

      changes.push(change);
      console.log(
        '[BackgroundFetch] ✅ Change detected for @' + newTarget.username + ':',
        {
          followers: `${oldFollowers} → ${newFollowers} (${
            change.followersDiff >= 0 ? '+' : ''
          }${change.followersDiff})`,
          following: `${oldFollowing} → ${newFollowing} (${
            change.followingDiff >= 0 ? '+' : ''
          }${change.followingDiff})`,
        }
      );
    }
  });

  return changes;
};

/**
 * Send notification for detected changes
 */
// Add this import at the top

// Replace the sendChangeNotifications function:
const sendChangeNotifications = async (changes: ChangeDetected[]) => {
  if (changes.length === 0) {
    console.log('[BackgroundFetch] No changes detected, no notifications sent');
    return;
  }

  console.log(
    `[BackgroundFetch] Sending notifications for ${changes.length} change(s)`
  );

  for (const change of changes) {
    const notificationId = `change-${change.targetId}-${Date.now()}`;

    // Build notification message
    const followerChange =
      change.followersDiff !== 0
        ? `Followers: ${change.followersDiff >= 0 ? '+' : ''}${change.followersDiff}`
        : '';
    const followingChange =
      change.followingDiff !== 0
        ? `Following: ${change.followingDiff >= 0 ? '+' : ''}${change.followingDiff}`
        : '';

    const changes_text = [followerChange, followingChange]
      .filter(Boolean)
      .join(' | ');
    const title = `📊 @${change.username} Updated`;
    const message = changes_text;

    // ✅ SAVE NOTIFICATION TO STORAGE
    try {
      await saveNotification({
        title,
        message,
        type: 'target_change',
        targetId: change.targetId,
        username: change.username,
        platform: change.platform,
        changeData: {
          followersDiff: change.followersDiff,
          followingDiff: change.followingDiff,
          oldFollowers: change.oldFollowers,
          newFollowers: change.newFollowers,
          oldFollowing: change.oldFollowing,
          newFollowing: change.newFollowing,
        },
      });
      console.log('[BackgroundFetch] ✅ Notification saved to storage');
    } catch (saveError) {
      console.error('[BackgroundFetch] Error saving notification:', saveError);
    }

    if (Platform.OS === 'ios') {
      try {
        PushNotificationIOS.addNotificationRequest({
          id: notificationId,
          title: title,
          body: message,
          sound: 'default',
          badge: 1,
          userInfo: {
            type: 'target_change',
            targetId: change.targetId,
            username: change.username,
            platform: change.platform,
            change: change,
          },
        });
        console.log(
          '[BackgroundFetch] ✅ iOS notification sent for @' + change.username
        );
      } catch (error) {
        console.error('[BackgroundFetch] iOS notification error:', error);
      }
    } else {
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
            type: 'target_change',
            targetId: change.targetId,
            username: change.username,
            platform: change.platform,
            change: change,
          },
        });
        console.log(
          '[BackgroundFetch] ✅ Android notification sent for @' +
            change.username
        );
      } catch (error) {
        console.error('[BackgroundFetch] Android notification error:', error);
      }
    }
  }
};

/**
 * Configure PushNotification
 */
const configurePushNotification = async () => {
  console.log('[BackgroundFetch] Configuring push notifications...');

  try {
    if (Platform.OS === 'ios') {
      const requested = await PushNotificationIOS.requestPermissions({
        alert: true,
        badge: true,
        sound: true,
      });
      console.log('[BackgroundFetch] iOS permissions:', requested);
    }

    PushNotification.configure({
      onRegister: (token: any) => {
        console.log('[BackgroundFetch] Push token:', token);
      },
      onNotification: (notification: any) => {
        console.log('[BackgroundFetch] Notification received:', notification);
        if (notification.finish) {
          notification.finish('UIBackgroundFetchResultNoData');
        }
      },
      permissions: {
        alert: true,
        badge: true,
        sound: true,
      },
      popInitialNotification: true,
      requestPermissions: true,
    });

    if (Platform.OS === 'android') {
      PushNotification.createChannel(
        {
          channelId: ANDROID_CHANNEL_ID,
          channelName: 'Account Changes',
          channelDescription: 'Notifications when followed accounts change',
          importance: 4,
          vibrate: true,
          soundName: 'default',
        },
        (created: boolean) =>
          console.log('[BackgroundFetch] Android channel created:', created)
      );
    }

    console.log('[BackgroundFetch] ✅ Push notifications configured');
  } catch (error) {
    console.error('[BackgroundFetch] Error configuring notifications:', error);
  }
};

/**
 * Main background fetch handler - fetches data, compares, and notifies
 */
const handleBackgroundFetch = async () => {
  console.log('[BackgroundFetch] ===== STARTING BACKGROUND FETCH =====');
  console.log('[BackgroundFetch] Timestamp:', new Date().toISOString());

  try {
    // Check authentication
    const accessToken = await getAccessToken();
    if (!accessToken) {
      console.log('[BackgroundFetch] No access token, attempting refresh...');
      const refreshed = await refreshAccessTokenIfPossible();
      if (!refreshed) {
        console.log('[BackgroundFetch] Cannot refresh token, aborting');
        return;
      }
    }

    // 1. Get old snapshots
    const oldSnapshots = await getStoredSnapshots();
    console.log(
      `[BackgroundFetch] Loaded ${oldSnapshots.length} old snapshot(s)`
    );

    // 2. Fetch current data
    console.log('[BackgroundFetch] Fetching current targets...');
    const currentTargets = await listTargets();
    console.log(
      `[BackgroundFetch] Fetched ${currentTargets.length} current target(s)`
    );

    if (currentTargets.length === 0) {
      console.log('[BackgroundFetch] No targets to check');
      return;
    }

    // 3. Detect changes
    const changes = detectChanges(oldSnapshots, currentTargets);
    console.log(`[BackgroundFetch] Detected ${changes.length} change(s)`);

    // 4. Send notifications for changes
    if (changes.length > 0) {
      await sendChangeNotifications(changes);
    }

    // 5. Update snapshots with new data
    await updateSnapshots(currentTargets);

    // 6. Update last check timestamp
    await setItem(LAST_CHECK_KEY, Date.now().toString());

    console.log('[BackgroundFetch] ===== BACKGROUND FETCH COMPLETED =====');
  } catch (error) {
    console.error('[BackgroundFetch] Error in background fetch:', error);
  }
};

/**
 * Initialize background fetch service
 */
export const initializeBackgroundFetch = async () => {
  console.log('[BackgroundFetch] Initializing background fetch service...');

  try {
    // Configure notifications
    await configurePushNotification();

    // Configure BackgroundFetch
    BackgroundFetch.configure(
      {
        minimumFetchInterval: BACKGROUND_FETCH_INTERVAL_MIN,
        stopOnTerminate: false,
        startOnBoot: true,
        enableHeadless: true,
        requiredNetworkType: BackgroundFetch.NETWORK_TYPE_ANY,
        requiresCharging: false,
        requiresDeviceIdle: false,
        requiresBatteryNotLow: false,
      },
      async (taskId) => {
        console.log('[BackgroundFetch] Task triggered:', taskId);
        try {
          await handleBackgroundFetch();
        } catch (error) {
          console.error('[BackgroundFetch] Task error:', error);
        } finally {
          BackgroundFetch.finish(taskId);
        }
      },
      (error) => {
        console.error('[BackgroundFetch] Configuration error:', error);
      }
    );

    BackgroundFetch.start();
    console.log('[BackgroundFetch] ✅ Background fetch service initialized');
  } catch (error) {
    console.error('[BackgroundFetch] Initialization error:', error);
  }
};

/**
 * Stop background fetch service
 */
export const stopBackgroundFetch = () => {
  console.log('[BackgroundFetch] Stopping background fetch service...');
  BackgroundFetch.stop();
  PushNotification.cancelAllLocalNotifications();
  console.log('[BackgroundFetch] ✅ Background fetch stopped');
};

/**
 * Test background fetch manually
 */
export const testBackgroundFetch = async () => {
  console.log('[BackgroundFetch] Running manual test...');
  await handleBackgroundFetch();
};

/**
 * Force immediate fetch (clears cache)
 */
export const forceBackgroundFetch = async () => {
  console.log('[BackgroundFetch] Forcing immediate fetch (clearing cache)...');

  // Clear the targets cache first
  try {
    const { listTargets } = await import('../api/targets');
    // @ts-ignore - accessing internal cache
    if (listTargets.cache) {
      // @ts-ignore
      listTargets.cache = null;
    }
  } catch {}

  await handleBackgroundFetch();
};

/**
 * Simulate background with fake data change
 */
export const simulateBackgroundExecution = async () => {
  console.log('[BackgroundFetch] Simulating data changes...');

  try {
    // Get current snapshots
    const snapshots = await getStoredSnapshots();

    if (snapshots.length === 0) {
      console.log(
        '[BackgroundFetch] No snapshots to simulate changes. Add targets first.'
      );
      return;
    }

    // Modify first snapshot to simulate change
    const modified = [...snapshots];
    modified[0].followers += 100;
    modified[0].following -= 5;

    // Temporarily save modified snapshot
    await setItem(TARGETS_SNAPSHOT_KEY, JSON.stringify(modified));
    console.log('[BackgroundFetch] Modified snapshot for simulation');

    // Now run fetch which will detect the "change"
    await handleBackgroundFetch();
  } catch (error) {
    console.error('[BackgroundFetch] Simulation error:', error);
  }
};

/**
 * Debug function - shows all stored data
 */
export const debugBackgroundFetch = async () => {
  console.log('===== BACKGROUND FETCH DEBUG =====');

  try {
    // 1. Check snapshots
    const snapshots = await getStoredSnapshots();
    console.log(`[Debug] Stored snapshots: ${snapshots.length}`);
    snapshots.forEach((s) => {
      console.log(
        `  - @${s.username}: ${s.followers} followers, ${s.following} following`
      );
    });

    // 2. Check last check time
    const lastCheckRaw = await getItem(LAST_CHECK_KEY);
    const lastCheck = lastCheckRaw ? new Date(Number(lastCheckRaw)) : null;
    console.log(
      `[Debug] Last check: ${lastCheck?.toLocaleString() || 'Never'}`
    );

    // 3. Check access token
    const token = await getAccessToken();
    console.log(`[Debug] Has access token: ${!!token}`);

    // 4. Check background fetch status
    const status = await BackgroundFetch.status();
    console.log(`[Debug] BackgroundFetch status: ${status}`);
    console.log(
      `[Debug] Status meaning:`,
      {
        0: 'RESTRICTED',
        1: 'DENIED',
        2: 'AVAILABLE',
      }[status] || 'UNKNOWN'
    );

    // 5. Fetch current targets
    console.log('[Debug] Fetching current targets...');
    const targets = await listTargets();
    console.log(`[Debug] Current targets: ${targets.length}`);
    targets.forEach((t: any) => {
      console.log(
        `  - @${t.username}: ${t.followers} followers, ${t.following} following`
      );
    });
  } catch (error) {
    console.error('[Debug] Error:', error);
  }

  console.log('===== END DEBUG =====');
};

/**
 * Check stored snapshots (utility)
 */
export const checkStoredData = async () => {
  console.log('=== CHECKING STORED DATA ===');

  try {
    const snapshotsRaw = await getItem(TARGETS_SNAPSHOT_KEY);
    const snapshots = snapshotsRaw ? JSON.parse(snapshotsRaw) : [];

    console.log(`[Storage] Found ${snapshots.length} snapshots`);
    snapshots.forEach((snap: TargetSnapshot) => {
      console.log(
        `  - @${snap.username}: ${snap.followers} followers, ${snap.following} following`
      );
    });

    const lastCheckRaw = await getItem(LAST_CHECK_KEY);
    const lastCheck = lastCheckRaw ? new Date(Number(lastCheckRaw)) : null;
    console.log(
      `[Storage] Last check: ${lastCheck?.toLocaleString() || 'Never'}`
    );
  } catch (error) {
    console.error('[Storage] Error checking data:', error);
  }

  console.log('=== END STORED DATA ===');
};

/**
 * Get background fetch status
 */
export const getBackgroundFetchStatus = async (): Promise<number> => {
  try {
    return await BackgroundFetch.status();
  } catch (error) {
    console.error('[BackgroundFetch] Error getting status:', error);
    return BackgroundFetch.STATUS_DENIED;
  }
};
