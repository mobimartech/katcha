import React, { useRef, useState } from 'react';
import {
  Alert,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { useAppTheme } from '../../theme/ThemeProvider';
import { addTarget } from '../../api/targets';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import variables from '../../../constants/variables.js';

type Props = NativeStackScreenProps<RootStackParamList, 'AddUser'>;

export default function AddUserScreen({
  navigation,
}: Props): React.ReactElement {
  const { colors, spacing, radius, typography, shadows } = useAppTheme();
  const [username, setUsername] = useState('');
  const [platform, setPlatform] = useState<'instagram' | 'tiktok'>('instagram');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'choose' | 'form'>('choose');

  // Animations
  const headerFade = useRef(new Animated.Value(0)).current;
  const cardTranslate = useRef(new Animated.Value(12)).current;
  const addScale = useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(headerFade, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.timing(cardTranslate, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
    ]).start();
  }, [headerFade, cardTranslate]);

  const onAdd = async () => {
    if (!username.trim()) {
      Alert.alert('Missing', 'Enter a username');
      return;
    }
    try {
      setLoading(true);
      // eslint-disable-next-line no-console
      console.log('[AddUser][Request]', { platform, username });
      const res = await addTarget(platform, username.trim());
      // eslint-disable-next-line no-console
      console.log('[AddUser][Response]', res);

      if (res.status === 200) {
        Alert.alert(
          'Success',
          `@${username.trim()} on ${platform} added to tracking`,
          [
            {
              text: 'OK',
              onPress: () => {
                // Navigate back to HomeScreen
                navigation.goBack();
              },
            },
          ]
        );
      } else {
        const errorMessage = res.error || `API returned status ${res.status}`;
        Alert.alert(
          'Error',
          `Failed to add @${username.trim()}.\n${errorMessage}`,
          [
            {
              text: 'OK',
              onPress: () => {
                // Navigate back to HomeScreen even on error
                navigation.goBack();
                navigation.navigate('Subscription');
              },
            },
          ]
        );
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log('[AddUser][Error]', e);
      Alert.alert(
        'Error',
        `Failed to add @${username.trim()}. Please try again.`,
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate back to HomeScreen even on error
              navigation.goBack();
              navigation.navigate('Subscription');
            },
          },
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const onPressIn = () =>
    Animated.spring(addScale, { toValue: 0.97, useNativeDriver: true }).start();
  const onPressOut = () =>
    Animated.spring(addScale, { toValue: 1, useNativeDriver: true }).start();

  const isInstagram = platform === 'instagram';

  const renderHeader = () => (
    <View style={[styles.headerGradient]}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView>
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={() => {
              if (step === 'form') {
                setStep('choose');
              } else {
                navigation.goBack();
              }
            }}
            style={styles.backButton}
          >
            <Icon name="chevron-back" size={22} color="#000000" />
          </TouchableOpacity>
          <View style={styles.brandWrap}>
            <Image
              source={require('../../../assets/img/logo.jpg')}
              style={styles.logoImage}
              resizeMode="contain"
            />
            <Text style={styles.brandText}>{variables.APP.app_name}</Text>
          </View>
          <TouchableOpacity
            style={styles.notificationButton}
            onPress={() =>
              navigation.navigate(
                'MainTabs' as any,
                { screen: 'Notifications' } as any
              )
            }
          >
            <Icon name="notifications-outline" size={20} color="#000000" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );

  const ChoosePlatform = () => (
    <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
      <Animated.View style={{ opacity: headerFade }}>
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderRadius: radius.xl,
              ...shadows.small,
            },
          ]}
        >
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <View>
              <Text style={[styles.bigTitle, { color: colors.text }]}>
                Add a new account
              </Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Start tracking your followers and insights instantly.
              </Text>
            </View>
            <Icon name="search" size={18} color={colors.textSecondary} />
          </View>

          <View style={{ height: 16 }} />

          {/* Instagram Button */}
          <Pressable
            onPress={() => {
              setPlatform('instagram');
              setStep('form');
            }}
            style={[styles.shadowWrap, { marginBottom: 12 }]}
          >
            <LinearGradient
              colors={[colors.primary as string, '#6AA6FF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.ctaButton, { borderRadius: radius.round }]}
            >
              <Icon name="logo-instagram" size={20} color="#FFFFFF" />
              <Text style={styles.ctaText}>Connect Instagram Account</Text>
            </LinearGradient>
          </Pressable>

          {/* TikTok Button */}
          <Pressable
            onPress={() => {
              setPlatform('tiktok');
              setStep('form');
            }}
            style={styles.shadowWrap}
          >
            <View style={[styles.ctaButton, styles.ctaButtonBlack]}>
              <Icon name="logo-tiktok" size={20} color="#FFFFFF" />
              <Text style={styles.ctaText}>Connect TikTok Account</Text>
            </View>
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );

  const UsernameForm = () => (
    <KeyboardAvoidingScreen>
      <View
        style={[
          styles.sheet,
          { backgroundColor: colors.surface, paddingHorizontal: 16 },
        ]}
      >
        <ScrollView
          keyboardShouldPersistTaps="always"
          keyboardDismissMode="none"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
        >
          <Text style={[styles.title, { color: colors.text }]}>
            {platform === 'instagram'
              ? 'Add Instagram account'
              : 'Add TikTok account'}
          </Text>

          <View style={{ marginTop: 12 }}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              Username
            </Text>
            <TextInput
              placeholder="Enter username"
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
              value={username}
              onChangeText={setUsername}
              style={[
                styles.input,
                {
                  borderColor: colors.border,
                  color: colors.text,
                  borderRadius: radius.md,
                  padding: 16,
                },
              ]}
            />
          </View>
        </ScrollView>

        {/* Bottom CTA */}
        <Animated.View
          style={[styles.bottomCta, { transform: [{ scale: addScale }] }]}
        >
          <Pressable
            onPressIn={onPressIn}
            onPressOut={onPressOut}
            disabled={loading}
            onPress={onAdd}
            style={styles.shadowWrap}
          >
            <LinearGradient
              colors={[colors.primary as string, '#6AA6FF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.bottomButton}
            >
              <Text style={styles.bottomButtonText}>
                {loading ? 'Adding…' : 'Start Tracking'}
              </Text>
            </LinearGradient>
          </Pressable>
        </Animated.View>
      </View>
    </KeyboardAvoidingScreen>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.primary }}>
      {renderHeader()}
      {step === 'choose' ? <ChoosePlatform /> : <UsernameForm />}
    </View>
  );
}

function KeyboardAvoidingScreen({ children }: { children: React.ReactNode }) {
  if (Platform.OS === 'ios') {
    return (
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        {children}
      </KeyboardAvoidingView>
    );
  }
  return <>{children}</>;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontSize: 22, fontWeight: '800' },
  subtitle: { marginTop: 4, fontSize: 13, fontWeight: '600' },
  card: { padding: 16, borderWidth: 0, borderRadius: 0 },
  segmentRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  segment: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  input: { borderWidth: 1, marginTop: 8 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  addLabel: { color: '#fff', fontWeight: '800', marginLeft: 8 },
  headerGradient: {
    backgroundColor: '#6A85FF',
    paddingTop: 14,
    paddingBottom: 50,
  },
  headerContent: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  brandWrap: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  logoImage: { width: 28, height: 28, borderRadius: 8, marginRight: 10 },
  brandText: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  sheet: {
    flex: 1,
    marginTop: -12,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 16,
  },
  bigTitle: { fontSize: 22, fontWeight: '800' },
  shadowWrap: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    paddingHorizontal: 16,
    borderRadius: 28,
  },
  ctaText: { color: '#FFFFFF', fontWeight: '800', marginLeft: 8 },
  bottomCta: { position: 'absolute', left: 16, right: 16, bottom: 24 },
  bottomButton: {
    borderRadius: 28,
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomButtonText: { color: '#FFFFFF', fontWeight: '800', fontSize: 16 },
  ctaButtonBlack: { backgroundColor: '#000000', borderRadius: 28 },
});
