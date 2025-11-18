import React, { useEffect, useRef, useState } from 'react';
import {
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  Animated,
  Easing,
  ScrollView,
  Image,
  TouchableOpacity,
  Linking,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAppTheme, useToggleTheme } from '../../theme/ThemeProvider';
import Card from '../../components/UI/Card';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { MainTabParamList } from '../../navigation/types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { clearAuthState } from '../../utils/auth.ts';
import { getUser } from '../../utils/storage.ts';
import { getSubscriptions } from '../../api/targets';
import { stopBackgroundFetch } from '../../services/BackgroundFetchService';
import { variables } from '../../../constants/index.js';

type TabProps = BottomTabScreenProps<MainTabParamList, 'Profile'>;
type RootNav = NativeStackNavigationProp<RootStackParamList>;

export default function ProfileScreen({
  navigation,
}: TabProps): React.ReactElement {
  const rootNavigation = navigation as unknown as RootNav;
  const { colors, spacing, radius, typography, shadows, dark } = useAppTheme();
  const toggleTheme = useToggleTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subscription, setSubscription] = useState<{
    is_valid: boolean;
    target_limit: number;
    subscription: {
      subscription_type: string;
      subscription_start: string | null;
      subscription_end: string | null;
    };
  } | null>(null);
  const [showSubscription, setShowSubscription] = useState(true); // default to true
  const fetchSubscriptionVisibility = async () => {
    try {
      const response = await fetch(
        'https://social-tracker.automasterpro.net/subscreenappshow.php',
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();
      // Assuming your PHP returns: {"status": "show"} or {"status": "hide"}
      setShowSubscription(data.status === 'show');
    } catch (error) {
      console.log('[Profile] Error fetching subscription visibility:', error);
      // Default to showing if there's an error
      setShowSubscription(true);
    }
  };

  // Entrance animation
  const fade = useRef(new Animated.Value(0)).current;
  const translate = useRef(new Animated.Value(12)).current;
  const buttonsFade = useRef(new Animated.Value(0)).current;
  const buttonsTranslate = useRef(new Animated.Value(12)).current;
  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fade, {
          toValue: 1,
          duration: 450,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
        Animated.timing(translate, {
          toValue: 0,
          duration: 450,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
      ]),
      Animated.parallel([
        Animated.timing(buttonsFade, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(buttonsTranslate, {
          toValue: 0,
          duration: 350,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [fade, translate, buttonsFade, buttonsTranslate]);

  useEffect(() => {
    void (async () => {
      const u = await getUser();
      if (u) {
        setName(u.name || '');
        setEmail(u.email || '');
      }
      await fetchSubscriptionVisibility();
      try {
        const sub = await getSubscriptions();
        console.log('[Profile] Subscription data:', sub);
        setSubscription(sub);
      } catch (error) {
        console.log('[Profile] Subscription error:', error);
        setSubscription({
          is_valid: false,
          target_limit: 0,
          subscription: {
            subscription_type: 'free',
            subscription_start: null,
            subscription_end: null,
          },
        });
      }
    })();
  }, []);

  const onLogout = async () => {
    console.log('[Profile] ===== LOGGING OUT =====');
    console.log('[Profile] Stopping background fetch...');
    stopBackgroundFetch();

    console.log('[Profile] Clearing all auth state...');
    await clearAuthState();

    console.log('[Profile] ✅ Logout complete, navigating to Login screen');
    rootNavigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  const subType = subscription?.subscription?.subscription_type || 'free';
  const subActive = subscription?.is_valid ? 'Active' : 'Inactive';
  const subEnd = subscription?.subscription?.subscription_end || '—';
  const targetLimit = subscription?.target_limit || 0;

  const avatarSource = { uri: '' };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Header bar */}
      <View
        style={[
          styles.headerBar,
          { backgroundColor: colors.surface, borderBottomColor: colors.border },
        ]}
      >
        <Pressable
          onPress={() => {
            if (rootNavigation.canGoBack()) {
              rootNavigation.goBack();
            }
          }}
          style={[styles.headerIconBtn, { borderColor: colors.border }]}
        >
          <Icon name="chevron-back" size={18} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Profile
        </Text>
        {/* spacer to balance center title */}
        <View style={{ alignItems: 'flex-end', marginBottom: 8 }}>
          <Pressable
            onPress={toggleTheme}
            style={[
              styles.toggleBtn,
              { borderColor: colors.border, backgroundColor: colors.surface },
            ]}
          >
            <Icon
              name={dark ? 'sunny' : 'moon'}
              size={18}
              color={colors.text}
            />
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 32,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Theme toggle row */}

        <Animated.View
          style={{ opacity: fade, transform: [{ translateY: translate }] }}
        >
          {/* Profile Row */}
          <View
            style={[
              styles.listItem,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                ...shadows.small,
              },
            ]}
          >
            <View
              style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}
            >
              <Image
                source={
                  avatarSource.uri
                    ? avatarSource
                    : require('../../../assets/img/icon.png')
                }
                style={[styles.avatarImg]}
              />
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text
                  style={[styles.itemTitle, { color: colors.text }]}
                  numberOfLines={1}
                >
                  {name || 'Your Name'}
                </Text>
                <Text
                  style={[styles.itemSub, { color: colors.textSecondary }]}
                  numberOfLines={1}
                >
                  {email || 'email@example.com'}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => rootNavigation.navigate('ProfileDetail')}
              style={[styles.itemAction, { backgroundColor: '#E9F0FF' }]}
            >
              <Icon name="chevron-forward" size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>

          <View style={{ height: 10 }} />

          {/* Subscription Plan Item - conditionally rendered */}
          {showSubscription && (
            <Pressable
              onPress={() => rootNavigation.navigate('Subscription')}
              style={[
                styles.listItem,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  ...shadows.small,
                },
              ]}
            >
              <View style={styles.itemLeftIconWrapper}>
                <Icon name="storefront" size={18} color={colors.primary} />
              </View>
              <Text style={[styles.itemTitle, { color: colors.text, flex: 1 }]}>
                Subscription Plan
              </Text>
              <Icon
                name="chevron-forward"
                size={18}
                color={colors.textSecondary}
              />
            </Pressable>
          )}

          {/* Language */}
          {/* <View
            style={[
              styles.listItem,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                ...shadows.small,
              },
            ]}
          >
            <View style={styles.itemLeftIconWrapper}>
              <Icon name="globe-outline" size={18} color={colors.primary} />
            </View>
            <Text style={[styles.itemTitle, { color: colors.text, flex: 1 }]}>
              Language
            </Text>
            <Icon
              name="chevron-forward"
              size={18}
              color={colors.textSecondary}
            />
          </View> */}

          {/* Help */}
          {/* <View
            style={[
              styles.listItem,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                ...shadows.small,
              },
            ]}
          >
            <View style={styles.itemLeftIconWrapper}>
              <Icon
                name="help-circle-outline"
                size={18}
                color={colors.primary}
              />
            </View>
            <Text style={[styles.itemTitle, { color: colors.text, flex: 1 }]}>
              Help
            </Text>
            <Icon
              name="chevron-forward"
              size={18}
              color={colors.textSecondary}
            />
          </View> */}

          {/* Terms */}
          <Pressable
            onPress={() => Linking.openURL(variables.APP.TERMS_URL)}
            style={[
              styles.listItem,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                ...shadows.small,
              },
            ]}
          >
            <View style={styles.itemLeftIconWrapper}>
              <Icon
                name="document-text-outline"
                size={18}
                color={colors.primary}
              />
            </View>
            <Text style={[styles.itemTitle, { color: colors.text, flex: 1 }]}>
              Terms and condition
            </Text>
            <Icon
              name="chevron-forward"
              size={18}
              color={colors.textSecondary}
            />
          </Pressable>

          {/* Privacy */}
          <Pressable
            onPress={() => Linking.openURL(variables.APP.PRIVACY_URL)}
            style={[
              styles.listItem,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                ...shadows.small,
              },
            ]}
          >
            <View style={styles.itemLeftIconWrapper}>
              <Icon
                name="information-circle-outline"
                size={18}
                color={colors.primary}
              />
            </View>
            <Text style={[styles.itemTitle, { color: colors.text, flex: 1 }]}>
              Privacy Policy
            </Text>
            <Icon
              name="chevron-forward"
              size={18}
              color={colors.textSecondary}
            />
          </Pressable>

          {/* Logout Button */}
          {/* Logout button (outlined red like screenshot) */}
          <Animated.View
            style={{
              opacity: buttonsFade,
              transform: [{ translateY: buttonsTranslate }],
              marginTop: 24,
              alignItems: 'center',
            }}
          >
            <Pressable
              style={[
                styles.logoutBtn,
                { borderColor: '#FF3B30', ...shadows.small },
              ]}
              onPress={onLogout}
            >
              <Text style={styles.logoutLabel}>Log Out</Text>
            </Pressable>
          </Animated.View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '800',
  },
  toggleBtn: { padding: 8, borderRadius: 999, borderWidth: 1 },
  listItem: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarImg: { width: 44, height: 44, borderRadius: 22 },
  itemLeftIconWrapper: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#E9F0FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  itemTitle: { fontSize: 16, fontWeight: '700' },
  itemSub: { fontSize: 12, fontWeight: '600' },
  itemAction: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardPadded: { padding: 16, borderWidth: 1 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  badgeLabel: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 11,
    letterSpacing: 0.3,
  },
  logoutBtn: {
    width: 240,
    paddingVertical: 14,
    borderRadius: 999,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  logoutLabel: { color: '#FF3B30', fontWeight: '800', fontSize: 16 },
});
