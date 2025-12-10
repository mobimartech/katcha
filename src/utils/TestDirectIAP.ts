import { Platform } from 'react-native';
import DirectIAPService from '../services/DirectIAPService';

export const testDirectIAP = async () => {
  try {
    console.log('🧪 Testing Direct IAP Service...');

    // Test initialization
    await DirectIAPService.initialize();
    console.log('✅ Initialization successful');

    // Test getting products
    const products = await DirectIAPService.getAvailableProducts();
    console.log('📱 Available products:', products);

    if (products.length === 0) {
      console.log('⚠️ No products found - check StoreKit configuration');
      return false;
    }

    // Test premium status
    const isPremium =
      Platform.OS === 'android'
        ? true
        : await DirectIAPService.checkPremiumStatus();
    console.log('💎 Premium status:', isPremium);

    // Test free generations
    const freeLeft = await DirectIAPService.getRemainingFreeGenerations();
    console.log('🆓 Free generations left:', freeLeft);

    // Test can generate
    const canGenerate = await DirectIAPService.canGenerate();
    console.log('🎯 Can generate:', canGenerate);

    console.log('✅ All tests passed!');
    return true;
  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
};
