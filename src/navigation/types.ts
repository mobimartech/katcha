import type { Target } from '../api/targets';

export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  SignUp: undefined;
  MainTabs: undefined;
  UserDetail: { userId: string; username: string; platform: 'instagram' | 'tiktok'; targetData?: Target };
  AddUser: undefined;
  Subscription: undefined;
  Onboarding: undefined;
  Paywall: undefined;
  ProfileDetail: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Notifications: undefined;
  Profile: undefined;
};


