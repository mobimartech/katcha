import React from 'react';
import {
  NavigationContainer,
  DefaultTheme,
  DarkTheme,
  Theme,
} from '@react-navigation/native';
import { navigationRef } from './navigationRef';
import { useAppTheme } from '../theme/ThemeProvider';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from './types';
import SplashScreen from '../screens/Splash/SplashScreen.tsx';
import LoginScreen from '../screens/Auth/LoginScreen.tsx';
import SignUpScreen from '../screens/Auth/SignUpScreen.tsx';
import MainTabs from './MainTabs';
import UserDetailScreen from '../screens/Home/UserDetailScreen.tsx';
import AddUserScreen from '../screens/Home/AddUserScreen.tsx';
import SubscriptionScreen from '../screens/Profile/SubscriptionScreen.tsx';
import OnboardingScreen from '../screens/OnboardingScreen.tsx';
import PaywallScreen from '../screens/Profile/paywall.tsx';
import ProfileDetailScreen from '../screens/Profile/ProfileDetailScreen.tsx';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator(): React.ReactElement {
  const { dark, colors } = useAppTheme();
  const navTheme: Theme = dark ? DarkTheme : DefaultTheme;
  navTheme.colors.background = colors.background as string;
  navTheme.colors.card = colors.surface as string;
  navTheme.colors.text = colors.text as string;
  navTheme.colors.primary = colors.primary as string;
  return (
    <NavigationContainer theme={navTheme} ref={navigationRef}>
      <Stack.Navigator>
        <Stack.Screen
          name="Splash"
          component={SplashScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="SignUp"
          component={SignUpScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="MainTabs"
          component={MainTabs}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Paywall"
          component={PaywallScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Onboarding"
          component={OnboardingScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="UserDetail"
          component={UserDetailScreen}
          options={{ title: 'User Detail',headerShown: false }}
        />
        <Stack.Screen
          name="AddUser"
          component={AddUserScreen}
          options={{ presentation: 'modal', headerShown: false }}
        />
        <Stack.Screen
          name="Subscription"
          component={SubscriptionScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ProfileDetail"
          component={ProfileDetailScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
