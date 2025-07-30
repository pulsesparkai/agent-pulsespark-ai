import CryptoJS from 'crypto-js';

// Production-ready: REQUIRE the encryption key from environment
const ENCRYPTION_KEY = import.meta.env.VITE_ENCRYPTION_KEY;

if (!ENCRYPTION_KEY) {
  throw new Error('VITE_ENCRYPTION_KEY environment variable is required');
}

export const encryptApiKey = (apiKey: string): string => {
  return CryptoJS.AES.encrypt(apiKey, ENCRYPTION_KEY).toString();
};

export const decryptApiKey = (encryptedKey: string): string => {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedKey, ENCRYPTION_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error('Failed to decrypt API key');
    throw new Error('Invalid encrypted key');
  }
};

export const getKeyPreview = (apiKey: string): string => {
  return `****${apiKey.slice(-4)}`;
};