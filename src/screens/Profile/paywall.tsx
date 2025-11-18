import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState, useEffect } from 'react';
import {
  Alert,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Purchases, {
  PurchasesOffering,
  PurchasesPackage,
} from 'react-native-purchases';
import { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Paywall'>;

// Fallback data if RevenueCat fails
const FALLBACK_PLANS = [
  {
    id: 'monthly',
    title: 'Monthly',
    price: '$4.99',
    subtitle: 'then $8.99/week',
    isSelected: true,
  },
  {
    id: 'yearly',
    title: 'Yearly',
    price: '$29.99',
    subtitle: '(Save 50%)',
    isSelected: false,
  },
];

const FEATURES = [
  'Real-time follower updates',
  'Advanced analytics & insights',
  'Unlimited account tracking',
  'Smart notifications & trends',
  'Priority data refresh',
];

export default function PaywallScreen({
  navigation,
}: Props): React.ReactElement {
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [offering, setOffering] = useState<PurchasesOffering | null>(null);
  const [selectedPackage, setSelectedPackage] =
    useState<PurchasesPackage | null>(null);
  const [plans, setPlans] = useState(FALLBACK_PLANS);
  const [selectedPlanId, setSelectedPlanId] = useState('monthly');
  const [useRevenueCat, setUseRevenueCat] = useState(false);

  useEffect(() => {
    fetchOfferings();
  }, []);

  const fetchOfferings = async () => {
    try {
      console.log('[Paywall] Fetching RevenueCat offerings...');
      const offerings = await Purchases.getOfferings();

      if (
        offerings.current !== null &&
        offerings.current.availablePackages.length > 0
      ) {
        console.log('[Paywall] RevenueCat offerings loaded successfully');
        setOffering(offerings.current);
        setUseRevenueCat(true);

        // Set the first package as selected by default
        const firstPackage = offerings.current.availablePackages[0];
        setSelectedPackage(firstPackage);

        console.log(
          '[Paywall] Available packages:',
          offerings.current.availablePackages.length
        );
      } else {
        console.log('[Paywall] No offerings available, using fallback data');
        setUseRevenueCat(false);
      }
    } catch (error) {
      console.error('[Paywall] Error fetching offerings:', error);
      setUseRevenueCat(false);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (purchasing) return;

    if (useRevenueCat && selectedPackage) {
      // Purchase through RevenueCat
      setPurchasing(true);
      try {
        console.log(
          '[Paywall] Starting purchase for:',
          selectedPackage.identifier
        );
        const { customerInfo } = await Purchases.purchasePackage(
          selectedPackage
        );

        console.log('[Paywall] Purchase successful');
        console.log(
          '[Paywall] Active subscriptions:',
          customerInfo.activeSubscriptions
        );

        if (customerInfo.activeSubscriptions.length > 0) {
          Alert.alert(
            'Success!',
            'Your subscription is now active. Enjoy premium features!',
            [
              {
                text: 'Continue',
                onPress: () => navigation.goBack(),
              },
            ]
          );
        }
      } catch (error: any) {
        console.error('[Paywall] Purchase error:', error);

        if (!error.userCancelled) {
          Alert.alert(
            'Purchase Failed',
            error.message || 'Unable to complete purchase. Please try again.'
          );
        }
      } finally {
        setPurchasing(false);
      }
    } else {
      // Fallback flow - just show message
      Alert.alert(
        'Demo Mode',
        'This is a demo. In production, this would process the payment.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    }
  };

  const selectPlan = (pkg: PurchasesPackage) => {
    setSelectedPackage(pkg);
  };

  const selectFallbackPlan = (planId: string) => {
    setSelectedPlanId(planId);
  };

  const renderRevenueCatPlans = () => {
    if (!offering) return null;

    return offering.availablePackages.map((pkg) => {
      const isSelected = selectedPackage?.identifier === pkg.identifier;

      return (
        <Pressable
          key={pkg.identifier}
          style={styles.planCard}
          onPress={() => selectPlan(pkg)}
        >
          {isSelected ? (
            <LinearGradient
              colors={['#7C8BFF', '#5B9EFF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.planCardContent}
            >
              <Text style={styles.planTitleSelected}>{pkg.product.title}</Text>
              <Text style={styles.planPriceSelected}>
                {pkg.product.priceString}
              </Text>
              <Text style={styles.planSubtitleSelected}>
                {pkg.product.subscriptionPeriod || 'Subscription'}
              </Text>
            </LinearGradient>
          ) : (
            <View style={styles.planCardContentUnselected}>
              <Text style={styles.planTitle}>{pkg.product.title}</Text>
              <Text style={styles.planPrice}>{pkg.product.priceString}</Text>
              <Text style={styles.planSubtitle}>
                {pkg.product.subscriptionPeriod || 'Subscription'}
              </Text>
            </View>
          )}
        </Pressable>
      );
    });
  };

  const renderFallbackPlans = () => {
    return plans.map((plan) => {
      const isSelected = selectedPlanId === plan.id;

      return (
        <Pressable
          key={plan.id}
          style={styles.planCard}
          onPress={() => selectFallbackPlan(plan.id)}
        >
          {isSelected ? (
            <LinearGradient
              colors={['#7C8BFF', '#5B9EFF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.planCardContent}
            >
              <Text style={styles.planTitleSelected}>{plan.title}</Text>
              <Text style={styles.planPriceSelected}>{plan.price}</Text>
              <Text style={styles.planSubtitleSelected}>{plan.subtitle}</Text>
            </LinearGradient>
          ) : (
            <View style={styles.planCardContentUnselected}>
              <Text style={styles.planTitle}>{plan.title}</Text>
              <Text style={styles.planPrice}>{plan.price}</Text>
              <Text style={styles.planSubtitle}>{plan.subtitle}</Text>
            </View>
          )}
        </Pressable>
      );
    });
  };

  if (loading) {
    return (
      <LinearGradient colors={['#658EFF', '#B27FFF']} style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FFFFFF" />
            <Text style={styles.loadingText}>
              Loading subscription plans...
            </Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#6B8CFF', '#8BA3FF']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header outside of content card */}
        <View style={styles.header}>
          <View style={styles.headerLogoContainer}>
            <Image
              source={require('../../../assets/img/logo.jpg')}
              style={styles.headerLogo}
              resizeMode="contain"
            />
            <Text style={styles.headerTitle}>Katcha</Text>
          </View>
        </View>

        {/* Main Content Card - Full Height */}
        <View style={styles.contentCard}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <Text style={styles.premiumTitle}>Katcha Premium</Text>
            <Text style={styles.premiumSubtitle}>
              Track deeper. Grow faster. Stay ahead.
            </Text>

            {/* Features List */}
            <View style={styles.featuresContainer}>
              <Text style={styles.featuresTitle}>Unlock all features:</Text>
              {FEATURES.map((feature, index) => (
                <View key={index} style={styles.featureRow}>
                  <Text style={styles.checkmark}>✓</Text>
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>

            {/* Plans Section */}
            <View style={styles.plansSection}>
              <Text style={styles.plansTitle}>Select your plan:</Text>
              <View style={styles.plansContainer}>
                {useRevenueCat
                  ? renderRevenueCatPlans()
                  : renderFallbackPlans()}
              </View>
            </View>

            {/* Submit Button */}
            <Pressable
              style={styles.submitButtonContainer}
              onPress={handlePurchase}
              disabled={purchasing}
            >
              <LinearGradient
                colors={['#7C8BFF', '#5B9EFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[
                  styles.submitButton,
                  purchasing && styles.submitButtonDisabled,
                ]}
              >
                {purchasing ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitButtonText}>Submit</Text>
                )}
              </LinearGradient>
            </Pressable>
          </ScrollView>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 16,
    fontWeight: '600',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerLogoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerLogo: {
    width: 36,
    height: 36,
    borderRadius: 8,
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  contentCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  premiumTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 6,
  },
  premiumSubtitle: {
    fontSize: 15,
    color: '#6B6B6B',
    marginBottom: 28,
    lineHeight: 22,
  },
  featuresContainer: {
    marginBottom: 32,
  },
  featuresTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  checkmark: {
    fontSize: 16,
    color: '#6B8CFF',
    marginRight: 12,
    fontWeight: '700',
  },
  featureText: {
    fontSize: 15,
    color: '#3A3A3A',
    flex: 1,
    lineHeight: 20,
  },
  plansSection: {
    marginBottom: 28,
  },
  plansTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  plansContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  planCard: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
  },
  planCardContent: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 160,
  },
  planCardContentUnselected: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 160,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 20,
  },
  planTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#3A3A3A',
    marginBottom: 16,
  },
  planTitleSelected: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  planPrice: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  planPriceSelected: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  planSubtitle: {
    fontSize: 13,
    color: '#6B6B6B',
    textAlign: 'center',
  },
  planSubtitleSelected: {
    fontSize: 13,
    color: '#FFFFFF',
    opacity: 0.9,
    textAlign: 'center',
  },
  submitButtonContainer: {
    borderRadius: 28,
    overflow: 'hidden',
    marginTop: 8,
  },
  submitButton: {
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 28,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
});
