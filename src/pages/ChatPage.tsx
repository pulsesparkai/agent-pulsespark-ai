import React from 'react';
import { ChatInput } from '../components/Chat/ChatInput';
import { useChat } from '../contexts/ChatContext';
import { LoadingSpinner } from '../components/Shared/LoadingSpinner';
import { Bot, User, MessageSquare } from 'lucide-react';

/**
 * ChatPage Component
 * 
 * Simple chat interface that uses the ChatContext
 */
export const ChatPage: React.FC = () => {
  const { 
    messages, 
    loading, 
    error,
    currentSession 
  } = useChat();

  if (loading && messages.length === 0) {
    return (
      <div className="flex h-full items-center justify-center bg-gray-900">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <h1 className="text-xl font-semibold text-white">
          {currentSession?.title || 'Chat with AI'}
        </h1>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-400 mt-20">
            <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">No messages yet</p>
            <p className="text-sm mt-2">Start a conversation by typing below</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                message.role === 'user' ? 'bg-blue-600' : 'bg-gray-600'
              }`}>
                {message.role === 'user' ? (
                  <User className="w-4 h-4 text-white" />
                ) : (
                  <Bot className="w-4 h-4 text-white" />
                )}
              </div>

              {/* Message Content */}
              <div className={`max-w-3xl ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
                <div className={`inline-block px-4 py-3 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-100'
                }`}>
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            </div>
          ))
        )}
        
        {/* Loading indicator */}
        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-gray-700 text-gray-100 px-4 py-3 rounded-lg">
              <LoadingSpinner size="sm" />
            </div>
          </div>
        )}
        
        {/* Error message */}
        {error && (
          <div className="text-center text-red-400 mt-4">
            <p>{error}</p>
          </div>
        )}
      </div>

      {/* Input Area */}
      <ChatInput />
    </div>
  );
};