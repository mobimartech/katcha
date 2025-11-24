import {
  getApiCredentials,
  getBaseUrl,
  getRefreshToken,
  setTokens,
} from '../utils/storage.ts';
import { generateSignature3 } from '../utils/signature.ts';
import { setUser } from '../utils/storage.ts';

export type GoogleLoginPayload = {
  action: 'google_login';
  google_id: string;
  email: string;
  name: string;
  device_id: string;
  firebaseID?: string;
};

export type AppleLoginPayload = {
  action: 'apple_login';
  apple_id: string;
  email: string;
  name: string;
  device_id: string;
  firebase_id?: string;
};

export type AuthTokens = {
  access_token: string;
  refresh_token?: string;
};

const makeFetchRequest = async (
  url: string,
  headers: any,
  method: string = 'POST',
  body?: string
): Promise<any> => {
  try {
    console.log('Making fetch request to:', url);
    console.log('Headers:', JSON.stringify(headers, null, 2));
    if (body) console.log('Body:', body);

    const doRequest = async () =>
      await fetch(url, {
        method,
        headers,
        body,
      });

    let response = await doRequest();

    console.log('Fetch Response Status:', response.status);

    const responseText = await response.text();
    console.log('Fetch Response Text:', responseText);

    // If unauthorized, attempt one refresh + retry
    if (response.status === 401) {
      console.log(
        '[Auth][makeFetchRequest] 401 received, attempting token refresh...'
      );
      const refreshed = await refreshAccessTokenIfPossible();
      if (refreshed) {
        console.log(
          '[Auth][makeFetchRequest] Refresh success, retrying request...'
        );
        response = await doRequest();
        console.log('Retry Response Status:', response.status);
      } else {
        console.log('[Auth][makeFetchRequest] Refresh not possible/failed.');
      }
    }

    const finalText = response.ok
      ? await (async () => responseText)()
      : responseText;
    try {
      const parsedData = JSON.parse(finalText);
      return { status: response.status, data: parsedData };
    } catch {
      console.log('Failed to parse JSON, returning raw text');
      return { status: response.status, data: finalText };
    }
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
};

export async function googleLogin(
  payload: GoogleLoginPayload
): Promise<AuthTokens> {
  try {
    console.log('[Auth][GoogleLogin][Request] Starting...');

    const baseUrl = (await getBaseUrl()) || 'https://katchaapp.org';
    const creds = await getApiCredentials();

    if (!creds) {
      throw new Error('Missing API credentials');
    }

    const method = 'POST';
    const path = '/api/auth';
    const { timestamp, signature, stringToSign } = generateSignature3(
      method,
      path,
      creds.apiSecret
    );

    const loginBody = JSON.stringify(payload);

    const headers = {
      'Content-Type': 'application/json',
      'x-api-key': creds.apiKey,
      'x-timestamp': timestamp,
      'x-signature': signature,
    };

    console.log('--- GOOGLE LOGIN REQUEST ---');
    const result = await makeFetchRequest(
      `${baseUrl}${path}`,
      headers,
      method,
      loginBody
    );

    console.log('Google Login Result Status:', result.status);
    console.log(
      'Google Login Result Data:',
      JSON.stringify(result.data, null, 2)
    );

    if (result.status === 200 && result.data.success) {
      const data = result.data;
      // Expecting shape per provided response example
      if (data?.tokens?.access_token) {
        await setTokens(data.tokens.access_token, data.tokens.refresh_token);
      }
      if (data?.user) {
        await setUser(data.user);
      }
      return (data?.tokens ?? data) as AuthTokens;
    } else {
      throw new Error(`Login failed: ${JSON.stringify(result.data)}`);
    }
  } catch (e) {
    console.log('[Auth][GoogleLogin][Error]:', e);
    throw e;
  }
}

export async function appleLogin(
  payload: AppleLoginPayload
): Promise<AuthTokens> {
  try {
    console.log('[Auth][AppleLogin][Request] Starting...');

    const baseUrl = (await getBaseUrl()) || 'https://katchaapp.org';
    const creds = await getApiCredentials();

    if (!creds) {
      throw new Error('Missing API credentials');
    }

    const method = 'POST';
    const path = '/api/auth';
    const { timestamp, signature, stringToSign } = generateSignature3(
      method,
      path,
      creds.apiSecret
    );

    const loginBody = JSON.stringify(payload);

    const headers = {
      'Content-Type': 'application/json',
      'x-api-key': creds.apiKey,
      'x-timestamp': timestamp,
      'x-signature': signature,
    };

    console.log('--- APPLE LOGIN REQUEST ---');
    console.log('Payload:', loginBody);
    const result = await makeFetchRequest(
      `${baseUrl}${path}`,
      headers,
      method,
      loginBody
    );

    console.log('Apple Login Result Status:', result.status);
    console.log(
      'Apple Login Result Data:',
      JSON.stringify(result.data, null, 2)
    );

    if (result.status === 200 && result.data.success) {
      const data = result.data;
      // Expecting shape per provided response example
      if (data?.tokens?.access_token) {
        await setTokens(data.tokens.access_token, data.tokens.refresh_token);
      }
      if (data?.user) {
        await setUser(data.user);
      }
      return (data?.tokens ?? data) as AuthTokens;
    } else {
      throw new Error(`Login failed: ${JSON.stringify(result.data)}`);
    }
  } catch (e) {
    console.log('[Auth][AppleLogin][Error]:', e);
    throw e;
  }
}

export async function refreshToken(refresh_token: string): Promise<AuthTokens> {
  try {
    console.log('[Auth][RefreshToken][Request] Starting...');

    const baseUrl = (await getBaseUrl()) || 'https://katchaapp.org';
    const creds = await getApiCredentials();

    if (!creds) {
      throw new Error('Missing API credentials');
    }

    const method = 'POST';
    const path = '/api/auth';
    const { timestamp, signature, stringToSign } = generateSignature3(
      method,
      path,
      creds.apiSecret
    );

    const refreshBody = JSON.stringify({
      action: 'refresh_token',
      refresh_token,
    });

    const headers = {
      'Content-Type': 'application/json',
      'x-api-key': creds.apiKey,
      'x-timestamp': timestamp,
      'x-signature': signature,
    };

    console.log('--- REFRESH TOKEN REQUEST ---');
    const result = await makeFetchRequest(
      `${baseUrl}${path}`,
      headers,
      method,
      refreshBody
    );

    console.log('Refresh Token Result Status:', result.status);
    console.log(
      'Refresh Token Result Data:',
      JSON.stringify(result.data, null, 2)
    );

    if (result.status === 200 && result.data) {
      const data = result.data;
      if (data?.access_token || data?.tokens?.access_token) {
        const at = data?.access_token ?? data?.tokens?.access_token;
        const rt =
          data?.refresh_token ?? data?.tokens?.refresh_token ?? refresh_token;
        await setTokens(at, rt);
        console.log('[Auth] Refresh stored. access_len:', String(at)?.length);
        return { access_token: at, refresh_token: rt };
      }
      return data as AuthTokens;
    } else {
      throw new Error(`Refresh failed: ${JSON.stringify(result.data)}`);
    }
  } catch (e) {
    console.log('[Auth][RefreshToken][Error]:', e);
    throw e;
  }
}

/**
 * Convenience helper that:
 * - reads the current refresh token from storage
 * - calls the refresh endpoint
 * - persists the returned access/refresh tokens
 * Returns true if refreshed successfully, false otherwise.
 */
export async function refreshAccessTokenIfPossible(): Promise<boolean> {
  try {
    const rt = await getRefreshToken();
    if (!rt) {
      console.log('[Auth][RefreshHelper] No refresh token available');
      return false;
    }
    const tokens = await refreshToken(rt);
    if (tokens?.access_token) {
      await setTokens(tokens.access_token, tokens.refresh_token);
      console.log('[Auth][RefreshHelper] Access token refreshed and saved');
      return true;
    }
    return false;
  } catch (e) {
    console.log('[Auth][RefreshHelper][Error]:', e);
    return false;
  }
}

export async function deleteAccount(
  email: string
): Promise<{ status: number; data: any }> {
  try {
    console.log('[Auth][DeleteAccount][Request] Starting...');
    const baseUrl = (await getBaseUrl()) || 'https://katchaapp.org';
    const creds = await getApiCredentials();
    if (!creds) {
      throw new Error('Missing API credentials');
    }

    const method = 'POST';
    const path = '/api/auth';
    const { timestamp, signature } = generateSignature3(
      method,
      path,
      creds.apiSecret
    );
    const body = JSON.stringify({ action: 'delete_account', email });
    const headers = {
      'Content-Type': 'application/json',
      'x-api-key': creds.apiKey,
      'x-timestamp': timestamp,
      'x-signature': signature,
    };

    const res = await fetch(`${baseUrl}${path}`, { method, headers, body });
    const text = await res.text();
    let data: any = null;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
    console.log('[Auth][DeleteAccount][Response]', res.status, data);
    return { status: res.status, data };
  } catch (e) {
    console.log('[Auth][DeleteAccount][Error]:', e);
    throw e;
  }
}
