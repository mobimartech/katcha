import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
  StatusBar,
  SafeAreaView,
  Text,
  Animated,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Theme from '../../constants/Theme';
import DirectIAPService, { ProductInfo } from '../../services/DirectIAPService';
import variables from '../../../constants/variables';
import { Linking } from 'react-native';

const { width, height } = Dimensions.get('window');

interface DirectPurchaseScreenProps {
  navigation: any;
  route?: {
    params?: {
      fromGenerate?: boolean;
    };
  };
}

const DirectPurchaseScreen: React.FC<DirectPurchaseScreenProps> = ({ navigation, route }) => {
  const [products, setProducts] = useState<ProductInfo[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [restoring, setRestoring] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  const fromGenerate = route?.params?.fromGenerate || false;

  useEffect(() => {
    loadProducts();
    checkPremiumStatus();
    startAnimations();
  }, []);

  const startAnimations = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const checkPremiumStatus = async () => {
    try {
      const premium = await DirectIAPService.checkPremiumStatus();

      if (premium && fromGenerate) {
        // User is already premium, go back to generate
        navigation.goBack();
      }
    } catch (error) {
      console.error('Failed to check premium status:', error);
    }
  };

  const loadProducts = async () => {
    try {
      setLoadingProducts(true);

      // Get real products from App Store
      const realProducts = await DirectIAPService.getAvailableProducts();
      console.log('📱 Loaded products from App Store:', realProducts);
      
      setProducts(realProducts);

      // Set default selected plan (prefer yearly if available)
      if (realProducts.length > 0) {
        const yearlyProduct = realProducts.find(p => p.id.includes('yearly'));
        const defaultProduct = yearlyProduct || realProducts[0];
        setSelectedPlan(defaultProduct.id);
      }
    } catch (error) {
      console.error('❌ Failed to load products:', error);
      Alert.alert(
        'Products Unavailable',
        'Unable to load subscription options. Please check your internet connection and try again.',
        [
          { text: 'Retry', onPress: loadProducts },
          { text: 'Cancel', onPress: () => navigation.goBack() }
        ]
      );
    } finally {
      setLoadingProducts(false);
    }
  };

  const handlePurchase = async (productId: string) => {
    try {
      setLoading(true);

      // Purchase using Direct IAP Service
      const result = await DirectIAPService.purchaseProduct(productId);

      if (result.success) {
        // Check premium status after purchase
        const isPremiumNow = await DirectIAPService.checkPremiumStatus();

        if (isPremiumNow) {
          Alert.alert(
            'Purchase Successful! 🎉',
            'Welcome to Baby Generator Premium! You now have Unlock access to all features.',
            [
              {
                text: 'Continue',
                onPress: () => {
                  if (fromGenerate) {
                    navigation.goBack();
                  } else {
                    navigation.navigate('HomeScreen');
                  }
                },
              },
            ]
          );
        }
      } else {
        Alert.alert('Purchase Failed', result.error || 'Purchase was not completed. Please try again.');
      }
    } catch (error: any) {
      console.error('❌ Purchase failed:', error);
      
      let errorMessage = 'Purchase failed. Please try again.';
      if (error.code === 'E_USER_CANCELLED') {
        errorMessage = 'Purchase was cancelled.';
      } else if (error.code === 'E_NETWORK_ERROR') {
        errorMessage = 'Network error. Please check your connection.';
      }
      
      Alert.alert('Purchase Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    try {
      setRestoring(true);

      // Use DirectIAPService for restore
      const success = await DirectIAPService.restorePurchases();

      if (success) {
        const isPremium = await DirectIAPService.checkPremiumStatus();

        if (isPremium) {
          Alert.alert(
            'Restore Successful! 🎉',
            'Your premium subscription has been restored.',
            [
              {
                text: 'Continue',
                onPress: () => {
                  if (fromGenerate) {
                    navigation.goBack();
                  } else {
                    navigation.navigate('HomeScreen');
                  }
                },
              },
            ]
          );
        } else {
          Alert.alert('No Purchases Found', 'No previous purchases were found to restore.');
        }
      } else {
        Alert.alert('No Purchases Found', 'No previous purchases were found to restore.');
      }
    } catch (error) {
      console.error('Restore error:', error);
      Alert.alert('Restore Failed', 'Unable to restore purchases. Please try again.');
    } finally {
      setRestoring(false);
    }
  };

  const openTerms = () => {
    Linking.openURL(variables.APP.TERMS_URL).catch(err => {
      console.error('Failed to open Terms URL:', err);
      Alert.alert('Error', 'Unable to open Terms of Service');
    });
  };

  const openPrivacy = () => {
    Linking.openURL(variables.APP.PRIVACY_URL).catch(err => {
      console.error('Failed to open Privacy URL:', err);
      Alert.alert('Error', 'Unable to open Privacy Policy');
    });
  };

  const renderProductCard = (product: ProductInfo) => {
    const isSelected = selectedPlan === product.id;
    
    return (
      <TouchableOpacity
        key={product.id}
        style={[
          styles.planCard,
          isSelected && styles.selectedPlanCard,
          product.popular && styles.popularPlanCard,
        ]}
        onPress={() => setSelectedPlan(product.id)}
        activeOpacity={0.8}
      >
        {product.popular && (
          <View style={styles.popularBadge}>
            <Text style={styles.popularBadgeText}>MOST POPULAR</Text>
          </View>
        )}
        
        <View style={styles.planHeader}>
          <Text style={[styles.planTitle, isSelected && styles.selectedPlanTitle]}>
            {product.title}
          </Text>
          <Text style={[styles.planPrice, isSelected && styles.selectedPlanPrice]}>
            {product.price}
            {product.period && <Text style={styles.planPeriod}>/{product.period}</Text>}
          </Text>
          {product.savings && (
            <Text style={styles.savingsText}>{product.savings}</Text>
          )}
        </View>

        <View style={styles.featuresContainer}>
          {product.features.map((feature, index) => (
            <View key={index} style={styles.featureRow}>
              <Icon 
                name="checkmark-circle" 
                size={16} 
                color={isSelected ? Theme.COLORS.PRIMARY : Theme.COLORS.SUCCESS} 
              />
              <Text style={[styles.featureText, isSelected && styles.selectedFeatureText]}>
                {feature}
              </Text>
            </View>
          ))}
        </View>

        {isSelected && (
          <View style={styles.selectedIndicator}>
            <Icon name="radio-button-on" size={24} color={Theme.COLORS.PRIMARY} />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loadingProducts) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={Theme.COLORS.PRIMARY} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Theme.COLORS.PRIMARY} />
          <Text style={styles.loadingText}>Loading subscription options...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Theme.COLORS.PRIMARY} />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Animated.View 
          style={[
            styles.header,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }
          ]}
        >
          <TouchableOpacity 
            style={styles.closeButton} 
            onPress={() => navigation.goBack()}
          >
            <Icon name="close" size={28} color="#FFFFFF" />
          </TouchableOpacity>
          
          <View style={styles.headerContent}>
            <Icon name="diamond" size={48} color="#FFFFFF" />
            <Text style={styles.headerTitle}>Unlock Premium</Text>
            <Text style={styles.headerSubtitle}>
              Get Unlock access to all baby generation features
            </Text>
          </View>
        </Animated.View>

        {/* Plans */}
        <Animated.View
          style={[
            styles.plansContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            }
          ]}
        >
          {products.map(renderProductCard)}
        </Animated.View>

        {/* Purchase Button */}
        <Animated.View
          style={[
            styles.purchaseSection,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            }
          ]}
        >
          <TouchableOpacity
            style={styles.purchaseButton}
            onPress={() => handlePurchase(selectedPlan)}
            disabled={loading || !selectedPlan}
            activeOpacity={0.9}
          >
            {loading ? (
              <ActivityIndicator size="large" color="#FFFFFF" />
            ) : (
              <>
                <Icon name="diamond" size={24} color="#FFFFFF" />
                <Text style={styles.purchaseButtonText}>Start Premium</Text>
              </>
            )}
          </TouchableOpacity>
          
          {/* Legal Links and Restore */}
          <View style={styles.footerLinks}>
            <TouchableOpacity onPress={openTerms}>
              <Text style={styles.linkText}>Terms</Text>
            </TouchableOpacity>

            <Text style={styles.separatorText}> • </Text>

            <TouchableOpacity onPress={openPrivacy}>
              <Text style={styles.linkText}>Privacy</Text>
            </TouchableOpacity>

            <Text style={styles.separatorText}> • </Text>

            <TouchableOpacity onPress={handleRestore} disabled={restoring}>
              <Text style={[styles.linkText, restoring && styles.linkTextDisabled]}>
                {restoring ? 'Restoring...' : 'Restore'}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.COLORS.PRIMARY,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Theme.COLORS.PRIMARY,
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 16,
    // fontFamily: Theme.fonts.medium,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 20 : 40,
    paddingHorizontal: 20,
    paddingBottom: 30,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 20 : 40,
    right: 20,
    zIndex: 1,
    padding: 8,
  },
  headerContent: {
    alignItems: 'center',
    marginTop: 20,
  },
  headerTitle: {
    fontSize: 32,
    // fontFamily: Theme.fonts.bold,
    color: '#FFFFFF',
    marginTop: 16,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    // fontFamily: Theme.fonts.regular,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
  },
  plansContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  planCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  selectedPlanCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderColor: '#FFFFFF',
  },
  popularPlanCard: {
    borderColor: Theme.COLORS.ACCENT,
  },
  popularBadge: {
    position: 'absolute',
    top: -8,
    left: 20,
    backgroundColor: Theme.COLORS.ACCENT,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    // fontFamily: Theme.fonts.bold,
  },
  planHeader: {
    marginBottom: 16,
  },
  planTitle: {
    fontSize: 20,
    // fontFamily: Theme.fonts.bold,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  selectedPlanTitle: {
    color: '#FFFFFF',
  },
  planPrice: {
    fontSize: 24,
    // fontFamily: Theme.fonts.bold,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  selectedPlanPrice: {
    color: '#FFFFFF',
  },
  planPeriod: {
    fontSize: 16,
    // fontFamily: Theme.fonts.regular,
  },
  savingsText: {
    fontSize: 14,
    // fontFamily: Theme.fonts.medium,
    color: Theme.COLORS.ACCENT,
    marginTop: 4,
  },
  featuresContainer: {
    marginTop: 8,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    fontSize: 14,
    // fontFamily: Theme.fonts.regular,
    color: 'rgba(255, 255, 255, 0.8)',
    marginLeft: 8,
    flex: 1,
  },
  selectedFeatureText: {
    color: '#FFFFFF',
  },
  selectedIndicator: {
    position: 'absolute',
    top: 20,
    right: 20,
  },
  purchaseSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  purchaseButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  purchaseButtonText: {
    fontSize: 18,
    // fontFamily: Theme.FONT_SIZES.bold,
    color: Theme.COLORS.PRIMARY,
    marginLeft: 8,
  },
  // New styles for footer links
  footerLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingHorizontal: 20,
  },
  linkText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  linkTextDisabled: {
    opacity: 0.5,
  },
  separatorText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '400',
  },
  bottomSpacing: {
    height: 40,
  },
});

export default DirectPurchaseScreen;
