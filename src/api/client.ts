import axios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { getAccessToken, getBaseUrl, getDeviceId, getApiCredentials } from '../utils/storage.ts';
import { buildStringToSign, hmacSha256Hex } from '../utils/signature.ts';

// Central axios client. Signature/HMAC headers will be attached later when keys are injected.
const client: AxiosInstance = axios.create({
  baseURL: 'https://social-tracker.automasterpro.net', // Default, will be updated dynamically
  timeout: 20000,
});

function serializeParamsPreserveOrder(params: any): string {
  if (!params) return '';
  const parts: string[] = [];
  Object.keys(params).forEach((key) => {
    const value = (params as any)[key];
    if (value === undefined || value === null) return;
    if (Array.isArray(value)) {
      value.forEach((v) => parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(v))}`));
    } else {
      parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
    }
  });
  return parts.join('&');
}

client.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await getAccessToken();
  // eslint-disable-next-line no-console
  console.log('[API][Token]', { hasToken: !!token, tokenLen: token?.length });
  const hdrs: any = config.headers as any;
  const setHeaderRaw = (k: string, v: string) => {
    if (hdrs && typeof hdrs.set === 'function') hdrs.set(k, v);
    else (config.headers as any)[k] = v;
  };
  const setHeaderAll = (k: string, v: string) => {
    setHeaderRaw(k, v);
    setHeaderRaw(k.toLowerCase(), v);
    // Common alt case variants some backends check
    if (k.startsWith('X-')) {
      const parts = k.split('-');
      const upper = parts.map((p) => p.toUpperCase()).join('-');
      setHeaderRaw(upper, v);
    }
  };
  if (token) setHeaderAll('Authorization', `Bearer ${token}`);

  const ts = Math.floor(Date.now() / 1000).toString();
  setHeaderAll('X-Timestamp', ts);
  const creds = await getApiCredentials();
  // eslint-disable-next-line no-console
  console.log('[API][Creds]', { hasCreds: !!creds, apiKeyLen: creds?.apiKey?.length, secretLen: creds?.apiSecret?.length });
  if (creds) {
    setHeaderAll('X-Api-Key', creds.apiKey);
    try {
      const method = (config.method || 'GET').toUpperCase();
      const base = config.baseURL || '';
      let path = config.url || '/';
      if (path.startsWith('http')) {
        const afterProto = path.split('://')[1];
        const slashIdx = afterProto.indexOf('/');
        path = slashIdx >= 0 ? afterProto.substring(slashIdx) : '/';
      }
      // Serialize query parameters (preserve insertion order)
      const qs = serializeParamsPreserveOrder((config as any).params);
      const pathWithQuery = qs ? `${path}?${qs}` : path;

      const stringToSign = buildStringToSign(method, pathWithQuery, ts);
      const signature = hmacSha256Hex(creds.apiSecret, stringToSign);
      setHeaderAll('X-Signature', signature);
      // eslint-disable-next-line no-console
      console.log('[API][Signature]', { method, pathWithQuery, ts, stringToSign, signatureLen: signature.length });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log('[API][Signature Error]', e);
      setHeaderAll('X-Signature', '');
    }
  }
  if (!hdrs['Content-Type'] && !(hdrs.get && hdrs.get('Content-Type'))) setHeaderAll('Content-Type', 'application/json');
  const deviceId = await getDeviceId();
  if (deviceId) setHeaderAll('X-Device-Id', deviceId);

  // Logging (avoid leaking secrets):
  try {
    const method = (config.method || 'GET').toUpperCase();
    const url = `${config.baseURL || ''}${config.url || ''}`;
    const tokenLen = token ? String(token).length : 0;
    const sig = hdrs.get ? hdrs.get('X-Signature') : (hdrs['X-Signature'] || hdrs['x-signature']);
    const apiKey = hdrs.get ? hdrs.get('X-Api-Key') : (hdrs['X-Api-Key'] || hdrs['x-api-key']);
    const xTs = hdrs.get ? hdrs.get('X-Timestamp') : (hdrs['X-Timestamp'] || hdrs['x-timestamp']);
    const auth = hdrs.get ? hdrs.get('Authorization') : (hdrs['Authorization'] || hdrs['authorization']);
    const sigLen = sig ? String(sig).length : 0;
    // Attach metadata for timing
    (config as any).metadata = { start: Date.now() };
    // Key request log
    // eslint-disable-next-line no-console
    console.log('[API][Request]', method, url, {
      xApiKey: Boolean(apiKey),
      xTimestamp: xTs,
      xSignatureLen: sigLen,
      authTokenLen: tokenLen,
      hasAuth: Boolean(auth),
    });
    console.log('Request creds.apiKey being sent:', apiKey);
    console.log('Request ts being sent:', ts);
    console.log('Request headers being sent:', sig);
    console.log('Request token being sent:', token);
    // eslint-disable-next-line no-console
    console.log('[API][Headers]', {
      'X-Api-Key': apiKey ? 'SET' : 'MISSING',
      'X-Timestamp': xTs || 'MISSING',
      'X-Signature': sig ? 'SET' : 'MISSING',
      'Authorization': auth ? 'SET' : 'MISSING',
    });
  } catch {
    // ignore logging errors
  }
  return config;
});

client.interceptors.response.use(
  (response: AxiosResponse) => {
    try {
      const cfg: any = response.config || {};
      const dur = cfg.metadata?.start ? Date.now() - cfg.metadata.start : undefined;
      const method = (cfg.method || 'GET').toUpperCase();
      const url = `${cfg.baseURL || ''}${cfg.url || ''}`;
      // eslint-disable-next-line no-console
      console.log('[API][Response]', response.status, method, url, { durationMs: dur });
      // Optional: small preview of data keys
      // eslint-disable-next-line no-console
      console.log('[API][DataKeys]', Object.keys(response.data || {}));
    } catch {
      // ignore logging errors
    }
    return response;
  },
  async (error) => {
    try {
      const cfg: any = error?.config || {};
      const dur = cfg.metadata?.start ? Date.now() - cfg.metadata.start : undefined;
      const method = (cfg.method || 'GET').toUpperCase();
      const url = `${cfg.baseURL || ''}${cfg.url || ''}`;
      const status = error?.response?.status;
      const data = error?.response?.data;
      // eslint-disable-next-line no-console
      console.log('[API][Error]', status, method, url, { durationMs: dur, data });
    } catch {
      // ignore logging errors
    }
    // TODO: Handle refresh token flow when backend is ready
    return Promise.reject(error);
  },
);

export default client;


