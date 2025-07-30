/**
 * Application configuration constants with better validation
 */

// Supabase Configuration with validation
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Log configuration status for debugging
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('⚠️ Supabase environment variables missing:', {
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
  FRONTEND_URL: import.meta.env.VITE_FRONTEND_URL || 'https://agent-pulsespark-ai.vercel.app'
} as const;

// Supabase Configuration
export const SUPABASE_CONFIG = {
  URL: SUPABASE_URL,
  ANON_KEY: SUPABASE_ANON_KEY,
  IS_CONFIGURED: !!(SUPABASE_URL && SUPABASE_ANON_KEY)
} as const;

// Environment validation
export const ENV_STATUS = {
  isProduction: import.meta.env.PROD,
  isDevelopment: import.meta.env.DEV,
  supabaseConfigured: SUPABASE_CONFIG.IS_CONFIGURED,
  allConfigured: SUPABASE_CONFIG.IS_CONFIGURED
} as const;

export default {
  API_CONFIG,
  APP_CONFIG,
  SUPABASE_CONFIG,
  ENV_STATUS
};