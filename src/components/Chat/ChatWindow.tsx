import React, { useEffect, useRef } from 'react';
import { ChatMessage } from './ChatMessage';
import { TypingIndicator } from './TypingIndicator';
import { useChat } from '../../contexts/ChatContext';
import { MessageSquare, Trash2 } from 'lucide-react';

/**
 * ChatWindow Component
 * 
 * Displays the main chat interface with message history, typing indicators,
 * and chat management controls. Features auto-scroll and responsive design.
 */
export const ChatWindow: React.FC = () => {
  const { messages, loading, clearChat, retryLastMessage } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showClearConfirm, setShowClearConfirm] = React.useState(false);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  /**
   * Handle chat clearing with confirmation
   */
  const handleClearChat = async () => {
    await clearChat();
    setShowClearConfirm(false);
  };

  /**
   * Find the last error message for retry functionality
   */
  const getLastErrorMessage = () => {
    return [...messages].reverse().find(msg => msg.role === 'assistant' && msg.error);
  };

  const lastErrorMessage = getLastErrorMessage();

  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      {/* Chat Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">AI Chat</h1>
              <p className="text-sm text-gray-600">
                {messages.length === 0 
                  ? 'Start a conversation with AI' 
                  : `${messages.length} message${messages.length !== 1 ? 's' : ''}`
                }
              </p>
            </div>
          </div>

          {/* Clear Chat Button */}
          {messages.length > 0 && (
            <div className="flex items-center gap-2">
              {showClearConfirm ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Clear all messages?</span>
                  <button
                    onClick={handleClearChat}
                    className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                  >
                    Clear
                  </button>
                  <button
                    onClick={() => setShowClearConfirm(false)}
                    className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowClearConfirm(true)}
                  className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Clear chat history"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="text-sm">Clear</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-4xl mx-auto">
          {messages.length === 0 ? (
            // Empty state
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Welcome to PulseSpark AI
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Start a conversation with your AI assistant. Select your preferred provider and begin chatting.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
                <p className="text-blue-800 text-sm">
                  💡 <strong>Tip:</strong> Make sure you have configured API keys for your preferred providers in the API Keys section.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Message List */}
              {messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  onRetry={message === lastErrorMessage ? retryLastMessage : undefined}
                  showRetry={message === lastErrorMessage}
                />
              ))}
              
              {/* Typing Indicator */}
              {loading && <TypingIndicator />}
            </>
          )}
          
          {/* Auto-scroll anchor */}
          <div ref={messagesEndRef} />
        </div>
      </div>
    </div>
  );
};