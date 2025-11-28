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
  Dimensions,
  ScrollView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
import { useAppTheme } from '../../theme/ThemeProvider';
import { listTargets, type Target } from '../../api/targets';
import { getUser } from '../../utils/storage.ts';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { MainTabParamList } from '../../navigation/types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import variables from '../../../constants/variables.js';
import { auth } from '../../firebase';
import { syncFirebaseUserToStorage } from '../../utils/storage.ts';
import { formatNumber } from '../../utils/formatNumber';
import {
  testBackgroundFetch,
  debugBackgroundFetch,
  forceBackgroundFetch,
  simulateBackgroundExecution,
} from '../../services/BackgroundFetchService';
import { getUnreadCount } from '../../utils/notificationStorage';
import Purchases from 'react-native-purchases';
import { BlurView } from '@react-native-community/blur';
import { Platform } from 'react-native';

const { width } = Dimensions.get('window');

type TabProps = BottomTabScreenProps<MainTabParamList, 'Home'>;
type RootNav = NativeStackNavigationProp<RootStackParamList>;

export default function HomeScreen({
  navigation,
}: TabProps): React.ReactElement {
  const rootNavigation = navigation as unknown as RootNav;
  const { colors } = useAppTheme();
  const [targets, setTargets] = useState<Target[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userName, setUserName] = useState('User');

  // Animation refs
  const pulseAnim1 = useRef(new Animated.Value(0)).current;
  const pulseAnim2 = useRef(new Animated.Value(0)).current;
  const pulseAnim3 = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const cardAnimations = useRef<Animated.Value[]>([]).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const floatingAnim = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const [unreadCount, setUnreadCount] = useState(0);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [checkingSubscription, setCheckingSubscription] = useState(true);

  const checkSubscriptionStatus = async () => {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      const hasActiveSubscription = //true;
        typeof customerInfo.entitlements.active['pro'] !== 'undefined';
      setIsSubscribed(hasActiveSubscription);
      return hasActiveSubscription;
    } catch (error) {
      console.log('[Home] Error checking subscription:', error);
      setIsSubscribed(false);
      return false;
    } finally {
      setCheckingSubscription(false);
    }
  };
  // Add effect to load unread count
  useFocusEffect(
    React.useCallback(() => {
      checkSubscriptionStatus();
      if (!didInitialFetchRef.current) {
        didInitialFetchRef.current = true;
        loadTargets();
      }
      loadUnreadCount();
    }, [])
  );
  const loadUnreadCount = async () => {
    const count = await getUnreadCount();
    setUnreadCount(count);
  };
  const loadUserData = async () => {
    try {
      await syncFirebaseUserToStorage();
      const user = await getUser();
      if (user?.name) {
        setUserName(user.name);
      } else {
        const firebaseUser = auth().currentUser;
        if (firebaseUser) {
          const displayName =
            firebaseUser.displayName ||
            firebaseUser.email?.split('@')[0] ||
            'User';
          setUserName(displayName);
        }
      }
    } catch (error) {
      console.log('[Home] Error loading user data:', error);
    }
  };

  const loadTargets = async () => {
    try {
      const data = await listTargets();
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

  const didInitialFetchRef = useRef(false);
  useFocusEffect(
    React.useCallback(() => {
      if (!didInitialFetchRef.current) {
        didInitialFetchRef.current = true;
        loadTargets();
      }
    }, [])
  );

  useEffect(() => {
    loadUserData();

    // Floating animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatingAnim, {
          toValue: 1,
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(floatingAnim, {
          toValue: 0,
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Shimmer animation
    Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    if (loading) {
      // Pulse animations
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim1, {
            toValue: 1,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim1, {
            toValue: 0,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.delay(500),
          Animated.timing(pulseAnim2, {
            toValue: 1,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim2, {
            toValue: 0,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.delay(1000),
          Animated.timing(pulseAnim3, {
            toValue: 1,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim3, {
            toValue: 0,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();

      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 3000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.1,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    }

    if (!loading) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }).start();
    }
  }, [loading]);

  useEffect(() => {
    if (!loading && targets.length > 0) {
      targets.forEach((_, index) => {
        if (!cardAnimations[index]) {
          cardAnimations[index] = new Animated.Value(0);
        }

        const animationDelay = index * 100;
        Animated.timing(cardAnimations[index], {
          toValue: 1,
          duration: 500,
          delay: animationDelay,
          useNativeDriver: true,
          easing: Easing.out(Easing.back(1.2)),
        }).start();
      });
    }
  }, [loading, targets.length]);

  const renderItem = ({ item, index }: { item: Target; index: number }) => {
    if (!cardAnimations[index]) {
      cardAnimations[index] = new Animated.Value(0);
    }

    return (
      <AccountCard
        item={item}
        index={index}
        animationValue={cardAnimations[index]}
        isSubscribed={isSubscribed}
        onPress={() =>
          rootNavigation.navigate('UserDetail', {
            userId: item.id.toString(),
            username: item.username,
            platform: item.platform,
            targetData: item,
          })
        }
        onSubscribePress={() => rootNavigation.navigate('Subscription')}
      />
    );
  };

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const pulse1Scale = pulseAnim1.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.5],
  });

  const pulse2Scale = pulseAnim2.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.5],
  });

  const pulse3Scale = pulseAnim3.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.5],
  });

  const floatingTranslateY = floatingAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-10, 10],
  });

  const shimmerTranslateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-width, width],
  });

  // LOADING SCREEN
  if (loading) {
    return (
      <LinearGradient
        colors={['#667eea', '#764ba2', '#f093fb', '#667eea']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.loadingContainer}
      >
        <StatusBar
          barStyle="light-content"
          backgroundColor="transparent"
          translucent
        />

        {/* Animated Background Orbs */}
        <Animated.View
          style={[
            styles.pulseCircle,
            {
              transform: [{ scale: pulse1Scale }],
              opacity: pulseAnim1.interpolate({
                inputRange: [0, 1],
                outputRange: [0.3, 0],
              }),
            },
          ]}
        />
        <Animated.View
          style={[
            styles.pulseCircle,
            styles.pulseCircle2,
            {
              transform: [{ scale: pulse2Scale }],
              opacity: pulseAnim2.interpolate({
                inputRange: [0, 1],
                outputRange: [0.25, 0],
              }),
            },
          ]}
        />
        <Animated.View
          style={[
            styles.pulseCircle,
            styles.pulseCircle3,
            {
              transform: [{ scale: pulse3Scale }],
              opacity: pulseAnim3.interpolate({
                inputRange: [0, 1],
                outputRange: [0.2, 0],
              }),
            },
          ]}
        />

        <View style={styles.loadingContent}>
          <Animated.View
            style={[
              styles.iconContainer,
              {
                transform: [{ rotate: spin }, { scale: scaleAnim }],
              },
            ]}
          >
            <LinearGradient
              colors={['#ffffff', '#f0f0f0', '#ffffff']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.iconGradient}
            >
              <Icon name="analytics" size={60} color="#667eea" />

              {/* Shimmer effect */}
              <Animated.View
                style={[
                  styles.shimmerOverlay,
                  {
                    transform: [{ translateX: shimmerTranslateX }],
                  },
                ]}
              >
                <LinearGradient
                  colors={[
                    'transparent',
                    'rgba(255,255,255,0.6)',
                    'transparent',
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.shimmerGradient}
                />
              </Animated.View>
            </LinearGradient>
          </Animated.View>

          <Text style={styles.loadingTitle}>{variables.APP.app_name}</Text>
          <Text style={styles.loadingSubtitle}>
            ✨ Analyzing your social presence...
          </Text>

          <View style={styles.dotsContainer}>
            <Animated.View
              style={[
                styles.dot,
                {
                  opacity: pulseAnim1.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 0.3],
                  }),
                  transform: [
                    {
                      scale: pulseAnim1.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 1.3],
                      }),
                    },
                  ],
                },
              ]}
            />
            <Animated.View
              style={[
                styles.dot,
                {
                  opacity: pulseAnim2.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 0.3],
                  }),
                  transform: [
                    {
                      scale: pulseAnim2.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 1.3],
                      }),
                    },
                  ],
                },
              ]}
            />
            <Animated.View
              style={[
                styles.dot,
                {
                  opacity: pulseAnim3.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 0.3],
                  }),
                  transform: [
                    {
                      scale: pulseAnim3.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 1.3],
                      }),
                    },
                  ],
                },
              ]}
            />
          </View>
        </View>
      </LinearGradient>
    );
  }

  // Calculate stats
  const totalFollowers = targets.reduce(
    (sum, t) => sum + (t.followers || 0),
    0
  );
  const totalFollowing = targets.reduce(
    (sum, t) => sum + (t.following || 0),
    0
  );
  const avgEngagement =
    targets.length > 0
      ? ((totalFollowers / totalFollowing) * 100).toFixed(1)
      : '0';

  // MAIN SCREEN
  return (
    <LinearGradient
      colors={['#667eea', '#764ba2', '#f093fb', '#4facfe']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.container}
    >
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />

      {/* Floating decorative circles */}
      <Animated.View
        style={[
          styles.decorativeCircle,
          styles.decorativeCircle1,
          { transform: [{ translateY: floatingTranslateY }] },
        ]}
      />
      <Animated.View
        style={[
          styles.decorativeCircle,
          styles.decorativeCircle2,
          {
            transform: [
              {
                translateY: floatingAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [10, -10],
                }),
              },
            ],
          },
        ]}
      />

      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={onRefresh}
          contentContainerStyle={styles.scrollContent}
        >
          <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
            {/* Header Section */}
            <View style={styles.header}>
              <View style={styles.headerTop}>
                <View style={styles.brandingLeft}>
                  <View style={styles.logoContainer}>
                    <Image
                      source={require('../../../assets/img/logo.jpg')}
                      style={styles.logoImage}
                      resizeMode="contain"
                    />
                    <View style={styles.onlineIndicator} />
                  </View>

                  <View style={styles.brandingTextContainer}>
                    <Text style={styles.brandText}>
                      {variables.APP.app_name}
                    </Text>
                    <View style={styles.premiumBadge}>
                      <Icon name="star" size={10} color="#FFD700" />
                      <Text style={styles.premiumText}>PRO</Text>
                    </View>
                  </View>
                  <View style={styles.headerActions}>
                    <TouchableOpacity
                      style={styles.notificationButton}
                      onPress={() => {
                        navigation.navigate('Notifications');
                        loadUnreadCount(); // Refresh count when opened
                      }}
                      activeOpacity={0.8}
                    >
                      <Icon
                        name="notifications-outline"
                        size={22}
                        color="#667eea"
                      />
                      {unreadCount > 0 && (
                        <View style={styles.notificationBadge}>
                          <Text style={styles.notificationBadgeText}>
                            {unreadCount > 99 ? '99+' : unreadCount}
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* <View style={styles.welcomeSection}>
                <Text style={styles.welcomeText}>Hey {userName}! 👋</Text>
                <View style={styles.debugSection}>
                  <Text style={styles.debugTitle}>
                    🧪 Background Fetch Tests
                  </Text>

                  <TouchableOpacity
                    style={styles.debugButton}
                    onPress={async () => {
                      console.log('=== MANUAL TEST STARTED ===');
                      await testBackgroundFetch();
                    }}
                  >
                    <Icon name="play-circle" size={20} color="#ffffff" />
                    <Text style={styles.debugButtonText}>
                      Test Background Fetch
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.debugButton}
                    onPress={async () => {
                      console.log('=== FORCE FETCH STARTED ===');
                      await forceBackgroundFetch();
                    }}
                  >
                    <Icon name="refresh-circle" size={20} color="#ffffff" />
                    <Text style={styles.debugButtonText}>
                      Force Immediate Fetch
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.debugButton}
                    onPress={async () => {
                      console.log('=== SIMULATION STARTED ===');
                      await simulateBackgroundExecution();
                    }}
                  >
                    <Icon name="rocket" size={20} color="#ffffff" />
                    <Text style={styles.debugButtonText}>
                      Simulate Background
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.debugButton}
                    onPress={async () => {
                      console.log('=== DEBUG INFO STARTED ===');
                      await debugBackgroundFetch();
                    }}
                  >
                    <Icon name="bug" size={20} color="#ffffff" />
                    <Text style={styles.debugButtonText}>Full Debug Info</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.welcomeSubtext}>
                  Your accounts are growing! Keep up the great work 🚀
                </Text>
              </View> */}
            </View>

            {/* Main Content */}
            {targets.length === 0 ? (
              <View style={styles.emptyStateContainer}>
                <View style={styles.emptyStateCard}>
                  {/* Animated empty state icon */}
                  <Animated.View
                    style={[
                      styles.emptyIconWrapper,
                      {
                        transform: [{ translateY: floatingTranslateY }],
                      },
                    ]}
                  >
                    <View style={styles.emptyIconGradient}>
                      <Icon name="rocket" size={52} color="#ffffff" />
                    </View>

                    {/* Decorative rings */}
                    <View style={styles.decorativeRing1} />
                    <View style={styles.decorativeRing2} />
                  </Animated.View>

                  <Text style={styles.emptyTitle}>
                    Begin Your Growth Journey
                  </Text>
                  <Text style={styles.emptySubtitle}>
                    Track Instagram & TikTok accounts to unlock powerful
                    insights, monitor growth, and dominate your social media
                    game 🎯
                  </Text>

                  <TouchableOpacity
                    onPress={() => rootNavigation.navigate('AddUser')}
                    activeOpacity={0.85}
                    style={styles.emptyActionWrapper}
                  >
                    <View style={styles.emptyActionButton}>
                      <Icon name="add-circle" size={24} color="#ffffff" />
                      <Text style={styles.emptyActionText}>
                        Add Your First Account
                      </Text>
                      <Icon name="arrow-forward" size={20} color="#ffffff" />
                    </View>
                  </TouchableOpacity>

                  {/* Features Grid */}
                  <View style={styles.featuresGrid}>
                    <View style={styles.featureCard}>
                      <View style={styles.featureIconBox}>
                        <Icon name="analytics" size={20} color="#ffffff" />
                      </View>
                      <Text style={styles.featureTitle}>Analytics</Text>
                      <Text style={styles.featureDescription}>
                        Real-time insights
                      </Text>
                    </View>

                    <View style={styles.featureCard}>
                      <View style={styles.featureIconBox}>
                        <Icon name="trending-up" size={20} color="#ffffff" />
                      </View>
                      <Text style={styles.featureTitle}>Growth Tracking</Text>
                      <Text style={styles.featureDescription}>
                        Monitor progress
                      </Text>
                    </View>

                    <View style={styles.featureCard}>
                      <View style={styles.featureIconBox}>
                        <Icon name="notifications" size={20} color="#ffffff" />
                      </View>
                      <Text style={styles.featureTitle}>Smart Alerts</Text>
                      <Text style={styles.featureDescription}>
                        Stay updated
                      </Text>
                    </View>

                    <View style={styles.featureCard}>
                      <View style={styles.featureIconBox}>
                        <Icon
                          name="shield-checkmark"
                          size={20}
                          color="#ffffff"
                        />
                      </View>
                      <Text style={styles.featureTitle}>Secure</Text>
                      <Text style={styles.featureDescription}>
                        Data protected
                      </Text>
                    </View>
                  </View>

                  {/* Trust indicators */}
                  <View style={styles.trustIndicators}>
                    <View style={styles.trustItem}>
                      <Icon name="checkmark-circle" size={18} color="#4ade80" />
                      <Text style={styles.trustText}>100% Secure</Text>
                    </View>
                    <View style={styles.trustItem}>
                      <Icon name="checkmark-circle" size={18} color="#4ade80" />
                      <Text style={styles.trustText}>Real-time Updates</Text>
                    </View>
                    <View style={styles.trustItem}>
                      <Icon name="checkmark-circle" size={18} color="#4ade80" />
                      <Text style={styles.trustText}>Free to Start</Text>
                    </View>
                  </View>
                </View>
              </View>
            ) : (
              <>
                {/* Stats Dashboard */}
                <View style={styles.statsSection}>
                  <View style={styles.statsSectionHeader}>
                    <View>
                      <Text style={styles.statsSectionTitle}>
                        Performance Overview
                      </Text>
                      <Text style={styles.statsSectionSubtitle}>
                        Your growth at a glance
                      </Text>
                    </View>
                  </View>

                  {/* Stats Cards */}
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.statsCarousel}
                  >
                    <View style={styles.statCard}>
                      <View style={styles.statCardContent}>
                        <View style={styles.statCardHeader}>
                          <View style={styles.statIconBox}>
                            <Icon name="people" size={24} color="#ffffff" />
                          </View>
                          {/* <View style={styles.statBadge}>
                            <Icon
                              name="trending-up"
                              size={14}
                              color="#4ade80"
                            />
                            <Text style={styles.statBadgeText}>+12.5%</Text>
                          </View> */}
                        </View>

                        <Text style={styles.statNumber}>
                          {formatNumber(totalFollowers)}
                        </Text>
                        <Text style={styles.statTitle}>Total Followers</Text>

                        {/* Mini graph */}
                        <View style={styles.miniGraph}>
                          <View style={[styles.graphBar, { height: 30 }]} />
                          <View style={[styles.graphBar, { height: 45 }]} />
                          <View style={[styles.graphBar, { height: 35 }]} />
                          <View style={[styles.graphBar, { height: 55 }]} />
                          <View style={[styles.graphBar, { height: 65 }]} />
                        </View>

                        <View style={styles.statFooter}>
                          <Icon
                            name="calendar-outline"
                            size={12}
                            color="rgba(255,255,255,0.8)"
                          />
                          <Text style={styles.statFooterText}>
                            Last 30 days
                          </Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.statCard}>
                      <View style={styles.statCardContent}>
                        <View style={styles.statCardHeader}>
                          <View style={styles.statIconBox}>
                            <Icon name="heart" size={24} color="#ffffff" />
                          </View>
                          <View style={styles.statBadge}>
                            <Icon
                              name="checkmark-circle"
                              size={14}
                              color="#4ade80"
                            />
                            <Text style={styles.statBadgeText}>Active</Text>
                          </View>
                        </View>

                        <Text style={styles.statNumber}>{targets.length}</Text>
                        <Text style={styles.statTitle}>
                          Active {targets.length === 1 ? 'Account' : 'Accounts'}
                        </Text>

                        {/* Progress circles */}
                        <View style={styles.progressCircles}>
                          {targets.slice(0, 3).map((target, idx) => (
                            <View key={idx} style={styles.progressCircle}>
                              <View style={styles.progressCircleInner}>
                                <Icon
                                  name={
                                    target.platform === 'instagram'
                                      ? 'logo-instagram'
                                      : 'musical-notes'
                                  }
                                  size={12}
                                  color="#667eea"
                                />
                              </View>
                            </View>
                          ))}
                          {targets.length > 3 && (
                            <View style={styles.progressCircle}>
                              <View style={styles.progressCircleMore}>
                                <Text style={styles.progressCircleMoreText}>
                                  +{targets.length - 3}
                                </Text>
                              </View>
                            </View>
                          )}
                        </View>

                        <View style={styles.statFooter}>
                          <Icon
                            name="sync-outline"
                            size={12}
                            color="rgba(255,255,255,0.8)"
                          />
                          <Text style={styles.statFooterText}>All synced</Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.statCard}>
                      <View style={styles.statCardContent}>
                        <View style={styles.statCardHeader}>
                          <View style={styles.statIconBox}>
                            <Icon name="flash" size={24} color="#ffffff" />
                          </View>
                          <View style={styles.statBadge}>
                            <Icon name="arrow-up" size={14} color="#4ade80" />
                            <Text style={styles.statBadgeText}>
                              +{formatNumber(Number(avgEngagement))}%
                            </Text>
                          </View>
                        </View>

                        <Text style={styles.statNumber}>
                          {formatNumber(Number(avgEngagement))}%
                        </Text>
                        <Text style={styles.statTitle}>Engagement Rate</Text>

                        {/* Circular progress */}
                        <View style={styles.circularProgress}>
                          <View style={styles.progressRing}>
                            <Text style={styles.progressPercentage}>
                              {formatNumber(Number(avgEngagement))}%
                            </Text>
                          </View>
                        </View>

                        <View style={styles.statFooter}>
                          <Icon
                            name="trophy-outline"
                            size={12}
                            color="rgba(255,255,255,0.8)"
                          />
                          <Text style={styles.statFooterText}>
                            Top performer
                          </Text>
                        </View>
                      </View>
                    </View>
                  </ScrollView>

                  {/* Following Insights */}
                  <View style={styles.followingInsightCard}>
                    <View style={styles.followingCardContent}>
                      <View style={styles.followingCardLeft}>
                        <View style={styles.followingIconBox}>
                          <Icon name="person-add" size={22} color="#ffffff" />
                        </View>
                        <View>
                          <Text style={styles.followingNumber}>
                            {formatNumber(Number(totalFollowing))}
                          </Text>
                          <Text style={styles.followingLabel}>
                            Total Following
                          </Text>
                        </View>
                      </View>
                      <View style={styles.followingCardRight}>
                        <View style={styles.ratioBox}>
                          <Icon name="flash" size={18} color="#ffffff" />
                          <View>
                            <Text style={styles.ratioNumber}>
                              {totalFollowers && totalFollowing
                                ? formatNumber(
                                    Number(
                                      (totalFollowers / totalFollowing).toFixed(
                                        2
                                      )
                                    )
                                  )
                                : '0'}
                            </Text>
                            <Text style={styles.ratioLabel}>F/F Ratio</Text>
                          </View>
                        </View>
                        {/* <Icon
                          name="chevron-forward"
                          size={20}
                          color="rgba(255,255,255,0.7)"
                        /> */}
                      </View>
                    </View>
                  </View>
                </View>

                {/* Accounts Section */}
                <View style={styles.accountsSection}>
                  <View style={styles.accountsSectionHeader}>
                    <View>
                      <Text style={styles.accountsSectionTitle}>
                        My Accounts
                      </Text>
                      <Text style={styles.accountsSectionSubtitle}>
                        {targets.length} tracked • Growing together 📈
                      </Text>
                    </View>

                    <TouchableOpacity
                      onPress={() => rootNavigation.navigate('AddUser')}
                      activeOpacity={0.85}
                      style={styles.modernAddButton}
                    >
                      <View style={styles.addButtonContent}>
                        <Icon name="add-circle" size={22} color="#FFFFFF" />
                        <Text style={styles.modernAddButtonText}>Add</Text>
                      </View>
                    </TouchableOpacity>
                  </View>

                  <FlatList
                    data={targets}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.listContent}
                    scrollEnabled={false}
                    showsVerticalScrollIndicator={false}
                  />
                </View>

                {/* Insights Banner */}
                {/* <View style={styles.insightsBanner}>
                  <View style={styles.insightsBannerContent}>
                    <View style={styles.insightsBannerIcon}>
                      <Icon name="bulb" size={28} color="#ffffff" />
                    </View>
                    <View style={styles.insightsBannerText}>
                      <Text style={styles.insightsBannerTitle}>Pro Tip</Text>
                      <Text style={styles.insightsBannerSubtitle}>
                        Post between 6-9 PM for maximum engagement
                      </Text>
                    </View>
                    <Icon
                      name="arrow-forward-circle"
                      size={32}
                      color="rgba(255,255,255,0.8)"
                    />
                  </View>
                </View> */}
              </>
            )}
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

// Account Card Component

// ... rest of imports

const AccountCard = ({
  item,
  index,
  animationValue,
  onPress,
  isSubscribed,
  onSubscribePress,
}: {
  item: Target;
  index: number;
  animationValue: Animated.Value;
  onPress: () => void;
  isSubscribed: boolean;
  onSubscribePress: () => void;
}) => {
  const { colors } = useAppTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;

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

  const getPlatformGradient = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'instagram':
        return [
          '#405DE6',
          '#5B51D8',
          '#833AB4',
          '#C13584',
          '#E1306C',
          '#FD1D1D',
        ];
      case 'tiktok':
        return ['#000000', '#00f2ea', '#ff0050'];
      default:
        return ['#667eea', '#764ba2'];
    }
  };

  const platformGradient = getPlatformGradient(item.platform);
  const platformIcon = getPlatformIcon(item.platform);

  const ratio =
    item.followers && item.following
      ? formatNumber(Number((item.followers / item.following).toFixed(2)))
      : '0';

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      useNativeDriver: true,
    }).start();
  };

  const handleCardPress = () => {
    if (!isSubscribed) {
      onSubscribePress();
    } else {
      onPress();
    }
  };

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
                outputRange: [40, 0],
              }),
            },
            {
              scale: Animated.multiply(
                animationValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.9, 1],
                }),
                scaleAnim
              ),
            },
          ],
        },
      ]}
    >
      <TouchableOpacity
        style={styles.cardContainer}
        onPress={handleCardPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        <View style={styles.cardMainContent}>
          {/* Username Section - Always Visible */}
          <View style={styles.cardTopRow}>
            <View style={styles.accountAvatarSection}>
              <LinearGradient
                colors={platformGradient}
                style={styles.platformIconLarge}
              >
                <Icon name={platformIcon} size={32} color="#FFFFFF" />
              </LinearGradient>

              <View style={styles.accountTextInfo}>
                <View style={styles.usernameRow}>
                  <Text style={styles.username}>@{item.username}</Text>
                  <Icon name="checkmark-circle" size={18} color="#ffffff" />
                </View>
                <Text style={styles.accountType}>
                  {item.platform === 'instagram'
                    ? 'Creator Account'
                    : 'Content Creator'}
                </Text>
              </View>
            </View>
          </View>

          {/* Metrics Grid - With Blur for Non-Subscribers */}
          <View style={styles.metricsContainer}>
            {/* Actual Metrics (will be blurred) */}
            <View style={styles.metricsGrid}>
              <View style={styles.metricBox}>
                <View style={styles.metricIconBox}>
                  <Icon name="people" size={18} color="#ffffff" />
                </View>
                <Text style={styles.metricValue}>
                  {formatNumber(item.followers)}
                </Text>
                <Text style={styles.metricLabel}>Followers</Text>
              </View>

              <View style={styles.metricDivider} />

              <View style={styles.metricBox}>
                <View style={styles.metricIconBox}>
                  <Icon name="person-add" size={18} color="#ffffff" />
                </View>
                <Text style={styles.metricValue}>
                  {formatNumber(item.following)}
                </Text>
                <Text style={styles.metricLabel}>Following</Text>
              </View>

              <View style={styles.metricDivider} />

              <View style={styles.metricBox}>
                <View style={styles.metricIconBox}>
                  <Icon name="flash" size={18} color="#ffffff" />
                </View>
                <Text style={styles.metricValue}>{ratio}</Text>
                <Text style={styles.metricLabel}>Ratio</Text>
              </View>
            </View>

            {/* Blur Overlay for Non-Subscribers */}
            {!isSubscribed && (
              <>
                {Platform.OS === 'ios' ? (
                  <BlurView
                    style={styles.absoluteBlur}
                    blurType="light"
                    blurAmount={10}
                    reducedTransparencyFallbackColor="rgba(102, 126, 234, 0.8)"
                  >
                    <View style={styles.blurContent}>
                      <Icon name="lock-closed" size={32} color="#ffffff" />
                      <Text style={styles.blurTitle}>Premium Feature</Text>
                      <Text style={styles.blurSubtitle}>
                        Subscribe to view metrics
                      </Text>
                      <TouchableOpacity
                        style={styles.unlockButton}
                        onPress={onSubscribePress}
                      >
                        <Text style={styles.unlockButtonText}>Unlock Now</Text>
                        <Icon name="arrow-forward" size={16} color="#ffffff" />
                      </TouchableOpacity>
                    </View>
                  </BlurView>
                ) : (
                  <View style={styles.androidBlurOverlay}>
                    <View style={styles.blurContent}>
                      <Icon name="lock-closed" size={32} color="#ffffff" />
                      <Text style={styles.blurTitle}>Premium Feature</Text>
                      <Text style={styles.blurSubtitle}>
                        Subscribe to view metrics
                      </Text>
                      <TouchableOpacity
                        style={styles.unlockButton}
                        onPress={onSubscribePress}
                      >
                        <Text style={styles.unlockButtonText}>Unlock Now</Text>
                        <Icon name="arrow-forward" size={16} color="#ffffff" />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </>
            )}
          </View>

          {/* Action Footer */}
          <View style={styles.cardFooter}>
            <View style={styles.lastUpdateInfo}>
              <Icon
                name="time-outline"
                size={14}
                color="rgba(255,255,255,0.8)"
              />
              <Text style={styles.lastUpdateText}>
                {isSubscribed ? '' : 'Subscribe to track'}
              </Text>
            </View>

            <View >
              <View style={styles.viewDetailsButton}>
                <Text style={styles.viewDetailsText}>
                  {isSubscribed ? 'View Details' : 'Subscribe'}
                </Text>
                <Icon name="arrow-forward" size={16} color="#ffffff" />
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  // Loading Screen
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  pulseCircle: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#ffffff',
  },
  pulseCircle2: {
    width: 300,
    height: 300,
    borderRadius: 150,
  },
  pulseCircle3: {
    width: 380,
    height: 380,
    borderRadius: 190,
  },
  loadingContent: {
    alignItems: 'center',
    zIndex: 10,
  },
  iconContainer: {
    marginBottom: 40,
    position: 'relative',
  },
  iconGradient: {
    width: 140,
    height: 140,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.3,
    shadowRadius: 32,
    elevation: 16,
    overflow: 'hidden',
  },
  shimmerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  shimmerGradient: {
    flex: 1,
    width: 200,
  },
  loadingTitle: {
    fontSize: 42,
    fontWeight: '900',
    color: '#ffffff',
    marginBottom: 12,
    letterSpacing: -1,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  loadingSubtitle: {
    fontSize: 16,
    color: '#ffffff',
    opacity: 0.95,
    marginBottom: 48,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ffffff',
    shadowColor: '#ffffff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },

  // Main Container
  container: {
    flex: 1,
    position: 'relative',
  },
  decorativeCircle: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  decorativeCircle1: {
    top: -50,
    right: -50,
  },
  decorativeCircle2: {
    bottom: -100,
    left: -80,
    width: 300,
    height: 300,
    borderRadius: 150,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 30,
  },
  content: {
    flex: 1,
    paddingTop: 20,
  },

  // Header
  header: {
    paddingHorizontal: 24,
    paddingTop: 30,
    paddingBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  brandingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 16,
  },
  logoContainer: {
    width: 50,
    height: 50,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    borderWidth: 2.5,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    position: 'relative',
  },
  logoImage: {
    width: 36,
    height: 36,
    borderRadius: 10,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#4ade80',
    borderWidth: 2.5,
    borderColor: '#ffffff',
  },
  brandingTextContainer: {
    flex: 1,
  },
  brandText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  premiumText: {
    color: '#FFD700',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 10,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  welcomeSection: {
    marginBottom: 20,
  },
  welcomeText: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '900',
    marginBottom: 8,
    letterSpacing: -1,
  },
  welcomeSubtext: {
    color: '#FFFFFF',
    fontSize: 15,
    opacity: 0.9,
    fontWeight: '500',
    lineHeight: 22,
  },
  quickStatsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  quickStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  quickStatText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  quickStatDivider: {
    width: 1,
    height: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 16,
  },

  // Empty State
  emptyStateContainer: {
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  emptyStateCard: {
    borderRadius: 32,
    padding: 40,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  emptyIconWrapper: {
    marginBottom: 32,
    position: 'relative',
  },
  emptyIconGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  decorativeRing1: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    top: -10,
    left: -10,
  },
  decorativeRing2: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    top: -20,
    left: -20,
  },
  emptyTitle: {
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 14,
    letterSpacing: -0.7,
    color: '#ffffff',
  },
  emptySubtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 36,
    paddingHorizontal: 8,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  emptyActionWrapper: {
    width: '100%',
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 36,
  },
  emptyActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    width: '100%',
    // gap: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 20,
  },
  emptyActionText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
    // letterSpacing: 0.3,
  },
  featuresGrid: {
    // flexDirection: 'row',
    // flexWrap: 'wrap',
    gap: 12,
    // width: '100%',
    marginBottom: 32,
    justifyContent: 'space-between',
  },
  featureCard: {
    width: width / 1.4,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  featureIconBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4,
    letterSpacing: -0.2,
    color: '#ffffff',
  },
  featureDescription: {
    fontSize: 11,
    textAlign: 'center',
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  trustIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 16,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  trustText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
  },

  // Stats Section
  statsSection: {
    paddingHorizontal: 24,
    marginBottom: 28,
    marginTop: 20,
  },
  statsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  statsSectionTitle: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
    color: '#ffffff',
  },
  statsSectionSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  statsCarousel: {
    gap: 14,
    paddingRight: 24,
  },
  statCard: {
    width: width * 0.7,
    borderRadius: 24,
    overflow: 'hidden',
  },
  statCardContent: {
    padding: 22,
    minHeight: 200,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 24,
  },
  statCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    gap: 5,
  },
  statBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#ffffff',
  },
  statNumber: {
    fontSize: 36,
    fontWeight: '900',
    color: '#ffffff',
    marginBottom: 6,
    letterSpacing: -1,
  },
  statTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.95)',
    marginBottom: 16,
  },
  miniGraph: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    marginBottom: 16,
  },
  graphBar: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
  },
  progressCircles: {
    flexDirection: 'row',
    gap: -8,
    marginBottom: 16,
  },
  progressCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2.5,
    borderColor: '#ffffff',
  },
  progressCircleInner: {
    flex: 1,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressCircleMore: {
    flex: 1,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressCircleMoreText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#ffffff',
  },
  circularProgress: {
    alignItems: 'center',
    marginBottom: 16,
  },
  progressRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 6,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressPercentage: {
    fontSize: 18,
    fontWeight: '900',
    color: '#ffffff',
  },
  statFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statFooterText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
  },

  // Following Card
  followingInsightCard: {
    marginTop: 14,
    borderRadius: 20,
    overflow: 'hidden',
  },
  followingCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
  },
  followingCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  followingIconBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  followingNumber: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
    color: '#ffffff',
  },
  followingLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  followingCardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  ratioBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  ratioNumber: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.3,
    color: '#ffffff',
  },
  ratioLabel: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
    color: 'rgba(255, 255, 255, 0.9)',
  },

  // Accounts Section
  accountsSection: {
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  accountsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  accountsSectionTitle: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
    color: '#ffffff',
  },
  accountsSectionSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  modernAddButton: {
    borderRadius: 28,
    overflow: 'hidden',
  },
  addButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 28,
  },
  modernAddButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  listContent: {
    paddingBottom: 20,
  },

  // Account Card
  accountCard: {
    marginBottom: 16,
  },
  cardContainer: {
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  cardMainContent: {
    padding: 20,
  },
  cardTopRow: {
    marginBottom: 20,
  },
  accountAvatarSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  platformIconLarge: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  accountTextInfo: {
    flex: 1,
  },
  usernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  username: {
    fontSize: 19,
    fontWeight: '900',
    letterSpacing: -0.3,
    color: '#ffffff',
  },
  accountType: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
  },

  metricBox: {
    flex: 1,
    alignItems: 'center',
  },
  metricIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 4,
    letterSpacing: -0.3,
    color: '#ffffff',
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 8,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  metricBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: 'rgba(74, 222, 128, 0.3)',
  },
  metricBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#ffffff',
  },
  metricDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    marginHorizontal: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.15)',
  },
  lastUpdateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  lastUpdateText: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  viewDetailsText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },

  // Insights Banner
  insightsBanner: {
    marginHorizontal: 24,
    marginBottom: 32,
    borderRadius: 20,
    overflow: 'hidden',
  },
  insightsBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
  },
  insightsBannerIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  insightsBannerText: {
    flex: 1,
  },
  insightsBannerTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#ffffff',
    marginBottom: 4,
  },
  insightsBannerSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 18,
  },
  debugSection: {
    marginHorizontal: 24,
    marginTop: 20,
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  debugTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 16,
  },
  debugButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  debugButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  notificationBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#ffffff',
  },
  blurOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(102, 126, 234, 0.95)',
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    padding: 20,
  },

  blurredMetric: {
    opacity: 0.5,
  },
  metricsContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  absoluteBlur: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 18,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(102, 126, 234, 0.3)', // Subtle tint
  },
  androidBlurOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(102, 126, 234, 0.92)', // Fallback for Android
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  blurContent: {
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
  },
  blurTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
    marginTop: 8,
  },
  blurSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.95)',
    textAlign: 'center',
  },
  unlockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  unlockButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
});
