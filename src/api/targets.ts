import {
  getApiCredentials,
  getAccessToken,
  getBaseUrl,
} from '../utils/storage.ts';
import { saveInitialSnapshot } from '../services/BackgroundFetchService';

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

    // Refresh + retry on expired token
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
              `[Targets][List] ========== Processing @${t.username} (${t.platform}) ==========`
            );

            const params = {
              platform: t.platform,
              username: t.username,
              target_id: t.id,
            };

            // Fetch userinfo, followers, and following in parallel
            const [userInfoData, followersData, followingData] =
              await Promise.all([
                getUserInfo(params),
                getFollowers(params),
                getFollowing(params),
              ]);

            console.log(
              `[Targets][List] 📊 Raw API Response for @${t.username}:`,
              JSON.stringify(userInfoData)?.substring(0, 800)
            );

            // Extract user info - handle nested structure
            let userData: any = null;
            if (userInfoData) {
              // Unwrap layers: data.data or data or raw
              const baseData =
                userInfoData.data?.data || userInfoData.data || userInfoData;

              console.log(
                '[Targets][List] Base data keys:',
                Object.keys(baseData).join(', ')
              );

              // For TikTok: Extract userInfo object which contains user and stats
              if (t.platform === 'tiktok' && baseData.userInfo) {
                console.log('[Targets][List] 🎵 TikTok structure detected');
                userData = baseData.userInfo;
                console.log(
                  '[Targets][List] TikTok userInfo keys:',
                  Object.keys(userData).join(', ')
                );
              } else {
                // For Instagram or if userInfo doesn't exist
                userData = baseData;
              }
            }

            // Extract followers data
            let followersCount = 0;
            let followersList: any[] = [];
            if (followersData) {
              const followersResult = followersData.data || followersData;
              followersList = followersResult.followers || [];
              followersCount =
                followersResult.total || followersList.length || 0;
            }

            // Extract following data
            let followingCount = 0;
            let followingList: any[] = [];
            if (followingData) {
              const followingResult = followingData.data || followingData;
              followingList = followingResult.following || [];
              followingCount =
                followingResult.total || followingList.length || 0;
            }

            console.log(`[Targets][List] 📦 API counts for @${t.username}:`, {
              followersFromAPI: followersCount,
              followingFromAPI: followingCount,
            });

            // Extract follower/following counts based on platform
            let finalFollowers = 0;
            let finalFollowing = 0;
            let profilePic = '';
            let fullName = '';
            let isVerified = false;

            if (userData) {
              if (t.platform === 'tiktok') {
                console.log('[Targets][List] 🎵 Extracting TikTok data');

                // TikTok: userInfo.stats for counts
                if (userData.stats) {
                  finalFollowers =
                    userData.stats.followerCount ||
                    userData.stats.follower_count ||
                    0;
                  finalFollowing =
                    userData.stats.followingCount ||
                    userData.stats.following_count ||
                    0;
                  console.log('[Targets][List] TikTok stats found:', {
                    followers: finalFollowers,
                    following: finalFollowing,
                  });
                }

                // TikTok: userInfo.user for profile info
                if (userData.user) {
                  profilePic =
                    userData.user.avatarLarger ||
                    userData.user.avatarMedium ||
                    userData.user.avatarThumb ||
                    '';
                  fullName =
                    userData.user.nickname ||
                    userData.user.uniqueId ||
                    t.username;
                  isVerified = userData.user.verified || false;

                  console.log('[Targets][List] TikTok user info:', {
                    hasProfilePic: !!profilePic,
                    profilePicUrl: profilePic,
                    fullName,
                    isVerified,
                  });
                }

                // Fallback to API counts if not found in userInfo
                if (finalFollowers === 0) finalFollowers = followersCount;
                if (finalFollowing === 0) finalFollowing = followingCount;
              } else {
                // Instagram structure
                console.log('[Targets][List] 📸 Extracting Instagram data');

                finalFollowers =
                  userData.follower_count ||
                  userData.followers_count ||
                  userData.followers ||
                  userData.edge_followed_by?.count ||
                  followersCount ||
                  0;

                finalFollowing =
                  userData.following_count ||
                  userData.followings_count ||
                  userData.following ||
                  userData.edge_follow?.count ||
                  followingCount ||
                  0;

                profilePic =
                  userData.profile_pic_url_hd ||
                  userData.profile_pic_url ||
                  userData.hd_profile_pic_url_info?.url ||
                  '';

                fullName = userData.full_name || userData.name || t.username;
                isVerified = userData.is_verified || false;

                console.log('[Targets][List] Instagram data:', {
                  followers: finalFollowers,
                  following: finalFollowing,
                  hasProfilePic: !!profilePic,
                });
              }
            } else {
              console.log(
                `[Targets][List] ⚠️ No user data for @${t.username}, using API counts`
              );
              finalFollowers = followersCount;
              finalFollowing = followingCount;
            }

            console.log(`[Targets][List] ✅ Final data for @${t.username}:`, {
              followers: finalFollowers,
              following: finalFollowing,
              fullName,
              hasProfilePic: !!profilePic,
              profilePicPreview: profilePic,
            });

            // Combine all data for detail screen
            const combinedResult = {
              ...userData,
              followers_list: followersList,
              following_list: followingList,
              followers_total: followersCount,
              following_total: followingCount,
            };

            return {
              id: t.id,
              platform: t.platform,
              username: t.username,
              followers: finalFollowers,
              following: finalFollowing,
              profile_pic_url: profilePic,
              full_name: fullName,
              is_verified: isVerified,
              last_checked: t.last_checked,
              is_active: t.is_active,
              user_id: t.user_id,
              added_at: t.added_at,
              result: combinedResult,
            } as Target;
          } catch (error) {
            console.error(
              `[Targets][List] ❌ Exception for @${t.username}:`,
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

      console.log('[Targets][List] ✅ Complete! Final Summary:');
      targetsWithSocialData.forEach((t) => {
        console.log(`  📊 @${t.username} (${t.platform}):`, {
          followers: t.followers,
          following: t.following,
          fullName: t.full_name,
          hasProfilePic: !!t.profile_pic_url,
        });
      });

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

// At the very top of targets.ts, add this import:

// Then replace your addTarget function completely:
export async function addTarget(
  platform: Platform,
  username: string
): Promise<{ status: number; data?: any; error?: string }> {
  try {
    console.log('[Targets][Add] Starting...');
    console.log('[Targets][Add] Platform:', platform);
    console.log('[Targets][Add] Username:', username);

    const result = await callAPI('POST', '/api/targets', {
      platform,
      username,
    });

    console.log('[Targets][Add][Response]', result);
    console.log('[Targets][Add][Response Status]', result.status);

    if (result.status === 200 && result.data?.success) {
      console.log('[Targets][Add] ✅ Target added successfully');
      
      // Clear cache so next listTargets() fetches fresh data
      targetsCache = null;
      console.log('[Targets][Add] Cache cleared');

      // ✅ SAVE INITIAL SNAPSHOT FOR BACKGROUND COMPARISON
      const addedTarget = result.data.target;
      if (addedTarget) {
        console.log('[Targets][Add] Saving initial snapshot for:', addedTarget.username);
        console.log('[Targets][Add] Target data:', {
          id: addedTarget.id,
          username: addedTarget.username,
          platform: addedTarget.platform,
          followers: addedTarget.followers,
          following: addedTarget.following,
        });
        
        try {
          await saveInitialSnapshot(addedTarget);
          console.log('[Targets][Add] ✅ Initial snapshot saved successfully');
        } catch (snapshotError) {
          console.error('[Targets][Add] ❌ Error saving initial snapshot:', snapshotError);
          // Don't fail the entire add operation if snapshot fails
        }
      } else {
        console.warn('[Targets][Add] ⚠️ No target data returned from API, cannot save snapshot');
      }

      return {
        status: result.status,
        data: result.data,
      };
    } else {
      console.log(
        '[Targets][Add][Error] API returned error status:',
        result.status
      );
      console.log('[Targets][Add][Error] Error message:', result.data?.error);
      
      return {
        status: result.status,
        data: result.data,
        error: result.data?.error || `API returned status ${result.status}`,
      };
    }
  } catch (e) {
    console.log('[Targets][Add][Error] Exception occurred:', e);
    console.error('[Targets][Add][Error] Stack trace:', e);
    
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
      // Clear cache
      targetsCache = null;
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
    console.log('[Social][UserInfo] Starting for', params.username);

    const query = `platform=${encodeURIComponent(
      params.platform
    )}&username=${encodeURIComponent(
      params.username
    )}&action=userinfo&target_id=${encodeURIComponent(
      String(params.target_id)
    )}`;
    const path = `/api/social?${query}`;

    const result = await callAPI('GET', path);

    console.log('[Social][UserInfo] Response status:', result.status);
    console.log(
      '[Social][UserInfo] Response data:',
      JSON.stringify(result.data)?.substring(0, 800)
    );

    if (result.status === 200 && result.data) {
      return result.data;
    } else {
      console.log(
        '[Social][UserInfo][Error] API returned non-200 status:',
        result.status
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
    console.log('[Social][Followers] Starting for', params.username);

    const query = `platform=${encodeURIComponent(
      params.platform
    )}&username=${encodeURIComponent(
      params.username
    )}&action=followers&target_id=${encodeURIComponent(
      String(params.target_id)
    )}`;
    const path = `/api/social?${query}`;

    const result = await callAPI('GET', path);

    console.log('[Social][Followers] Response status:', result.status);
    console.log(
      '[Social][Followers] Response data:',
      JSON.stringify(result.data)?.substring(0, 300)
    );

    if (result.status === 200 && result.data) {
      return result.data;
    } else {
      console.log('[Social][Followers][Error] API returned non-200 status');
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
    console.log('[Social][Following] Starting for', params.username);

    const query = `platform=${encodeURIComponent(
      params.platform
    )}&username=${encodeURIComponent(
      params.username
    )}&action=following&target_id=${encodeURIComponent(
      String(params.target_id)
    )}`;
    const path = `/api/social?${query}`;

    const result = await callAPI('GET', path);

    console.log('[Social][Following] Response status:', result.status);
    console.log(
      '[Social][Following] Response data:',
      JSON.stringify(result.data)?.substring(0, 300)
    );

    if (result.status === 200 && result.data) {
      return result.data;
    } else {
      console.log('[Social][Following][Error] API returned non-200 status');
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
/**
 * Update or create a subscription for a user
 * @param userId - The user ID to update subscription for
 * @param subscriptionType - The subscription type (e.g., 'weekly', 'monthly', 'yearly')
 */
export async function updateSubscription(
 
  subscriptionType: string
): Promise<{ status: number; data?: any; error?: string }> {
  try {
    console.log('[Subscription][Update] Starting...');
    
    console.log('[Subscription][Update] Type:', subscriptionType);

    const result = await callAPI('POST', '/api/subscription', {
     // Ensure it's a string as per your curl example
      type: subscriptionType,
    });

    console.log('[Subscription][Update][Response]', result);
    console.log('[Subscription][Update][Response Status]', result.status);

    if (result.status === 200 || result.status === 201) {
      console.log('[Subscription][Update] ✅ Subscription updated successfully');
      
      return {
        status: result.status,
        data: result.data,
      };
    } else {
      console.log(
        '[Subscription][Update][Error] API returned error status:',
        result.status
      );
      console.log('[Subscription][Update][Error] Error message:', result.data?.error);
      
      return {
        status: result.status,
        data: result.data,
        error: result.data?.error || `API returned status ${result.status}`,
      };
    }
  } catch (e) {
    console.log('[Subscription][Update][Error] Exception occurred:', e);
    console.error('[Subscription][Update][Error] Stack trace:', e);
    
    return {
      status: 500,
      error: e instanceof Error ? e.message : 'Network error occurred',
    };
  }
}
