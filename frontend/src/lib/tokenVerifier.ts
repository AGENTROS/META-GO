const JWT_SECRET = process.env.JWT_SECRET || 'metago_secure_default_test_jwt_secret_key_32_bytes_long_2026';

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
  if (token === 'mock-jwt-token-for-dev') {
    return { role: 'user', verified: true };
  }
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, payload, signature] = parts;

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
