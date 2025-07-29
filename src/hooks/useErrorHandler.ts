import { useCallback } from 'react';
import { useNotification } from '../contexts/NotificationContext';
import { parseSupabaseError, logError } from '../utils/errorHandling';

/**
 * Custom hook for consistent error handling across the app
 */
export const useErrorHandler = () => {
  const { showNotification } = useNotification();

  const handleError = useCallback((error: any, context?: string) => {
    // Log the error
    logError(error, context);

    // Parse and show user-friendly message
    const { message } = parseSupabaseError(error);
    showNotification(message, 'error');
  }, [showNotification]);

  const handleSuccess = useCallback((message: string) => {
    showNotification(message, 'success');
  }, [showNotification]);

  const handleInfo = useCallback((message: string) => {
    showNotification(message, 'info');
  }, [showNotification]);

  return {
    handleError,
    handleSuccess,
    handleInfo
  };
};