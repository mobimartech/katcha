import React, { useState, useEffect, useRef } from 'react';
import {
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Animated,
  Easing,
  Image,
  StatusBar,
} from 'react-native';
// import { LinearGradient } from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
import { useAppTheme } from '../../theme/ThemeProvider';
import { listTargets, type Target } from '../../api/targets';
import EmptyState from '../../components/UI/EmptyState';
import { getUser } from '../../utils/storage.ts';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { MainTabParamList } from '../../navigation/types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import variables from '../../../constants/variables.js';
import { auth } from '../../firebase';
import { syncFirebaseUserToStorage } from '../../utils/storage.ts';
import { refreshAccessTokenIfPossible } from '../../api/auth.ts';
type TabProps = BottomTabScreenProps<MainTabParamList, 'Home'>;
type RootNav = NativeStackNavigationProp<RootStackParamList>;

export default function HomeScreen({
  navigation,
}: TabProps): React.ReactElement {
  const rootNavigation = navigation as unknown as RootNav;
  const { colors, spacing, radius, typography, shadows } = useAppTheme();
  const [targets, setTargets] = useState<Target[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userName, setUserName] = useState('User');

  // Animation refs
  const loadingDotAnim = useRef(new Animated.Value(0)).current;
  const cardAnimations = useRef<Animated.Value[]>([]).current;
  const headerFadeAnim = useRef(new Animated.Value(0)).current;
  const headerTranslateY = useRef(new Animated.Value(-20)).current;

  // const loadUserData = async () => {
  //   try {
  //     const user = await getUser();
  //     if (user?.name) {
  //       setUserName(user.name);
  //       console.log('[Home] Loaded user name:', user.name);
  //     }
  //   } catch (error) {
  //     console.log('[Home] Error loading user data:', error);
  //   }
  // };
  const loadUserData = async () => {
    try {
      // Sync Firebase user to storage first
      await syncFirebaseUserToStorage();

      // Then get user from storage
      const user = await getUser();
      if (user?.name) {
        setUserName(user.name);
        console.log('[Home] Loaded user name:', user.name);
      } else {
        // Fallback to Firebase directly
        const firebaseUser = auth().currentUser;
        if (firebaseUser) {
          const displayName =
            firebaseUser.displayName ||
            firebaseUser.email?.split('@')[0] ||
            'User';
          setUserName(displayName);
          console.log('[Home] Loaded user name from Firebase:', displayName);
        }
      }
    } catch (error) {
      console.log('[Home] Error loading user data:', error);
    }
  };
  const loadTargets = async () => {
    try {
      console.log('[Home] Loading targets...');
      const data = await listTargets();
      console.log('[Home] Loaded targets:', data.length);
      setTargets(data);
    } catch (error) {
      console.log('[Home] Error loading targets:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTargets();
  };

  // Reload targets when screen first comes into focus only once
  const didInitialFetchRef = useRef(false);
  useFocusEffect(
    React.useCallback(() => {
      if (!didInitialFetchRef.current) {
        didInitialFetchRef.current = true;
        loadTargets();
      }
      return () => {};
    }, [])
  );

  // Combined useEffect for all animations and data loading
  useEffect(() => {
    // Load user data only; targets fetched via focus guard above
    loadUserData();

    // Start loading animation if in loading state
    if (loading) {
      Animated.loop(
        Animated.timing(loadingDotAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    }

    // Start header animation when loading finishes
    if (!loading) {
      Animated.parallel([
        Animated.timing(headerFadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
        Animated.timing(headerTranslateY, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
          easing: Easing.out(Easing.back(1.5)),
        }),
      ]).start();
    }
  }, [loading, loadingDotAnim, headerFadeAnim, headerTranslateY]);

  // Initialize all card animations when data loads
  useEffect(() => {
    if (!loading && targets.length > 0) {
      targets.forEach((_, index) => {
        if (!cardAnimations[index]) {
          cardAnimations[index] = new Animated.Value(0);
        }

        const animationDelay = index * 150;
        Animated.timing(cardAnimations[index], {
          toValue: 1,
          duration: 600,
          delay: animationDelay,
          useNativeDriver: true,
          easing: Easing.out(Easing.back(1.2)),
        }).start();
      });
    }
  }, [loading, targets.length]);

  const renderItem = ({ item, index }: { item: Target; index: number }) => {
    // Initialize animation value for this card if not exists
    if (!cardAnimations[index]) {
      cardAnimations[index] = new Animated.Value(0);
    }

    return (
      <AccountCard
        item={item}
        index={index}
        animationValue={cardAnimations[index]}
        onPress={() =>
          rootNavigation.navigate('UserDetail', {
            userId: item.id.toString(),
            username: item.username,
            platform: item.platform,
            targetData: item,
          })
        }
      />
    );
  };

  // Derived values for dot opacities
  const dotOpacity1 = loadingDotAnim.interpolate({
    inputRange: [0, 0.333, 0.666, 1],
    outputRange: [0.3, 1, 0.3, 0.3],
  });

  const dotOpacity2 = loadingDotAnim.interpolate({
    inputRange: [0, 0.333, 0.666, 1],
    outputRange: [0.3, 0.3, 1, 0.3],
  });

  const dotOpacity3 = loadingDotAnim.interpolate({
    inputRange: [0, 0.333, 0.666, 1],
    outputRange: [0.3, 0.3, 0.3, 1],
  });

  if (loading) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          {
            backgroundColor: colors.background,
            justifyContent: 'center',
            alignItems: 'center',
          },
        ]}
      >
        <View style={styles.loadingContainer}>
          <Icon name="people" size={60} color={colors.primary} />
          <Text
            style={{
              fontSize: 24,
              fontWeight: '600',
              color: colors.text,
              marginTop: spacing.md,
            }}
          >
            Katcha
          </Text>
          <Text
            style={{
              fontSize: 16,
              color: colors.textSecondary,
              marginTop: spacing.sm,
            }}
          >
            Loading your tracked accounts
          </Text>

          <View style={styles.loadingDots}>
            <Animated.View
              style={[
                styles.loadingDot,
                { backgroundColor: colors.primary, opacity: dotOpacity1 },
              ]}
            />
            <Animated.View
              style={[
                styles.loadingDot,
                { backgroundColor: colors.primary, opacity: dotOpacity2 },
              ]}
            />
            <Animated.View
              style={[
                styles.loadingDot,
                { backgroundColor: colors.primary, opacity: dotOpacity3 },
              ]}
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.primary }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      {/* Purple Header with rounded bottom */}
      <View
        style={[styles.headerGradient, { backgroundColor: colors.primary }]}
      >
        <SafeAreaView>
          <Animated.View
            style={[
              styles.headerContent,
              {
                opacity: headerFadeAnim,
                transform: [{ translateY: headerTranslateY }],
              },
            ]}
          >
            {/* App Branding */}
            <View style={styles.branding}>
              <Image
                source={require('../../../assets/img/logo.jpg')}
                style={styles.logoImage}
                resizeMode="contain"
              />
              <Text style={styles.brandText}>{variables.APP.app_name}</Text>
              <TouchableOpacity style={styles.notificationButton} onPress={() => navigation.navigate('Notifications')}>
                <Icon name="notifications-outline" size={20} color="#000000" />
              </TouchableOpacity>
            </View>

            {/* Welcome Message */}
            <View style={styles.welcomeSection}>
              <Text style={styles.welcomeText}>Welcome, {userName} 👋</Text>
            </View>
          </Animated.View>
        </SafeAreaView>
      </View>

      {/* Main Content */}
      <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
        {targets.length === 0 ? (
          <EmptyState
            title="No Tracked Accounts"
            subtitle="Start tracking Instagram or TikTok accounts to monitor followers and engagement"
            actionLabel="Add Account"
            icon="people-outline"
            onAction={() => rootNavigation.navigate('AddUser')}
          />
        ) : (
          <>
            {/* My Accounts Header */}
            <View style={styles.accountsHeader}>
              <Text style={[styles.accountsTitle, { color: colors.text }]}>
                My Accounts
              </Text>
              <TouchableOpacity
                onPress={() => rootNavigation.navigate('AddUser')}
                style={styles.addButton}
              >
                <Icon name="add" size={16} color={colors.primary} />
                <Text style={[styles.addButtonText, { color: colors.primary }]}>
                  Add Account
                </Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={targets}
              renderItem={renderItem}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={styles.listContent}
              refreshing={refreshing}
              onRefresh={onRefresh}
              showsVerticalScrollIndicator={false}
            />
          </>
        )}
      </View>
    </View>
  );
}

// Account Card Component
const AccountCard = ({
  item,
  index,
  animationValue,
  onPress,
}: {
  item: Target;
  index: number;
  animationValue: Animated.Value;
  onPress: () => void;
}) => {
  const { colors, spacing, radius, typography, shadows } = useAppTheme();

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'instagram':
        return 'logo-instagram';
      case 'tiktok':
        return 'musical-notes';
      default:
        return 'person-circle';
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'instagram':
        return '#E4405F';
      case 'tiktok':
        return '#000000';
      default:
        return colors.primary;
    }
  };

  const getTimeAgo = (lastChecked: string) => {
    if (!lastChecked) return 'Never';
    const now = new Date();
    const checked = new Date(lastChecked);
    const diffMs = now.getTime() - checked.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  const platformColor = getPlatformColor(item.platform);
  const platformIcon = getPlatformIcon(item.platform);

  return (
    <Animated.View
      style={[
        styles.accountCard,
        {
          opacity: animationValue,
          transform: [
            {
              translateY: animationValue.interpolate({
                inputRange: [0, 1],
                outputRange: [50, 0],
              }),
            },
            {
              scale: animationValue.interpolate({
                inputRange: [0, 1],
                outputRange: [0.9, 1],
              }),
            },
          ],
        },
      ]}
    >
      <TouchableOpacity
        style={[styles.cardContent, { backgroundColor: colors.surface }]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        {/* Platform Icon and Handle */}
        <View style={styles.cardHeader}>
          <View style={styles.platformSection}>
            <View
              style={[styles.platformIcon, { backgroundColor: platformColor }]}
            >
              <Icon name={platformIcon} size={20} color="#FFFFFF" />
            </View>
            <View style={styles.handleSection}>
              <Text style={[styles.handle, { color: colors.text }]}>
                @{item.username}
              </Text>
              <Text
                style={[styles.lastUpdated, { color: colors.textSecondary }]}
              >
                Last updated {getTimeAgo(item.last_checked || '')}
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.optionsButton}>
            <Icon
              name="ellipsis-vertical"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        {/* Metrics */}
        <View style={styles.metricsContainer}>
          <View style={styles.metricColumn}>
            <Text style={[styles.metricValue, { color: colors.text }]}>
              {item.followers !== undefined
                ? item.followers.toLocaleString()
                : '--'}
            </Text>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
              Followers
            </Text>
            <Text style={[styles.metricChange, { color: '#34C759' }]}>+34</Text>
            <Text
              style={[styles.metricSubLabel, { color: colors.textSecondary }]}
            >
              New Followers
            </Text>
          </View>

          <View style={styles.metricColumn}>
            <Text style={[styles.metricValue, { color: colors.text }]}>
              {item.following !== undefined
                ? item.following.toLocaleString()
                : '--'}
            </Text>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
              Following
            </Text>
            <Text style={[styles.metricChange, { color: '#FF3B30' }]}>12</Text>
            <Text
              style={[styles.metricSubLabel, { color: colors.textSecondary }]}
            >
              Unfollowers
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Header Styles
  headerGradient: {
    paddingTop: 20,
    paddingBottom: 30,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  headerContent: {
    paddingHorizontal: 20,
  },
  branding: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  logoImage: {
    width: 32,
    height: 32,
    borderRadius: 8,
    marginRight: 12,
  },
  brandText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
  },
  welcomeSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  welcomeText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },

  // Sheet container (rounded white top like screenshot)
  sheet: {
    flex: 1,
    marginTop: -16,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  accountsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  accountsTitle: {
    fontSize: 28,
    fontWeight: '800',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 4,
  },
  listContent: {
    paddingBottom: 24,
  },

  // Account Card Styles
  accountCard: {
    marginBottom: 16,
  },
  cardContent: {
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  platformSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  platformIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  handleSection: {
    flex: 1,
  },
  handle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  lastUpdated: {
    fontSize: 14,
    fontWeight: '400',
  },
  optionsButton: {
    padding: 8,
  },

  // Metrics Styles
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricColumn: {
    flex: 1,
    alignItems: 'flex-start',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 2,
  },
  metricLabel: {
    fontSize: 14,
    fontWeight: '400',
    marginBottom: 8,
  },
  metricChange: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  metricSubLabel: {
    fontSize: 12,
    fontWeight: '400',
  },

  // Loading Styles
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingDots: {
    flexDirection: 'row',
    marginTop: 24,
  },
  loadingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 4,
  },
});
