import React from 'react';
import { Bot } from 'lucide-react';

/**
 * TypingIndicator Component
 * 
 * Shows an animated typing indicator when the AI is generating a response.
 * Features bouncing dots animation and consistent styling with chat messages.
 */
export const TypingIndicator: React.FC = () => {
  return (
    <div className="flex gap-3 mb-6">
      {/* Avatar */}
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center">
        <Bot className="w-4 h-4" />
      </div>

      {/* Typing Animation */}
      <div className="flex-1 max-w-3xl">
        <div className="flex items-center gap-2 mb-1 text-xs text-gray-500">
          <span>AI Assistant</span>
          <span>•</span>
          <span>typing...</span>
        </div>

        <div className="inline-block px-4 py-3 bg-gray-100 rounded-2xl rounded-bl-md">
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    </div>
  );
};