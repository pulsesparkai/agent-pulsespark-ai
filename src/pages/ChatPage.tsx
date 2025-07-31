/**
 * Chat Page for PulseSpark AI
 * Multi-provider AI chat interface with session management
 */

import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Plus, MessageSquare, Settings, Trash2, Brain } from 'lucide-react';
import { useChatContext } from '../contexts/ChatContext';
import { useAuth } from '../contexts/AuthContext';
import { useApiKeys } from '../contexts/ApiKeysContext';
import { useNotification } from '../contexts/NotificationContext';

// UPDATED: Added DeepSeek-R1 to available providers
const AVAILABLE_PROVIDERS = ['OpenAI', 'Claude', 'DeepSeek', 'DeepSeek-R1', 'Grok', 'Mistral'];

export const ChatPage: React.FC = () => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { user } = useAuth();
  const { apiKeys } = useApiKeys();
  const { showNotification } = useNotification();
  
  const {
    messages,
    loading,
    error,
    selectedProvider,
    setSelectedProvider,
    sendMessage,
    currentSession,
    createNewSession,
    deleteSession,
    switchSession,
    chatSessions
  } = useChatContext();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Get available providers based on user's API keys
  const availableProviders = AVAILABLE_PROVIDERS.filter(provider => 
    apiKeys.some(key => key.provider === provider)
  );

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const messageContent = input.trim();
    setInput('');
    await sendMessage(messageContent);
  };

  // UPDATED: Handle provider selection with enhanced notifications
  const handleProviderChange = (provider: string) => {
    setSelectedProvider(provider);
    
    // Show different notifications for DeepSeek models
    if (provider === 'DeepSeek-R1') {
      showNotification('Switched to DeepSeek R1 - Advanced reasoning model with thinking process', 'info');
    } else if (provider === 'DeepSeek') {
      showNotification('Switched to DeepSeek V3 - Fast general chat model', 'info');
    } else {
      showNotification(`Switched to ${provider}`, 'info');
    }
  };

  // Handle new session creation
  const handleNewSession = async () => {
    const title = `Chat - ${new Date().toLocaleDateString()}`;
    await createNewSession(title);
  };

  // Handle session deletion
  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent switching to session
    
    if (confirm('Are you sure you want to delete this chat session?')) {
      await deleteSession(sessionId);
    }
  };

  // Format timestamp for display
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // NEW: Get provider badge styling
  const getProviderBadge = (provider: string) => {
    switch (provider) {
      case 'OpenAI': 
        return { color: 'bg-green-600 text-green-100', icon: null };
      case 'Claude': 
        return { color: 'bg-orange-600 text-orange-100', icon: null };
      case 'DeepSeek': 
        return { color: 'bg-blue-600 text-blue-100', icon: null };
      case 'DeepSeek-R1': 
        return { color: 'bg-purple-600 text-purple-100', icon: <Brain className="w-3 h-3" /> };
      case 'Grok': 
        return { color: 'bg-gray-600 text-gray-100', icon: null };
      case 'Mistral': 
        return { color: 'bg-red-600 text-red-100', icon: null };
      default: 
        return { color: 'bg-gray-600 text-gray-100', icon: null };
    }
  };

  // NEW: Get provider description
  const getProviderDescription = (provider: string) => {
    switch (provider) {
      case 'OpenAI': return 'GPT models for general chat';
      case 'Claude': return 'Anthropic\'s conversational AI';
      case 'DeepSeek': return 'DeepSeek V3 - Fast general chat';
      case 'DeepSeek-R1': return 'DeepSeek R1-0528 - Advanced reasoning with thinking process';
      case 'Grok': return 'X.AI\'s conversational model';
      case 'Mistral': return 'Mistral\'s language models';
      default: return 'AI language model';
    }
  };

  return (
    <div className="flex h-full bg-gray-900">
      {/* Sidebar - Chat Sessions */}
      <div className="w-80 bg-gray-800 border-r border-gray-700 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">Chat Sessions</h2>
            <button
              onClick={handleNewSession}
              className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors"
              title="New Chat"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          {/* Provider Selector */}
          <div className="space-y-2">
            <label className="text-sm text-gray-300">AI Provider</label>
            <select
              value={selectedProvider}
              onChange={(e) => handleProviderChange(e.target.value)}
              disabled={availableProviders.length === 0}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {availableProviders.length > 0 ? (
                availableProviders.map(provider => (
                  <option key={provider} value={provider}>
                    {provider}
                  </option>
                ))
              ) : (
                <option value="">No API keys configured</option>
              )}
            </select>
            
            {/* NEW: Provider description */}
            {selectedProvider && availableProviders.length > 0 && (
              <p className="text-xs text-gray-400">
                {getProviderDescription(selectedProvider)}
              </p>
            )}
            
            {availableProviders.length === 0 && (
              <p className="text-xs text-red-400 flex items-center gap-1">
                <Settings className="w-3 h-3" />
                Add API keys in Settings
              </p>
            )}
          </div>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto">
          {chatSessions.length === 0 ? (
            <div className="p-4 text-center text-gray-400">
              <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No chat sessions yet</p>
              <p className="text-xs">Start a new conversation!</p>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {chatSessions.map((session) => (
                <div
                  key={session.id}
                  onClick={() => switchSession(session)}
                  className={`group p-3 rounded-lg cursor-pointer transition-colors relative ${
                    currentSession?.id === session.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{session.title}</h3>
                      <p className="text-xs opacity-75 mt-1">
                        {new Date(session.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={(e) => handleDeleteSession(session.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-600 rounded transition-all"
                      title="Delete session"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="p-4 border-b border-gray-700 bg-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-white">
                {currentSession?.title || 'PulseSpark AI Chat'}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-sm text-gray-400">
                  {messages.length} messages
                </p>
                {/* NEW: Enhanced provider badge */}
                {selectedProvider && availableProviders.length > 0 && (
                  <div className="flex items-center gap-1">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getProviderBadge(selectedProvider).color}`}>
                      {getProviderBadge(selectedProvider).icon}
                      {selectedProvider}
                    </span>
                    {selectedProvider === 'DeepSeek-R1' && (
                      <span className="text-xs text-purple-400 font-medium">
                        🧠 Advanced Reasoning
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            {error && (
              <div className="bg-red-900 border border-red-700 text-red-200 px-3 py-1 rounded text-sm">
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <Bot className="w-16 h-16 mb-4 opacity-50" />
              <h3 className="text-xl font-semibold mb-2">Ready to chat!</h3>
              <p className="text-center max-w-md mb-4">
                {availableProviders.length > 0
                  ? `Start a conversation with ${selectedProvider}. Ask me anything!`
                  : 'Please add an API key in Settings to start chatting.'
                }
              </p>
              
              {/* NEW: DeepSeek R1 features showcase */}
              {selectedProvider === 'DeepSeek-R1' && (
                <div className="p-4 bg-purple-900/30 border border-purple-700/50 rounded-lg text-sm text-purple-200 max-w-md">
                  <div className="flex items-center gap-2 mb-2">
                    <Brain className="w-4 h-4" />
                    <span className="font-medium">DeepSeek R1 Features:</span>
                  </div>
                  <ul className="text-left space-y-1 text-xs">
                    <li>• Advanced reasoning and thinking process</li>
                    <li>• Better for complex math and logic problems</li>
                    <li>• Enhanced code analysis capabilities</li>
                    <li>• Up to 32K tokens for detailed responses</li>
                  </ul>
                </div>
              )}
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.role === 'assistant' && (
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.provider === 'DeepSeek-R1' 
                      ? 'bg-gradient-to-r from-purple-500 to-purple-700' 
                      : 'bg-gradient-to-r from-blue-500 to-purple-600'
                  }`}>
                    {message.provider === 'DeepSeek-R1' ? (
                      <Brain className="w-4 h-4 text-white" />
                    ) : (
                      <Bot className="w-4 h-4 text-white" />
                    )}
                  </div>
                )}
                
                <div className={`max-w-3xl ${message.role === 'user' ? 'order-first' : ''}`}>
                  <div
                    className={`px-4 py-2 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white ml-auto'
                        : 'bg-gray-700 text-gray-100'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{message.content}</div>
                    <div className={`text-xs mt-1 opacity-75 flex items-center gap-2 ${
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}>
                      <span>{formatTime(message.timestamp)}</span>
                      {/* NEW: Enhanced provider badge in messages */}
                      {message.provider && message.role === 'assistant' && (
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs ${getProviderBadge(message.provider).color}`}>
                          {getProviderBadge(message.provider).icon}
                          {message.provider}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {message.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
            ))
          )}

          {loading && (
            <div className="flex gap-3 justify-start">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                selectedProvider === 'DeepSeek-R1' 
                  ? 'bg-gradient-to-r from-purple-500 to-purple-700' 
                  : 'bg-gradient-to-r from-blue-500 to-purple-600'
              }`}>
                {selectedProvider === 'DeepSeek-R1' ? (
                  <Brain className="w-4 h-4 text-white" />
                ) : (
                  <Bot className="w-4 h-4 text-white" />
                )}
              </div>
              <div className="bg-gray-700 px-4 py-2 rounded-lg text-gray-100">
                <div className="flex items-center gap-2">
                  <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                  {selectedProvider === 'DeepSeek-R1' ? (
                    <span>🧠 {selectedProvider} is thinking deeply...</span>
                  ) : (
                    <span>{selectedProvider} is thinking...</span>
                  )}
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <form onSubmit={handleSubmit} className="border-t border-gray-700 p-4 bg-gray-800">
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                availableProviders.length > 0 
                  ? selectedProvider === 'DeepSeek-R1'
                    ? "Ask me a complex reasoning question..."
                    : "Type a message..." 
                  : "Add an API key to start chatting"
              }
              disabled={loading || availableProviders.length === 0}
              className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading || availableProviders.length === 0}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
            >
              <Send className="w-5 h-5" />
              Send
            </button>
          </div>
          
          {availableProviders.length === 0 && (
            <p className="text-red-400 text-sm mt-2 flex items-center gap-1">
              <Settings className="w-4 h-4" />
              Please add API keys in Settings to enable chat functionality
            </p>
          )}
        </form>
      </div>
    </div>
  );
};