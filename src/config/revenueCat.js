import Purchases from 'react-native-purchases';
import { Platform } from 'react-native';

const API_KEYS = {
  ios: 'appl_bwytOJSXqaDnJTPBMncYDShpOIn',
  android: 'YOUR_ANDROID_API_KEY', // Replace with your actual Android key
};

export const initializeRevenueCat = async (userId) => {
  try {
    const apiKey = Platform.OS === 'ios' ? API_KEYS.ios : API_KEYS.android;

    await Purchases.configure({
      apiKey,
      appUserID: userId, // Optional but recommended for user tracking
    });

    console.log('✅ RevenueCat initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing RevenueCat:', error);
  }
};
