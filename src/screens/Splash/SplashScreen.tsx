import React, { useEffect, useState } from 'react';
import { SafeAreaView, StyleSheet, Image } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { getOnboardingComplete } from '../../utils/onboarding';
import Purchases, { PurchasesPackage } from 'react-native-purchases';

export default function SplashScreen({ navigation }) {
  const checkPremiumStatus = async () => {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      const premium =
        typeof customerInfo.entitlements.active['pro'] !== 'undefined';
      console.log('Premium status:', premium);
      return premium; // Return the value instead of setting state
    } catch (error) {
      console.error('Failed to check premium status:', error);
      return false; // Return false on error
    }
  };

  useEffect(() => {
    const checkAppStatus = async () => {
      try {
        const hasCompletedOnboarding = await getOnboardingComplete();
        const isPremium = await checkPremiumStatus(); // Wait for the result

        setTimeout(() => {
          if (!hasCompletedOnboarding) {
            navigation.replace('Onboarding');
          } else {
            if (isPremium) {
              console.log('Navigating to MainTabs - User is premium');
              navigation.replace('MainTabs');
            } else {
              console.log('Navigating to Subscription - User is not premium');
              navigation.replace('Subscription');
            }
          }
        }, 1000);
      } catch (error) {
        console.error('Error in checkAppStatus:', error);
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
