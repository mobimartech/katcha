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

const { width, height } = Dimensions.get('window');
const isSmallDevice = width < 375;

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

    // Show close button after 4 seconds
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
        typeof customerInfo.entitlements.active['pro'] !== 'undefined';
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
        console.log('📦 Loaded packages from RevenueCat:', availablePackages);

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
    handlePurchase();
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

  // Helper function to check if package has free trial
  const hasFreeTrial = (pkg: PurchasesPackage | undefined): boolean => {
    if (!pkg) return false;
    try {
      const introPrice = pkg.product.introPrice;
      return introPrice !== null && introPrice.price === 0;
    } catch (error) {
      return false;
    }
  };

  // Helper function to get free trial days
  const getFreeTrialDays = (pkg: PurchasesPackage | undefined): number => {
    if (!pkg || !hasFreeTrial(pkg)) return 0;

    try {
      const introPrice = pkg.product.introPrice;
      if (!introPrice) return 0;

      // Get period information
      const period = introPrice.period || '';
      const periodUnit = introPrice.periodUnit || '';
      const periodNumberOfUnits = introPrice.periodNumberOfUnits || 1;

      // Parse ISO 8601 duration format (e.g., "P7D", "P1W", "P1M")
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

      // Fallback to periodUnit
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

  // Get free trial info for selected plan
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
      >
        <SafeAreaView style={styles.safeArea}>
          <Animated.View
            style={[
              styles.contentWrapper,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}
          >
            {/* Close Button - Top Left - Appears after 4 seconds */}
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
                  <Icon name="close" size={24} color="#000" />
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
            {useDefaultPackages && (
              <View style={styles.offlineNotice}>
                <Icon name="cloud-offline-outline" size={16} color="#FF9500" />
                <Text style={styles.offlineText}>
                  Preview mode - Connect to purchase
                </Text>
              </View>
            )}

            {/* Main Title */}
            <Text style={styles.mainTitle}>Reach Your Goals Faster</Text>

            {/* Review Card */}
            <View style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <Text style={styles.reviewTitle}>Best app ever!</Text>
                <View style={styles.reviewDate}>
                  <Text style={styles.reviewAuthor}>Sarah M.</Text>
                </View>
              </View>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4].map((star) => (
                  <Text key={star} style={styles.starIcon}>
                    ⭐
                  </Text>
                ))}
              </View>
              <Text style={styles.reviewText}>
                I've been using Katcha for tracking instagram growth, and I'm
                impressed with the accuracy and features. The interface is clean
                and intuitive, making it easy to see who's engaging with the
                target. Great app!
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

              {/* Yearly Plan - WITH DISCOUNT BADGE */}
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
                {/* Discount Badge - ALWAYS VISIBLE on Yearly Plan */}
                <View style={styles.yearlyDiscountBadge}>
                  <LinearGradient
                    colors={['#FFD700', '#FFA500']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.discountBadgeGradient}
                  >
                    <Icon
                      name="pricetag"
                      size={14}
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

            {/* Free Trial Notice - Shown when package has free trial */}
            {showFreeTrial && freeTrialDays > 0 && (
              <View style={styles.freeTrialContainer}>
                <Icon name="gift-outline" size={20} color="#7A86FF" />
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
                <Icon name="checkmark-circle" size={20} color="#7A86FF" />
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
    paddingBottom: 40,
  },
  safeArea: {
    flex: 1,
  },
  contentWrapper: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? 60 : 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    color: '#000',
    fontSize: 16,
    marginTop: 16,
    fontWeight: '600',
  },
  closeButton: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 20 : 10,
    left: 24,
    zIndex: 999,
  },
  closeButtonTouchable: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
    marginBottom: 32,
  },
  logoWrapper: {
    width: 100,
    height: 100,
    borderRadius: 20,
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
    borderRadius: 20,
  },
  offlineNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    marginBottom: 24,
  },
  offlineText: {
    fontSize: 13,
    color: '#FF9500',
    marginLeft: 8,
    fontWeight: '600',
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 36,
  },
  reviewCard: {
    backgroundColor: '#E8D4FEFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  reviewTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  reviewDate: {
    alignItems: 'flex-end',
  },
  reviewDateText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  reviewAuthor: {
    fontSize: 14,
    color: '#666',
  },
  starsRow: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 12,
  },
  starIcon: {
    fontSize: 20,
  },
  reviewText: {
    fontSize: 14,
    color: '#000',
    lineHeight: 20,
  },
  plansContainer: {
    gap: 12,
    marginBottom: 16,
  },
  planCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
    minHeight: 100,
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
    fontSize: 14,
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
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  planPriceWhite: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: '700',
  },
  planTextGray: {
    color: '#000',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  planPriceGray: {
    color: '#000',
    fontSize: 24,
    fontWeight: '700',
  },
  freeTrialContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: '#F3E8FF',
    borderRadius: 16,
    marginBottom: 20,
    gap: 8,
  },
  freeTrialText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#7A86FF',
    letterSpacing: 0.2,
  },
  continueButtonWrapper: {
    marginBottom: 16,
  },
  continueButton: {
    backgroundColor: '#7A86FF',
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7A86FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  continueButtonDisabled: {
    opacity: 0.6,
  },
  continueButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
  disclaimerContainer: {
    paddingHorizontal: 8,
    marginBottom: 24,
  },
  disclaimerText: {
    fontSize: 11,
    color: '#999',
    textAlign: 'center',
    lineHeight: 16,
  },
  footerLinksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    // paddingVertical: 16,
  },
  footerDivider: {
    width: 1,
    height: 16,
    backgroundColor: '#E5E5E5',
  },
  footerLinkText: {
    fontSize: 14,
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
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: '#F3E8FF',
    borderRadius: 16,
    marginTop: 16,
  },
  premiumBadgeText: {
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 8,
    color: '#7A86FF',
  },
});
