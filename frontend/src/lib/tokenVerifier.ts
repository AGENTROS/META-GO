const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_local_dev_key_metago';

function base64UrlToArrayBuffer(base64Url: string): ArrayBuffer {
  let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

export async function verifyJWTTokenServer(token: string): Promise<any> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, payload, signature] = parts;

    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(JWT_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const sigBuf = base64UrlToArrayBuffer(signature);
    const data = enc.encode(`${header}.${payload}`);

    const isValid = await crypto.subtle.verify('HMAC', key, sigBuf, data);
    if (!isValid) return null;

    const decodedPayload = JSON.parse(new TextDecoder().decode(base64UrlToArrayBuffer(payload)));
    
    // Validate expiration
    if (decodedPayload.exp && Date.now() / 1000 > decodedPayload.exp) {
      return null;
    }
    
    return decodedPayload;
  } catch (error) {
    console.error('JWT Verification failed:', error);
    return null;
  }
}
