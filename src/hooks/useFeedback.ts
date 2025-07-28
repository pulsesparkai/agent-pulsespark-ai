import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useProject } from '../contexts/ProjectContext';
import { useNotification } from '../contexts/NotificationContext';
import { FeedbackEntry, FeedbackData, RatingType, AIProvider } from '../components/Feedback/FeedbackForm';

/**
 * Feedback Statistics Interface
 * Aggregated feedback data for analytics and insights
 */
export interface FeedbackStats {
  total_feedback: number;
  average_rating: number;
  rating_distribution: Record<string, number>;
  provider_stats: Record<string, {
    count: number;
    avg_rating: number;
  }>;
  period_days: number;
  generated_at: string;
}

/**
 * Feedback Trends Interface
 * Time-series data for feedback trends analysis
 */
export interface FeedbackTrend {
  date: string;
  feedback_count: number;
  average_rating: number;
}

/**
 * Feedback Hook Options
 * Configuration options for feedback queries and operations
 */
export interface FeedbackOptions {
  projectId?: string;
  aiProvider?: AIProvider;
  ratingType?: RatingType;
  daysBack?: number;
  limit?: number;
}

/**
 * Feedback Hook Return Type
 * Interface for the useFeedback hook return value
 */
export interface UseFeedbackReturn {
  // Core feedback operations
  submitFeedback: (feedbackData: Omit<FeedbackData, 'userId'>) => Promise<FeedbackEntry>;
  updateFeedback: (feedbackId: string, updates: Partial<FeedbackData>) => Promise<void>;
  deleteFeedback: (feedbackId: string) => Promise<void>;
  
  // Feedback retrieval
  getUserFeedback: (options?: FeedbackOptions) => Promise<FeedbackEntry[]>;
  getProjectFeedback: (projectId: string, options?: FeedbackOptions) => Promise<FeedbackEntry[]>;
  
  // Analytics and statistics
  getFeedbackStats: (options?: FeedbackOptions) => Promise<FeedbackStats>;
  getFeedbackTrends: (options?: FeedbackOptions) => Promise<FeedbackTrend[]>;
  
  // State management
  loading: boolean;
  error: string | null;
  clearError: () => void;
}

/**
 * Custom Feedback Management Hook
 * 
 * Provides comprehensive feedback management functionality for PulseSpark's AI responses.
 * Handles feedback submission, retrieval, analytics, and user context isolation.
 * Integrates with Supabase for secure data storage and Row-Level Security.
 * 
 * Features:
 * - Submit and manage feedback for AI responses
 * - Retrieve user and project-specific feedback
 * - Generate analytics and trend data
 * - Secure user and project isolation
 * - Error handling and loading states
 */
export const useFeedback = (): UseFeedbackReturn => {
  // State management for loading and error states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Context dependencies for user and project isolation
  const { user } = useAuth();
  const { currentProject } = useProject();
  const { showNotification } = useNotification();

  /**
   * Submit new feedback for an AI response
   * Creates a new feedback entry with user context and validation
   * 
   * @param feedbackData - Feedback data without user ID (automatically added)
   * @returns Promise resolving to created feedback entry
   */
  const submitFeedback = useCallback(async (
    feedbackData: Omit<FeedbackData, 'userId'>
  ): Promise<FeedbackEntry> => {
    if (!user) {
      throw new Error('User must be authenticated to submit feedback');
    }

    // Validate required fields
    if (!feedbackData.aiResponseId || !feedbackData.aiProvider) {
      throw new Error('AI response ID and provider are required');
    }

    if (feedbackData.ratingValue === null || feedbackData.ratingValue === undefined) {
      throw new Error('Rating value is required');
    }

    setLoading(true);
    setError(null);

    try {
      // Prepare feedback entry for database
      const feedbackEntry = {
        user_id: user.id,
        project_id: currentProject?.id || null,
        chat_session_id: feedbackData.chatSessionId || null,
        ai_response_id: feedbackData.aiResponseId,
        ai_provider: feedbackData.aiProvider,
        rating_type: feedbackData.ratingType,
        rating_value: feedbackData.ratingValue,
        feedback_text: feedbackData.feedbackText?.trim() || null,
        response_context: {
          ...feedbackData.responseContext,
          submitted_at: new Date().toISOString(),
          user_agent: navigator.userAgent
        }
      };

      // Submit to Supabase
      const { data, error: submitError } = await supabase
        .from('feedback_entries')
        .insert(feedbackEntry)
        .select()
        .single();

      if (submitError) {
        throw submitError;
      }

      // Log successful submission (without sensitive data)
      console.log('✅ Feedback submitted successfully:', {
        aiProvider: feedbackData.aiProvider,
        ratingType: feedbackData.ratingType,
        ratingValue: feedbackData.ratingValue,
        hasText: !!feedbackData.feedbackText,
        projectId: currentProject?.id
      });

      return data;

    } catch (err: any) {
      const errorMessage = err.message || 'Failed to submit feedback';
      setError(errorMessage);
      showNotification(`Failed to submit feedback: ${errorMessage}`, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user, currentProject, showNotification]);

  /**
   * Update existing feedback entry
   * Modifies feedback with new rating or text
   * 
   * @param feedbackId - ID of feedback entry to update
   * @param updates - Partial updates to apply
   */
  const updateFeedback = useCallback(async (
    feedbackId: string, 
    updates: Partial<FeedbackData>
  ): Promise<void> => {
    if (!user) {
      throw new Error('User must be authenticated to update feedback');
    }

    setLoading(true);
    setError(null);

    try {
      const updateData: any = {};

      // Map updates to database fields
      if (updates.ratingValue !== undefined) {
        updateData.rating_value = updates.ratingValue;
      }
      if (updates.feedbackText !== undefined) {
        updateData.feedback_text = updates.feedbackText?.trim() || null;
      }
      if (updates.responseContext) {
        updateData.response_context = {
          ...updates.responseContext,
          updated_at: new Date().toISOString()
        };
      }

      const { error: updateError } = await supabase
        .from('feedback_entries')
        .update(updateData)
        .eq('id', feedbackId)
        .eq('user_id', user.id); // Ensure user can only update their own feedback

      if (updateError) {
        throw updateError;
      }

      showNotification('Feedback updated successfully', 'success');

    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update feedback';
      setError(errorMessage);
      showNotification(`Failed to update feedback: ${errorMessage}`, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user, showNotification]);

  /**
   * Delete feedback entry
   * Removes feedback from database with user verification
   * 
   * @param feedbackId - ID of feedback entry to delete
   */
  const deleteFeedback = useCallback(async (feedbackId: string): Promise<void> => {
    if (!user) {
      throw new Error('User must be authenticated to delete feedback');
    }

    setLoading(true);
    setError(null);

    try {
      const { error: deleteError } = await supabase
        .from('feedback_entries')
        .delete()
        .eq('id', feedbackId)
        .eq('user_id', user.id); // Ensure user can only delete their own feedback

      if (deleteError) {
        throw deleteError;
      }

      showNotification('Feedback deleted successfully', 'success');

    } catch (err: any) {
      const errorMessage = err.message || 'Failed to delete feedback';
      setError(errorMessage);
      showNotification(`Failed to delete feedback: ${errorMessage}`, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user, showNotification]);

  /**
   * Get user's feedback entries with optional filtering
   * Retrieves feedback with user context isolation
   * 
   * @param options - Optional filtering and pagination options
   * @returns Promise resolving to array of feedback entries
   */
  const getUserFeedback = useCallback(async (
    options: FeedbackOptions = {}
  ): Promise<FeedbackEntry[]> => {
    if (!user) {
      return [];
    }

    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('feedback_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      // Apply optional filters
      if (options.projectId) {
        query = query.eq('project_id', options.projectId);
      }
      if (options.aiProvider) {
        query = query.eq('ai_provider', options.aiProvider);
      }
      if (options.ratingType) {
        query = query.eq('rating_type', options.ratingType);
      }
      if (options.daysBack) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - options.daysBack);
        query = query.gte('created_at', cutoffDate.toISOString());
      }
      if (options.limit) {
        query = query.limit(options.limit);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw fetchError;
      }

      return data || [];

    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch user feedback';
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, [user]);

  /**
   * Get feedback for a specific project
   * Retrieves project-specific feedback with user context
   * 
   * @param projectId - ID of project to get feedback for
   * @param options - Optional filtering options
   * @returns Promise resolving to array of feedback entries
   */
  const getProjectFeedback = useCallback(async (
    projectId: string, 
    options: FeedbackOptions = {}
  ): Promise<FeedbackEntry[]> => {
    return getUserFeedback({ ...options, projectId });
  }, [getUserFeedback]);

  /**
   * Get aggregated feedback statistics
   * Retrieves analytics data for user or project feedback
   * 
   * @param options - Optional filtering options
   * @returns Promise resolving to feedback statistics
   */
  const getFeedbackStats = useCallback(async (
    options: FeedbackOptions = {}
  ): Promise<FeedbackStats> => {
    if (!user) {
      throw new Error('User must be authenticated to get feedback stats');
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: statsError } = await supabase
        .rpc('get_feedback_stats', {
          filter_user_id: user.id,
          filter_project_id: options.projectId || null,
          filter_provider: options.aiProvider || null,
          days_back: options.daysBack || 30
        });

      if (statsError) {
        throw statsError;
      }

      return data || {
        total_feedback: 0,
        average_rating: 0,
        rating_distribution: {},
        provider_stats: {},
        period_days: options.daysBack || 30,
        generated_at: new Date().toISOString()
      };

    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch feedback statistics';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user]);

  /**
   * Get feedback trends over time
   * Retrieves time-series data for feedback analysis
   * 
   * @param options - Optional filtering options
   * @returns Promise resolving to array of trend data points
   */
  const getFeedbackTrends = useCallback(async (
    options: FeedbackOptions = {}
  ): Promise<FeedbackTrend[]> => {
    if (!user) {
      throw new Error('User must be authenticated to get feedback trends');
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: trendsError } = await supabase
        .rpc('get_feedback_trends', {
          filter_user_id: user.id,
          filter_project_id: options.projectId || null,
          days_back: options.daysBack || 30,
          interval_days: 1
        });

      if (trendsError) {
        throw trendsError;
      }

      return data || [];

    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch feedback trends';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user]);

  /**
   * Clear error state
   * Resets error state for clean UI updates
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Return hook interface with all feedback operations
  return {
    // Core feedback operations
    submitFeedback,
    updateFeedback,
    deleteFeedback,
    
    // Feedback retrieval
    getUserFeedback,
    getProjectFeedback,
    
    // Analytics and statistics
    getFeedbackStats,
    getFeedbackTrends,
    
    // State management
    loading,
    error,
    clearError
  };
};