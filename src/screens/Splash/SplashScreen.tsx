import React, { useEffect } from 'react';
import { SafeAreaView, StyleSheet, Image } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { getIsLoggedIn } from '../../utils/auth';
import { getOnboardingComplete } from '../../utils/onboarding';

export default function SplashScreen({ navigation }) {
  useEffect(() => {
    const checkAppStatus = async () => {
      try {
        const hasCompletedOnboarding = await getOnboardingComplete();
        const isLoggedIn = await getIsLoggedIn();

        console.log('Onboarding complete:', hasCompletedOnboarding);
        console.log('User logged in:', isLoggedIn);

        setTimeout(() => {
          if (!hasCompletedOnboarding) {
            // First time user - show onboarding
            navigation.replace('Onboarding');
          } else if (isLoggedIn) {
            // User has seen onboarding and is logged in
            navigation.replace('MainTabs');
          } else {
            // User has seen onboarding but not logged in
            navigation.replace('Login');
          }
        }, 1000);
      } catch (error) {
        console.error('Error checking app status:', error);
        // Default to onboarding on error
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
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 300,
    height: 300,
  },
});
