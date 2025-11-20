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

const { width, height } = Dimensions.get('window');

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
  const [restoring, setRestoring] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [useDefaultPackages, setUseDefaultPackages] = useState(false);

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
      setRestoring(true);

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
      setRestoring(false);
    }
  };

  const handlePrivacyPolicy = () => {
    const privacyUrl = variables.APP.PRIVACY_URL; // Replace with your actual privacy policy URL
    Linking.openURL(privacyUrl).catch((err) =>
      console.error('Failed to open privacy policy:', err)
    );
  };

  const handleTermsOfService = () => {
    const termsUrl = variables.APP.TERMS_URL; // Replace with your actual terms URL
    Linking.openURL(termsUrl).catch((err) =>
      console.error('Failed to open terms:', err)
    );
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

  if (loadingProducts) {
    return (
      <LinearGradient
        colors={['#5B68E8', '#7B5FD8', '#A855F7']}
        style={styles.container}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        <StatusBar barStyle="light-content" backgroundColor="#5B68E8" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFF" />
          <Text style={styles.loadingText}>Loading subscriptions...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={['#5B68E8', '#7B5FD8', '#A855F7']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <StatusBar barStyle="light-content" backgroundColor="#5B68E8" />

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
            {/* Close Button */}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => (navigation as any).navigate('MainTabs', {})}
            >
              <Icon name="close" size={24} color="#FFF" />
            </TouchableOpacity>

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

            {/* Main Headline */}
            <Text style={styles.mainTitle}>Unlock Premium Power</Text>
            <Text style={styles.mainSubtitle}>
              Unlimited tracking & advanced insights
            </Text>

            {/* Quick Benefits Icons */}
            <View style={styles.benefitsContainer}>
              <View style={styles.benefitBadge}>
                <Icon name="infinite" size={20} color="#FFF" />
                <Text style={styles.benefitLabel}>Unlimited</Text>
              </View>
              <View style={styles.benefitBadge}>
                <Icon name="trending-up" size={20} color="#FFF" />
                <Text style={styles.benefitLabel}>Analytics</Text>
              </View>
              <View style={styles.benefitBadge}>
                <Icon name="flash" size={20} color="#FFF" />
                <Text style={styles.benefitLabel}>Real-time</Text>
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

            {/* Plans Section */}
            <View style={styles.plansSection}>
              <Text style={styles.planSectionTitle}>Choose Your Plan</Text>

              <View style={styles.plansContainer}>
                {/* Weekly Plan */}
                <TouchableOpacity
                  style={styles.planWrapper}
                  onPress={() => setSelectedPlan('weekly')}
                  activeOpacity={0.8}
                  disabled={useDefaultPackages}
                >
                  <View
                    style={[
                      styles.planCard,
                      selectedPlan === 'weekly' && styles.planCardSelected,
                      useDefaultPackages && styles.planCardDisabled,
                    ]}
                  >
                    {selectedPlan === 'weekly' && (
                      <View style={styles.selectedBadge}>
                        <Icon name="checkmark-circle" size={20} color="#FFF" />
                      </View>
                    )}
                    {/* Empty space to match yearly plan height */}
                    <View style={styles.badgePlaceholder} />
                    <Text style={styles.planLabel}>Weekly</Text>
                    <Text style={styles.planPrice}>{getWeeklyPrice()}</Text>
                    <Text style={styles.planDescription}>
                      {getWeeklyDescription()}
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Yearly Plan */}
                <TouchableOpacity
                  style={styles.planWrapper}
                  onPress={() => setSelectedPlan('yearly')}
                  activeOpacity={0.8}
                  disabled={useDefaultPackages}
                >
                  <View
                    style={[
                      styles.planCard,
                      selectedPlan === 'yearly' && styles.planCardSelected,
                      useDefaultPackages && styles.planCardDisabled,
                    ]}
                  >
                    {selectedPlan === 'yearly' && (
                      <View style={styles.selectedBadge}>
                        <Icon name="checkmark-circle" size={20} color="#FFF" />
                      </View>
                    )}
                    <View style={styles.popularBadge}>
                      <Text style={styles.popularText}>POPULAR</Text>
                    </View>
                    <Text style={styles.planLabel}>Yearly</Text>
                    <Text style={styles.planPrice}>{getYearlyPrice()}</Text>
                    <Text style={styles.planDescription}>
                      {getYearlyDescription()}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            {/* Continue Button */}
            <TouchableOpacity
              onPress={handlePurchase}
              disabled={loading || isPremium || useDefaultPackages}
              activeOpacity={0.8}
              style={styles.subscribeButtonWrapper}
            >
              <View
                style={[
                  styles.subscribeButton,
                  (useDefaultPackages || isPremium) &&
                    styles.subscribeButtonDisabled,
                ]}
              >
                {loading ? (
                  <ActivityIndicator color="#5B68E8" size="small" />
                ) : (
                  <Text style={styles.subscribeButtonText}>
                    {isPremium
                      ? 'Already Premium ✓'
                      : useDefaultPackages
                      ? 'Service Unavailable'
                      : 'Continue'}
                  </Text>
                )}
              </View>
            </TouchableOpacity>

            {/* Footer Links Row: Privacy | Restore | Terms */}
            {!isPremium && (
              <View style={styles.footerLinksRow}>
                <TouchableOpacity
                  style={styles.footerLink}
                  onPress={handlePrivacyPolicy}
                  activeOpacity={0.7}
                >
                  <Text style={styles.footerLinkText}>Privacy</Text>
                </TouchableOpacity>

                <View style={styles.footerDivider} />

                <TouchableOpacity
                  style={styles.footerLink}
                  onPress={handleRestore}
                  disabled={useDefaultPackages || restoring}
                  activeOpacity={0.7}
                >
                  {restoring ? (
                    <View style={styles.restoreLoaderContainer}>
                      <ActivityIndicator color="#FFF" size="small" />
                    </View>
                  ) : (
                    <Text
                      style={[
                        styles.footerLinkText,
                        useDefaultPackages && { opacity: 0.5 },
                      ]}
                    >
                      Restore
                    </Text>
                  )}
                </TouchableOpacity>

                <View style={styles.footerDivider} />

                <TouchableOpacity
                  style={styles.footerLink}
                  onPress={handleTermsOfService}
                  activeOpacity={0.7}
                >
                  <Text style={styles.footerLinkText}>Terms</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Premium Badge */}
            {isPremium && (
              <View style={styles.premiumBadge}>
                <Icon name="checkmark-circle" size={20} color="#FFF" />
                <Text style={styles.premiumBadgeText}>
                  You have Premium Access
                </Text>
              </View>
            )}
          </Animated.View>
        </SafeAreaView>
      </ScrollView>
    </LinearGradient>
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
  safeArea: {
    flex: 1,
  },
  contentWrapper: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? 20 : 10,
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
  closeButton: {
    alignSelf: 'flex-end',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoWrapper: {
    width: 100,
    height: 100,
    borderRadius: 24,
    backgroundColor: '#FFF',
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  logo: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  mainTitle: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  mainSubtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 26,
    fontWeight: '500',
  },
  benefitsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 40,
  },
  benefitBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
  },
  benefitLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFF',
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
  plansSection: {
    marginBottom: 32,
  },
  planSectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 20,
  },
  plansContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  planWrapper: {
    flex: 1,
  },
  planCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    height: 200,
    justifyContent: 'center',
    position: 'relative',
  },
  planCardSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderColor: '#FFF',
    shadowColor: '#FFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  planCardDisabled: {
    opacity: 0.6,
  },
  selectedBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  badgePlaceholder: {
    height: 20,
    marginBottom: 8,
  },
  popularBadge: {
    position: 'absolute',
    top: -8,
    backgroundColor: '#FFD700',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#5B68E8',
    letterSpacing: 0.5,
  },
  planLabel: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 12,
  },
  planPrice: {
    fontSize: 32,
    fontWeight: '500',
    color: '#FFF',
    marginBottom: 8,
    letterSpacing: -1,
  },
  planDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    fontWeight: '600',
  },
  subscribeButtonWrapper: {
    marginBottom: 20,
  },
  subscribeButton: {
    backgroundColor: '#FFF',
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  subscribeButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    shadowOpacity: 0.1,
  },
  subscribeButtonText: {
    color: '#5B68E8',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  footerLinksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  footerLink: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  footerLinkText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
  footerDivider: {
    width: 1,
    height: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  restoreLoaderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 50,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    marginTop: 8,
  },
  premiumBadgeText: {
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 8,
    color: '#FFF',
  },
});
