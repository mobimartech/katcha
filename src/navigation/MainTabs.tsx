import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';
import { View, StyleSheet, Platform } from 'react-native';
import { BlurView } from '@react-native-community/blur';
import LinearGradient from 'react-native-linear-gradient';
import { useAppTheme } from '../theme/ThemeProvider';
import type { MainTabParamList } from './types';
import HomeScreen from '../screens/Home/HomeScreen';
import NotificationsScreen from '../screens/Notifications/NotificationsScreen';
import ProfileScreen from '../screens/Profile/ProfileScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

// Ultra Glass Tab Bar Background
const CustomTabBarBackground = () => {
  if (Platform.OS === 'ios') {
    return (
      <View style={styles.tabBarBackgroundContainer}>
        <BlurView
          style={StyleSheet.absoluteFill}
          blurType="light"
          blurAmount={40}
          reducedTransparencyFallbackColor="rgba(255, 255, 255, 0.3)"
        />
        <LinearGradient
          colors={[
            'rgba(255, 255, 255, 0.15)',
            'rgba(255, 255, 255, 0.1)',
            'rgba(255, 255, 255, 0.12)',
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.4)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 0.25 }}
          style={styles.topGlow}
        />
      </View>
    );
  }

  return (
    <View style={styles.tabBarBackgroundContainer}>
      <LinearGradient
        colors={[
          'rgba(255, 255, 255, 0.35)',
          'rgba(255, 255, 255, 0.25)',
          'rgba(255, 255, 255, 0.3)',
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={['rgba(255, 255, 255, 0.5)', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 0.25 }}
        style={styles.topGlow}
      />
    </View>
  );
};

export default function MainTabs(): React.ReactElement {
  const { colors } = useAppTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        tabBarStyle: {
          position: 'absolute',
          bottom: 30,
          left: 30,
          right: 30,
          elevation: 0, // Remove shadow on Android
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          height: 75,
          borderRadius: 40,
          paddingBottom: 12,
          paddingTop: 12,
          shadowColor: 'transparent', // Remove shadow on iOS
          shadowOffset: {
            width: 0,
            height: 0,
          },
          shadowOpacity: 0,
          shadowRadius: 0,
        },
        tabBarBackground: () => <CustomTabBarBackground />,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: '#8E8E93',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          marginTop: 5,
          letterSpacing: 0.3,
        },
        tabBarItemStyle: {
          paddingVertical: 5,
        },
        tabBarIcon: ({ color, size, focused }) => {
          const map: Record<string, string> = {
            Home: focused ? 'home' : 'home-outline',
            Notifications: focused ? 'analytics' : 'analytics-outline',
            Profile: focused ? 'person-circle' : 'person-circle-outline',
          };

          return (
            <Icon
              name={map[route.name] || 'ellipse-outline'}
              color={color}
              size={focused ? size + 3 : size}
            />
          );
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          headerShown: false,
          tabBarLabel: 'Home',
        }}
      />
      <Tab.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          headerShown: false,
          tabBarLabel: 'Notifications',
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          headerShown: false,
          tabBarLabel: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBarBackgroundContainer: {
    flex: 1,
    borderRadius: 40,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  topGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '40%',
    pointerEvents: 'none',
  },
});
