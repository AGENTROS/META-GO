/**
 * Meta Go — Zero-Knowledge Client-Side Vault Cryptography Module
 * Uses standard Web Crypto API (AES-GCM 256-bit) to encrypt credentials locally
 * using keys derived from deterministic MetaMask wallet signatures.
 */

// Helper to convert ArrayBuffer to Base64
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

// Helper to convert Base64 to ArrayBuffer
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Derives a CryptoKey object for AES-GCM from a cryptographic wallet signature string.
 */
export async function deriveVaultKey(signature: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const signatureBytes = encoder.encode(signature);
  
  // Hash the signature bytes using SHA-256 to get a consistent 256-bit key entropy
  const keyMaterial = await window.crypto.subtle.digest('SHA-256', signatureBytes);
  
  // Import the hash buffer as a raw CryptoKey for AES-GCM
  return await window.crypto.subtle.importKey(
    'raw',
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts user credentials client-side.
 * Returns a JSON payload containing the Base64 encoded ciphertext and iv.
 */
export async function encryptVault(credentials: any[], key: CryptoKey): Promise<string> {
  const encoder = new TextEncoder();
  const plaintextBytes = encoder.encode(JSON.stringify(credentials));
  
  // Generate a random 12-byte initialization vector (IV) for AES-GCM
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  
  const ciphertextBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv
    },
    key,
    plaintextBytes
  );
  
  const payload = {
    ciphertext: arrayBufferToBase64(ciphertextBuffer),
    iv: arrayBufferToBase64(iv.buffer)
  };
  
  return JSON.stringify(payload);
}

/**
 * Decrypts the Base64 cipher blocks back to a plain credentials array.
 */
export async function decryptVault(encryptedJson: string, key: CryptoKey): Promise<any[]> {
  const { ciphertext, iv } = JSON.parse(encryptedJson);
  
  const ciphertextBytes = base64ToArrayBuffer(ciphertext);
  const ivBytes = new Uint8Array(base64ToArrayBuffer(iv));
  
  const decryptedBuffer = await window.crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: ivBytes
    },
    key,
    ciphertextBytes
  );
  
  const decoder = new TextDecoder();
  const plaintext = decoder.decode(decryptedBuffer);
  
  return JSON.parse(plaintext);
}
