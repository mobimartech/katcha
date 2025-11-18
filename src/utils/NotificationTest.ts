// @ts-ignore - react-native-push-notification doesn't have types
import PushNotification from 'react-native-push-notification';
import PushNotificationIOS from '@react-native-community/push-notification-ios';
import { Platform, Alert } from 'react-native';

/**
 * Test notification permissions and send test notifications
 */
export const testNotificationPermissions = async () => {
  console.log('[NotificationTest] Starting permission test...');
  
  try {
    // Check iOS permissions
    if (Platform.OS === 'ios') {
      const settings = await PushNotificationIOS.checkPermissions();
      console.log('[NotificationTest] iOS notification permissions:', settings);
      
      if (settings.alert === 0 || settings.badge === 0 || settings.sound === 0) {
        console.warn('[NotificationTest] iOS notifications not fully authorized');
        Alert.alert(
          'Notification Permission Required',
          'Please enable notifications in Settings > Notifications > Social Tracker',
          [{ text: 'OK' }]
        );
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('[NotificationTest] Permission check error:', error);
    return false;
  }
};

/**
 * Send test notification using react-native-push-notification
 */
export const sendTestNotification1 = () => {
  console.log('[NotificationTest] Sending test notification 1...');
  
  try {
    PushNotification.localNotification({
      id: 'test-1',
      title: 'Test PushNotification 1',
      message: 'This is from react-native-push-notification',
      playSound: true,
      soundName: 'default',
      vibrate: true,
      vibration: 300,
    });
    console.log('[NotificationTest] Test notification 1 sent successfully');
  } catch (error) {
    console.error('[NotificationTest] Test notification 1 error:', error);
  }
};

/**
 * Send test notification using PushNotificationIOS
 */
export const sendTestNotification2 = () => {
  console.log('[NotificationTest] Sending test notification 2...');
  
  try {
    PushNotificationIOS.addNotificationRequest({
      id: 'test-2',
      title: 'Test PushNotificationIOS 2',
      body: 'This is from PushNotificationIOS',
    });
    console.log('[NotificationTest] Test notification 2 sent successfully');
  } catch (error) {
    console.error('[NotificationTest] Test notification 2 error:', error);
  }
};

/**
 * Run comprehensive notification test
 */
export const runNotificationTest = async () => {
  console.log('[NotificationTest] Running comprehensive test...');
  
  // Check permissions first
  const hasPermissions = await testNotificationPermissions();
  
  if (hasPermissions) {
    // Send both test notifications
    sendTestNotification1();
    
    setTimeout(() => {
      sendTestNotification2();
    }, 1000);
    
    // Show alert after a delay
    setTimeout(() => {
   
    }, 2000);
  } else {
    Alert.alert(
      'Permission Required',
      'Please grant notification permissions in Settings to test notifications.',
      [{ text: 'OK' }]
    );
  }
};
