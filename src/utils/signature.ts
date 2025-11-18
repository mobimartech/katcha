// Minimal SHA-256 and HMAC-SHA256 implementation in TypeScript (no external deps)
// NOTE: This is intended for development purposes. Consider using a vetted crypto library for production.
import CryptoJS from 'crypto-js';
import { HmacSHA256 } from 'crypto-js';
function rightRotate(value: number, amount: number): number {
  return (value >>> amount) | (value << (32 - amount));
}

function sha256(bytes: Uint8Array): Uint8Array {
  const k = new Uint32Array([
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ]);

  const h = new Uint32Array([
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ]);

  const origLen = bytes.length;
  const withOne = origLen + 1;
  const zeroPad = (64 - ((withOne + 8) % 64)) % 64;
  const totalLen = withOne + zeroPad + 8;
  const msg = new Uint8Array(totalLen);
  msg.set(bytes);
  msg[origLen] = 0x80;
  const bitLen = origLen * 8;
  const view = new DataView(msg.buffer);
  view.setUint32(totalLen - 4, bitLen >>> 0, false);
  view.setUint32(totalLen - 8, Math.floor(bitLen / 2 ** 32) >>> 0, false);

  const w = new Uint32Array(64);
  for (let i = 0; i < totalLen; i += 64) {
    for (let j = 0; j < 16; j++) {
      w[j] = view.getUint32(i + j * 4, false);
    }
    for (let j = 16; j < 64; j++) {
      const s0 = rightRotate(w[j - 15], 7) ^ rightRotate(w[j - 15], 18) ^ (w[j - 15] >>> 3);
      const s1 = rightRotate(w[j - 2], 17) ^ rightRotate(w[j - 2], 19) ^ (w[j - 2] >>> 10);
      w[j] = (w[j - 16] + s0 + w[j - 7] + s1) >>> 0;
    }
    let a = h[0];
    let b = h[1];
    let c = h[2];
    let d = h[3];
    let e = h[4];
    let f = h[5];
    let g = h[6];
    let _h = h[7];
    for (let j = 0; j < 64; j++) {
      const S1 = rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (_h + S1 + ch + k[j] + w[j]) >>> 0;
      const S0 = rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) >>> 0;
      _h = g;
      g = f;
      f = e;
      e = (d + temp1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) >>> 0;
    }
    h[0] = (h[0] + a) >>> 0;
    h[1] = (h[1] + b) >>> 0;
    h[2] = (h[2] + c) >>> 0;
    h[3] = (h[3] + d) >>> 0;
    h[4] = (h[4] + e) >>> 0;
    h[5] = (h[5] + f) >>> 0;
    h[6] = (h[6] + g) >>> 0;
    h[7] = (h[7] + _h) >>> 0;
  }

  const out = new Uint8Array(32);
  const outView = new DataView(out.buffer);
  for (let i = 0; i < 8; i++) outView.setUint32(i * 4, h[i], false);
  return out;
}

function toUtf8Bytes(str: string): Uint8Array {
  const encoder = new TextEncoder();
  return encoder.encode(str);
}

function bytesToHex(bytes: Uint8Array): string {
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i].toString(16).padStart(2, '0');
    hex += b;
  }
  return hex;
}

export function hmacSha256Hex(key: string, message: string): string {
  const blockSize = 64; // bytes
  let keyBytes = toUtf8Bytes(key);
  if (keyBytes.length > blockSize) {
    keyBytes = sha256(keyBytes);
  }
  if (keyBytes.length < blockSize) {
    const tmp = new Uint8Array(blockSize);
    tmp.set(keyBytes);
    keyBytes = tmp;
  }
  const oKeyPad = new Uint8Array(blockSize);
  const iKeyPad = new Uint8Array(blockSize);
  for (let i = 0; i < blockSize; i++) {
    oKeyPad[i] = keyBytes[i] ^ 0x5c;
    iKeyPad[i] = keyBytes[i] ^ 0x36;
  }
  const inner = new Uint8Array(iKeyPad.length + toUtf8Bytes(message).length);
  inner.set(iKeyPad);
  inner.set(toUtf8Bytes(message), iKeyPad.length);
  const innerHash = sha256(inner);

  const outer = new Uint8Array(oKeyPad.length + innerHash.length);
  outer.set(oKeyPad);
  outer.set(innerHash, oKeyPad.length);
  const finalHash = sha256(outer);
  return bytesToHex(finalHash);
}

export function buildStringToSign(method: string, pathWithQuery: string, timestamp: string): string {
  // Ensure method is uppercase and path has no trailing slash (unless it's just /)
  const normalizedMethod = method.toUpperCase();
  let normalizedPath = pathWithQuery;
  if (normalizedPath.length > 1 && normalizedPath.endsWith('/')) {
    normalizedPath = normalizedPath.slice(0, -1);
  }
  return `method=${normalizedMethod}&path=${normalizedPath}&timestamp=${timestamp}`;
}

// Convenience helper: replicates sampleAPi.tsx logic
export function generateSignature(
  method: string,
  pathWithQuery: string,
  apiSecret: string,
  explicitTimestamp?: number,
): { timestamp: string; signature: string; stringToSign: string } {
  const ts = (explicitTimestamp ?? Math.floor(Date.now() / 1000)).toString();
  const stringToSign = buildStringToSign(method, pathWithQuery, ts);
  const signature = hmacSha256Hex(apiSecret, stringToSign);
  return { timestamp: ts, signature, stringToSign };
}

const API_KEY =
  'd4f25ac2a42f35bf7a130dd3743f6e86b2b08f77d13edd116cfcaaadb81ab196';
const API_SECRET =
  '13397ff2fb52da6cc9beeb802bc1e41d35b655268e88007360e149d8744e5784';

// Convenience helper: replicates sampleAPi.tsx logic exactly
export function generateSignature3(
  method: string,
  path: string,
  apiSecret: string,
): { timestamp: string; signature: string; stringToSign: string } {
  const timestamp = Math.floor(Date.now() / 1000);
  const stringToSign = `method=${method}&path=${path}&timestamp=${timestamp}`;

  console.log('=== Signature Generation ===');
  console.log('Method:', method);
  console.log('Path:', path);
  console.log('Timestamp:', timestamp);
  console.log('String to sign:', stringToSign);
  console.log('API Secret (first 10 chars):', apiSecret.substring(0, 10));

  const signature = HmacSHA256(stringToSign, apiSecret).toString(
    CryptoJS.enc.Hex,
  );

  console.log('Generated signature:', signature);
  console.log('===========================');

  return { timestamp: timestamp.toString(), signature, stringToSign };
}
