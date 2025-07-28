import React, { createContext, useContext, ReactNode } from 'react';
import { useFeedback, UseFeedbackReturn } from '../hooks/useFeedback';

/**
 * Feedback Context Type
 * Provides feedback system functionality through React Context
 */
type FeedbackContextType = UseFeedbackReturn;

/**
 * Feedback Context
 * React context for sharing feedback system functionality across components
 */
const FeedbackContext = createContext<FeedbackContextType | undefined>(undefined);

/**
 * Custom hook to access Feedback context
 * Throws error if used outside of FeedbackProvider
 * 
 * @returns Feedback context value with all feedback operations
 */
export const useFeedbackContext = (): FeedbackContextType => {
  const context = useContext(FeedbackContext);
  if (context === undefined) {
    throw new Error('useFeedbackContext must be used within a FeedbackProvider');
  }
  return context;
};

/**
 * Feedback Provider Props
 * Props interface for FeedbackProvider component
 */
interface FeedbackProviderProps {
  children: ReactNode;
}

/**
 * Feedback Provider Component
 * 
 * Provides feedback system functionality to child components through React Context.
 * Wraps the useFeedback hook and makes it available throughout the component tree.
 * 
 * Features:
 * - Centralized feedback management
 * - User and project context isolation
 * - Analytics and trend analysis
 * - Secure data handling with RLS
 * - Error and loading state management
 */
export const FeedbackProvider: React.FC<FeedbackProviderProps> = ({ children }) => {
  // Initialize feedback hook with all functionality
  const feedbackHook = useFeedback();

  return (
    <FeedbackContext.Provider value={feedbackHook}>
      {children}
    </FeedbackContext.Provider>
  );
};