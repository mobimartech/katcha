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
import { getDeviceId } from '../../utils/storage';
import { googleLogin } from '../../api/auth';
import { auth } from '../../firebase';

type Props = NativeStackScreenProps<RootStackParamList, 'SignUp'>;

export default function SignUpScreen({
  navigation,
}: Props): React.ReactElement {
  const { colors } = useAppTheme();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [loading, setLoading] = useState(false);

  const onSignUp = async () => {
    if (!email || !password || !name) {
      Alert.alert('Missing Info', 'Enter name, email and password');
      return;
    }

    if (!agreeToTerms) {
      Alert.alert(
        'Terms Required',
        'Please agree to the Terms & Conditions and Privacy Policy'
      );
      return;
    }

    setLoading(true);
    try {
      console.log('[SignUp] Step 1: Creating Firebase account...');

      const userCredential = await auth().createUserWithEmailAndPassword(
        email,
        password
      );

      console.log('[SignUp] Step 2: Updating Firebase profile...');
      await userCredential.user.updateProfile({
        displayName: name,
      });

      const firebaseUser = userCredential.user;
      console.log('[SignUp] Step 3: Firebase account created');
      console.log('[SignUp] Firebase UID:', firebaseUser.uid);

      const deviceId = await getDeviceId();
      console.log('[SignUp] Step 4: Device ID:', deviceId);

      console.log('[SignUp] Step 5: Registering with backend...');
      const backendPayload = {
        action: 'google_login' as const,
        google_id: firebaseUser.uid,
        email: firebaseUser.email || email,
        name: name,
        device_id: deviceId,
        firebaseID: firebaseUser.uid,
      };

      console.log(
        '[SignUp] Backend payload:',
        JSON.stringify(backendPayload, null, 2)
      );

      const authTokens = await googleLogin(backendPayload);
      console.log('[SignUp] Step 6: Backend registration successful');

      Alert.alert('Success', 'Account created successfully!', [
        {
          text: 'OK',
          onPress: () => navigation.replace('Login'),
        },
      ]);
    } catch (e: any) {
      console.error('[SignUp] Sign up error:', e);

      let errorMessage = 'Could not create account';
      if (e.message?.includes('email-already-in-use')) {
        errorMessage = 'This email is already registered';
      } else if (e.message?.includes('weak-password')) {
        errorMessage = 'Password should be at least 6 characters';
      } else if (e.message?.includes('invalid-email')) {
        errorMessage = 'Invalid email format';
      } else if (e.message?.includes('network')) {
        errorMessage = 'Network error. Please check your connection';
      } else if (e.message) {
        errorMessage = e.message;
      }

      Alert.alert('Sign Up Failed', errorMessage);
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
              <Text style={styles.title}>Sign Up</Text>

              {/* Full Name Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Full Name</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="Write your name"
                    placeholderTextColor="#999"
                    autoCapitalize="words"
                    value={name}
                    onChangeText={setName}
                  />
                </View>
              </View>

              {/* Email Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="Write your email"
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

              {/* Terms & Conditions */}
              <Pressable
                style={styles.termsContainer}
                onPress={() => setAgreeToTerms(!agreeToTerms)}
              >
                <View
                  style={[
                    styles.checkbox,
                    agreeToTerms && styles.checkboxChecked,
                  ]}
                >
                  {agreeToTerms && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.termsText}>
                  I agree to the{' '}
                  <Text style={styles.termsLink}>Terms & Conditions</Text>
                  {'\n'}and <Text style={styles.termsLink}>Privacy Policy</Text>
                </Text>
              </Pressable>

              {/* Sign Up Button */}
              <Pressable
                style={styles.signUpButtonContainer}
                onPress={onSignUp}
                disabled={loading}
              >
                <LinearGradient
                  colors={['#7A86FF', '#3C9DFF']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[
                    styles.signUpButton,
                    loading && styles.signUpButtonDisabled,
                  ]}
                >
                  <Text style={styles.signUpButtonText}>
                    {loading ? 'Creating...' : 'Sign Up'}
                  </Text>
                </LinearGradient>
              </Pressable>
            </View>

            {/* Login Link */}
            <Pressable
              onPress={() => navigation.navigate('Login')}
              style={styles.loginContainer}
            >
              <Text style={styles.loginText}>
                Already have an account? Log In
              </Text>
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
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    marginRight: 10,
    marginTop: 2,
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
  termsText: {
    flex: 1,
    fontSize: 13,
    color: '#000',
    lineHeight: 20,
  },
  termsLink: {
    color: '#5B9EFF',
    fontWeight: '600',
  },
  signUpButtonContainer: {
    borderRadius: 16,
    shadowColor: '#7C6EF7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  signUpButton: {
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  signUpButtonDisabled: {
    opacity: 0.6,
  },
  signUpButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  loginContainer: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 20,
  },
  loginText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
