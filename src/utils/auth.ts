import { getItem, setItem, removeItem } from './storage';

const IS_LOGGED_IN_KEY = 'is_logged_in';

/**
 * Check if user is logged in by checking for access token
 * Returns true if user has a valid session
 */
export async function getIsLoggedIn(): Promise<boolean> {
  try {
    const isLoggedIn = await getItem(IS_LOGGED_IN_KEY);
    console.log('[Auth] Checking login status:', isLoggedIn === 'true');
    return isLoggedIn === 'true';
  } catch (error) {
    console.error('[Auth] Error checking login status:', error);
    return false;
  }
}

/**
 * Set login state
 * @param value - true if logged in, false if logged out
 */
export async function setIsLoggedIn(value: boolean): Promise<void> {
  try {
    console.log('[Auth] Setting login status to:', value);
    await setItem(IS_LOGGED_IN_KEY, value ? 'true' : 'false');
  } catch (error) {
    console.error('[Auth] Error setting login status:', error);
  }
}

/**
 * Clear login state and all auth data
 * Should be called on logout
 */
export async function clearAuthState(): Promise<void> {
  try {
    console.log('[Auth] Clearing all auth state...');
    await removeItem(IS_LOGGED_IN_KEY);
    await removeItem('access_token');
    await removeItem('refresh_token');
    await removeItem('user_json');
    console.log('[Auth] ✅ All auth state cleared');
  } catch (error) {
    console.error('[Auth] Error clearing auth state:', error);
  }
}


