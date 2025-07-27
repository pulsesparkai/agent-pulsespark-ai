import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2 } from 'lucide-react';

// Type definitions for component props
interface ChatInputBarProps {
  onSendMessage?: (message: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

/**
 * ChatInputBar Component
 * 
 * A horizontal input bar for chat messages with PulseSpark branding.
 * Features auto-expanding textarea, send button, and keyboard shortcuts.
 * Provides smooth user experience with proper accessibility support.
 */
export const ChatInputBar: React.FC<ChatInputBarProps> = ({
  onSendMessage,
  isLoading = false,
  disabled = false,
  placeholder = "Type your message...",
  className = ''
}) => {
  // State management for input functionality
  const [inputValue, setInputValue] = useState('');
  
  // Ref for textarea DOM manipulation
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /**
   * Auto-resize textarea based on content
   * Expands up to 5 lines (120px max height) for better UX
   * Resets to minimum height when content is cleared
   */
  useEffect(() => {
    if (textareaRef.current) {
      // Reset height to auto to get the correct scrollHeight
      textareaRef.current.style.height = 'auto';
      
      // Calculate new height based on content
      const scrollHeight = textareaRef.current.scrollHeight;
      const maxHeight = 120; // 5 lines approximately (24px line height * 5)
      const minHeight = 48;  // 2 lines approximately (24px line height * 2)
      
      // Set height within min/max constraints
      const newHeight = Math.min(Math.max(scrollHeight, minHeight), maxHeight);
      textareaRef.current.style.height = `${newHeight}px`;
    }
  }, [inputValue]);

  /**
   * Handle input value changes
   * Updates state and manages character limit (2000 chars max)
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    
    // Enforce character limit to prevent extremely long messages
    if (value.length <= 2000) {
      setInputValue(value);
    }
  };

  /**
   * Handle keyboard events in textarea
   * Enter sends message, Shift+Enter creates new line
   * Prevents default Enter behavior when sending
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  /**
   * Handle message sending
   * Validates input, calls parent callback, and clears input
   */
  const handleSendMessage = () => {
    const trimmedMessage = inputValue.trim();
    
    // Validate message content and component state
    if (!trimmedMessage || isLoading || disabled) {
      return;
    }

    // Call parent callback with message
    if (onSendMessage) {
      onSendMessage(trimmedMessage);
    }

    // Clear input and reset textarea height
    setInputValue('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  /**
   * Determine if send button should be enabled
   * Checks for content, loading state, and disabled prop
   */
  const canSend = inputValue.trim().length > 0 && !isLoading && !disabled;

  /**
   * Get character count for display
   * Shows current length out of maximum allowed
   */
  const characterCount = inputValue.length;
  const maxCharacters = 2000;

  return (
    // Main container - Full width with white background and top border
    <div className={`
      w-full bg-white border-t border-gray-300 p-4
      ${className}
    `}>
      {/* Input container - Flex layout with proper spacing */}
      <div className="flex items-end gap-3 max-w-4xl mx-auto">
        
        {/* Textarea input container - Flexible width with relative positioning */}
        <div className="flex-1 relative">
          {/* Accessible label for screen readers */}
          <label htmlFor="chatInput" className="sr-only">
            Type your message
          </label>
          
          {/* Expandable textarea input */}
          <textarea
            ref={textareaRef}
            id="chatInput"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isLoading || disabled}
            className="
              w-full bg-gray-100 text-gray-900 rounded-md p-3 pr-16
              border border-gray-300 resize-none transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent
              hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed
              placeholder-gray-500
            "
            style={{ 
              minHeight: '48px',
              maxHeight: '120px'
            }}
            aria-describedby="input-help character-count"
            aria-label="Chat message input"
          />
          
          {/* Character counter - Positioned in bottom right of textarea */}
          <div 
            id="character-count"
            className="absolute bottom-2 right-2 text-xs text-gray-400 pointer-events-none"
            aria-live="polite"
          >
            {characterCount}/{maxCharacters}
          </div>
        </div>

        {/* Send button - Green gradient with loading and disabled states */}
        <button
          onClick={handleSendMessage}
          disabled={!canSend}
          className="
            flex items-center justify-center w-12 h-12 rounded-md
            bg-gradient-to-r from-green-600 to-green-700 
            hover:from-green-500 hover:to-green-600
            text-white font-bold transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2
            disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-green-600 disabled:hover:to-green-700
            transform hover:scale-105 active:scale-95 disabled:transform-none
          "
          aria-label={isLoading ? 'Sending message...' : 'Send message'}
          title={canSend ? 'Send message' : 'Type a message to send'}
        >
          {/* Button icon - Shows loading spinner or send icon */}
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
          ) : (
            <Send className="w-5 h-5" aria-hidden="true" />
          )}
        </button>
      </div>

      {/* Helper text and keyboard shortcuts - Hidden but accessible */}
      <div className="mt-2 text-center">
        <p 
          id="input-help" 
          className="text-xs text-gray-500"
          aria-live="polite"
        >
          Press <kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs font-mono">Enter</kbd> to send, 
          <kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs font-mono ml-1">Shift + Enter</kbd> for new line
        </p>
      </div>

      {/* Screen reader only instructions */}
      <div className="sr-only" aria-live="polite">
        {isLoading && "Message is being sent..."}
        {!canSend && inputValue.length === 0 && "Type a message to enable send button"}
        {characterCount > 1800 && `Approaching character limit: ${characterCount} of ${maxCharacters} characters used`}
      </div>
    </div>
  );
};

export default ChatInputBar;