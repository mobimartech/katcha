import Purchases from 'react-native-purchases';
import { Platform } from 'react-native';
import { CURRENT_ENVIRONMENT, ENTITLEMENT_ID, validateConfiguration } from '../config/PurchaseConfig';

/**
 * RevenueCat Debug Helper
 * Use this to diagnose RevenueCat configuration issues
 */
export class RevenueCatDebugger {
  
  /**
   * Print comprehensive debug information
   */
  static async printDebugInfo() {
    console.log('\n🔍 ===== REVENUECAT DEBUG INFO =====');
    
    // 1. Configuration validation
    console.log('\n📋 Configuration Validation:');
    const validation = validateConfiguration();
    console.log('✅ Valid:', validation.isValid);
    if (!validation.isValid) {
      console.log('❌ Issues:', validation.issues);
    }
    
    // 2. Environment info
    console.log('\n🌍 Environment:');
    console.log('Platform:', Platform.OS);
    console.log('Is Production:', CURRENT_ENVIRONMENT.IS_PRODUCTION);
    console.log('API Key:', CURRENT_ENVIRONMENT.API_KEY);
    console.log('Product IDs:', CURRENT_ENVIRONMENT.PRODUCT_IDS);
    console.log('Entitlement ID:', ENTITLEMENT_ID);
    
    // 3. RevenueCat status
    console.log('\n🔑 RevenueCat Status:');
    try {
      const isConfigured = await Purchases.isConfigured();
      console.log('✅ RevenueCat Configured:', isConfigured);
      
      if (isConfigured) {
        const appUserID = await Purchases.getAppUserID();
        console.log('👤 App User ID:', appUserID);
      }
    } catch (error) {
      console.log('❌ RevenueCat Status Error:', error);
    }
    
    // 4. Try to fetch offerings
    console.log('\n🛒 Offerings Check:');
    try {
      const offerings = await Purchases.getOfferings();
      console.log('✅ Offerings fetched successfully');
      console.log('📦 Current Offering:', offerings.current?.identifier || 'None');
      console.log('📦 Available Offerings:', Object.keys(offerings.all));
      
      if (offerings.current) {
        console.log('📦 Current Offering Packages:');
        offerings.current.availablePackages.forEach((pkg, index) => {
          console.log(`  ${index + 1}. ${pkg.identifier} - ${pkg.product.identifier} - ${pkg.product.priceString}`);
        });
      }
    } catch (error: any) {
      console.log('❌ Offerings Error:', error.message);
      console.log('❌ Full Error:', error);
      
      // Specific error analysis
      this.analyzeOfferingsError(error);
    }
    
    // 5. Customer info
    console.log('\n👤 Customer Info:');
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      console.log('✅ Customer Info fetched');
      console.log('🔓 Active Entitlements:', Object.keys(customerInfo.entitlements.active));
      console.log('💰 Active Subscriptions:', Object.keys(customerInfo.activeSubscriptions));
    } catch (error) {
      console.log('❌ Customer Info Error:', error);
    }
    
    console.log('\n🔍 ===== END DEBUG INFO =====\n');
  }
  
  /**
   * Analyze specific offerings error
   */
  static analyzeOfferingsError(error: any) {
    console.log('\n🔍 Error Analysis:');
    
    const errorMessage = error.message || '';
    
    if (errorMessage.includes('None of the products registered')) {
      console.log('❌ ISSUE: Products not found in App Store Connect');
      console.log('💡 SOLUTION: Check these steps:');
      console.log('   1. Verify products exist in App Store Connect');
      console.log('   2. Ensure products are "Ready to Submit" or "Approved"');
      console.log('   3. Check Bundle ID matches exactly');
      console.log('   4. Verify product IDs match exactly');
    }
    
    if (errorMessage.includes('configuration')) {
      console.log('❌ ISSUE: Configuration problem');
      console.log('💡 SOLUTION: Check these steps:');
      console.log('   1. Verify API key is correct');
      console.log('   2. Check Bundle ID in RevenueCat matches Xcode');
      console.log('   3. Ensure products are imported in RevenueCat');
    }
    
    if (errorMessage.includes('network') || errorMessage.includes('connection')) {
      console.log('❌ ISSUE: Network problem');
      console.log('💡 SOLUTION: Check internet connection');
    }
    
    if (errorMessage.includes('StoreKit')) {
      console.log('❌ ISSUE: StoreKit problem');
      console.log('💡 SOLUTION: Check these steps:');
      console.log('   1. Enable In-App Purchase capability in Xcode');
      console.log('   2. Create StoreKit configuration file for testing');
      console.log('   3. Test with sandbox account');
    }
  }
  
  /**
   * Test specific product availability
   */
  static async testProductAvailability(productId: string) {
    console.log(`\n🧪 Testing Product: ${productId}`);
    
    try {
      const products = await Purchases.getProducts([productId]);
      if (products.length > 0) {
        const product = products[0];
        console.log('✅ Product found:');
        console.log('  ID:', product.identifier);
        console.log('  Title:', product.title);
        console.log('  Description:', product.description);
        console.log('  Price:', product.priceString);
      } else {
        console.log('❌ Product not found');
      }
    } catch (error) {
      console.log('❌ Product test error:', error);
    }
  }
  
  /**
   * Test all configured products
   */
  static async testAllProducts() {
    console.log('\n🧪 Testing All Products:');
    const productIds = Object.values(CURRENT_ENVIRONMENT.PRODUCT_IDS);
    
    for (const productId of productIds) {
      await this.testProductAvailability(productId);
    }
  }
  
  /**
   * Quick health check
   */
  static async quickHealthCheck(): Promise<boolean> {
    try {
      const offerings = await Purchases.getOfferings();
      return offerings.current !== null && offerings.current.availablePackages.length > 0;
    } catch {
      return false;
    }
  }
  
  /**
   * Get configuration recommendations
   */
  static getConfigurationRecommendations() {
    console.log('\n💡 Configuration Recommendations:');
    
    const validation = validateConfiguration();
    if (!validation.isValid) {
      console.log('❌ Fix these configuration issues first:');
      validation.issues.forEach(issue => console.log(`   - ${issue}`));
      return;
    }
    
    console.log('✅ Configuration looks good!');
    console.log('\n📋 Next steps to fix offerings error:');
    console.log('1. 🏪 App Store Connect:');
    console.log('   - Create products with IDs: baby_generator_monthly, baby_generator_yearly, baby_generator_lifetime');
    console.log('   - Ensure products are "Ready to Submit" or "Approved"');
    console.log('   - Create subscription group "premium_features"');
    
    console.log('\n2. 🔧 RevenueCat Dashboard:');
    console.log('   - Import products from App Store Connect');
    console.log('   - Create entitlement "premium"');
    console.log('   - Create offering "default" with all products');
    console.log('   - Verify Bundle ID matches exactly');
    
    console.log('\n3. 📱 Xcode:');
    console.log('   - Enable In-App Purchase capability');
    console.log('   - Create StoreKit configuration file');
    console.log('   - Test with StoreKit configuration first');
    
    console.log('\n4. 🧪 Testing:');
    console.log('   - Test in simulator with StoreKit config');
    console.log('   - Test on device with sandbox account');
    console.log('   - Check RevenueCat dashboard for events');
  }
}

// Export for easy debugging
export const debugRevenueCat = RevenueCatDebugger.printDebugInfo;
export const testProducts = RevenueCatDebugger.testAllProducts;
export const quickCheck = RevenueCatDebugger.quickHealthCheck;
export const getRecommendations = RevenueCatDebugger.getConfigurationRecommendations;
