import React, { useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useAppTheme } from '../../theme/ThemeProvider';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { setIsLoggedIn } from '../../utils/auth.ts';
import { registerForPushNotifications } from '../../notifications/messaging';
import { initializeBackgroundFetch } from '../../services/BackgroundFetchService';
import { getDeviceId } from '../../utils/storage';
import { googleLogin } from '../../api/auth';
import { auth } from '../../firebase';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props): React.ReactElement {
  const { colors } = useAppTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const onLogin = async () => {
    if (!email || !password) {
      Alert.alert('Missing Info', 'Enter email and password');
      return;
    }
    setLoading(true);
    try {
      console.log('[Login] Step 1: Attempting Firebase login with:', email);

      const userCredential = await auth().signInWithEmailAndPassword(
        email,
        password
      );

      const firebaseUser = userCredential.user;
      console.log('[Login] Step 2: Firebase login successful');
      console.log('[Login] Firebase UID:', firebaseUser.uid);

      const deviceId = await getDeviceId();
      console.log('[Login] Step 3: Device ID:', deviceId);

      console.log('[Login] Step 4: Calling backend googleLogin...');
      const backendPayload = {
        action: 'google_login' as const,
        google_id: firebaseUser.uid,
        email: firebaseUser.email || email,
        name: firebaseUser.displayName || email.split('@')[0],
        device_id: deviceId,
        firebaseID: firebaseUser.uid,
      };

      console.log(
        '[Login] Backend payload:',
        JSON.stringify(backendPayload, null, 2)
      );

      const authTokens = await googleLogin(backendPayload);
      console.log('[Login] Step 5: Backend authentication successful');

      await setIsLoggedIn(true);
      await initializeBackgroundFetch();
      void registerForPushNotifications();

      console.log('[Login] Step 6: Navigation to MainTabs');
      navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
    } catch (e: any) {
      console.error('[Login] Login error:', e);

      let errorMessage = 'Invalid credentials';
      if (e.message?.includes('user-not-found')) {
        errorMessage = 'No account found with this email';
      } else if (e.message?.includes('wrong-password')) {
        errorMessage = 'Incorrect password';
      } else if (e.message?.includes('invalid-email')) {
        errorMessage = 'Invalid email format';
      } else if (e.message?.includes('network')) {
        errorMessage = 'Network error. Please check your connection';
      } else if (e.message) {
        errorMessage = e.message;
      }

      Alert.alert('Login Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#658EFF', '#B27FFF']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Logo */}
            <View style={styles.logoContainer}>
              <Image
                source={require('../../../assets/img/logo.jpg')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>

            {/* White Card Container */}
            <View style={styles.card}>
              <Text style={styles.title}>Log In</Text>

              {/* Email Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your email"
                    placeholderTextColor="#999"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    value={email}
                    onChangeText={setEmail}
                  />
                </View>
              </View>

              {/* Password Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="Write your password"
                    placeholderTextColor="#999"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                  />
                  <Pressable
                    style={styles.eyeIcon}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Text style={styles.eyeIconText}>
                      {showPassword ? '👁️' : '👁️‍🗨️'}
                    </Text>
                  </Pressable>
                </View>
              </View>

              {/* Remember Me */}
              <Pressable
                style={styles.rememberMeContainer}
                onPress={() => setRememberMe(!rememberMe)}
              >
                <View
                  style={[
                    styles.checkbox,
                    rememberMe && styles.checkboxChecked,
                  ]}
                >
                  {rememberMe && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.rememberMeText}>Remember me</Text>
              </Pressable>

              {/* Login Button */}
              <Pressable
                style={styles.loginButtonContainer}
                onPress={onLogin}
                disabled={loading}
              >
                <LinearGradient
                  colors={['#7A86FF', '#3C9DFF']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[
                    styles.loginButton,
                    loading && styles.loginButtonDisabled,
                  ]}
                >
                  <Text style={styles.loginButtonText}>
                    {loading ? 'Logging in...' : 'Log In'}
                  </Text>
                </LinearGradient>
              </Pressable>
            </View>

            {/* Sign Up Link */}
            <Pressable
              onPress={() => navigation.navigate('SignUp')}
              style={styles.signUpContainer}
            >
              <Text style={styles.signUpText}>Create an account</Text>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 20,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    width: 200,
    height: 200,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
    textAlign: 'center',
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#000',
  },
  eyeIcon: {
    padding: 8,
  },
  eyeIconText: {
    fontSize: 20,
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#FF6B9D',
    borderColor: '#FF6B9D',
  },
  checkmark: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  rememberMeText: {
    fontSize: 14,
    color: '#000',
  },
  loginButtonContainer: {
    borderRadius: 16,
    shadowColor: '#7C6EF7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  loginButton: {
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  signUpContainer: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 20,
  },
  signUpText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
