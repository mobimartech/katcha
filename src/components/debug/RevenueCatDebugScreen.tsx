import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  SafeAreaView,
} from 'react-native';
import PurchaseService from '../../services/PurchaseService';
import { RevenueCatDebugger } from '../../utils/RevenueCatDebugger';
import { CURRENT_ENVIRONMENT, validateConfiguration } from '../../config/PurchaseConfig';

const RevenueCatDebugScreen: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    runInitialCheck();
  }, []);

  const runInitialCheck = async () => {
    setIsLoading(true);
    try {
      const validation = validateConfiguration();
      let info = '🔍 INITIAL CONFIGURATION CHECK\n\n';
      
      info += `✅ Configuration Valid: ${validation.isValid}\n`;
      if (!validation.isValid) {
        info += `❌ Issues: ${validation.issues.join(', ')}\n`;
      }
      
      info += `🌍 Platform: ${CURRENT_ENVIRONMENT.PLATFORM}\n`;
      info += `🔑 API Key: ${CURRENT_ENVIRONMENT.API_KEY.substring(0, 15)}...\n`;
      info += `📦 Product IDs: ${Object.values(CURRENT_ENVIRONMENT.PRODUCT_IDS).join(', ')}\n\n`;
      
      setDebugInfo(info);
    } catch (error) {
      setDebugInfo(`❌ Initial check failed: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const runFullDebug = async () => {
    setIsLoading(true);
    try {
      // Capture console output
      const originalLog = console.log;
      const originalError = console.error;
      const originalWarn = console.warn;
      
      let capturedOutput = '';
      
      const captureLog = (...args: any[]) => {
        capturedOutput += args.join(' ') + '\n';
        originalLog(...args);
      };
      
      const captureError = (...args: any[]) => {
        capturedOutput += '❌ ' + args.join(' ') + '\n';
        originalError(...args);
      };
      
      const captureWarn = (...args: any[]) => {
        capturedOutput += '⚠️ ' + args.join(' ') + '\n';
        originalWarn(...args);
      };
      
      console.log = captureLog;
      console.error = captureError;
      console.warn = captureWarn;
      
      // Run debug
      await RevenueCatDebugger.printDebugInfo();
      
      // Restore console
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
      
      setDebugInfo(capturedOutput);
    } catch (error) {
      setDebugInfo(`❌ Debug failed: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testPurchaseService = async () => {
    setIsLoading(true);
    try {
      let info = '🧪 TESTING PURCHASE SERVICE\n\n';
      
      // Test initialization
      info += '1. Testing initialization...\n';
      await PurchaseService.initialize();
      info += '✅ PurchaseService initialized\n\n';
      
      // Test offerings
      info += '2. Testing offerings...\n';
      const offerings = await PurchaseService.getOfferings();
      if (offerings) {
        info += `✅ Offerings loaded: ${offerings.identifier}\n`;
        info += `📦 Packages: ${offerings.availablePackages.length}\n`;
        offerings.availablePackages.forEach((pkg, index) => {
          info += `   ${index + 1}. ${pkg.identifier} - ${pkg.product.identifier} - ${pkg.product.priceString}\n`;
        });
      } else {
        info += '❌ No offerings available\n';
      }
      info += '\n';
      
      // Test products
      info += '3. Testing products...\n';
      const products = await PurchaseService.getProducts();
      info += `📱 Products found: ${products.length}\n`;
      products.forEach((product, index) => {
        info += `   ${index + 1}. ${product.title} - ${product.price} ${product.period}\n`;
      });
      info += '\n';
      
      // Test premium status
      info += '4. Testing premium status...\n';
      const isPremium = await PurchaseService.checkPremiumStatus();
      info += `👑 Premium Status: ${isPremium}\n\n`;
      
      // Test generation status
      info += '5. Testing generation status...\n';
      const canGenerate = await PurchaseService.canGenerate();
      info += `🎨 Can Generate: ${canGenerate.canGenerate}\n`;
      info += `👑 Is Premium: ${canGenerate.isPremium}\n`;
      info += `🆓 Free Left: ${canGenerate.freeLeft}\n\n`;
      
      setDebugInfo(info);
    } catch (error: any) {
      setDebugInfo(`❌ Purchase Service test failed: ${error.message}\n\nFull error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testProductAvailability = async () => {
    setIsLoading(true);
    try {
      let info = '🧪 TESTING INDIVIDUAL PRODUCTS\n\n';
      
      const productIds = Object.values(CURRENT_ENVIRONMENT.PRODUCT_IDS);
      
      for (const productId of productIds) {
        info += `Testing: ${productId}\n`;
        try {
          await RevenueCatDebugger.testProductAvailability(productId);
          info += '✅ Product test completed\n\n';
        } catch (error) {
          info += `❌ Product test failed: ${error}\n\n`;
        }
      }
      
      setDebugInfo(info);
    } catch (error) {
      setDebugInfo(`❌ Product availability test failed: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const showRecommendations = () => {
    Alert.alert(
      'Configuration Recommendations',
      `Based on your error, here are the steps to fix it:

1. 🏪 App Store Connect:
   • Create products with exact IDs:
     - baby_generator_monthly
     - baby_generator_yearly  
     - baby_generator_lifetime
   • Ensure products are "Ready to Submit"
   • Create subscription group "premium_features"

2. 🔧 RevenueCat Dashboard:
   • Import products from App Store Connect
   • Create entitlement "premium"
   • Create offering "default" with all products
   • Verify Bundle ID matches exactly

3. 📱 Xcode:
   • Enable In-App Purchase capability
   • Create StoreKit configuration file
   • Test with StoreKit configuration first

4. 🧪 Testing:
   • Test in simulator with StoreKit config
   • Test on device with sandbox account`,
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>RevenueCat Debug</Text>
        <Text style={styles.subtitle}>Diagnose IAP Issues</Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={runFullDebug}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>🔍 Full Debug</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={testPurchaseService}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>🧪 Test Service</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={testProductAvailability}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>📦 Test Products</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.helpButton]}
          onPress={showRecommendations}
        >
          <Text style={styles.buttonText}>💡 Get Help</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.outputContainer}>
        <Text style={styles.outputText}>
          {isLoading ? '⏳ Running tests...' : debugInfo || 'Tap a button to start debugging'}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  buttonContainer: {
    padding: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: '45%',
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  secondaryButton: {
    backgroundColor: '#34C759',
  },
  helpButton: {
    backgroundColor: '#FF9500',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  outputContainer: {
    flex: 1,
    margin: 20,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
  },
  outputText: {
    fontFamily: 'Courier',
    fontSize: 12,
    color: '#333',
    lineHeight: 18,
  },
});

export default RevenueCatDebugScreen;
