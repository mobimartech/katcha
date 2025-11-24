import React, { useState } from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
  TouchableOpacity,
  Alert,
} from 'react-native';
import CryptoJS from 'crypto-js';
import { HmacSHA256 } from 'crypto-js';

const API_KEY =
  'd4f25ac2a42f35bf7a130dd3743f6e86b2b08f77d13edd116cfcaaadb81ab196';
const API_SECRET =
  '13397ff2fb52da6cc9beeb802bc1e41d35b655268e88007360e149d8744e5784';

function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';
  const [loading, setLoading] = useState(false);

  const backgroundColor = isDarkMode ? '#000000' : '#FFFFFF';
  const textColor = isDarkMode ? '#FFFFFF' : '#000000';

  const generateSignature = (
    method: string,
    path: string,
    timestamp: number
  ): string => {
    const stringToSign = `method=${method}&path=${path}&timestamp=${timestamp}`;

    console.log('=== Signature Generation ===');
    console.log('Method:', method);
    console.log('Path:', path);
    console.log('Timestamp:', timestamp);
    console.log('String to sign:', stringToSign);
    console.log('API Secret (first 10 chars):', API_SECRET.substring(0, 10));

    const signature = HmacSHA256(stringToSign, API_SECRET).toString(
      CryptoJS.enc.Hex
    );

    console.log('Generated signature:', signature);
    console.log('===========================');

    return signature;
  };

  const makeFetchRequest = async (
    url: string,
    headers: any,
    body: string
  ): Promise<any> => {
    try {
      console.log('Making fetch request to:', url);
      console.log('Headers:', JSON.stringify(headers, null, 2));
      console.log('Body:', body);

      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: body,
      });

      console.log('Fetch Response Status:', response.status);

      const responseText = await response.text();
      console.log('Fetch Response Text:', responseText);

      try {
        const parsedData = JSON.parse(responseText);
        return {
          status: response.status,
          data: parsedData,
        };
      } catch (e) {
        console.log('Failed to parse JSON, returning raw text');
        return {
          status: response.status,
          data: responseText,
        };
      }
    } catch (error) {
      console.error('Fetch error:', error);
      throw error;
    }
  };

  const getTargets = async (accessToken: string): Promise<any> => {
    try {
      console.log('\n--- GET TARGETS REQUEST ---\n');

      const timestamp = Math.floor(Date.now() / 1000);
      const method = 'GET';
      const path = '/api/targets';

      const signature = generateSignature(method, path, timestamp);

      const targetHeaders = {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'x-timestamp': timestamp.toString(),
        'x-signature': signature,
        authorization: `Bearer ${accessToken}`,
      };

      console.log('--- GET TARGETS REQUEST ---');
      console.log('Request Headers:', JSON.stringify(targetHeaders, null, 2));

      const response = await fetch('https://katchaapp.org/api/targets', {
        method: 'GET',
        headers: targetHeaders,
      });

      console.log('Get Targets Response Status:', response.status);

      const responseText = await response.text();
      console.log('Get Targets Response Text:', responseText);

      try {
        const parsedData = JSON.parse(responseText);
        return {
          status: response.status,
          data: parsedData,
        };
      } catch (e) {
        console.log('Failed to parse JSON, returning raw text');
        return {
          status: response.status,
          data: responseText,
        };
      }
    } catch (error) {
      console.error('Get Targets error:', error);
      throw error;
    }
  };

  const handleAPIRequests = async () => {
    setLoading(true);

    try {
      console.log('\n========== STARTING API REQUESTS ==========\n');

      const loginHeaders = {
        'Content-Type': 'application/json',
      };

      const loginBody = JSON.stringify({
        action: 'google_login',
        google_id: 'test_google_id_1',
        email: 'test@example.com',
        name: 'Test User',
        device_id: 'device_1',
      });

      console.log('--- LOGIN REQUEST ---');
      const loginResult = await makeFetchRequest(
        'https://katchaapp.org/api/auth',
        loginHeaders,
        loginBody
      );

      console.log('Login Result Status:', loginResult.status);
      console.log(
        'Login Result Data:',
        JSON.stringify(loginResult.data, null, 2)
      );

      if (!loginResult.data.success) {
        Alert.alert('Login Failed', JSON.stringify(loginResult.data, null, 2));
        setLoading(false);
        return;
      }

      if (!loginResult.data.tokens || !loginResult.data.tokens.access_token) {
        Alert.alert('Error', 'No access token received from login');
        setLoading(false);
        return;
      }

      const accessToken = loginResult.data.tokens.access_token;
      console.log('Access Token:', accessToken.substring(0, 20) + '...');

      // First, get existing targets
      console.log('\n--- Waiting 100ms before get targets request ---\n');
      await new Promise<void>((resolve) => setTimeout(() => resolve(), 100));

      const getTargetsResult = await getTargets(accessToken);
      console.log('Get Targets Result Status:', getTargetsResult.status);
      console.log(
        'Get Targets Result Data:',
        JSON.stringify(getTargetsResult.data, null, 2)
      );

      // Then, add a new target
      console.log('\n--- Waiting 100ms before add target request ---\n');
      await new Promise<void>((resolve) => setTimeout(() => resolve(), 100));

      const timestamp = Math.floor(Date.now() / 1000);
      const method = 'POST';
      const path = '/api/targets';

      const signature = generateSignature(method, path, timestamp);

      const targetBody = JSON.stringify({
        platform: 'instagram',
        username: 'instagram',
      });

      const targetHeaders = {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'x-timestamp': timestamp.toString(),
        'x-signature': signature,
        authorization: `Bearer ${accessToken}`,
      };

      console.log('--- ADD TARGET REQUEST ---');
      console.log('Request Headers:', JSON.stringify(targetHeaders, null, 2));
      console.log('Request Body:', targetBody);

      const targetResult = await makeFetchRequest(
        'https://katchaapp.org/api/targets',
        targetHeaders,
        targetBody
      );

      console.log('Add Target Result Status:', targetResult.status);
      console.log(
        'Add Target Result Data:',
        JSON.stringify(targetResult.data, null, 2)
      );

      if (targetResult.status === 200 && targetResult.data.success) {
        Alert.alert(
          'Success! 🎉',
          `Get Targets: ${
            getTargetsResult.data?.targets?.length || 0
          } targets found\n\nAdd Target: ${
            targetResult.data.message || 'Target added successfully'
          }`
        );
      } else {
        Alert.alert(
          'API Error',
          `Get Targets Status: ${getTargetsResult.status}\nAdd Target Status: ${
            targetResult.status
          }\n\nAdd Target Response:\n${JSON.stringify(
            targetResult.data,
            null,
            2
          )}`
        );
      }

      console.log('\n========== API REQUESTS COMPLETED ==========\n');
    } catch (error: any) {
      console.error('=== ERROR OCCURRED ===');
      console.error('Error Type:', error.constructor.name);
      console.error('Error Message:', error.message);
      console.error('Error Stack:', error.stack);
      console.error('=====================');

      Alert.alert(
        'Error',
        `An error occurred:\n\n${error.message || 'Unknown error'}`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: textColor }]}>
            Social Tracker App
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleAPIRequests}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Loading...' : 'Make API Requests'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoContainer}>
          <Text style={[styles.infoText, { color: textColor }]}>
            Tap the button above to test the API integration.
          </Text>
          <Text style={[styles.infoText, { color: textColor, marginTop: 10 }]}>
            This will:
          </Text>
          <Text style={[styles.infoText, { color: textColor, marginTop: 5 }]}>
            1. Login with Google credentials
          </Text>
          <Text style={[styles.infoText, { color: textColor, marginTop: 5 }]}>
            2. Add Instagram target with HMAC signature
          </Text>
          <Text style={[styles.infoText, { color: textColor, marginTop: 15 }]}>
            ✅ Using fetch() for better header support
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    marginTop: 60,
    marginBottom: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  buttonContainer: {
    alignItems: 'center',
    marginVertical: 30,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 12,
    minWidth: 250,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonDisabled: {
    backgroundColor: '#999',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  infoContainer: {
    marginTop: 30,
    padding: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  infoText: {
    fontSize: 16,
    lineHeight: 24,
  },
});

export default App;
