import 'server-only';

const SECRET_B64 = process.env.PERSONAL_KEY_SECRET || '';

function getKeyBytes(): Uint8Array {
  const buf = Buffer.from(SECRET_B64, 'base64');
  if (buf.length !== 32) {
    throw new Error('Invalid PERSONAL_KEY_SECRET. Provide a 32-byte base64 key.');
  }
  return new Uint8Array(buf);
}

async function importAesKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    getKeyBytes(),
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );
}

function u8ToB64(u8: Uint8Array): string {
  return Buffer.from(u8).toString('base64');
}

function b64ToU8(b64: string): Uint8Array {
  return new Uint8Array(Buffer.from(b64, 'base64'));
}

export async function encryptToBase64(plaintext: string): Promise<string> {
  const key = await importAesKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = new TextEncoder().encode(plaintext);
  const encrypted = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data));
  // WebCrypto AES-GCM returns ciphertext||tag; prepend IV
  const payload = new Uint8Array(iv.length + encrypted.length);
  payload.set(iv, 0);
  payload.set(encrypted, iv.length);
  return u8ToB64(payload);
}

export async function decryptFromBase64(payloadB64: string): Promise<string> {
  const raw = b64ToU8(payloadB64);
  const iv = raw.subarray(0, 12);
  const ciphertextWithTag = raw.subarray(12);
  const key = await importAesKey();
  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertextWithTag);
  return new TextDecoder().decode(new Uint8Array(decrypted));
}
