import React, { useState, useCallback } from 'react';
import { 
  ThumbsUp, 
  ThumbsDown, 
  Star, 
  Send, 
  MessageSquare,
  CheckCircle,
  AlertCircle,
  X
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useProject } from '../../contexts/ProjectContext';
import { useNotification } from '../../contexts/NotificationContext';
import { LoadingSpinner } from '../Shared/LoadingSpinner';
import { supabase } from '../../lib/supabase';

// Type definitions for feedback system
export type RatingType = 'thumbs' | 'stars' | 'scale';
export type AIProvider = 'OpenAI' | 'Claude' | 'DeepSeek' | 'Grok' | 'Mistral';

export interface FeedbackData {
  aiResponseId: string;
  aiProvider: AIProvider;
  ratingType: RatingType;
  ratingValue: number;
  feedbackText?: string;
  responseContext?: Record<string, any>;
  chatSessionId?: string;
}

export interface FeedbackEntry {
  id: string;
  user_id: string;
  project_id?: string;
  chat_session_id?: string;
  ai_response_id: string;
  ai_provider: AIProvider;
  rating_type: RatingType;
  rating_value: number;
  feedback_text?: string;
  response_context: Record<string, any>;
  created_at: string;
  updated_at: string;
}

interface FeedbackFormProps {
  /** Unique identifier for the AI response being rated */
  aiResponseId: string;
  /** AI provider that generated the response */
  aiProvider: AIProvider;
  /** Optional chat session ID for context */
  chatSessionId?: string;
  /** Additional context about the AI response */
  responseContext?: Record<string, any>;
  /** Callback fired when feedback is successfully submitted */
  onFeedbackSubmitted?: (feedback: FeedbackEntry) => void;
  /** Optional custom styling classes */
  className?: string;
  /** Compact mode for inline display */
  compact?: boolean;
  /** Default rating type to display */
  defaultRatingType?: RatingType;
}

/**
 * FeedbackForm Component
 * 
 * A comprehensive feedback collection system for AI-generated responses with PulseSpark branding.
 * Supports multiple rating types (thumbs, stars, scale) and textual feedback with validation.
 * Integrates with Supabase for secure feedback storage and user context isolation.
 * 
 * Features:
 * - Multiple rating types with visual feedback
 * - Optional textual comments with character limits
 * - Real-time validation and error handling
 * - Loading states during submission
 * - Responsive design with compact mode option
 * - Accessibility support with ARIA labels
 */
export const FeedbackForm: React.FC<FeedbackFormProps> = ({
  aiResponseId,
  aiProvider,
  chatSessionId,
  responseContext = {},
  onFeedbackSubmitted,
  className = '',
  compact = false,
  defaultRatingType = 'thumbs'
}) => {
  // Context and authentication
  const { user } = useAuth();
  const { currentProject } = useProject();
  const { showNotification } = useNotification();

  // Form state management
  const [ratingType, setRatingType] = useState<RatingType>(defaultRatingType);
  const [ratingValue, setRatingValue] = useState<number | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [showTextInput, setShowTextInput] = useState(false);
  
  // UI state management
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form validation constants
  const MAX_FEEDBACK_LENGTH = 1000;
  const MIN_FEEDBACK_LENGTH = 5;

  /**
   * Validate rating value based on rating type
   * Ensures rating values are within acceptable ranges for each type
   */
  const validateRating = useCallback((type: RatingType, value: number): boolean => {
    switch (type) {
      case 'thumbs':
        return value === 0 || value === 1; // 0 = thumbs down, 1 = thumbs up
      case 'stars':
        return value >= 1 && value <= 5; // 1-5 star rating
      case 'scale':
        return value >= 1 && value <= 10; // 1-10 scale rating
      default:
        return false;
    }
  }, []);

  /**
   * Validate feedback text input
   * Checks length requirements and content appropriateness
   */
  const validateFeedbackText = useCallback((text: string): string | null => {
    if (text.trim().length === 0) {
      return null; // Optional field
    }
    
    if (text.trim().length < MIN_FEEDBACK_LENGTH) {
      return `Feedback must be at least ${MIN_FEEDBACK_LENGTH} characters`;
    }
    
    if (text.length > MAX_FEEDBACK_LENGTH) {
      return `Feedback must be less than ${MAX_FEEDBACK_LENGTH} characters`;
    }
    
    return null;
  }, []);

  /**
   * Handle rating selection for different rating types
   * Updates rating value and provides visual feedback
   */
  const handleRatingSelect = useCallback((value: number) => {
    if (validateRating(ratingType, value)) {
      setRatingValue(value);
      setError(null);
    }
  }, [ratingType, validateRating]);

  /**
   * Handle feedback text changes with validation
   * Provides real-time character count and validation feedback
   */
  const handleFeedbackTextChange = useCallback((text: string) => {
    setFeedbackText(text);
    
    // Clear error when user starts typing
    if (error) {
      setError(null);
    }
  }, [error]);

  /**
   * Submit feedback to Supabase backend
   * Handles validation, API calls, and error management
   */
  const handleSubmitFeedback = useCallback(async () => {
    if (!user) {
      setError('You must be signed in to submit feedback');
      return;
    }

    if (ratingValue === null) {
      setError('Please provide a rating before submitting');
      return;
    }

    if (!validateRating(ratingType, ratingValue)) {
      setError('Invalid rating value for selected rating type');
      return;
    }

    // Validate feedback text if provided
    const textValidationError = validateFeedbackText(feedbackText);
    if (textValidationError) {
      setError(textValidationError);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Prepare feedback data for submission
      const feedbackData = {
        user_id: user.id,
        project_id: currentProject?.id || null,
        chat_session_id: chatSessionId || null,
        ai_response_id: aiResponseId,
        ai_provider: aiProvider,
        rating_type: ratingType,
        rating_value: ratingValue,
        feedback_text: feedbackText.trim() || null,
        response_context: {
          ...responseContext,
          submitted_at: new Date().toISOString(),
          user_agent: navigator.userAgent,
          page_url: window.location.href
        }
      };

      // Submit feedback to Supabase
      const { data, error: submitError } = await supabase
        .from('feedback_entries')
        .insert(feedbackData)
        .select()
        .single();

      if (submitError) {
        throw submitError;
      }

      // Success handling
      setIsSubmitted(true);
      showNotification('Thank you for your feedback!', 'success');

      // Call success callback if provided
      if (onFeedbackSubmitted && data) {
        onFeedbackSubmitted(data);
      }

      // Log successful submission (without sensitive data)
      console.log('✅ Feedback submitted successfully:', {
        aiProvider,
        ratingType,
        ratingValue,
        hasText: !!feedbackText.trim(),
        projectId: currentProject?.id
      });

    } catch (err: any) {
      const errorMessage = err.message || 'Failed to submit feedback';
      setError(errorMessage);
      showNotification(`Failed to submit feedback: ${errorMessage}`, 'error');
      
      // Log error for debugging
      console.error('❌ Feedback submission error:', {
        error: errorMessage,
        aiProvider,
        ratingType
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [
    user,
    currentProject,
    chatSessionId,
    aiResponseId,
    aiProvider,
    ratingType,
    ratingValue,
    feedbackText,
    responseContext,
    validateRating,
    validateFeedbackText,
    onFeedbackSubmitted,
    showNotification
  ]);

  /**
   * Reset form to initial state
   * Allows users to submit new feedback after successful submission
   */
  const handleReset = useCallback(() => {
    setRatingValue(null);
    setFeedbackText('');
    setShowTextInput(false);
    setIsSubmitted(false);
    setError(null);
  }, []);

  /**
   * Render thumbs up/down rating interface
   * Simple binary rating with visual feedback
   */
  const renderThumbsRating = () => (
    <div className="flex items-center gap-2">
      <button
        onClick={() => handleRatingSelect(1)}
        disabled={isSubmitting || isSubmitted}
        className={`
          p-2 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 
          focus:ring-green-500 focus:ring-offset-1 disabled:opacity-50
          ${ratingValue === 1 
            ? 'bg-green-100 text-green-600 shadow-md' 
            : 'bg-gray-100 text-gray-400 hover:bg-green-50 hover:text-green-500'
          }
        `}
        aria-label="Thumbs up - Positive feedback"
        title="This response was helpful"
      >
        <ThumbsUp className="w-5 h-5" />
      </button>
      
      <button
        onClick={() => handleRatingSelect(0)}
        disabled={isSubmitting || isSubmitted}
        className={`
          p-2 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 
          focus:ring-red-500 focus:ring-offset-1 disabled:opacity-50
          ${ratingValue === 0 
            ? 'bg-red-100 text-red-600 shadow-md' 
            : 'bg-gray-100 text-gray-400 hover:bg-red-50 hover:text-red-500'
          }
        `}
        aria-label="Thumbs down - Negative feedback"
        title="This response was not helpful"
      >
        <ThumbsDown className="w-5 h-5" />
      </button>
    </div>
  );

  /**
   * Render star rating interface
   * 1-5 star rating with hover effects and visual feedback
   */
  const renderStarRating = () => (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={() => handleRatingSelect(star)}
          disabled={isSubmitting || isSubmitted}
          className={`
            p-1 rounded transition-all duration-200 focus:outline-none focus:ring-2 
            focus:ring-yellow-500 focus:ring-offset-1 disabled:opacity-50
            ${ratingValue && ratingValue >= star 
              ? 'text-yellow-500' 
              : 'text-gray-300 hover:text-yellow-400'
            }
          `}
          aria-label={`${star} star${star > 1 ? 's' : ''}`}
          title={`Rate ${star} out of 5 stars`}
        >
          <Star className="w-5 h-5 fill-current" />
        </button>
      ))}
    </div>
  );

  /**
   * Render scale rating interface
   * 1-10 numeric scale with visual indicators
   */
  const renderScaleRating = () => (
    <div className="flex items-center gap-1 flex-wrap">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
        <button
          key={value}
          onClick={() => handleRatingSelect(value)}
          disabled={isSubmitting || isSubmitted}
          className={`
            w-8 h-8 rounded-full text-sm font-medium transition-all duration-200 
            focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1 
            disabled:opacity-50
            ${ratingValue === value 
              ? 'bg-green-600 text-white shadow-md' 
              : 'bg-gray-100 text-gray-600 hover:bg-green-100 hover:text-green-700'
            }
          `}
          aria-label={`Rate ${value} out of 10`}
          title={`Rate ${value} out of 10`}
        >
          {value}
        </button>
      ))}
    </div>
  );

  /**
   * Render rating interface based on selected rating type
   * Switches between thumbs, stars, and scale ratings
   */
  const renderRatingInterface = () => {
    switch (ratingType) {
      case 'thumbs':
        return renderThumbsRating();
      case 'stars':
        return renderStarRating();
      case 'scale':
        return renderScaleRating();
      default:
        return renderThumbsRating();
    }
  };

  // Don't render if user is not authenticated
  if (!user) {
    return null;
  }

  // Success state - show confirmation message
  if (isSubmitted) {
    return (
      <div className={`bg-green-50 border border-green-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-green-800 font-medium">Thank you for your feedback!</p>
            <p className="text-green-700 text-sm">Your input helps us improve the AI experience.</p>
          </div>
          {!compact && (
            <button
              onClick={handleReset}
              className="text-green-600 hover:text-green-700 transition-colors"
              title="Submit new feedback"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
      {/* Feedback Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-green-600" />
          <h3 className="text-sm font-semibold text-gray-900">
            {compact ? 'Rate this response' : 'How was this response?'}
          </h3>
        </div>
        
        {/* Rating Type Selector - Only show in non-compact mode */}
        {!compact && (
          <select
            value={ratingType}
            onChange={(e) => {
              setRatingType(e.target.value as RatingType);
              setRatingValue(null); // Reset rating when type changes
            }}
            disabled={isSubmitting}
            className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="thumbs">👍 Thumbs</option>
            <option value="stars">⭐ Stars</option>
            <option value="scale">📊 Scale</option>
          </select>
        )}
      </div>

      {/* Rating Interface */}
      <div className="mb-4">
        <div className="flex items-center justify-center">
          {renderRatingInterface()}
        </div>
        
        {/* Rating Description */}
        {ratingValue !== null && !compact && (
          <div className="mt-2 text-center">
            <p className="text-sm text-gray-600">
              {ratingType === 'thumbs' 
                ? (ratingValue === 1 ? 'Helpful response' : 'Not helpful')
                : ratingType === 'stars'
                  ? `${ratingValue} out of 5 stars`
                  : `${ratingValue} out of 10`
              }
            </p>
          </div>
        )}
      </div>

      {/* Optional Text Feedback */}
      {!compact && (
        <div className="mb-4">
          {!showTextInput ? (
            <button
              onClick={() => setShowTextInput(true)}
              disabled={isSubmitting}
              className="text-sm text-green-600 hover:text-green-700 hover:underline transition-colors disabled:opacity-50"
            >
              + Add written feedback (optional)
            </button>
          ) : (
            <div>
              <label htmlFor="feedbackText" className="block text-sm font-medium text-gray-700 mb-2">
                Additional Comments (Optional)
              </label>
              <textarea
                id="feedbackText"
                value={feedbackText}
                onChange={(e) => handleFeedbackTextChange(e.target.value)}
                placeholder="Tell us more about your experience with this response..."
                disabled={isSubmitting}
                className="
                  w-full px-3 py-2 border border-gray-300 rounded-md resize-vertical
                  focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent
                  disabled:opacity-50 disabled:cursor-not-allowed transition-colors
                  min-h-[80px]
                "
                maxLength={MAX_FEEDBACK_LENGTH}
                aria-describedby="feedback-help"
              />
              <div className="flex items-center justify-between mt-1">
                <p id="feedback-help" className="text-xs text-gray-500">
                  Help us understand what worked well or could be improved
                </p>
                <span className="text-xs text-gray-400">
                  {feedbackText.length}/{MAX_FEEDBACK_LENGTH}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Submit Button */}
      <div className="flex items-center justify-between">
        <div className="text-xs text-gray-500">
          Feedback for {aiProvider} response
        </div>
        
        <button
          onClick={handleSubmitFeedback}
          disabled={isSubmitting || ratingValue === null}
          className="
            flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 
            hover:from-green-500 hover:to-green-600 text-white font-semibold rounded-md 
            shadow-sm transform transition-all duration-200 hover:scale-[1.02] hover:shadow-md
            focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2
            disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
          "
          aria-label="Submit feedback"
        >
          {isSubmitting ? (
            <>
              <LoadingSpinner size="sm" />
              <span className="text-sm">Submitting...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span className="text-sm">Submit</span>
            </>
          )}
        </button>
      </div>

      {/* Compact Mode Footer */}
      {compact && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-500 text-center">
            Your feedback helps improve AI responses
          </p>
        </div>
      )}
    </div>
  );
};