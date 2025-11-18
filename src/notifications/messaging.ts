import messaging from '@react-native-firebase/messaging';
import { Platform } from 'react-native';
import { sendFirebaseTokenToServer } from '../api/notifications';

export async function requestUserPermission(): Promise<boolean> {
  const authStatus = await messaging().requestPermission({
    alert: true,
    announcement: false,
    badge: true,
    carPlay: false,
    criticalAlert: false,
    provisional: false,
    sound: true,
  });
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;
  return enabled;
}

export async function getFcmToken(): Promise<string | null> {
  try {
    if (Platform.OS === 'ios') {
      await messaging().registerDeviceForRemoteMessages();
    }
    const token = await messaging().getToken();
    return token;
  } catch {
    return null;
  }
}

export async function registerForPushNotifications(): Promise<string | null> {
  const permission = await requestUserPermission();
  if (!permission) return null;
  const token = await getFcmToken();
  if (token) {
    await sendFirebaseTokenToServer(token);
  }
  // Keep server up-to-date when token rotates
  messaging().onTokenRefresh(async t => {
    await sendFirebaseTokenToServer(t);
  });
  return token;
}

export function setupForegroundNotificationListeners(): () => void {
  // Foreground message listener
  const unsubscribeMessage = messaging().onMessage(async remoteMessage => {
    // TODO: Optionally display a local notification using react-native-push-notification
    // For now, just log structure
    // console.log('FCM Foreground Message:', JSON.stringify(remoteMessage));
  });

  // When app opened from a background state by tapping a notification
  const unsubscribeOpened = messaging().onNotificationOpenedApp(_remoteMessage => {
    // TODO: Navigate to appropriate screen based on notification data
  });

  // Handle notification opened when app was quit
  void messaging()
    .getInitialNotification()
    .then(_remoteMessage => {
      // TODO: Navigate based on initial notification if needed
    })
    .catch(() => undefined);

  return () => {
    unsubscribeMessage();
    unsubscribeOpened();
  };
}


