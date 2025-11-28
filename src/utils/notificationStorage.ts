import { getItem, setItem } from './storage';

const NOTIFICATIONS_KEY = 'app_notifications';

export interface SavedNotification {
  id: string;
  title: string;
  message: string;
  type: 'target_change' | 'system' | 'alert';
  targetId?: number;
  username?: string;
  platform?: string;
  changeData?: {
    followersDiff: number;
    followingDiff: number;
    oldFollowers: number;
    newFollowers: number;
    oldFollowing: number;
    newFollowing: number;
  };
  timestamp: number;
  read: boolean;
}

/**
 * Get all saved notifications
 */
export const getSavedNotifications = async (): Promise<SavedNotification[]> => {
  try {
    const raw = await getItem(NOTIFICATIONS_KEY);
    if (!raw) return [];
    const notifications = JSON.parse(raw);
    // Sort by timestamp descending (newest first)
    return notifications.sort(
      (a: SavedNotification, b: SavedNotification) => b.timestamp - a.timestamp
    );
  } catch (error) {
    console.error('[NotificationStorage] Error getting notifications:', error);
    return [];
  }
};

/**
 * Save a new notification
 */
export const saveNotification = async (
  notification: Omit<SavedNotification, 'id' | 'timestamp' | 'read'>
) => {
  try {
    const existing = await getSavedNotifications();

    const newNotification: SavedNotification = {
      ...notification,
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      read: false,
    };

    const updated = [newNotification, ...existing];

    // Keep only last 100 notifications
    const trimmed = updated.slice(0, 100);

    await setItem(NOTIFICATIONS_KEY, JSON.stringify(trimmed));
    console.log(
      '[NotificationStorage] ✅ Notification saved:',
      newNotification.id
    );

    return newNotification;
  } catch (error) {
    console.error('[NotificationStorage] Error saving notification:', error);
  }
};

/**
 * Mark notification as read
 */
export const markNotificationAsRead = async (notificationId: string) => {
  try {
    const notifications = await getSavedNotifications();
    const updated = notifications.map((n) =>
      n.id === notificationId ? { ...n, read: true } : n
    );
    await setItem(NOTIFICATIONS_KEY, JSON.stringify(updated));
    console.log(
      '[NotificationStorage] ✅ Notification marked as read:',
      notificationId
    );
  } catch (error) {
    console.error('[NotificationStorage] Error marking as read:', error);
  }
};

/**
 * Mark all notifications as read
 */
export const markAllNotificationsAsRead = async () => {
  try {
    const notifications = await getSavedNotifications();
    const updated = notifications.map((n) => ({ ...n, read: true }));
    await setItem(NOTIFICATIONS_KEY, JSON.stringify(updated));
    console.log('[NotificationStorage] ✅ All notifications marked as read');
  } catch (error) {
    console.error('[NotificationStorage] Error marking all as read:', error);
  }
};

/**
 * Delete a notification
 */
export const deleteNotification = async (notificationId: string) => {
  try {
    const notifications = await getSavedNotifications();
    const filtered = notifications.filter((n) => n.id !== notificationId);
    await setItem(NOTIFICATIONS_KEY, JSON.stringify(filtered));
    console.log(
      '[NotificationStorage] ✅ Notification deleted:',
      notificationId
    );
  } catch (error) {
    console.error('[NotificationStorage] Error deleting notification:', error);
  }
};

/**
 * Clear all notifications
 */
export const clearAllNotifications = async () => {
  try {
    await setItem(NOTIFICATIONS_KEY, JSON.stringify([]));
    console.log('[NotificationStorage] ✅ All notifications cleared');
  } catch (error) {
    console.error('[NotificationStorage] Error clearing notifications:', error);
  }
};

/**
 * Get unread notification count
 */
export const getUnreadCount = async (): Promise<number> => {
  try {
    const notifications = await getSavedNotifications();
    return notifications.filter((n) => !n.read).length;
  } catch (error) {
    console.error('[NotificationStorage] Error getting unread count:', error);
    return 0;
  }
};
