import React, { useEffect, useRef, useState } from 'react';
import { SafeAreaView, StyleSheet, Text, View, Image, TouchableOpacity, Linking, Animated, Easing, ScrollView, Alert, StatusBar, Platform, ActionSheetIOS } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAppTheme } from '../../theme/ThemeProvider';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { getUserInfo, getFollowers, getFollowing, deleteTarget } from '../../api/targets';
import variables from '../../../constants/variables.js';

// Dummy fallback pulled from user-provided structure (trimmed fields used by UI)
const dummyUserInfo = {
  username: 'instagram',
  full_name: 'Instagram',
  is_verified: true,
  follower_count: 695330181,
  following_count: 252,
  biography: "Discover what's new on Instagram 🔎✨",
  external_url: 'http://help.instagram.com',
  profile_pic_url_hd: 'https://scontent-sjc3-1.cdninstagram.com/v/t51.2885-19/550891366_18667771684001321_1383210656577177067_n.jpg?stp=dst-jpg_s640x640_tt6&efg=eyJ2ZW5jb2RlX3RhZyI6InByb2ZpbGVfcGljLmRqYW5nby4xMDgwLmMyIn0&_nc_ht=scontent-sjc3-1.cdninstagram.com&_nc_cat=1&_nc_oc=Q6cZ2QEzWhOzTDjJL7UGlhLSE1jfgctXTn8HDl8sM8MQTUbpPpCFt-4HSDEs2A3fQeQvjec&_nc_ohc=TEQYHlIlR9oQ7kNvwFMWQuB&_nc_gid=Y1u3c8Z1DWazonCqa77LeA&edm=AO4kU9EBAAAA&ccb=7-5&ig_cache_key=GGbv1SApFvlLPVJCAOtF0XrDJjITbmNDAQAB6406400j-ccb7-5&oh=00_AfeanVY5l3eAr90rTfORPbxC1vDMOeXTkThA3bhxOGRPUA&oe=68F13FF1&_nc_sid=164c1d',
  profile_context_facepile_users: [
    {
      username: '8iirish.knnp',
      full_name: '𝐈.𝐑𝐈𝐒𝐇',
      profile_pic_url:
        'https://scontent-sjc3-1.cdninstagram.com/v/t51.2885-19/536303937_17854647735508949_4371086600476127648_n.jpg?stp=dst-jpg_e0_s150x150_tt6',
      is_private: false,
      is_verified: false,
      id: '75326308948',
    },
  ],
  bio_links: [
    { url: 'http://help.instagram.com', title: '' },
  ],
};

function formatCount(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

type Props = NativeStackScreenProps<RootStackParamList, 'UserDetail'>;

type FacepileUser = { username: string; full_name?: string; profile_pic_url?: string };

type UiInfo = {
  username: string;
  full_name: string;
  is_verified: boolean;
  follower_count: number;
  following_count: number;
  biography?: string;
  external_url?: string;
  profile_pic_url_hd?: string;
  profile_pic_url?: string;
  profile_context_facepile_users?: FacepileUser[];
  bio_links?: Array<{ url: string; title?: string }>;
};

export default function UserDetailScreen({ route, navigation }: Props): React.ReactElement {
  const { colors, spacing, radius, typography, shadows } = useAppTheme();
  const { userId, username, platform, targetData } = route.params;
  const [info, setInfo] = useState<UiInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [followers, setFollowers] = useState<any[]>([]);
  const [following, setFollowing] = useState<any[]>([]);
  const [followersCount, setFollowersCount] = useState(targetData?.followers || 0);
  const [followingCount, setFollowingCount] = useState(targetData?.following || 0);

  // Header animation
  const headerFade = useRef(new Animated.Value(0)).current;
  const headerTranslate = useRef(new Animated.Value(-12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerFade, { toValue: 1, duration: 600, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
      Animated.timing(headerTranslate, { toValue: 0, duration: 600, useNativeDriver: true, easing: Easing.out(Easing.back(1.5)) }),
    ]).start();
  }, [headerFade, headerTranslate]);

  useEffect(() => {
    const params = { platform, username, target_id: Number(userId) } as const;
    void (async () => {
      try {
        console.log('[UserDetail] Loading data...');
        console.log('[UserDetail] Has cached data:', !!targetData);
        
        // If we have cached data from HomeScreen, use it immediately
        if (targetData?.result) {
          console.log('[UserDetail] Using cached data from HomeScreen');
          const base = targetData.result;
          const facepile = (base.profile_context_facepile_users || []) as FacepileUser[];
          const links = (base.bio_links || []) as Array<any>;
          
          // Set user info
          setInfo({
            username: base.username ?? username,
            full_name: base.full_name ?? username,
            is_verified: base.is_verified ?? false,
            follower_count: targetData.followers || base.follower_count || base.followers_total || 0,
            following_count: targetData.following || base.following_count || base.following_total || 0,
            biography: base.biography ?? '',
            external_url: base.external_url ?? '',
            profile_pic_url_hd: base.profile_pic_url_hd ?? base.profile_pic_url ?? '',
            profile_pic_url: base.profile_pic_url ?? '',
            profile_context_facepile_users: facepile,
            bio_links: links.map((l: any) => ({ url: l.url, title: l.title })),
          });
          
          // Set followers and following lists from cached data
          setFollowers(base.followers_list || []);
          setFollowing(base.following_list || []);
          setFollowersCount(base.followers_total || targetData.followers || 0);
          setFollowingCount(base.following_total || targetData.following || 0);
          
          setLoading(false);
          console.log('[UserDetail] Cached data loaded successfully:', {
            followers: base.followers_list?.length || 0,
            following: base.following_list?.length || 0
          });
          return;
        }
        
        // Otherwise fetch fresh data
        console.log('[UserDetail] No cached data, fetching from API...');
        const [userInfoData, followersData, followingData] = await Promise.all([
          getUserInfo(params),
          getFollowers(params),
          getFollowing(params),
        ]);

        // Process user info
        const base = userInfoData?.data || userInfoData || {};
        const facepile = (base.profile_context_facepile_users || []) as FacepileUser[];
        const links = (base.bio_links || []) as Array<any>;
        setInfo({
          username: base.username ?? username,
          full_name: base.full_name ?? username,
          is_verified: base.is_verified ?? false,
          follower_count: base.follower_count ?? 0,
          following_count: base.following_count ?? 0,
          biography: base.biography ?? '',
          external_url: base.external_url ?? '',
          profile_pic_url_hd: base.profile_pic_url_hd ?? base.profile_pic_url ?? '',
          profile_pic_url: base.profile_pic_url ?? '',
          profile_context_facepile_users: facepile,
          bio_links: links.map((l) => ({ url: l.url, title: l.title })),
        });

        // Process followers
        const followersResult = followersData?.data || followersData || {};
        setFollowers(followersResult.followers || []);
        setFollowersCount(followersResult.total || followersResult.followers?.length || 0);

        // Process following
        const followingResult = followingData?.data || followingData || {};
        setFollowing(followingResult.following || []);
        setFollowingCount(followingResult.total || followingResult.following?.length || 0);

        console.log('[UserDetail] API data loaded:', {
          followers: followersResult.followers?.length || 0,
          following: followingResult.following?.length || 0,
        });
      } catch (error) {
        console.log('[UserDetail] Error:', error);
        setInfo(dummyUserInfo);
      } finally {
        setLoading(false);
      }
    })();
  }, [userId, username, platform, targetData]);

  const avatar = info?.profile_pic_url_hd || info?.profile_pic_url || '';
  const displayName = info?.full_name || username;
  const isVerified = Boolean(info?.is_verified);

  const onDelete = () => {
    Alert.alert(
      'Delete Profile',
      `Remove @${username} from tracked accounts?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // eslint-disable-next-line no-console
              console.log('[UserDetail][Delete] Request', { target_id: Number(userId) });
              const res = await deleteTarget(Number(userId));
              // eslint-disable-next-line no-console
              console.log('[UserDetail][Delete] Response', res);
              navigation.goBack();
            } catch (e) {
              // eslint-disable-next-line no-console
              console.log('[UserDetail][Delete] Error', e);
              navigation.goBack();
            }
          },
        },
      ],
      { cancelable: true },
    );
  };

  const onMorePress = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Delete'],
          destructiveButtonIndex: 1,
          cancelButtonIndex: 0,
          title: `@${username}`,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            onDelete();
          }
        }
      );
    } else {
      Alert.alert(`@${username}`, undefined, [
        { text: 'Delete', style: 'destructive', onPress: onDelete },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.primary }}>
      <StatusBar barStyle="light-content" />
      <View style={[styles.headerGradient, { backgroundColor: colors.primary }]}>
        <SafeAreaView>
          <View style={styles.branding}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.circleButton}>
              <Icon name="chevron-back" size={22} color="#000000" />
            </TouchableOpacity>
            <View style={styles.brandCenter}>
              <Image source={require('../../../assets/img/logo.jpg')} style={styles.logoImage} />
              <Text style={styles.brandText}>{variables.APP.app_name}</Text>
            </View>
            <TouchableOpacity style={styles.circleButton} onPress={() => navigation.navigate('MainTabs' as any, { screen: 'Notifications' } as any)}>
              <Icon name="notifications-outline" size={20} color="#000000" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 0, paddingTop: 0, paddingBottom: 0 }} showsVerticalScrollIndicator={false}>
        <View style={[styles.sheet, { backgroundColor: colors.surface, flex: 1 }]}>
          {/* Title row */}
          <View style={styles.analyticsHeaderRow}>
            <Text style={[styles.analyticsTitle, { color: colors.text }]}>
              {platform === 'tiktok' ? 'TikTok Analytics' : 'Instagram Analytics'}
            </Text>
            <TouchableOpacity onPress={onMorePress} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Icon name="ellipsis-horizontal" size={22} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Profile row */}
          <View style={styles.profileRow}>
            <View style={[styles.avatarLarge, { backgroundColor: colors.surface, borderColor: colors.border, ...shadows.small }]}>
              {avatar ? (
                <Image source={{ uri: avatar }} style={styles.avatarLargeImg} />
              ) : (
                <View style={[styles.avatarFallback, { backgroundColor: colors.surface }]}>
                  <Icon name={platform === 'instagram' ? 'logo-instagram' : 'logo-tiktok'} size={32} color={colors.accent} />
                </View>
              )}
            </View>
            <View style={{ marginLeft: 14, flex: 1 }}>
              <Text style={[styles.handleLarge, { color: colors.text }]}>@{username}</Text>
              <Text style={[styles.realName, { color: colors.text }]}>{displayName}</Text>
              <Text style={[styles.updatedText, { color: colors.textSecondary }]}>Updated 2h ago</Text>
            </View>
          </View>

          {/* Inner analytics card */}
          <View style={[styles.analyticsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.platformRow}>
              <View style={[styles.platformBadge, { backgroundColor: platform === 'tiktok' ? '#000000' : colors.primary }]}>
                <Icon name={platform === 'tiktok' ? 'logo-tiktok' : 'logo-instagram'} size={20} color="#FFFFFF" />
              </View>
              <Text style={[styles.platformHandle, { color: colors.text }]}>@{username}</Text>
            </View>

            <View style={styles.metricsGrid}>
              <View style={styles.metricBox}>
                <Text style={[styles.metricValue, { color: colors.text }]}>{formatCount(info?.follower_count || followersCount)}</Text>
                <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Followers</Text>
              </View>
              <View style={styles.metricBox}>
                <Text style={[styles.metricValue, { color: colors.text }]}>{formatCount(info?.following_count || followingCount)}</Text>
                <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Following</Text>
              </View>
              <View style={styles.metricBox}>
                <Text style={[styles.metricValue, { color: colors.text }]}>{formatCount((targetData as any)?.video_likes || 0)}</Text>
                <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Video Likes</Text>
              </View>
              <View style={styles.metricBox}>
                <Text style={[styles.metricValue, { color: colors.text }]}>+{formatCount((targetData as any)?.new_fans_week || 0)}</Text>
                <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>New fans this week</Text>
              </View>
            </View>
          </View>

          <Text style={[styles.footerNote, { color: colors.text }] }>
            Your audience is growing fast — engagement looks great! 🚀
          </Text>
     
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerGradient: { paddingTop: 14, paddingBottom: 26 },
  branding: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
  circleButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 3 },
  brandCenter: { flexDirection: 'row', alignItems: 'center' },
  logoImage: { width: 28, height: 28, borderRadius: 8, marginRight: 10 },
  brandText: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
  sheet: { borderTopLeftRadius: 36, borderTopRightRadius: 36, padding: 16,flex:1 },
  analyticsHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  analyticsTitle: { fontSize: 30, fontWeight: '800' },
  profileRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  avatarLarge: { width: 80, height: 80, borderRadius: 40, borderWidth: 1, overflow: 'hidden' },
  avatarLargeImg: { width: '100%', height: '100%' },
  avatarFallback: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  handleLarge: { fontSize: 26, fontWeight: '800' },
  realName: { marginTop: 4, fontSize: 18, fontWeight: '600' },
  updatedText: { marginTop: 4, fontSize: 14, fontWeight: '500' },
  analyticsCard: { borderWidth: 1, borderRadius: 20, padding: 18 },
  platformRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  platformBadge: { width: 56, height: 56, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  platformHandle: { fontSize: 22, fontWeight: '800' },
  metricsGrid: { marginTop: 12, flexDirection: 'row', flexWrap: 'wrap' },
  metricBox: { width: '50%', paddingVertical: 12 },
  metricValue: { fontSize: 26, fontWeight: '800' },
  metricLabel: { fontSize: 16, fontWeight: '700', opacity: 0.75 },
  footerNote: { marginTop: 16, fontSize: 18, fontWeight: '400',marginRight:60 },
  legalLinks: { marginTop: 16, flexDirection: 'row', alignItems: 'center' },
  legalLink: { fontSize: 14, fontWeight: '700', textDecorationLine: 'underline' },
});


