import React from 'react';

// Type definition for message bubble props
interface ChatMessageBubbleProps {
  message: string;
  isUser: boolean;
  timestamp: string | Date;
  className?: string;
}

/**
 * ChatMessageBubble Component
 * 
 * A reusable chat message bubble component styled with PulseSpark branding.
 * Displays messages with different styling for user vs AI messages, including
 * proper alignment, colors, and timestamp formatting.
 * 
 * Features:
 * - User messages: Right-aligned with green background
 * - AI messages: Left-aligned with gray background
 * - Responsive design with max-width constraints
 * - Accessible with proper ARIA labels and semantic HTML
 * - Timestamp display with relative formatting
 */
export const ChatMessageBubble: React.FC<ChatMessageBubbleProps> = ({
  message,
  isUser,
  timestamp,
  className = ''
}) => {
  /**
   * Format timestamp for display
   * Converts Date objects or ISO strings to readable time format
   */
  const formatTimestamp = (timestamp: string | Date): string => {
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid time';
    }
    
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    // Show relative time for recent messages
    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) { // Less than 24 hours
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours}h ago`;
    } else {
      // Show actual time for older messages
      return date.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
    }
  };

  /**
   * Get sender label for accessibility
   * Provides clear identification for screen readers
   */
  const getSenderLabel = (): string => {
    return isUser ? 'You' : 'AI Assistant';
  };

  return (
    <div 
      className={`
        flex flex-col mb-4 animate-fadeIn
        ${isUser ? 'items-end' : 'items-start'}
        ${className}
      `}
      role="article"
      aria-label={`Message from ${getSenderLabel()} at ${formatTimestamp(timestamp)}`}
    >
      {/* Sender Label - Shows who sent the message */}
      <div className={`
        text-xs text-gray-500 mb-1 px-1
        ${isUser ? 'text-right' : 'text-left'}
      `}>
        {getSenderLabel()}
      </div>

      {/* Message Bubble Container */}
      <div className={`
        flex flex-col max-w-[75%] min-w-[120px]
        ${isUser ? 'items-end' : 'items-start'}
      `}>
        {/* Message Bubble */}
        <div
          className={`
            px-4 py-3 rounded-2xl shadow-sm transition-all duration-200
            break-words whitespace-pre-wrap leading-relaxed
            ${isUser 
              ? `
                bg-green-600 text-white rounded-br-md
                hover:bg-green-700 focus:bg-green-700
                focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2
              `
              : `
                bg-gray-200 text-gray-900 rounded-bl-md
                hover:bg-gray-300 focus:bg-gray-300
                focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2
              `
            }
          `}
          tabIndex={0}
          role="text"
          aria-label={`Message content: ${message}`}
        >
          {/* Message Text Content */}
          <span className="text-sm font-medium">
            {message}
          </span>
        </div>

        {/* Timestamp Display */}
        <div className={`
          text-xs text-gray-400 mt-1 px-1
          ${isUser ? 'text-right' : 'text-left'}
        `}>
          {formatTimestamp(timestamp)}
        </div>
      </div>
    </div>
  );
};

export default ChatMessageBubble;