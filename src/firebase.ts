// src/firebase.ts
import auth from '@react-native-firebase/auth';
import type { FirebaseAuthTypes } from '@react-native-firebase/auth';

// Export the auth module for use in your app
export { auth };
export type { FirebaseAuthTypes };

// Helper function to get current user
export const getCurrentUser = (): FirebaseAuthTypes.User | null => {
  return auth().currentUser;
};

// Helper function to get user display name
export const getCurrentUserName = (): string => {
  const user = auth().currentUser;
  return user?.displayName || user?.email?.split('@')[0] || 'User';
};