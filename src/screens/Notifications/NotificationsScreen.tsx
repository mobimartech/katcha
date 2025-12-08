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
import Icon from 'react-native-vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { useAppTheme } from '../../theme/ThemeProvider';
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
  const { colors, spacing, radius, typography, shadows } = useAppTheme();
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
    if (
      notification.targetId &&
      notification.username &&
      notification.platform
    ) {
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

    const iconColor = item.read ? colors.textSecondary : '#4ade80';
    const iconBgColor = item.read ? '#F3F4F6' : '#DCFCE7';

    return (
      <TouchableOpacity
        style={[
          styles.notificationCard,
          {
            backgroundColor: colors.surface,
            borderColor: item.read ? colors.border : '#86efac',
            ...shadows.small,
          },
          !item.read && styles.unreadCard,
        ]}
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.cardContent}>
          <View style={[styles.iconBox, { backgroundColor: iconBgColor }]}>
            <Icon name={icon} size={20} color={iconColor} />
          </View>

          <View style={styles.textContent}>
            <View style={styles.headerRow}>
              <Text
                style={[
                  styles.title,
                  { color: colors.text },
                  !item.read && styles.unreadTitle,
                ]}
                numberOfLines={1}
              >
                {item.title}
              </Text>
              {!item.read && <View style={styles.unreadDot} />}
            </View>

            <Text style={[styles.message, { color: colors.textSecondary }]}>
              {item.message}
            </Text>

            {item.changeData && (
              <View style={styles.changesGrid}>
                {item.changeData.followersDiff !== 0 && (
                  <View
                    style={[
                      styles.changeBox,
                      {
                        backgroundColor: '#F9FAFB',
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <Icon name="people" size={14} color={colors.primary} />
                    <Text
                      style={[
                        styles.changeLabel,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Followers:
                    </Text>
                    <Text style={[styles.changeText, { color: colors.text }]}>
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
                  <View
                    style={[
                      styles.changeBox,
                      {
                        backgroundColor: '#F9FAFB',
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <Icon name="person-add" size={14} color={colors.primary} />
                    <Text
                      style={[
                        styles.changeLabel,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Following:
                    </Text>
                    <Text style={[styles.changeText, { color: colors.text }]}>
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
              <Icon
                name="time-outline"
                size={12}
                color={colors.textSecondary}
              />
              <Text style={[styles.timestamp, { color: colors.textSecondary }]}>
                {formatTimestamp(item.timestamp)}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDelete(item.id)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon name="close-circle" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.backButton, { borderColor: colors.border }]}
            onPress={() => navigation.goBack()}
          >
            <Icon name="chevron-back" size={20} color={colors.text} />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              Notifications
            </Text>
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount}</Text>
              </View>
            )}
          </View>

          {notifications.length > 0 && (
            <TouchableOpacity
              style={[styles.menuButton, { borderColor: colors.border }]}
              onPress={handleClearAll}
            >
              <Icon name="trash-outline" size={20} color={colors.text} />
            </TouchableOpacity>
          )}
        </View>

        {/* Actions Bar */}
        {notifications.length > 0 && unreadCount > 0 && (
          <View style={styles.actionsBar}>
            <TouchableOpacity
              style={[
                styles.actionButton,
                {
                  backgroundColor: colors.primary,
                  borderColor: colors.primary,
                },
              ]}
              onPress={handleMarkAllRead}
            >
              <Icon name="checkmark-done" size={16} color="#ffffff" />
              <Text style={styles.actionText}>Mark all as read</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Notifications List */}
        {loading ? (
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconBox, { backgroundColor: '#F3F4F6' }]}>
              <Icon name="hourglass-outline" size={32} color={colors.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              Loading notifications...
            </Text>
          </View>
        ) : notifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconBox, { backgroundColor: '#F3F4F6' }]}>
              <Icon name="notifications-off" size={40} color={colors.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No Notifications Yet
            </Text>
            <Text
              style={[styles.emptySubtitle, { color: colors.textSecondary }]}
            >
              You'll receive notifications when your tracked accounts have
              changes in followers or following counts
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
                tintColor={colors.primary}
              />
            }
          />
        )}
      </SafeAreaView>
    </View>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
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
    fontSize: 18,
    fontWeight: '800',
  },
  badge: {
    backgroundColor: '#ef4444',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#ffffff',
  },
  menuButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionsBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignSelf: 'flex-start',
    borderWidth: 1,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 30,
  },
  notificationCard: {
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    overflow: 'hidden',
  },
  unreadCard: {
    borderWidth: 2,
  },
  cardContent: {
    flexDirection: 'row',
    padding: 12,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContent: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },
  unreadTitle: {
    fontWeight: '800',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4ade80',
  },
  message: {
    fontSize: 13,
    marginBottom: 8,
    lineHeight: 18,
  },
  changesGrid: {
    gap: 6,
    marginBottom: 8,
  },
  changeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  changeLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  changeText: {
    fontSize: 11,
    fontWeight: '700',
    flex: 1,
  },
  changeDiff: {
    fontSize: 12,
    fontWeight: '800',
  },
  positiveChange: {
    color: '#16a34a',
  },
  negativeChange: {
    color: '#dc2626',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timestamp: {
    fontSize: 11,
    fontWeight: '500',
  },
  deleteButton: {
    marginLeft: 8,
    padding: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
