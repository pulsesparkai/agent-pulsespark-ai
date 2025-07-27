import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { ChatMessageBubble } from './ChatMessageBubble';

// Type definitions for chat messages
interface ChatMessage {
  id: string;
  message: string;
  isUser: boolean;
  timestamp: Date;
}

interface ChatWindowProps {
  className?: string;
}

/**
 * ChatWindow Component
 * 
 * Main chat interface for agent.pulsespark.ai with PulseSpark branding.
 * Features auto-scrolling message list, expandable input, and simulated AI responses.
 * Uses the existing ChatMessageBubble component for consistent message styling.
 */
export const ChatWindow: React.FC<ChatWindowProps> = ({ className = '' }) => {
  // State management for chat functionality
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      message: 'Hello! I\'m your AI assistant. How can I help you today?',
      isUser: false,
      timestamp: new Date(Date.now() - 300000) // 5 minutes ago
    }
  ]);
  
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Refs for DOM manipulation
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /**
   * Auto-scroll to bottom when new messages are added
   * Ensures users always see the latest message in the conversation
   */
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  /**
   * Auto-scroll effect - triggers when messages array changes
   * Also scrolls when loading state changes to show typing indicator
   */
  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  /**
   * Auto-resize textarea based on content
   * Expands up to 5 lines (120px max height) for better UX
   */
  useEffect(() => {
    if (textareaRef.current) {
      // Reset height to auto to get the correct scrollHeight
      textareaRef.current.style.height = 'auto';
      
      // Set height based on content, with min and max constraints
      const scrollHeight = textareaRef.current.scrollHeight;
      const maxHeight = 120; // 5 lines approximately
      const minHeight = 48; // 2 lines approximately
      
      textareaRef.current.style.height = `${Math.min(Math.max(scrollHeight, minHeight), maxHeight)}px`;
    }
  }, [inputValue]);

  /**
   * Generate simulated AI responses
   * Returns realistic responses based on user input patterns
   */
  const generateAIResponse = (userMessage: string): string => {
    const responses = [
      "That's a great question! Let me help you with that.",
      "I understand what you're looking for. Here's what I can suggest:",
      "Thanks for sharing that information. Based on what you've told me:",
      "I'd be happy to assist you with that. Here are some options:",
      "That's an interesting point. Let me provide some insights:",
      "I can definitely help you with that task. Here's my recommendation:",
      "Great! I have some ideas that might work well for your situation:",
      "I see what you're trying to accomplish. Here's how we can approach it:"
    ];
    
    // Simple keyword-based responses for demo purposes
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('help') || lowerMessage.includes('how')) {
      return "I'd be happy to help! Could you provide more details about what you're trying to accomplish?";
    }
    
    if (lowerMessage.includes('code') || lowerMessage.includes('programming')) {
      return "I can assist with coding tasks! What programming language or framework are you working with?";
    }
    
    if (lowerMessage.includes('project')) {
      return "Projects are exciting! Tell me more about what you're building and I'll help you plan it out.";
    }
    
    // Return random response for other messages
    return responses[Math.floor(Math.random() * responses.length)];
  };

  /**
   * Handle sending a new message
   * Adds user message, clears input, and simulates AI response with delay
   */
  const handleSendMessage = async () => {
    const trimmedInput = inputValue.trim();
    if (!trimmedInput || isLoading) return;

    // Create user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      message: trimmedInput,
      isUser: true,
      timestamp: new Date()
    };

    // Add user message to chat
    setMessages(prev => [...prev, userMessage]);
    
    // Clear input and reset textarea height
    setInputValue('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    // Show loading state for AI response
    setIsLoading(true);

    try {
      // Simulate AI processing delay (1-3 seconds)
      const delay = 1000 + Math.random() * 2000;
      await new Promise(resolve => setTimeout(resolve, delay));

      // Generate and add AI response
      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        message: generateAIResponse(trimmedInput),
        isUser: false,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      console.error('Error generating AI response:', error);
      
      // Add error message if something goes wrong
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        message: "Sorry, I encountered an error. Please try again.",
        isUser: false,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle keyboard events in textarea
   * Enter sends message, Shift+Enter creates new line
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  /**
   * Handle input change with character limit
   * Prevents extremely long messages (max 2000 characters)
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= 2000) {
      setInputValue(value);
    }
  };

  // Check if send button should be enabled
  const canSend = inputValue.trim().length > 0 && !isLoading;

  return (
    <div className={`flex flex-col h-full bg-gray-50 ${className}`}>
      {/* Chat Header - Optional branding area */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <span className="text-green-600 font-semibold text-sm">AI</span>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">PulseSpark AI Assistant</h2>
            <p className="text-sm text-gray-600">Ready to help with your projects</p>
          </div>
        </div>
      </div>

      {/* Messages Area - Scrollable container for chat messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {/* Render all chat messages using ChatMessageBubble component */}
        {messages.map((msg) => (
          <ChatMessageBubble
            key={msg.id}
            message={msg.message}
            isUser={msg.isUser}
            timestamp={msg.timestamp}
          />
        ))}

        {/* Loading Indicator - Shows when AI is typing */}
        {isLoading && (
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
              <span className="text-gray-600 font-semibold text-sm">AI</span>
            </div>
            <div className="bg-gray-200 text-gray-900 rounded-2xl rounded-bl-md px-4 py-3 max-w-[75%]">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-gray-600" />
                <span className="text-sm text-gray-600">AI is typing...</span>
              </div>
            </div>
          </div>
        )}

        {/* Auto-scroll anchor - Invisible element at bottom for scrolling */}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area - Fixed at bottom with textarea and send button */}
      <div className="flex-shrink-0 bg-white border-t border-gray-200 px-6 py-4">
        <div className="flex items-end gap-3 max-w-4xl mx-auto">
          {/* Message Input - Expandable textarea with auto-resize */}
          <div className="flex-1 relative">
            <label htmlFor="messageInput" className="sr-only">
              Type your message
            </label>
            <textarea
              ref={textareaRef}
              id="messageInput"
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Type your message... (Enter to send, Shift+Enter for new line)"
              disabled={isLoading}
              className="
                w-full bg-gray-100 text-gray-900 rounded-md p-3 pr-12
                border border-gray-300 resize-none transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent
                hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed
                placeholder-gray-500
              "
              style={{ 
                minHeight: '48px',
                maxHeight: '120px'
              }}
              aria-describedby="input-help"
            />
            
            {/* Character Counter - Shows remaining characters */}
            <div className="absolute bottom-1 right-1 text-xs text-gray-400 pointer-events-none">
              {inputValue.length}/2000
            </div>
          </div>

          {/* Send Button - Green themed with loading state */}
          <button
            onClick={handleSendMessage}
            disabled={!canSend}
            className="
              flex items-center justify-center w-12 h-12 rounded-md transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2
              disabled:opacity-50 disabled:cursor-not-allowed
              bg-green-600 hover:bg-green-700 text-white
              transform hover:scale-105 active:scale-95
            "
            aria-label={isLoading ? 'AI is responding...' : 'Send message'}
            title={canSend ? 'Send message' : 'Type a message to send'}
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Input Help Text - Hidden but accessible for screen readers */}
        <p id="input-help" className="sr-only">
          Type your message and press Enter to send, or Shift+Enter to add a new line. Maximum 2000 characters.
        </p>

        {/* Keyboard Shortcuts Help - Visible helper text */}
        <div className="mt-2 text-center">
          <p className="text-xs text-gray-500">
            Press <kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">Enter</kbd> to send, 
            <kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs ml-1">Shift + Enter</kbd> for new line
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;