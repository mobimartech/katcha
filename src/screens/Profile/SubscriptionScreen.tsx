import React, { useEffect, useState, useRef } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Platform,
  Linking,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import Purchases, { PurchasesPackage } from 'react-native-purchases';
import LinearGradient from 'react-native-linear-gradient';
import { useAppTheme } from '../../theme/ThemeProvider';
import variables from '../../../constants/variables.js';
import { setIsLoggedIn } from '../../utils/auth.ts';
import { registerForPushNotifications } from '../../notifications/messaging';
import {
  initializeBackgroundFetch,
  testBackgroundFetch,
} from '../../services/BackgroundFetchService';
import { updateSubscription } from '../../api/targets.ts';

// ============================================================================
// RESPONSIVE SCALING UTILITIES
// ============================================================================
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const BASE_WIDTH = 375;
const BASE_HEIGHT = 812;

const scaleWidth = (size: number): number => (SCREEN_WIDTH / BASE_WIDTH) * size;
const scaleHeight = (size: number): number =>
  (SCREEN_HEIGHT / BASE_HEIGHT) * size;
const moderateScale = (size: number, factor: number = 0.5): number =>
  size + (scaleWidth(size) - size) * factor;

const isSmallDevice = SCREEN_WIDTH < 375;
const isTablet = SCREEN_WIDTH >= 768;
const isShortDevice = SCREEN_HEIGHT < 700;

const getFontSize = (small: number, medium: number, large: number): number => {
  if (isTablet) return large;
  if (isSmallDevice) return small;
  return medium;
};

// ============================================================================
// DEFAULT PACKAGES (FALLBACK)
// ============================================================================
const DEFAULT_PACKAGES = {
  weekly: {
    price: '$4.99',
    description: 'Billed weekly',
  },
  yearly: {
    price: '$29.99',
    description: 'Billed yearly',
  },
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function SubscriptionScreen(): React.ReactElement {
  const { colors } = useAppTheme();
  const navigation = useNavigation();

  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<'weekly' | 'yearly'>(
    'weekly'
  );
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [useDefaultPackages, setUseDefaultPackages] = useState(false);
  const [showCloseButton, setShowCloseButton] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const closeButtonOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadOfferings();
    checkPremiumStatus();
    startAnimations();

    const timer = setTimeout(() => {
      setShowCloseButton(true);
      Animated.timing(closeButtonOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  const startAnimations = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const checkPremiumStatus = async () => {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      const premium =
        Platform.OS === 'android'
          ? true
          : typeof customerInfo.entitlements.active['pro'] !== 'undefined';
      setIsPremium(premium);
    } catch (error) {
      console.error('Failed to check premium status:', error);
    }
  };

  const loadOfferings = async () => {
    try {
      setLoadingProducts(true);
      const offerings = await Purchases.getOfferings();

      if (
        offerings.current !== null &&
        offerings.current.availablePackages.length > 0
      ) {
        const availablePackages = offerings.current.availablePackages;
        setPackages(availablePackages);
        setUseDefaultPackages(false);
        console.log('✅ Loaded packages from RevenueCat:', availablePackages);

        const hasWeekly = availablePackages.some(
          (pkg) => pkg.packageType === Purchases.PACKAGE_TYPE.WEEKLY
        );
        setSelectedPlan(hasWeekly ? 'weekly' : 'yearly');
      } else {
        console.warn(
          '⚠️ No offerings available from RevenueCat, using default packages'
        );
        setUseDefaultPackages(true);
      }
    } catch (error) {
      console.error('❌ Failed to load offerings from RevenueCat:', error);
      setUseDefaultPackages(true);
    } finally {
      setLoadingProducts(false);
    }
  };

  const handlePlanSelection = (plan: 'weekly' | 'yearly') => {
    setSelectedPlan(plan);

    if (useDefaultPackages) {
      Alert.alert(
        'Service Unavailable',
        'Subscription services are currently unavailable. Please check your internet connection and try again.',
        [
          { text: 'Retry', onPress: () => loadOfferings() },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
      return;
    }
  };

  const getPackageByType = (
    type: 'weekly' | 'yearly'
  ): PurchasesPackage | undefined => {
    if (useDefaultPackages) return undefined;

    const packageType =
      type === 'weekly'
        ? Purchases.PACKAGE_TYPE.WEEKLY
        : Purchases.PACKAGE_TYPE.ANNUAL;

    return packages.find((pkg) => pkg.packageType === packageType);
  };

  const handlePurchase = async () => {
    if (useDefaultPackages) {
      Alert.alert(
        'Service Unavailable',
        'Subscription services are currently unavailable. Please check your internet connection and try again.',
        [
          { text: 'Retry', onPress: () => loadOfferings() },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
      return;
    }

    try {
      setLoading(true);

      const selectedPackage = getPackageByType(selectedPlan);

      if (!selectedPackage) {
        Alert.alert('Error', 'Selected package not available');
        return;
      }

      const { customerInfo } = await Purchases.purchasePackage(selectedPackage);

      if (typeof customerInfo.entitlements.active['pro'] !== 'undefined') {
        setIsPremium(true);
        await updateSubscription(selectedPlan);
        await setIsLoggedIn(true);
        await initializeBackgroundFetch();
        void registerForPushNotifications();
        await testBackgroundFetch();
        navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
      }
    } catch (error: any) {
      console.error('❌ Purchase failed:', error);

      if (!error.userCancelled) {
        Alert.alert(
          'Purchase Failed',
          'Unable to complete purchase. Please try again.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    if (useDefaultPackages) {
      Alert.alert(
        'Service Unavailable',
        'Subscription services are currently unavailable. Please check your internet connection and try again.',
        [
          { text: 'Retry', onPress: () => loadOfferings() },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
      return;
    }

    try {
      setRestoring(true);

      const customerInfo = await Purchases.restorePurchases();
      const premium =
        typeof customerInfo.entitlements.active['pro'] !== 'undefined';

      if (premium) {
        setIsPremium(true);
        Alert.alert('Restored! 🎉', 'Your subscription has been restored.');
        await updateSubscription(selectedPlan);
        await setIsLoggedIn(true);
        await initializeBackgroundFetch();
        void registerForPushNotifications();
        await testBackgroundFetch();
        navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
      } else {
        Alert.alert('No Purchases Found', 'No previous purchases to restore.');
      }
    } catch (error) {
      console.error('❌ Restore failed:', error);
      Alert.alert('Restore Failed', 'Unable to restore purchases.');
    } finally {
      setRestoring(false);
    }
  };

  const handlePrivacyPolicy = () => {
    const privacyUrl = variables.APP.PRIVACY_URL;
    Linking.openURL(privacyUrl).catch((err) =>
      console.error('Failed to open privacy policy:', err)
    );
  };

  const handleTermsOfService = () => {
    const termsUrl = variables.APP.TERMS_URL;
    Linking.openURL(termsUrl).catch((err) =>
      console.error('Failed to open terms:', err)
    );
  };

  const weeklyPackage = getPackageByType('weekly');
  const yearlyPackage = getPackageByType('yearly');

  const hasFreeTrial = (pkg: PurchasesPackage | undefined): boolean => {
    if (!pkg) return false;
    try {
      const introPrice = pkg.product.introPrice;
      return introPrice !== null && introPrice.price === 0;
    } catch (error) {
      return false;
    }
  };

  const getFreeTrialDays = (pkg: PurchasesPackage | undefined): number => {
    if (!pkg || !hasFreeTrial(pkg)) return 0;

    try {
      const introPrice = pkg.product.introPrice;
      if (!introPrice) return 0;

      const period = introPrice.period || '';
      const periodUnit = introPrice.periodUnit || '';
      const periodNumberOfUnits = introPrice.periodNumberOfUnits || 1;

      if (period.startsWith('P')) {
        if (period.includes('D')) {
          const days = parseInt(period.replace('P', '').replace('D', ''));
          return isNaN(days) ? 0 : days;
        } else if (period.includes('W')) {
          const weeks = parseInt(period.replace('P', '').replace('W', ''));
          return isNaN(weeks) ? 0 : weeks * 7;
        } else if (period.includes('M')) {
          const months = parseInt(period.replace('P', '').replace('M', ''));
          return isNaN(months) ? 0 : months * 30;
        }
      }

      if (periodUnit === 'DAY') {
        return periodNumberOfUnits;
      } else if (periodUnit === 'WEEK') {
        return periodNumberOfUnits * 7;
      } else if (periodUnit === 'MONTH') {
        return periodNumberOfUnits * 30;
      } else if (periodUnit === 'YEAR') {
        return periodNumberOfUnits * 365;
      }

      return 0;
    } catch (error) {
      console.error('Error getting free trial days:', error);
      return 0;
    }
  };

  const getWeeklyPrice = () => {
    return useDefaultPackages
      ? DEFAULT_PACKAGES.weekly.price
      : weeklyPackage?.product.priceString || DEFAULT_PACKAGES.weekly.price;
  };

  const getWeeklyPeriod = () => {
    if (useDefaultPackages) return 'week';
    if (!weeklyPackage) return 'week';

    const subscriptionPeriod = weeklyPackage.product.subscriptionPeriod;
    if (subscriptionPeriod === 'P1W') return 'week';
    if (subscriptionPeriod === 'P1M') return 'month';
    if (subscriptionPeriod === 'P1Y') return 'year';
    return 'week';
  };

  const getYearlyPrice = () => {
    return useDefaultPackages
      ? DEFAULT_PACKAGES.yearly.price
      : yearlyPackage?.product.priceString || DEFAULT_PACKAGES.yearly.price;
  };

  const getYearlyPeriod = () => {
    if (useDefaultPackages) return 'year';
    if (!yearlyPackage) return 'year';

    const subscriptionPeriod = yearlyPackage.product.subscriptionPeriod;
    if (subscriptionPeriod === 'P1W') return 'week';
    if (subscriptionPeriod === 'P1M') return 'month';
    if (subscriptionPeriod === 'P1Y') return 'year';
    return 'year';
  };

  const calculateDiscount = () => {
    if (useDefaultPackages || !weeklyPackage || !yearlyPackage) {
      return '50';
    }

    try {
      const weeklyPrice = weeklyPackage.product.price;
      const yearlyPrice = yearlyPackage.product.price;
      const weeklyYearlyCost = weeklyPrice * 52;
      const savings =
        ((weeklyYearlyCost - yearlyPrice) / weeklyYearlyCost) * 100;
      return Math.round(savings).toString();
    } catch (error) {
      return '50';
    }
  };

  const selectedPackage = getPackageByType(selectedPlan);
  const showFreeTrial = !useDefaultPackages && hasFreeTrial(selectedPackage);
  const freeTrialDays = getFreeTrialDays(selectedPackage);
  const packagePrice =
    selectedPlan === 'weekly' ? getWeeklyPrice() : getYearlyPrice();
  const packagePeriod =
    selectedPlan === 'weekly' ? getWeeklyPeriod() : getYearlyPeriod();

  if (loadingProducts) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7A86FF" />
          <Text style={styles.loadingText}>Loading subscriptions...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        <SafeAreaView style={styles.safeArea}>
          <Animated.View
            style={[
              styles.contentWrapper,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}
          >
            {/* Close Button */}
            {showCloseButton && (
              <Animated.View
                style={[styles.closeButton, { opacity: closeButtonOpacity }]}
              >
                <TouchableOpacity
                  onPress={() => {
                    navigation.reset({
                      index: 0,
                      routes: [{ name: 'MainTabs' }],
                    });
                  }}
                  style={styles.closeButtonTouchable}
                >
                  <Icon name="close" size={moderateScale(24)} color="#000" />
                </TouchableOpacity>
              </Animated.View>
            )}

            {/* Logo */}
            <View style={styles.logoContainer}>
              <View style={styles.logoWrapper}>
                <Image
                  source={require('../../../assets/img/logo.jpg')}
                  style={styles.logo}
                  resizeMode="contain"
                />
              </View>
            </View>

            {/* Offline Notice */}
            {/* {useDefaultPackages && (
              <View style={styles.offlineNotice}>
                <Icon
                  name="cloud-offline-outline"
                  size={moderateScale(16)}
                  color="#FF9500"
                />
                <Text style={styles.offlineText}>
                  Preview mode - Connect to purchase
                </Text>
              </View>
            )} */}

            {/* Main Title */}
            <Text style={styles.mainTitle}>Reach Your Goals Faster</Text>

            {/* Review Card - REDUCED HEIGHT */}
            <View style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <Text style={styles.reviewTitle}>Love this app!</Text>
                <Text style={styles.reviewAuthor}>Sarah M.</Text>
              </View>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Text key={star} style={styles.starIcon}>
                    ⭐
                  </Text>
                ))}
              </View>
              <Text style={styles.reviewText} numberOfLines={3}>
                I've been using Katcha for tracking instagram growth, and I'm
                impressed with the accuracy and features. The interface is clean
                and intuitive.
              </Text>
            </View>

            {/* Pricing Plans */}
            <View style={styles.plansContainer}>
              {/* Weekly Plan */}
              <TouchableOpacity
                style={[
                  styles.planCard,
                  selectedPlan === 'weekly'
                    ? styles.planCardPurple
                    : styles.planCardGray,
                  selectedPlan === 'weekly' && styles.planCardSelected,
                  useDefaultPackages && styles.planCardDisabled,
                ]}
                onPress={() => handlePlanSelection('weekly')}
                activeOpacity={0.8}
                disabled={useDefaultPackages || loading}
              >
                <View style={styles.planContent}>
                  <View>
                    <Text
                      style={
                        selectedPlan === 'weekly'
                          ? styles.planTextWhite
                          : styles.planTextGray
                      }
                    >
                      Billed
                    </Text>
                    <Text
                      style={
                        selectedPlan === 'weekly'
                          ? styles.planPriceWhite
                          : styles.planPriceGray
                      }
                    >
                      {getWeeklyPrice()}
                    </Text>
                  </View>
                  <Text
                    style={
                      selectedPlan === 'weekly'
                        ? styles.planTextWhite
                        : styles.planTextGray
                    }
                  >
                    /{getWeeklyPeriod()}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Yearly Plan */}
              <TouchableOpacity
                style={[
                  styles.planCard,
                  selectedPlan === 'yearly'
                    ? styles.planCardPurple
                    : styles.planCardGray,
                  selectedPlan === 'yearly' && styles.planCardSelected,
                  useDefaultPackages && styles.planCardDisabled,
                ]}
                onPress={() => handlePlanSelection('yearly')}
                activeOpacity={0.8}
                disabled={useDefaultPackages || loading}
              >
                {/* Discount Badge */}
                <View style={styles.yearlyDiscountBadge}>
                  <LinearGradient
                    colors={['#FFD700', '#FFA500']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.discountBadgeGradient}
                  >
                    <Icon
                      name="pricetag"
                      size={moderateScale(14)}
                      color="#5B21B6"
                      style={{ marginRight: 4 }}
                    />
                    <Text style={styles.discountText}>
                      {calculateDiscount()}% OFF
                    </Text>
                  </LinearGradient>
                </View>

                <View style={styles.planContent}>
                  <View>
                    <Text
                      style={
                        selectedPlan === 'yearly'
                          ? styles.planTextWhite
                          : styles.planTextGray
                      }
                    >
                      Billed
                    </Text>
                    <Text
                      style={
                        selectedPlan === 'yearly'
                          ? styles.planPriceWhite
                          : styles.planPriceGray
                      }
                    >
                      {getYearlyPrice()}
                    </Text>
                  </View>
                  <Text
                    style={
                      selectedPlan === 'yearly'
                        ? styles.planTextWhite
                        : styles.planTextGray
                    }
                  >
                    /{getYearlyPeriod()}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Free Trial Notice */}
            {showFreeTrial && freeTrialDays > 0 && (
              <View style={styles.freeTrialContainer}>
                <Icon
                  name="gift-outline"
                  size={moderateScale(20)}
                  color="#7A86FF"
                />
                <Text style={styles.freeTrialText}>
                  Enjoy {freeTrialDays} Day{freeTrialDays > 1 ? 's' : ''} free,
                  then {packagePrice} /{packagePeriod}
                </Text>
              </View>
            )}

            {/* Continue Button */}
            <TouchableOpacity
              onPress={handlePurchase}
              disabled={loading || useDefaultPackages}
              activeOpacity={0.8}
              style={styles.continueButtonWrapper}
            >
              <View
                style={[
                  styles.continueButton,
                  (useDefaultPackages || loading) &&
                    styles.continueButtonDisabled,
                ]}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={styles.continueButtonText}>
                    {showFreeTrial && freeTrialDays > 0
                      ? 'Start Free Trial'
                      : 'Continue'}
                  </Text>
                )}
              </View>
            </TouchableOpacity>

            {/* Disclaimer */}
            <View style={styles.disclaimerContainer}>
              <Text style={styles.disclaimerText}>
                {showFreeTrial && freeTrialDays > 0
                  ? 'After free trial ends, the subscription will commence immediately. You have the option to cancel at any time. Subscriptions will be automatically renewed unless you disable auto-renewal at least 24 hours prior to the end of the current period.'
                  : 'Once you subscribe, the subscription will commence immediately. You have the option to cancel at any time. Subscriptions will be automatically renewed unless you disable auto-renewal at least 24 hours prior to the end of the current period.'}
              </Text>
            </View>

            {/* Footer Links */}
            <View style={styles.footerLinksRow}>
              <TouchableOpacity
                onPress={handlePrivacyPolicy}
                activeOpacity={0.7}
              >
                <Text style={styles.footerLinkText}>Privacy</Text>
              </TouchableOpacity>

              <View style={styles.footerDivider} />

              <TouchableOpacity
                onPress={handleRestore}
                disabled={useDefaultPackages || restoring}
                activeOpacity={0.7}
              >
                {restoring ? (
                  <ActivityIndicator color="#666" size="small" />
                ) : (
                  <Text
                    style={[
                      styles.footerLinkText,
                      useDefaultPackages && styles.footerLinkDisabled,
                    ]}
                  >
                    Restore
                  </Text>
                )}
              </TouchableOpacity>

              <View style={styles.footerDivider} />

              <TouchableOpacity
                onPress={handleTermsOfService}
                activeOpacity={0.7}
              >
                <Text style={styles.footerLinkText}>Terms</Text>
              </TouchableOpacity>
            </View>

            {/* Premium Badge */}
            {isPremium && (
              <View style={styles.premiumBadge}>
                <Icon
                  name="checkmark-circle"
                  size={moderateScale(20)}
                  color="#7A86FF"
                />
                <Text style={styles.premiumBadgeText}>
                  You have Premium Access
                </Text>
              </View>
            )}
          </Animated.View>
        </SafeAreaView>
      </ScrollView>
    </View>
  );
}

// ============================================================================
// RESPONSIVE STYLES - REVIEW CARD HEIGHT REDUCED
// ============================================================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: scaleHeight(40),
  },
  safeArea: {
    flex: 1,
  },
  contentWrapper: {
    paddingHorizontal: scaleWidth(24),
    paddingTop: Platform.OS === 'android' ? scaleHeight(60) : scaleHeight(40),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    color: '#000',
    fontSize: moderateScale(16),
    marginTop: scaleHeight(16),
    fontWeight: '600',
  },
  closeButton: {
    position: 'absolute',
    top: Platform.OS === 'android' ? scaleHeight(20) : scaleHeight(10),
    left: scaleWidth(24),
    zIndex: 999,
  },
  closeButtonTouchable: {
    width: scaleWidth(40),
    height: scaleWidth(40),
    borderRadius: scaleWidth(20),
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: scaleHeight(24), // Reduced from 32
  },
  logoWrapper: {
    width: scaleWidth(80), // Reduced from 100
    height: scaleWidth(80), // Reduced from 100
    borderRadius: scaleWidth(16), // Reduced from 20
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  logo: {
    width: '100%',
    height: '100%',
    borderRadius: scaleWidth(16),
  },
  offlineNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: scaleHeight(10),
    paddingHorizontal: scaleWidth(16),
    backgroundColor: '#FFF3E0',
    borderRadius: moderateScale(12),
    marginBottom: scaleHeight(16),
  },
  offlineText: {
    fontSize: getFontSize(11, 12, 13),
    color: '#FF9500',
    marginLeft: scaleWidth(8),
    fontWeight: '600',
  },
  mainTitle: {
    fontSize: getFontSize(20, 22, 28), // Reduced from 22, 25, 32
    fontWeight: '700',
    color: '#000',
    textAlign: 'center',
    marginBottom: scaleHeight(20), // Reduced from 32
    lineHeight: getFontSize(28, 30, 38), // Reduced
    paddingHorizontal: scaleWidth(16),
  },

  // ============================================================================
  // REVIEW CARD - SIGNIFICANTLY REDUCED HEIGHT
  // ============================================================================
  reviewCard: {
    backgroundColor: '#E8D4FEFF',
    borderRadius: moderateScale(12), // Reduced from 16
    padding: scaleWidth(12), // Reduced from 20
    marginBottom: scaleHeight(20), // Reduced from 32
    width: '100%',
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center', // Changed from flex-start
    marginBottom: scaleHeight(4), // Reduced from 8
  },
  reviewTitle: {
    fontSize: getFontSize(14, 15, 18), // Reduced from 16, 18, 20
    fontWeight: '700',
    color: '#000',
  },
  reviewAuthor: {
    fontSize: getFontSize(11, 12, 13), // Reduced from 13, 14, 15
    color: '#666',
  },
  starsRow: {
    flexDirection: 'row',
    gap: scaleWidth(2), // Reduced from 4
    marginBottom: scaleHeight(6), // Reduced from 12
  },
  starIcon: {
    fontSize: moderateScale(14), // Reduced from 18
  },
  reviewText: {
    fontSize: getFontSize(11, 12, 13), // Reduced from 13, 14, 15
    color: '#000',
    lineHeight: getFontSize(16, 17, 19), // Reduced from 19, 20, 22
  },

  plansContainer: {
    gap: scaleHeight(12),
    marginBottom: scaleHeight(16),
  },
  planCard: {
    borderRadius: moderateScale(16),
    padding: scaleWidth(20),
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
    minHeight: scaleHeight(100),
    overflow: 'visible',
  },
  planCardPurple: {
    backgroundColor: '#7A86FF',
  },
  planCardGray: {
    backgroundColor: '#F5F5F5',
    borderColor: '#E5E5E5',
  },
  planCardSelected: {
    borderColor: '#7A86FF',
    borderWidth: 3,
    shadowColor: '#7A86FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  planCardDisabled: {
    opacity: 0.6,
  },
  yearlyDiscountBadge: {
    position: 'absolute',
    top: -8,
    right: 12,
    zIndex: 10,
    width: 100,
    height: 'auto',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  discountBadgeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 30,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FFF',
    textAlign: 'center',
    justifyContent: 'center',
  },
  discountText: {
    color: '#5B21B6',
    fontSize: getFontSize(12, 14, 16),
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  planContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planTextWhite: {
    color: '#FFF',
    fontSize: getFontSize(13, 14, 15),
    fontWeight: '500',
    marginBottom: scaleHeight(4),
  },
  planPriceWhite: {
    color: '#FFF',
    fontSize: getFontSize(22, 24, 28),
    fontWeight: '700',
  },
  planTextGray: {
    color: '#000',
    fontSize: getFontSize(13, 14, 15),
    fontWeight: '500',
    marginBottom: scaleHeight(4),
  },
  planPriceGray: {
    color: '#000',
    fontSize: getFontSize(22, 24, 28),
    fontWeight: '700',
  },
  freeTrialContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: scaleHeight(14),
    paddingHorizontal: scaleWidth(20),
    backgroundColor: '#F3E8FF',
    borderRadius: moderateScale(16),
    marginBottom: scaleHeight(20),
    gap: scaleWidth(8),
  },
  freeTrialText: {
    fontSize: getFontSize(14, 16, 18),
    fontWeight: '700',
    color: '#7A86FF',
    letterSpacing: 0.2,
    flexShrink: 1,
  },
  continueButtonWrapper: {
    marginBottom: scaleHeight(16),
  },
  continueButton: {
    backgroundColor: '#7A86FF',
    minHeight: scaleHeight(56),
    borderRadius: moderateScale(28),
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7A86FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    paddingVertical: scaleHeight(16),
  },
  continueButtonDisabled: {
    opacity: 0.6,
  },
  continueButtonText: {
    color: '#FFF',
    fontSize: getFontSize(16, 18, 20),
    fontWeight: '700',
  },
  disclaimerContainer: {
    paddingHorizontal: scaleWidth(8),
    marginBottom: scaleHeight(24),
  },
  disclaimerText: {
    fontSize: getFontSize(10, 11, 12),
    color: '#999',
    textAlign: 'center',
    lineHeight: getFontSize(15, 16, 18),
  },
  footerLinksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scaleWidth(16),
  },
  footerDivider: {
    width: 1,
    height: scaleHeight(16),
    backgroundColor: '#E5E5E5',
  },
  footerLinkText: {
    fontSize: getFontSize(13, 14, 15),
    fontWeight: '600',
    color: '#666',
  },
  footerLinkDisabled: {
    opacity: 0.5,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: scaleHeight(14),
    paddingHorizontal: scaleWidth(20),
    backgroundColor: '#F3E8FF',
    borderRadius: moderateScale(16),
    marginTop: scaleHeight(16),
  },
  premiumBadgeText: {
    fontSize: getFontSize(14, 15, 16),
    fontWeight: '700',
    marginLeft: scaleWidth(8),
    color: '#7A86FF',
  },
});
