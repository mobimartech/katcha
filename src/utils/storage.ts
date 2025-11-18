// Storage utils using AsyncStorage for persistence
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../firebase';

export async function setItem(key: string, value: string): Promise<void> {
  try {
    await AsyncStorage.setItem(key, value);
  } catch (e) {
    console.log('[Storage] Error setting item:', key, e);
  }
}

export async function getItem(key: string): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(key);
  } catch (e) {
    console.log('[Storage] Error getting item:', key, e);
    return null;
  }
}

export async function removeItem(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch (e) {
    console.log('[Storage] Error removing item:', key, e);
  }
}

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const BASE_URL_KEY = 'base_url';
const DEVICE_ID_KEY = 'device_id';
const API_KEY_KEY = 'api_key';
const API_SECRET_KEY = 'api_secret';
const USER_JSON_KEY = 'user_json';

export async function setTokens(access: string, refresh?: string): Promise<void> {
  console.log('[Storage] Setting tokens', { accessLen: access?.length, refreshLen: refresh?.length });
  await setItem(ACCESS_TOKEN_KEY, access);
  if (refresh) await setItem(REFRESH_TOKEN_KEY, refresh);
}

export async function getAccessToken(): Promise<string | null> {
  const token = await getItem(ACCESS_TOKEN_KEY);
  console.log('[Storage] Getting access token', { hasToken: !!token, tokenLen: token?.length });
  return token;
}

export async function getRefreshToken(): Promise<string | null> {
  return getItem(REFRESH_TOKEN_KEY);
}

export async function setBaseUrl(url: string): Promise<void> {
  await setItem(BASE_URL_KEY, url);
}

export async function getBaseUrl(): Promise<string | null> {
  return await getItem(BASE_URL_KEY);
}

export async function getDeviceId(): Promise<string> {
  let deviceId = await getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    const rand = Math.random().toString(16).slice(2);
    deviceId = `device_${rand}`;
    await setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
}

export type ApiCredentials = { apiKey: string; apiSecret: string };

export async function setApiCredentials(creds: ApiCredentials): Promise<void> {
  await setItem(API_KEY_KEY, creds.apiKey);
  await setItem(API_SECRET_KEY, creds.apiSecret);
}

export async function getApiCredentials(): Promise<ApiCredentials | null> {
  const apiKey = await getItem(API_KEY_KEY);
  const apiSecret = await getItem(API_SECRET_KEY);
  if (!apiKey || !apiSecret) return null;
  return { apiKey, apiSecret };
}

export type AuthUser = {
  id: number;
  email: string;
  google_id?: string | null;
  apple_id?: string | null;
  name: string;
  subscription_type?: string | null;
  subscription_start?: string | null;
  subscription_end?: string | null;
  created_at?: string;
  updated_at?: string;
};

export async function setUser(user: AuthUser): Promise<void> {
  await setItem(USER_JSON_KEY, JSON.stringify(user));
}

export async function getUser(): Promise<AuthUser | null> {
  // First, try to get from AsyncStorage
  const raw = await getItem(USER_JSON_KEY);
  if (raw) {
    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      // Fall through to Firebase
    }
  }

  // If not in storage, get from Firebase Auth
  const firebaseUser = auth().currentUser;
  if (firebaseUser) {
    const authUser: AuthUser = {
      id: 0, // You might want to store this elsewhere or use Firebase UID
      email: firebaseUser.email || '',
      name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
      created_at: firebaseUser.metadata.creationTime,
    };
    
    // Save to storage for future use
    await setUser(authUser);
    return authUser;
  }

  return null;
}

// New helper to sync Firebase user to storage
export async function syncFirebaseUserToStorage(): Promise<void> {
  const firebaseUser = auth().currentUser;
  if (firebaseUser) {
    const authUser: AuthUser = {
      id: 0, // You might want to generate or fetch this from your backend
      email: firebaseUser.email || '',
      name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
      created_at: firebaseUser.metadata.creationTime,
    };
    await setUser(authUser);
    console.log('[Storage] Synced Firebase user to storage:', authUser.name);
  }
}