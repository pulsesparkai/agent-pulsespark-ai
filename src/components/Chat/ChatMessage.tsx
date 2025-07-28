import React from 'react';
import { ChatMessage as ChatMessageType } from '../../types';
import { User, Bot, AlertCircle, RefreshCw } from 'lucide-react';
import { FeedbackForm } from '../Feedback/FeedbackForm';

interface ChatMessageProps {
  message: ChatMessageType;
  onRetry?: () => void;
  showRetry?: boolean;
  showFeedback?: boolean;
  chatSessionId?: string;
}

/**
 * ChatMessage Component
 * 
 * Renders individual chat messages with proper styling for user/AI messages,
 * error states, and retry functionality. Supports timestamps and provider info.
 */
export const ChatMessage: React.FC<ChatMessageProps> = ({ 
  message, 
  onRetry, 
  showRetry = false,
  showFeedback = true,
  chatSessionId
}) => {
  const isUser = message.role === 'user';
  const hasError = !!message.error;

  /**
   * Format timestamp for display
   */
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  /**
   * Get color for AI provider badge
   */
  const getProviderColor = (provider?: string) => {
    const colors: Record<string, string> = {
      'OpenAI': 'text-green-600',
      'Claude': 'text-purple-600',
      'DeepSeek': 'text-blue-600',
      'Grok': 'text-orange-600',
      'Mistral': 'text-red-600'
    };
    return colors[provider || ''] || 'text-gray-600';
  };

  return (
    <div className={`flex gap-3 mb-6 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div className={`
        flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
        ${isUser 
          ? 'bg-blue-600 text-white' 
          : hasError 
            ? 'bg-red-100 text-red-600'
            : 'bg-gray-100 text-gray-600'
        }
      `}>
        {isUser ? (
          <User className="w-4 h-4" />
        ) : hasError ? (
          <AlertCircle className="w-4 h-4" />
        ) : (
          <Bot className="w-4 h-4" />
        )}
      </div>

      {/* Message Content */}
      <div className={`flex-1 max-w-3xl ${isUser ? 'text-right' : 'text-left'}`}>
        {/* Message Header */}
        <div className={`flex items-center gap-2 mb-1 text-xs text-gray-500 ${isUser ? 'justify-end' : 'justify-start'}`}>
          <span>{isUser ? 'You' : 'AI Assistant'}</span>
          {message.provider && !isUser && (
            <>
              <span>•</span>
              <span className={getProviderColor(message.provider)}>
                {message.provider}
              </span>
            </>
          )}
          <span>•</span>
          <span>{formatTimestamp(message.timestamp)}</span>
        </div>

        {/* Message Bubble */}
        <div className={`
          inline-block px-4 py-3 rounded-2xl max-w-full break-words
          ${isUser 
            ? 'bg-blue-600 text-white rounded-br-md' 
            : hasError
              ? 'bg-red-50 text-red-900 border border-red-200 rounded-bl-md'
              : 'bg-gray-100 text-gray-900 rounded-bl-md'
          }
        `}>
          <div className="whitespace-pre-wrap text-sm leading-relaxed">
            {message.content}
          </div>
          
          {/* Error Details and Retry */}
          {hasError && message.error && (
            <div className="mt-2 pt-2 border-t border-red-200">
              <p className="text-xs text-red-600">
                Error: {message.error}
              </p>
              {showRetry && onRetry && (
                <button
                  onClick={onRetry}
                  className="mt-2 flex items-center gap-1 text-xs text-red-700 hover:text-red-800 transition-colors"
                >
                  <RefreshCw className="w-3 h-3" />
                  Retry
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Feedback Form - Only show for AI messages without errors */}
      {showFeedback && !isUser && !hasError && message.provider && (
        <div className="mt-3 max-w-md">
          <FeedbackForm
            aiResponseId={message.id}
            aiProvider={message.provider}
            chatSessionId={chatSessionId}
            responseContext={{
              message_content: message.content,
              message_timestamp: message.timestamp,
              conversation_context: 'chat_message'
            }}
            compact={true}
            onFeedbackSubmitted={(feedback) => {
              console.log('Feedback submitted for message:', message.id, feedback);
            }}
          />
        </div>
      )}
    </div>
  );
};