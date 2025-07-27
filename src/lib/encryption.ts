import CryptoJS from 'crypto-js';

// Simple client-side encryption (in production, use server-side encryption)
const ENCRYPTION_KEY = 'your-secret-key-here'; // In production, use environment variable

export const encryptApiKey = (apiKey: string): string => {
  return CryptoJS.AES.encrypt(apiKey, ENCRYPTION_KEY).toString();
};

export const decryptApiKey = (encryptedKey: string): string => {
  const bytes = CryptoJS.AES.decrypt(encryptedKey, ENCRYPTION_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
};

export const getKeyPreview = (apiKey: string): string => {
  return `****${apiKey.slice(-4)}`;
};