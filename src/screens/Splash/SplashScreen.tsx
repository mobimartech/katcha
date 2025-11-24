import React, { useEffect, useState } from 'react';
import { SafeAreaView, StyleSheet, Image } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { getOnboardingComplete } from '../../utils/onboarding';
import Purchases, { PurchasesPackage } from 'react-native-purchases';

export default function SplashScreen({ navigation }) {
  const [isPremium, setIsPremium] = useState(false);

  const checkPremiumStatus = async () => {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      const premium =
        typeof customerInfo.entitlements.active['premium'] !== 'undefined';
      setIsPremium(premium);
    } catch (error) {
      setIsPremium(false);
      console.error('Failed to check premium status:', error);
    }
  };

  useEffect(() => {
    const checkAppStatus = async () => {
      try {
        const hasCompletedOnboarding = await getOnboardingComplete();
        checkPremiumStatus();
        setTimeout(() => {
          if (!hasCompletedOnboarding) {
            navigation.replace('Onboarding');
          } else {
            if (isPremium === false) {
              navigation.replace('Subscription');
            } else {
              navigation.replace('MainTabs');
            }
          }
        }, 1000);
      } catch (error) {
        navigation.replace('Onboarding');
      }
    };

    checkAppStatus();
  }, [navigation]);

  return (
    <LinearGradient colors={['#698eff', '#dc80ff']} style={styles.gradient}>
      <SafeAreaView style={styles.container}>
        <Image
          source={require('../../../assets/img/logo.jpg')}
          style={styles.logo}
          resizeMode="contain"
        />
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  logo: { width: 300, height: 300 },
});
