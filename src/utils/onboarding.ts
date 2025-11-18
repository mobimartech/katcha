import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_KEY = '@onboarding_complete';

/**
 * Check if user has completed onboarding
 */
export const getOnboardingComplete = async (): Promise<boolean> => {
  try {
    const value = await AsyncStorage.getItem(ONBOARDING_KEY);
    return value === 'true';
  } catch (error) {
    console.error('Error reading onboarding status:', error);
    return false;
  }
};

/**
 * Mark onboarding as complete
 */
export const setOnboardingComplete = async (): Promise<void> => {
  try {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    console.log('[Onboarding] Marked as complete');
  } catch (error) {
    console.error('Error setting onboarding status:', error);
  }
};

/**
 * Reset onboarding status (for testing purposes)
 */
export const resetOnboarding = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(ONBOARDING_KEY);
    console.log('[Onboarding] Reset');
  } catch (error) {
    console.error('Error resetting onboarding status:', error);
  }
};
