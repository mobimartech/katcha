import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import {
  getSavedNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  clearAllNotifications,
  type SavedNotification,
} from '../../utils/notificationStorage';
import { formatNumber } from '../../utils/formatNumber';

type Props = NativeStackScreenProps<RootStackParamList, 'Notifications'>;

export default function NotificationsScreen({ navigation }: Props) {
  const [notifications, setNotifications] = useState<SavedNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadNotifications = async () => {
    try {
      const data = await getSavedNotifications();
      setNotifications(data);
    } catch (error) {
      console.error('[Notifications] Error loading:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadNotifications();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadNotifications();
  };

  const handleNotificationPress = async (notification: SavedNotification) => {
    // Mark as read
    await markNotificationAsRead(notification.id);
    loadNotifications();

    // Navigate to target detail if available
    if (notification.targetId && notification.username && notification.platform) {
      navigation.navigate('UserDetail', {
        userId: notification.targetId.toString(),
        username: notification.username,
        platform: notification.platform as 'instagram' | 'tiktok',
      });
    }
  };

  const handleDelete = async (notificationId: string) => {
    Alert.alert(
      'Delete Notification',
      'Are you sure you want to delete this notification?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteNotification(notificationId);
            loadNotifications();
          },
        },
      ]
    );
  };

  const handleClearAll = () => {
    Alert.alert(
      'Clear All Notifications',
      'Are you sure you want to clear all notifications?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            await clearAllNotifications();
            loadNotifications();
          },
        },
      ]
    );
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsAsRead();
    loadNotifications();
  };

  const renderNotification = ({ item }: { item: SavedNotification }) => {
    const icon =
      item.type === 'target_change'
        ? 'analytics'
        : item.type === 'alert'
        ? 'warning'
        : 'information-circle';

    const iconColor = item.read ? 'rgba(255,255,255,0.5)' : '#4ade80';

    return (
      <TouchableOpacity
        style={[styles.notificationCard, !item.read && styles.unreadCard]}
        // onPress={() => handleNotificationPress(item)}
        activeOpacity={0.8}
      >
        <View style={styles.cardContent}>
          <View style={styles.iconBox}>
            <Icon name={icon} size={24} color={iconColor} />
          </View>

          <View style={styles.textContent}>
            <View style={styles.headerRow}>
              <Text style={[styles.title, !item.read && styles.unreadTitle]}>
                {item.title}
              </Text>
              {!item.read && <View style={styles.unreadDot} />}
            </View>

            <Text style={styles.message}>{item.message}</Text>

            {item.changeData && (
              <View style={styles.changesGrid}>
                {item.changeData.followersDiff !== 0 && (
                  <View style={styles.changeBox}>
                    <Icon name="people" size={14} color="rgba(255,255,255,0.8)" />
                    <Text style={styles.changeText}>
                      {formatNumber(item.changeData.oldFollowers)} →{' '}
                      {formatNumber(item.changeData.newFollowers)}
                    </Text>
                    <Text
                      style={[
                        styles.changeDiff,
                        item.changeData.followersDiff > 0
                          ? styles.positiveChange
                          : styles.negativeChange,
                      ]}
                    >
                      {item.changeData.followersDiff > 0 ? '+' : ''}
                      {formatNumber(item.changeData.followersDiff)}
                    </Text>
                  </View>
                )}

                {item.changeData.followingDiff !== 0 && (
                  <View style={styles.changeBox}>
                    <Icon name="person-add" size={14} color="rgba(255,255,255,0.8)" />
                    <Text style={styles.changeText}>
                      {formatNumber(item.changeData.oldFollowing)} →{' '}
                      {formatNumber(item.changeData.newFollowing)}
                    </Text>
                    <Text
                      style={[
                        styles.changeDiff,
                        item.changeData.followingDiff > 0
                          ? styles.positiveChange
                          : styles.negativeChange,
                      ]}
                    >
                      {item.changeData.followingDiff > 0 ? '+' : ''}
                      {formatNumber(item.changeData.followingDiff)}
                    </Text>
                  </View>
                )}
              </View>
            )}

            <View style={styles.footer}>
              <Icon name="time-outline" size={12} color="rgba(255,255,255,0.6)" />
              <Text style={styles.timestamp}>
                {formatTimestamp(item.timestamp)}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDelete(item.id)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon name="close-circle" size={24} color="rgba(255,255,255,0.4)" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <LinearGradient
      colors={['#667eea', '#764ba2', '#f093fb', '#4facfe']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Notifications</Text>
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount}</Text>
              </View>
            )}
          </View>

          {notifications.length > 0 && (
            <TouchableOpacity style={styles.menuButton} onPress={handleClearAll}>
              <Icon name="trash-outline" size={22} color="#ffffff" />
            </TouchableOpacity>
          )}
        </View>

        {/* Actions Bar */}
        {notifications.length > 0 && unreadCount > 0 && (
          <View style={styles.actionsBar}>
            <TouchableOpacity style={styles.actionButton} onPress={handleMarkAllRead}>
              <Icon name="checkmark-done" size={18} color="#ffffff" />
              <Text style={styles.actionText}>Mark all as read</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Notifications List */}
        {loading ? (
          <View style={styles.emptyContainer}>
            <Icon name="hourglass-outline" size={48} color="rgba(255,255,255,0.6)" />
            <Text style={styles.emptyText}>Loading notifications...</Text>
          </View>
        ) : notifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconBox}>
              <Icon name="notifications-off" size={52} color="rgba(255,255,255,0.8)" />
            </View>
            <Text style={styles.emptyTitle}>No Notifications Yet</Text>
            <Text style={styles.emptySubtitle}>
              You'll receive notifications when your tracked accounts have changes in
              followers or following counts
            </Text>
          </View>
        ) : (
          <FlatList
            data={notifications}
            renderItem={renderNotification}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#ffffff"
              />
            }
          />
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

function formatTimestamp(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  const date = new Date(timestamp);
  return date.toLocaleDateString();
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  badge: {
    backgroundColor: '#ef4444',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionsBar: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  actionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 30,
  },
  notificationCard: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    overflow: 'hidden',
  },
  unreadCard: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderColor: 'rgba(74, 222, 128, 0.5)',
    borderWidth: 2,
  },
  cardContent: {
    flexDirection: 'row',
    padding: 16,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  textContent: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.9)',
    flex: 1,
  },
  unreadTitle: {
    color: '#ffffff',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4ade80',
  },
  message: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 12,
    fontWeight: '600',
    lineHeight: 20,
  },
  changesGrid: {
    gap: 8,
    marginBottom: 12,
  },
  changeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  changeText: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.9)',
  },
  changeDiff: {
    fontSize: 12,
    fontWeight: '800',
    marginLeft: 'auto',
  },
  positiveChange: {
    color: '#4ade80',
  },
  negativeChange: {
    color: '#f87171',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timestamp: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '600',
  },
  deleteButton: {
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIconBox: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#ffffff',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  emptyText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
  },
  emptySubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '600',
  },
});
