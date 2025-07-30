import React, { useState } from 'react';
import { useChat } from '../contexts/ChatContext';
import { useApiKeys } from '../contexts/ApiKeysContext';
import { LoadingSpinner } from '../components/Shared/LoadingSpinner';
import { Bot, User, MessageSquare, Send } from 'lucide-react';

export const ChatPage: React.FC = () => {
  const { messages, loading, sendMessage, selectedProvider, setSelectedProvider } = useChat();
  const { apiKeys } = useApiKeys();
  const [input, setInput] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    
    const message = input.trim();
    setInput('');
    await sendMessage(message);
  };

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-white">AI Chat</h1>
          
          {/* Provider Selector */}
          {apiKeys.length > 0 && (
            <select
              value={selectedProvider}
              onChange={(e) => setSelectedProvider(e.target.value as any)}
              className="bg-gray-700 border border-gray-600 rounded px-3 py-1 text-white text-sm"
            >
              {apiKeys.map(key => (
                <option key={key.id} value={key.provider}>{key.provider}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-400 mt-20">
            <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">No messages yet</p>
            <p className="text-sm mt-2">Start a conversation below</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                message.role === 'user' ? 'bg-blue-600' : 'bg-gray-600'
              }`}>
                {message.role === 'user' ? (
                  <User className="w-4 h-4 text-white" />
                ) : (
                  <Bot className="w-4 h-4 text-white" />
                )}
              </div>
              <div className={`max-w-3xl ${message.role === 'user' ? 'text-right' : ''}`}>
                <div className={`inline-block px-4 py-2 rounded-lg ${
                  message.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-100'
                }`}>
                  {message.content}
                </div>
              </div>
            </div>
          ))
        )}
        
        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-gray-700 px-4 py-2 rounded-lg">
              <LoadingSpinner size="sm" />
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="border-t border-gray-700 p-4">
        <div className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={apiKeys.length > 0 ? "Type a message..." : "Add an API key to start chatting"}
            disabled={loading || apiKeys.length === 0}
            className="flex-1 bg-gray-800 border border-gray-600 rounded px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading || apiKeys.length === 0}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        {apiKeys.length === 0 && (
          <p className="text-red-400 text-sm mt-2">Please add an API key in settings first</p>
        )}
      </form>
    </div>
  );
};