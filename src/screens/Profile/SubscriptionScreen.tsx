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
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import Purchases, { PurchasesPackage } from 'react-native-purchases';
import LinearGradient from 'react-native-linear-gradient';
import { useAppTheme } from '../../theme/ThemeProvider';
import variables from '../../../constants/variables.js';

const { width, height } = Dimensions.get('window');

// Default packages if RevenueCat fails to load
const DEFAULT_PACKAGES = {
  weekly: {
    price: '$4.99',
    description: 'Billed weekly',
  },
  yearly: {
    price: '$29.99',
    description: '(Save 50%)',
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
  const [restoring, setRestoring] = useState(false); // New state for restore
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [useDefaultPackages, setUseDefaultPackages] = useState(false);

  // Animation
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    loadOfferings();
    checkPremiumStatus();
    startAnimations();
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
        typeof customerInfo.entitlements.active['premium'] !== 'undefined';
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

      if (typeof customerInfo.entitlements.active['premium'] !== 'undefined') {
        setIsPremium(true);
        Alert.alert(
          'Success! 🎉',
          'Welcome to Katcha Premium! You now have unlimited access.',
          [{ text: 'Continue', onPress: () => navigation.goBack() }]
        );
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
      setRestoring(true); // Show loader

      const customerInfo = await Purchases.restorePurchases();
      const premium =
        typeof customerInfo.entitlements.active['premium'] !== 'undefined';

      if (premium) {
        setIsPremium(true);
        Alert.alert('Restored! 🎉', 'Your subscription has been restored.');
      } else {
        Alert.alert('No Purchases Found', 'No previous purchases to restore.');
      }
    } catch (error) {
      console.error('❌ Restore failed:', error);
      Alert.alert('Restore Failed', 'Unable to restore purchases.');
    } finally {
      setRestoring(false); // Hide loader
    }
  };

  const weeklyPackage = getPackageByType('weekly');
  const yearlyPackage = getPackageByType('yearly');

  const getWeeklyPrice = () => {
    return useDefaultPackages
      ? DEFAULT_PACKAGES.weekly.price
      : weeklyPackage?.product.priceString || DEFAULT_PACKAGES.weekly.price;
  };

  const getWeeklyDescription = () => {
    return useDefaultPackages
      ? DEFAULT_PACKAGES.weekly.description
      : 'Billed weekly';
  };

  const getYearlyPrice = () => {
    return useDefaultPackages
      ? DEFAULT_PACKAGES.yearly.price
      : yearlyPackage?.product.priceString || DEFAULT_PACKAGES.yearly.price;
  };

  const getYearlyDescription = () => {
    return DEFAULT_PACKAGES.yearly.description;
  };

  const features = [
    'Real-time follower updates',
    'Advanced analytics & insights',
    'Unlimited account tracking',
    'Smart notifications & trends',
    'Priority data refresh',
  ];

  if (loadingProducts) {
    return (
      <View style={[styles.container, { backgroundColor: colors.primary }]}>
        <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFF" />
          <Text style={styles.loadingText}>Loading subscriptions...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.primary }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View
          style={[
            styles.header,
            { backgroundColor: colors.primary },
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <SafeAreaView>
            <View style={styles.headerRow}>
              <View style={styles.brandRow}>
                <View style={styles.logoBox}>
                  <Image
                    source={require('../../../assets/img/logomain.jpg')}
                    style={styles.logoImage}
                    resizeMode="contain"
                  />
                </View>
                <Text style={styles.brandText}>{variables.APP.app_name}</Text>
              </View>
              <TouchableOpacity
                style={styles.bell}
                onPress={() => (navigation as any).navigate('MainTabs', {})}
              >
                <Icon name="home-outline" size={22} color="#000" />
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </Animated.View>

        {/* Premium Card */}
        <Animated.View
          style={[
            styles.premiumCard,
            { backgroundColor: colors.surface },
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <Text style={[styles.premiumTitle, { color: colors.text }]}>
            Katcha Premium
          </Text>
          <Text
            style={[styles.premiumSubtitle, { color: colors.textSecondary }]}
          >
            Track deeper. Grow faster. Stay ahead.
          </Text>

          {/* Offline/Default Mode Indicator */}
          {useDefaultPackages && (
            <View style={styles.offlineNotice}>
              <Icon name="cloud-offline-outline" size={16} color="#FF9500" />
              <Text style={styles.offlineText}>
                Displaying preview pricing. Connect to purchase.
              </Text>
            </View>
          )}

          {/* Features Section */}
          <Text style={[styles.featuresTitle, { color: colors.text }]}>
            Unlock all features:
          </Text>
          <View style={styles.featuresList}>
            {features.map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <Icon name="checkmark" size={20} color={colors.primary} />
                <Text style={[styles.featureText, { color: colors.text }]}>
                  {feature}
                </Text>
              </View>
            ))}
          </View>

          {/* Plan Selection */}
          <Text style={[styles.planTitle, { color: colors.text }]}>
            Select your plan:
          </Text>

          <View style={styles.plansContainer}>
            {/* Weekly Plan */}
            <View style={styles.planWrapper}>
              <TouchableOpacity
                onPress={() => setSelectedPlan('weekly')}
                activeOpacity={0.8}
                disabled={useDefaultPackages}
              >
                {selectedPlan === 'weekly' ? (
                  <LinearGradient
                    colors={
                      useDefaultPackages
                        ? ['#9CA3AF', '#6B7280']
                        : ['#688dff', '#dc80ff']
                    }
                    style={styles.planCard}
                    start={{ x: 0.5, y: 0 }}
                    end={{ x: 0.5, y: 1 }}
                  >
                    <Text style={styles.planLabelSelected}>Weekly</Text>
                    <Text style={styles.planPriceSelected}>
                      {getWeeklyPrice()}
                    </Text>
                    <Text style={styles.planDescSelected}>
                      {getWeeklyDescription()}
                    </Text>
                  </LinearGradient>
                ) : (
                  <View
                    style={[
                      styles.planCard,
                      styles.planCardUnselected,
                      { backgroundColor: colors.background },
                      useDefaultPackages && { opacity: 0.6 },
                    ]}
                  >
                    <Text style={[styles.planLabel, { color: colors.text }]}>
                      Weekly
                    </Text>
                    <Text style={[styles.planPrice, { color: colors.text }]}>
                      {getWeeklyPrice()}
                    </Text>
                    <Text
                      style={[styles.planDesc, { color: colors.textSecondary }]}
                    >
                      {getWeeklyDescription()}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Yearly Plan */}
            <View style={styles.planWrapper}>
              <TouchableOpacity
                onPress={() => setSelectedPlan('yearly')}
                activeOpacity={0.8}
                disabled={useDefaultPackages}
                style={styles.planTouchable}
              >
                {selectedPlan === 'yearly' ? (
                  <LinearGradient
                    colors={
                      useDefaultPackages
                        ? ['#9CA3AF', '#6B7280']
                        : ['#688dff', '#dc80ff']
                    }
                    style={styles.planCard}
                    start={{ x: 0.5, y: 0 }}
                    end={{ x: 0.5, y: 1 }}
                  >
                    <Text style={styles.planLabelSelected}>Yearly</Text>
                    <Text style={styles.planPriceSelected}>
                      {getYearlyPrice()}
                    </Text>
                    <Text style={styles.planDescSelected}>
                      {getYearlyDescription()}
                    </Text>
                  </LinearGradient>
                ) : (
                  <View
                    style={[
                      styles.planCard,
                      styles.planCardUnselected,
                      { backgroundColor: colors.background },
                      useDefaultPackages && { opacity: 0.6 },
                    ]}
                  >
                    <Text style={[styles.planLabel, { color: colors.text }]}>
                      Yearly
                    </Text>
                    <Text style={[styles.planPrice, { color: colors.text }]}>
                      {getYearlyPrice()}
                    </Text>
                    <Text
                      style={[styles.planDesc, { color: colors.textSecondary }]}
                    >
                      {getYearlyDescription()}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            onPress={handlePurchase}
            disabled={loading || isPremium || useDefaultPackages}
            activeOpacity={0.8}
            style={styles.submitWrapper}
          >
            <LinearGradient
              colors={
                useDefaultPackages || isPremium
                  ? ['#9CA3AF', '#6B7280']
                  : ['#7b86ff', '#3c9eff']
              }
              style={styles.submitButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <Text style={styles.submitButtonText}>
                  {isPremium
                    ? 'Already Premium ✓'
                    : useDefaultPackages
                    ? 'Service Unavailable'
                    : 'Submit'}
                </Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Restore Button with Loader */}
          {!isPremium && (
            <TouchableOpacity
              style={styles.restoreButton}
              onPress={handleRestore}
              disabled={useDefaultPackages || restoring}
              activeOpacity={0.7}
            >
              {restoring ? (
                <View style={styles.restoreLoaderContainer}>
                  <ActivityIndicator color={colors.primary} size="small" />
                  <Text
                    style={[
                      styles.restoreButtonText,
                      { color: colors.primary, marginLeft: 8 },
                    ]}
                  >
                    Restoring...
                  </Text>
                </View>
              ) : (
                <Text
                  style={[
                    styles.restoreButtonText,
                    { color: colors.primary },
                    useDefaultPackages && { opacity: 0.5 },
                  ]}
                >
                  Restore Purchases
                </Text>
              )}
            </TouchableOpacity>
          )}

          {/* Premium Status Badge */}
          {isPremium && (
            <View
              style={[
                styles.premiumBadge,
                { backgroundColor: colors.primary + '15' },
              ]}
            >
              <Icon name="checkmark-circle" size={18} color={colors.primary} />
              <Text
                style={[styles.premiumBadgeText, { color: colors.primary }]}
              >
                You have Premium Access
              </Text>
            </View>
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFF',
    fontSize: 16,
    marginTop: 16,
    fontWeight: '600',
  },
  header: {
    paddingTop: Platform.OS === 'android' ? 20 : 10,
    paddingBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoBox: {
    backgroundColor: '#FFF',
    width: 40,
    height: 40,
    borderRadius: 8,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 6,
  },
  logoImage: {
    borderRadius: 8,
    width: 40,
    height: 40,
  },
  brandText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '600',
  },
  bell: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  premiumCard: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 40,
    minHeight: height - 100,
  },
  premiumTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  premiumSubtitle: {
    fontSize: 16,
    marginBottom: 24,
    lineHeight: 22,
  },
  offlineNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
    marginBottom: 20,
  },
  offlineText: {
    fontSize: 13,
    color: '#FF9500',
    marginLeft: 8,
    fontWeight: '600',
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  featuresList: {
    marginBottom: 32,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  featureText: {
    fontSize: 16,
    marginLeft: 12,
    flex: 1,
  },
  planTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  plansContainer: {
    flexDirection: 'row',
    marginBottom: 32,
    gap: 16,
  },
  planWrapper: {
    flex: 1,
  },
  planTouchable: {
    width: '100%',
  },
  planCard: {
    width: '100%',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 170,
  },
  planCardUnselected: {
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  planLabel: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 16,
  },
  planLabelSelected: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 16,
    color: '#FFFFFF',
  },
  planPrice: {
    fontSize: 40,
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: -1,
  },
  planPriceSelected: {
    fontSize: 40,
    fontWeight: '700',
    marginBottom: 8,
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  planDesc: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  planDescSelected: {
    fontSize: 13,
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 18,
  },
  submitWrapper: {
    marginBottom: 16,
  },
  submitButton: {
    width: '100%',
    height: 56,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7b86ff',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
  restoreButton: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  restoreButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  restoreLoaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 8,
  },
  premiumBadgeText: {
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8,
  },
});
