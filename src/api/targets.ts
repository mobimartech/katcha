import {
  getApiCredentials,
  getAccessToken,
  getBaseUrl,
} from '../utils/storage.ts';
import CryptoJS from 'crypto-js';
import { HmacSHA256 } from 'crypto-js';
import { generateSignatureS } from './signature.ts';
import { clearAuthState, setIsLoggedIn } from '../utils/auth.ts';
import { stopBackgroundFetch } from '../services/BackgroundFetchService';
import { navigationRef, resetToLogin } from '../navigation/navigationRef';
import { refreshAccessTokenIfPossible } from './auth';

export type Platform = 'instagram' | 'tiktok';

export type Target = {
  id: number;
  platform: Platform;
  username: string;
  result: any;
  followers?: number;
  following?: number;
  last_checked?: string;
  is_active?: number;
  user_id?: number;
  added_at?: string;
  profile_pic_url?: string;
  full_name?: string;
  is_verified?: boolean;
};

// Dummy list used on error
const DUMMY_TARGETS: Target[] = [];

// Simple runtime metrics and request control
const apiCallCounts: Record<string, number> = {};
const inflightRequests: Record<string, Promise<any> | undefined> = {};
let targetsCache: { data: Target[]; expiresAt: number } | null = null;
const TARGETS_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export function getApiCallCounts() {
  return { ...apiCallCounts };
}

// Clean API call helper
const callAPI = async (method: string, path: string, body?: any) => {
  const baseUrl = (await getBaseUrl()) || 'https://katchaapp.org';
  const creds = await getApiCredentials();
  const accessToken = await getAccessToken();

  if (!creds || !accessToken) {
    throw new Error('Missing credentials or token');
  }
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = generateSignatureS(method, path, timestamp);

  const headers = {
    'Content-Type': 'application/json',
    'x-api-key': creds.apiKey,
    'x-timestamp': timestamp.toString(),
    'x-signature': signature,
    authorization: `Bearer ${accessToken}`,
  };

  // Track request counts for visibility
  apiCallCounts[path] = (apiCallCounts[path] || 0) + 1;
  console.log(`[API][Count] ${path}:`, apiCallCounts[path]);

  console.log(`--- ${method} ${path} REQUEST ---`);
  console.log('Headers:', JSON.stringify(headers, null, 2));
  if (body) console.log('Body:', JSON.stringify(body, null, 2));

  const inflightKey = `${method}:${path}`;
  if (inflightRequests[inflightKey]) {
    console.log(`[API][Dedup] Reusing in-flight request for ${inflightKey}`);
    return inflightRequests[inflightKey];
  }

  const requestPromise = (async () => {
    const doRequest = async (overrideHeaders?: any) => {
      const h = overrideHeaders || headers;
      return await fetch(`${baseUrl}${path}`, {
        method,
        headers: h,
        body: body ? JSON.stringify(body) : undefined,
      });
    };
    let response = await doRequest();

    console.log('Response Status:', response.status);
    const responseText = await response.text();
    console.log('Response Text:', responseText);

    let parsed: any = null;
    try {
      parsed = JSON.parse(responseText);
    } catch {
      parsed = responseText;
    }

    // Refresh + retry on expired token, else logout
    const errorMessage: string =
      parsed && parsed.error ? String(parsed.error) : String(parsed || '');
    if (response.status === 401 || /token expired/i.test(errorMessage)) {
      console.log('[API][Auth] 401/token expired. Attempting refresh...');
      const refreshed = await refreshAccessTokenIfPossible();
      if (refreshed) {
        const newAccess = await getAccessToken();
        const retryHeaders = {
          ...headers,
          authorization: `Bearer ${newAccess}`,
        };
        response = await doRequest(retryHeaders);
        console.log('[API][Auth] Retry status:', response.status);
        const retryText = await response.text();
        try {
          parsed = JSON.parse(retryText);
        } catch {
          parsed = retryText;
        }
      } else {
        // try {
        //   console.log('[API][Auth] Refresh failed. Auto logout.');
        //   await clearAuthState();
        //   await setIsLoggedIn(false);
        //   stopBackgroundFetch();
        //   if (navigationRef.isReady()) resetToLogin();
        // } catch (logoutErr) {
        //   console.log('[API][Auth] Auto logout error:', logoutErr);
        // }
      }
    }

    return {
      status: response.status,
      data: parsed,
    };
  })().finally(() => {
    delete inflightRequests[inflightKey];
  });

  inflightRequests[inflightKey] = requestPromise;
  return requestPromise;
};

/**
 * List all targets with their followers/following data
 * Fetches targets, then fetches social data for each one
 */
export async function listTargets(): Promise<Target[]> {
  try {
    console.log('[Targets][List] Starting...');
    // Use cache to avoid repeated backend load
    if (targetsCache && Date.now() < targetsCache.expiresAt) {
      console.log('[Targets][List] Returning cached targets');
      return targetsCache.data;
    }

    const result = await callAPI('GET', '/api/targets');

    if (result.status === 200 && result.data.targets) {
      const targets = result.data.targets as Array<any>;
      console.log(
        `[Targets][List] Found ${targets.length} targets, fetching social data...`
      );

      // Fetch social data for each target
      const targetsWithSocialData = await Promise.all(
        targets.map(async (t) => {
          try {
            console.log(
              `[Targets][List] Fetching complete social data for @${t.username} (${t.platform})...`
            );

            const params = {
              platform: t.platform,
              username: t.username,
              target_id: t.id,
            };

            // Fetch userinfo, followers, and following in parallel using existing functions
            const [userInfoData, followersData, followingData] =
              await Promise.all([
                getUserInfo(params),
                getFollowers(params),
                getFollowing(params),
              ]);

            console.log(`[Targets][List] API responses for @${t.username}:`, {
              hasUserInfo: !!userInfoData,
              hasFollowers: !!followersData,
              hasFollowing: !!followingData,
            });

            if (userInfoData) {
              // Process user info
              const base = userInfoData?.data || userInfoData || {};

              // Log the actual data structure
              console.log(
                `[Targets][List] Raw user data for @${t.username}:`,
                JSON.stringify(base).substring(0, 300)
              );

              // Process followers
              const followersResult =
                followersData?.data || followersData || {};
              const followersList = followersResult.followers || [];
              const followersTotal =
                followersResult.total || followersList.length || 0;

              console.log(`[Targets][List] Followers for @${t.username}:`, {
                count: followersTotal,
                listLength: followersList.length,
              });

              // Process following
              const followingResult =
                followingData?.data || followingData || {};
              const followingList = followingResult.following || [];
              const followingTotal =
                followingResult.total || followingList.length || 0;

              console.log(`[Targets][List] Following for @${t.username}:`, {
                count: followingTotal,
                listLength: followingList.length,
              });

              // Extract follower/following counts with multiple fallback fields
              const followers =
                base.follower_count ||
                base.followers_count ||
                base.followers ||
                base.followerCount ||
                followersTotal ||
                0;

              const following =
                base.following_count ||
                base.followings_count ||
                base.following ||
                base.followingCount ||
                followingTotal ||
                0;

              // Extract profile picture and other details
              const profilePic =
                base.profile_pic_url_hd ||
                base.profile_pic_url ||
                base.hd_profile_pic_url_info?.url ||
                base.avatar_url ||
                '';

              const fullName = base.full_name || base.name || t.username;
              const isVerified = base.is_verified || false;

              console.log(
                `[Targets][List] ✅ Extracted data for @${t.username}:`,
                {
                  followers,
                  following,
                  fullName,
                  isVerified,
                  hasProfilePic: !!profilePic,
                  followersListCount: followersList.length,
                  followingListCount: followingList.length,
                }
              );

              // Combine all data for detail screen
              const combinedResult = {
                ...base,
                followers_list: followersList,
                following_list: followingList,
                followers_total: followersTotal,
                following_total: followingTotal,
              };

              return {
                id: t.id,
                platform: t.platform,
                username: t.username,
                followers: followers,
                following: following,
                profile_pic_url: profilePic,
                full_name: fullName,
                is_verified: isVerified,
                last_checked: t.last_checked,
                is_active: t.is_active,
                user_id: t.user_id,
                added_at: t.added_at,
                result: combinedResult, // Store full API response with lists
              } as Target;
            } else {
              console.log(
                `[Targets][List] No user info data for @${t.username}`
              );
              return {
                id: t.id,
                platform: t.platform,
                username: t.username,
                followers: 0,
                following: 0,
                last_checked: t.last_checked,
                is_active: t.is_active,
                user_id: t.user_id,
                added_at: t.added_at,
                result: null,
              } as Target;
            }
          } catch (error) {
            console.error(
              `[Targets][List] Exception for @${t.username}:`,
              error
            );
            return {
              id: t.id,
              platform: t.platform,
              username: t.username,
              followers: 0,
              following: 0,
              last_checked: t.last_checked,
              is_active: t.is_active,
              user_id: t.user_id,
              added_at: t.added_at,
              result: null,
            } as Target;
          }
        })
      );

      console.log(
        '[Targets][List] Successfully fetched all targets with social data'
      );
      targetsCache = {
        data: targetsWithSocialData,
        expiresAt: Date.now() + TARGETS_CACHE_TTL_MS,
      };
      return targetsWithSocialData;
    } else {
      console.log(
        '[Targets][List][Error] API returned error, using dummy data'
      );
      return DUMMY_TARGETS;
    }
  } catch (e) {
    console.log(
      '[Targets][List][Error] Exception occurred, using dummy data:',
      e
    );
    return DUMMY_TARGETS;
  }
}

export async function addTarget(
  platform: Platform,
  username: string
): Promise<{ status: number; data?: any; error?: string }> {
  try {
    console.log('[Targets][Add] Starting...');

    const result = await callAPI('POST', '/api/targets', {
      platform,
      username,
    });

    console.log('[Targets][Add][Response]', result);

    if (result.status === 200 && result.data?.success) {
      return {
        status: result.status,
        data: result.data,
      };
    } else {
      console.log(
        '[Targets][Add][Error] API returned error status:',
        result.status
      );
      return {
        status: result.status,
        data: result.data,
        error: result.data?.error || `API returned status ${result.status}`,
      };
    }
  } catch (e) {
    console.log('[Targets][Add][Error] Exception occurred:', e);
    return {
      status: 500,
      error: e instanceof Error ? e.message : 'Network error occurred',
    };
  }
}

export async function deleteTarget(
  target_id: number
): Promise<{ success: boolean }> {
  try {
    console.log('[Targets][Delete] Starting...');

    const result = await callAPI('DELETE', '/api/targets', { target_id });

    if (result.status === 200 && result.data.success) {
      return { success: true };
    } else {
      console.log(
        '[Targets][Delete][Error] API returned error, using dummy success'
      );
      return { success: true };
    }
  } catch (e) {
    console.log(
      '[Targets][Delete][Error] Exception occurred, using dummy success:',
      e
    );
    return { success: true };
  }
}

// Social API functions for User Detail
export async function getUserInfo(params: {
  platform: Platform;
  username: string;
  target_id: number;
}): Promise<any> {
  try {
    console.log('[Social][UserInfo] Starting...');

    const query = `platform=${encodeURIComponent(
      params.platform
    )}&username=${encodeURIComponent(
      params.username
    )}&action=userinfo&target_id=${encodeURIComponent(
      String(params.target_id)
    )}`;
    const path = `/api/social?${query}`;
    console.log('[Social][UserInfo] Starting...', path);

    const result = await callAPI('GET', path);
    console.log('[Social][UserInfo] result...', result);

    if (result.status === 200 && result.data) {
      return result.data;
    } else {
      console.log(
        '[Social][UserInfo][Error] API returned error, using dummy data'
      );
      return null;
    }
  } catch (e) {
    console.log('[Social][UserInfo][Error] Exception occurred:', e);
    return null;
  }
}

export async function getFollowers(params: {
  platform: Platform;
  username: string;
  target_id: number;
}): Promise<any> {
  try {
    console.log('[Social][Followers] Starting...');

    const query = `platform=${encodeURIComponent(
      params.platform
    )}&username=${encodeURIComponent(
      params.username
    )}&action=followers&target_id=${encodeURIComponent(
      String(params.target_id)
    )}`;
    const path = `/api/social?${query}`;
    console.log('[Social][Followers] Starting...', path);

    const result = await callAPI('GET', path);
    console.log('[Social][Followers] Starting...', result);

    if (result.status === 200 && result.data) {
      return result.data;
    } else {
      console.log('[Social][Followers][Error] API returned error');
      return { data: { followers: [], total: 0 } };
    }
  } catch (e) {
    console.log('[Social][Followers][Error] Exception occurred:', e);
    return { data: { followers: [], total: 0 } };
  }
}

export async function getFollowing(params: {
  platform: Platform;
  username: string;
  target_id: number;
}): Promise<any> {
  try {
    console.log('[Social][Following] Starting...');

    const query = `platform=${encodeURIComponent(
      params.platform
    )}&username=${encodeURIComponent(
      params.username
    )}&action=following&target_id=${encodeURIComponent(
      String(params.target_id)
    )}`;
    const path = `/api/social?${query}`;
    console.log('[Social][getFollowing] Starting...', path);

    const result = await callAPI('GET', path);
    console.log('[Social][getFollowing] Starting...', result);

    if (result.status === 200 && result.data) {
      return result.data;
    } else {
      console.log('[Social][Following][Error] API returned error');
      return { data: { following: [], total: 0 } };
    }
  } catch (e) {
    console.log('[Social][Following][Error] Exception occurred:', e);
    return { data: { following: [], total: 0 } };
  }
}

// Subscription API
export type SubscriptionInfo = {
  is_valid: boolean;
  target_limit: number;
  subscription: {
    subscription_type: string;
    subscription_start: string | null;
    subscription_end: string | null;
  };
};

export async function getSubscriptions(): Promise<SubscriptionInfo> {
  try {
    console.log('[Subscription] Starting...');

    const result = await callAPI('GET', '/api/subscription');

    if (result.status === 200 && result.data) {
      return result.data as SubscriptionInfo;
    } else {
      console.log('[Subscription][Error] API returned error, using dummy data');
      return {
        is_valid: false,
        target_limit: 0,
        subscription: {
          subscription_type: 'free',
          subscription_start: null,
          subscription_end: null,
        },
      };
    }
  } catch (e) {
    console.log(
      '[Subscription][Error] Exception occurred, using dummy data:',
      e
    );
    return {
      is_valid: false,
      target_limit: 0,
      subscription: {
        subscription_type: 'free',
        subscription_start: null,
        subscription_end: null,
      },
    };
  }
}
