import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Alert,
  Animated,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Theme from '../constants/Theme';
import RewardAdService from '../services/RewardAdService';
import variables from '../../constants/variables';
import { Linking } from 'react-native';

const { width, height } = Dimensions.get('window');

interface PaywallModalProps {
  visible: boolean;
  onClose: () => void;
  onPurchase: () => void;
  rewardAdCount: number;
  rewardGenerations: number;
}

const PaywallModal: React.FC<PaywallModalProps> = ({
  visible,
  onClose,
  onPurchase,
  rewardAdCount,
  rewardGenerations,
}) => {
  const [loadingAd, setLoadingAd] = useState(false);
  const [adReady, setAdReady] = useState(false);
  const [translateYAnim] = useState(new Animated.Value(300));
  const [fadeAnim] = useState(new Animated.Value(0));

  const handleClose = () => {
    // Animate out before closing
    Animated.parallel([
      Animated.timing(translateYAnim, {
        toValue: 300,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  useEffect(() => {
    if (visible) {
      setAdReady(RewardAdService.isAnyAdReady());

      // Start animations - slide up from bottom
      Animated.parallel([
        Animated.spring(translateYAnim, {
          toValue: 0,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      translateYAnim.setValue(300);
      fadeAnim.setValue(0);
    }
  }, [visible]);

  const handleWatchAd = async () => {
    try {
      setLoadingAd(true);
      console.log('🎬 User clicked watch ad button');

      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Ad timeout')), 45000); // 45 second timeout
      });

      // Race between ad showing and timeout
      const result = await Promise.race([
        RewardAdService.showRewardAd(),
        timeoutPromise
      ]) as { success: boolean; message: string; type: 'reward' | 'interstitial' };

      console.log('🎬 Ad result:', result);

      if (result.success) {
        // Ad was shown successfully - now wait for user to complete it
        const adType = result.type === 'interstitial' ? 'Interstitial' : 'Reward';
        console.log(`🎬 ${adType} ad shown successfully - waiting for user completion`);

        // Set up callback to close modal when ad is actually completed
        const completionCallback = () => {
          console.log('🎉 Ad completed by user - closing modal');
          handleClose();
        };

        RewardAdService.addAdCompletionCallback(completionCallback);

        // Set a safety timeout in case callback doesn't fire
        setTimeout(() => {
          console.log('🎬 Ad completion timeout - closing modal');
          RewardAdService.removeAdCompletionCallback(completionCallback);
          handleClose();
        }, 120000); // 2 minutes safety timeout

      } else {
        console.warn('⚠️ Failed to show ad:', result.message);
        Alert.alert(
          'Ad Not Available',
          result.message || 'Unable to show ad right now. Please try again later.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('❌ Error showing reward ad:', error);

      if (error instanceof Error && error.message === 'Ad timeout') {
        Alert.alert(
          'Timeout',
          'Ad took too long to load. Please try again.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Error',
          'Something went wrong. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } finally {
      setLoadingAd(false);
    }
  };

  const getAdButtonText = () => {
    const config = variables.APP.REWARD_AD_CONFIG;

    if (rewardGenerations > 0) {
      return `Use Reward Generation (${rewardGenerations} left)`;
    }

    const adsNeeded = config.ADS_REQUIRED - rewardAdCount;
    if (adsNeeded > 0) {
      return `Watch ${adsNeeded} Ad${adsNeeded > 1 ? 's' : ''} for ${config.GENERATIONS_REWARD} Free Generations`;
    }

    return `Get ${config.GENERATIONS_REWARD} Free Generations`;
  };

  const getAdButtonSubtext = () => {
    const config = variables.APP.REWARD_AD_CONFIG;

    if (rewardGenerations > 0) {
      return 'You have reward generations available!';
    }

    if (rewardAdCount > 0) {
      return `${rewardAdCount}/${config.ADS_REQUIRED} ads watched`;
    }

    if (!adReady) {
      return 'Loading ad... If reward ads aren\'t available, we\'ll show a quick interstitial ad instead.';
    }

    return `Watch ${config.ADS_REQUIRED} short ads to unlock ${config.GENERATIONS_REWARD} free generations. Fallback to interstitial if needed.`;
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

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={handleClose}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          <Animated.View
            style={[
              styles.modal,
              {
                opacity: fadeAnim,
                transform: [{ translateY: translateYAnim }],
              },
            ]}
          >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <Icon name="close" size={24} color="#666" />
            </TouchableOpacity>
            <Text style={styles.title}>Choose Your Option</Text>
          </View>

          {/* Content */}
          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <Icon name="heart" size={40} color={Theme.COLORS.PRIMARY} />
            </View>
            
            <Text style={styles.subtitle}>
              You've used all your free generations
            </Text>
            
            <Text style={styles.description}>
              Choose how you'd like to continue creating baby photos
            </Text>

            {/* Purchase Option */}
            <TouchableOpacity
              style={[styles.optionButton, styles.purchaseButton]}
              onPress={onPurchase}
              activeOpacity={0.9}
            >
              <View style={styles.optionContent}>
                <Icon name="diamond" size={24} color="#FFFFFF" />
                <View style={styles.optionText}>
                  <Text style={styles.optionTitle}>Get Premium</Text>
                  <Text style={styles.optionSubtitle}>Unlock generations</Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* Watch Ads Option */}
            <TouchableOpacity
              style={[styles.optionButton, styles.adButton]}
              onPress={rewardGenerations > 0 ? handleClose : handleWatchAd}
              disabled={loadingAd || (!adReady && rewardGenerations === 0)}
              activeOpacity={0.9}
            >
              <View style={styles.optionContent}>
                {loadingAd ? (
                  <ActivityIndicator size="small" color={Theme.COLORS.PRIMARY} />
                ) : (
                  <Icon
                    name={rewardGenerations > 0 ? "gift" : "play-circle"}
                    size={24}
                    color={Theme.COLORS.PRIMARY}
                  />
                )}
                <View style={styles.optionText}>
                  <Text style={[styles.optionTitle, styles.adOptionTitle]}>
                    {getAdButtonText()}
                  </Text>
                  <Text style={[styles.optionSubtitle, styles.adOptionSubtitle]}>
                    {getAdButtonSubtext()}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>

            {!adReady && rewardGenerations === 0 && (
              <Text style={styles.adNotReadyText}>
                Loading reward ad... If unavailable, we'll show an interstitial ad instead
              </Text>
            )}

            {/* Footer Links */}
            <View style={styles.footerLinks}>
              <TouchableOpacity onPress={openTerms}>
                <Text style={styles.linkText}>Terms</Text>
              </TouchableOpacity>

              <Text style={styles.separatorText}> • </Text>

              <TouchableOpacity onPress={openPrivacy}>
                <Text style={styles.linkText}>Privacy</Text>
              </TouchableOpacity>
            </View>
          </View>
          </Animated.View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? 50 : 30,
    paddingHorizontal: 20,
    paddingTop: 60, // Ensure modal doesn't go too high
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: width * 0.9,
    maxWidth: 400,
    maxHeight: height * 0.65, // Reduced from 0.75 to 0.65
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  closeButton: {
    position: 'absolute',
    left: 20,
    top: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Theme.COLORS.BLACK,
  },
  content: {
    padding: 20,
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 107, 157, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Theme.COLORS.BLACK,
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: Theme.COLORS.GRAY,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 20,
  },
  optionButton: {
    width: '100%',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  purchaseButton: {
    backgroundColor: Theme.COLORS.PRIMARY,
  },
  adButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: Theme.COLORS.PRIMARY,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  optionText: {
    marginLeft: 12,
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  adOptionTitle: {
    color: Theme.COLORS.PRIMARY,
  },
  optionSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  adOptionSubtitle: {
    color: `${Theme.COLORS.PRIMARY}B3`, // 70% opacity
  },
  adNotReadyText: {
    fontSize: 12,
    color: Theme.COLORS.GRAY,
    textAlign: 'center',
    marginTop: 10,
    fontStyle: 'italic',
  },
  footerLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    paddingHorizontal: 20,
  },
  linkText: {
    fontSize: 14,
    color: Theme.COLORS.PRIMARY,
    fontWeight: '600',
  },
  separatorText: {
    fontSize: 14,
    color: Theme.COLORS.GRAY,
    fontWeight: '400',
  },
});

export default PaywallModal;
