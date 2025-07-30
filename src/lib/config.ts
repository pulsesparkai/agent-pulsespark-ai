/**
 * Application configuration constants
 */

// Supabase Configuration with validation
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Required variables:', {
    VITE_SUPABASE_URL: !!SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: !!SUPABASE_ANON_KEY
  });
}

// API Configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'https://api.pulsespark.ai',
  ENDPOINTS: {
    GENERATE: '/generate',
    EMBEDDINGS: '/embeddings',
    HEALTH: '/health',
    PROVIDERS: '/providers'
  }
} as const;

// App Configuration
export const APP_CONFIG = {
  NAME: import.meta.env.VITE_APP_NAME || 'PulseSpark AI',
  VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0',
  ENVIRONMENT: import.meta.env.NODE_ENV || 'development',
  FRONTEND_URL: import.meta.env.VITE_FRONTEND_URL || 'https://agent.pulsespark.ai'
} as const;

// Supabase Configuration
export const SUPABASE_CONFIG = {
  URL: SUPABASE_URL,
  ANON_KEY: SUPABASE_ANON_KEY,
  IS_CONFIGURED: !!(SUPABASE_URL && SUPABASE_ANON_KEY)
} as const;

export default {
  API_CONFIG,
  APP_CONFIG,
  SUPABASE_CONFIG
};