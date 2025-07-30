import { createClient } from '@supabase/supabase-js';

// Supabase configuration with better error handling
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables:', {
    VITE_SUPABASE_URL: !!supabaseUrl,
    VITE_SUPABASE_ANON_KEY: !!supabaseAnonKey
  });
  
  // In production, show user-friendly error
  if (import.meta.env.PROD) {
    console.error('🚨 Supabase configuration missing. Please check environment variables.');
  }
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'pkce'
    },
    global: {
      headers: {
        'X-Client-Info': 'pulsespark-ai@1.0.0'
      }
    }
  }
);

// Export environment check for debugging
export const isProduction = import.meta.env.PROD;
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);