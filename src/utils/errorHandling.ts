/**
 * Error handling utilities for PulseSpark.ai
 */

export interface AppError {
  message: string;
  code?: string;
  details?: any;
}

/**
 * Parse Supabase errors into user-friendly messages
 */
export const parseSupabaseError = (error: any): AppError => {
  if (!error) {
    return { message: 'An unknown error occurred' };
  }

  // Handle Supabase auth errors
  if (error.message?.includes('Invalid login credentials')) {
    return { message: 'Invalid email or password. Please try again.' };
  }

  if (error.message?.includes('Email not confirmed')) {
    return { message: 'Please check your email and click the confirmation link.' };
  }

  if (error.message?.includes('User already registered')) {
    return { message: 'An account with this email already exists.' };
  }

  // Handle database errors
  if (error.code === 'PGRST116') {
    return { message: 'No data found or access denied.' };
  }

  if (error.code === '23505') {
    return { message: 'This item already exists.' };
  }

  if (error.code === '23503') {
    return { message: 'Cannot delete this item because it is referenced by other data.' };
  }

  // Handle network errors
  if (error.message?.includes('fetch')) {
    return { message: 'Network error. Please check your connection and try again.' };
  }

  // Default error message
  return {
    message: error.message || 'An unexpected error occurred',
    code: error.code,
    details: error
  };
};

/**
 * Log errors in development, send to monitoring in production
 */
export const logError = (error: any, context?: string) => {
  const errorInfo = {
    error: error.message || error,
    context,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href
  };

  if (import.meta.env.DEV) {
    console.error('App Error:', errorInfo);
  } else {
    // In production, send to error monitoring service
    // Example: Sentry.captureException(error, { extra: errorInfo });
  }
};

/**
 * Retry function with exponential backoff
 */
export const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> => {
  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxRetries) {
        throw error;
      }

      // Exponential backoff with jitter
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
};