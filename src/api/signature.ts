import CryptoJS, { HmacSHA256 } from 'crypto-js';

const API_KEY =
  'd4f25ac2a42f35bf7a130dd3743f6e86b2b08f77d13edd116cfcaaadb81ab196';
const API_SECRET =
  '13397ff2fb52da6cc9beeb802bc1e41d35b655268e88007360e149d8744e5784';

  
// Convenience helper: replicates sampleAPi.tsx logic
export function generateSignatureS(
    method: string,
    path: string,
    timestamp: number,
  ): string {
    const stringToSign = `method=${method}&path=${path}&timestamp=${timestamp}`;

    console.log('=== Signature Generation ===');
    console.log('Method:', method);
    console.log('Path:', path);
    console.log('Timestamp:', timestamp);
    console.log('String to sign:', stringToSign);
    console.log('API Secret (first 10 chars):', API_SECRET.substring(0, 10));

    const signature = HmacSHA256(stringToSign, API_SECRET).toString(
      CryptoJS.enc.Hex,
    );

    console.log('Generated signature:', signature);
    console.log('===========================');

    return signature;
  }
  