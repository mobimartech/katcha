import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, SafeAreaView, StyleSheet, Text, View, Pressable, RefreshControl } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAppTheme } from '../../theme/ThemeProvider';
import Card from '../../components/UI/Card';
import EmptyState from '../../components/UI/EmptyState';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { MainTabParamList } from '../../navigation/types';
import { sendFirebaseTokenToServer } from '../../api/notifications';
import { getItem } from '../../utils/storage.ts';
import { useFocusEffect } from '@react-navigation/native';

type Props = BottomTabScreenProps<MainTabParamList, 'Notifications'>;

type FeedItem = {
  id: string;
  username: string;
  platform: 'instagram' | 'tiktok' | string;
  followers: number;
  following: number;
  fetchedAt: number;
};

const FEED_KEY = 'notifications_feed';

export default function NotificationsScreen({ navigation }: Props): React.ReactElement {
  const { colors, radius, spacing, typography, shadows } = useAppTheme();
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadFeed = useCallback(async () => {
    try {
      const raw = await getItem(FEED_KEY);
      if (!raw) { setFeed([]); return; }
      const parsed = JSON.parse(raw) as FeedItem[];
      setFeed(parsed.sort((a, b) => b.fetchedAt - a.fetchedAt));
    } catch (e) {
      setFeed([]);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadFeed();
      return () => {};
    }, [loadFeed])
  );

  // TODO: On app start, request permission and get FCM/APNs token, then:
  // sendFirebaseTokenToServer(token)
  void sendFirebaseTokenToServer('placeholder-token');

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}> 
      <View style={[styles.headerBar, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => navigation.goBack()} style={[styles.headerIconBtn, { borderColor: colors.border }]}> 
          <Icon name="chevron-back" size={18} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Notifications</Text>
        <View style={{ width: 36 }} />
      </View>

      <FlatList
        data={feed}
        keyExtractor={(i) => i.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadFeed().finally(() => setRefreshing(false)); }} />}
        renderItem={({ item }) => {
          const icon = item.platform === 'instagram' ? 'logo-instagram' : item.platform === 'tiktok' ? 'logo-tiktok' : 'person';
          const when = new Date(item.fetchedAt);
          const dateLabel = `${when.toLocaleDateString()} ${when.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
          return (
            <View style={[styles.notifCard, { backgroundColor: colors.surface, borderColor: colors.border, ...shadows.small }]}> 
              <View style={[styles.iconWrap, { backgroundColor: '#EDEBFE' }]}> 
                <Icon name={icon as any} size={18} color={'#8B5CF6'} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>@{item.username}</Text>
                <Text style={[styles.body, { color: colors.textSecondary }]} numberOfLines={1}>Followers {item.followers.toLocaleString()}   •   Following {item.following.toLocaleString()}</Text>
                <Text style={[styles.time, { color: colors.textSecondary }]}>{dateLabel}</Text>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={(
          <EmptyState
            title="No notifications yet"
            subtitle="Background updates will appear here after we fetch your accounts."
            actionLabel="Refresh"
            icon="notifications-outline"
            onAction={() => { setRefreshing(true); loadFeed().finally(() => setRefreshing(false)); }}
          />
        )}
        contentContainerStyle={{ paddingBottom: 24 }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1 },
  headerIconBtn: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '800' },
  groupLabel: { textAlign: 'center', marginTop: 12, marginBottom: 8, fontWeight: '700' },
  notifCard: { marginHorizontal: 16, marginBottom: 10, padding: 12, borderRadius: 12, borderWidth: 1, flexDirection: 'row', alignItems: 'center' },
  iconWrap: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  title: { fontWeight: '700' },
  body: { marginTop: 4 },
  time: { marginTop: 2, fontSize: 12 },
});


