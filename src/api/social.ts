import { getApiCredentials, getAccessToken, getBaseUrl } from '../utils/storage.ts';
import { generateSignatureS } from './signature.ts';

export type Platform = 'instagram' | 'tiktok';

// Clean API call helper (same as targets.ts)
const callAPI = async (method: string, path: string, body?: any) => {
  const baseUrl = (await getBaseUrl()) || 'https://social-tracker.automasterpro.net';
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
    'authorization': `Bearer ${accessToken}`,
  };

  console.log(`--- ${method} ${path} REQUEST ---`);
  console.log('Headers:', JSON.stringify(headers, null, 2));
  if (body) console.log('Body:', JSON.stringify(body, null, 2));

  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  console.log('Response Status:', response.status);
  const responseText = await response.text();
  console.log('Response Text:', responseText);

  try {
    return {
      status: response.status,
      data: JSON.parse(responseText),
    };
  } catch (e) {
    return {
      status: response.status,
      data: responseText,
    };
  }
};

// Minimal dummy userinfo payload
export const dummyUserInfo = {
  data: {
    username: 'instagram',
    full_name: 'Instagram',
    is_verified: true,
    follower_count: 695330181,
    following_count: 252,
    biography: "Discover what's new on Instagram 🔎✨",
    external_url: 'http://help.instagram.com',
    profile_pic_url_hd:
      'https://scontent-sjc3-1.cdninstagram.com/v/t51.2885-19/550891366_18667771684001321_1383210656577177067_n.jpg?stp=dst-jpg_s640x640_tt6&efg=eyJ2ZW5jb2RlX3RhZyI6InByb2ZpbGVfcGljLmRqYW5nby4xMDgwLmMyIn0&_nc_ht=scontent-sjc3-1.cdninstagram.com&_nc_cat=1&_nc_oc=Q6cZ2QEzWhOzTDjJL7UGlhLSE1jfgctXTn8HDl8sM8MQTUbpPpCFt-4HSDEs2A3fQeQvjec&_nc_ohc=TEQYHlIlR9oQ7kNvwFMWQuB&_nc_gid=Y1u3c8Z1DWazonCqa77LeA&edm=AO4kU9EBAAAA&ccb=7-5&ig_cache_key=GGbv1SApFvlLPVJCAOtF0XrDJjITbmNDAQAB6406400j-ccb7-5&oh=00_AfeanVY5l3eAr90rTfORPbxC1vDMOeXTkThA3bhxOGRPUA&oe=68F13FF1&_nc_sid=164c1d',
    profile_context_facepile_users: [
      {
        username: '8iirish.knnp',
        full_name: '𝐈.𝐑𝐈𝐒𝐇',
        profile_pic_url:
          'https://scontent-sjc3-1.cdninstagram.com/v/t51.2885-19/536303937_17854647735508949_4371086600476127648_n.jpg?stp=dst-jpg_e0_s150x150_tt6',
      },
    ],
    bio_links: [
      { url: 'http://help.instagram.com', title: '' },
    ],
  },
};

export async function getUserInfo(params: { platform: Platform; username: string; target_id: number }) {
  try {
    console.log('[Social][UserInfo] Starting...');
    
    // Build the query path with parameters
    const query = `platform=${encodeURIComponent(params.platform)}&username=${encodeURIComponent(params.username)}&action=userinfo&target_id=${encodeURIComponent(String(params.target_id))}`;
    const path = `/api/social?${query}`;
    
    const result = await callAPI('GET', path);
    
    if (result.status === 200 && result.data) {
      return result.data;
    } else {
      console.log('[Social][UserInfo][Error] API returned error, using dummy data');
      return dummyUserInfo;
    }
  } catch (e) {
    console.log('[Social][UserInfo][Error] Exception occurred, using dummy data:', e);
    return dummyUserInfo;
  }
}

export async function getFollowers(params: { platform: Platform; username: string; target_id: number }) {
  try {
    console.log('[Social][Followers] Starting...');
    
    const query = `platform=${encodeURIComponent(params.platform)}&username=${encodeURIComponent(params.username)}&action=followers&target_id=${encodeURIComponent(String(params.target_id))}`;
    const path = `/api/social?${query}`;
    
    const result = await callAPI('GET', path);
    
    if (result.status === 200 && result.data) {
      return result.data;
    } else {
      console.log('[Social][Followers][Error] API returned error, using empty array');
      return { data: { followers: [], total: 0 } };
    }
  } catch (e) {
    console.log('[Social][Followers][Error] Exception occurred, using empty array:', e);
    return { data: { followers: [], total: 0 } };
  }
}

export async function getFollowing(params: { platform: Platform; username: string; target_id: number }) {
  try {
    console.log('[Social][Following] Starting...');
    
    const query = `platform=${encodeURIComponent(params.platform)}&username=${encodeURIComponent(params.username)}&action=following&target_id=${encodeURIComponent(String(params.target_id))}`;
    const path = `/api/social?${query}`;
    
    const result = await callAPI('GET', path);
    
    if (result.status === 200 && result.data) {
      return result.data;
    } else {
      console.log('[Social][Following][Error] API returned error, using empty array');
      return { data: { following: [], total: 0 } };
    }
  } catch (e) {
    console.log('[Social][Following][Error] Exception occurred, using empty array:', e);
    return { data: { following: [], total: 0 } };
  }
}