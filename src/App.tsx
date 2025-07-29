import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useApiKeys } from '../../contexts/ApiKeysContext';
import { useNotification } from '../../contexts/NotificationContext';
import { supabase } from '../../lib/supabase';
import { LoadingSpinner } from '../Shared/LoadingSpinner';
import { 
  MessageSquare, 
  Plus, 
  Send, 
  Bot, 
  User, 
  Trash2,
  Edit2,
  Search,
  Filter,
  X
} from 'lucide-react';
import { ChatMessage, ChatSession, ApiKeyProvider } from '../../types';

/**
 * ChatPage Component
 * 
 * Complete chat management interface with session management,
 * message history, and AI provider integration.
 */
export const ChatPage: React.FC = () => {
  const { user } = useAuth();
  const { apiKeys } = useApiKeys();
  const { showNotification } = useNotification();

  // State management
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // UI state
  const [inputMessage, setInputMessage] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<ApiKeyProvider>('OpenAI');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewSessionModal, setShowNewSessionModal] = useState(false);
  const [newSessionTitle, setNewSessionTitle] = useState('');

  // Load chat sessions on mount
  useEffect(() => {
    if (user) {
      loadChatSessions();
    }
  }, [user]);

  // Load messages when session changes
  useEffect(() => {
    if (currentSession) {
      setMessages(currentSession.messages || []);
    }
  }, [currentSession]);

  /**
   * Load all chat sessions for the current user
   */
  const loadChatSessions = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (fetchError) throw fetchError;

      setChatSessions(data || []);
      
      // Select first session if available
      if (data && data.length > 0 && !currentSession) {
        setCurrentSession(data[0]);
      }

    } catch (err: any) {
      setError(err.message);
      showNotification('Failed to load chat sessions', 'error');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Create a new chat session
   */
  const createNewSession = async () => {
    if (!user || !newSessionTitle.trim()) return;

    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .insert({
          user_id: user.id,
          title: newSessionTitle.trim(),
          messages: []
        })
        .select()
        .single();

      if (error) throw error;

      setChatSessions(prev => [data, ...prev]);
      setCurrentSession(data);
      setNewSessionTitle('');
      setShowNewSessionModal(false);
      showNotification('New chat session created', 'success');

    } catch (err: any) {
      showNotification('Failed to create chat session', 'error');
    }
  };

  /**
   * Send a message to AI
   */
  const sendMessage = async () => {
    if (!inputMessage.trim() || !currentSession || sending) return;

    const apiKey = apiKeys.find(key => key.provider === selectedProvider);
    if (!apiKey) {
      showNotification(`No API key found for ${selectedProvider}`, 'error');
      return;
    }

    setSending(true);

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: inputMessage,
      role: 'user',
      timestamp: new Date().toISOString(),
      provider: selectedProvider
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputMessage('');

    try {
      // Simulate AI response (replace with actual API call)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: `This is a simulated response from ${selectedProvider}. In production, this would be the actual AI response.`,
        role: 'assistant',
        timestamp: new Date().toISOString(),
        provider: selectedProvider
      };

      const finalMessages = [...updatedMessages, aiMessage];
      setMessages(finalMessages);

      // Save to database
      await supabase
        .from('chat_sessions')
        .update({
          messages: finalMessages,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentSession.id);

    } catch (err: any) {
      showNotification('Failed to send message', 'error');
    } finally {
      setSending(false);
    }
  };

  /**
   * Delete a chat session
   */
  const deleteSession = async (sessionId: string) => {
    if (!window.confirm('Are you sure you want to delete this chat session?')) return;

    try {
      const { error } = await supabase
        .from('chat_sessions')
        .delete()
        .eq('id', sessionId);

      if (error) throw error;

      setChatSessions(prev => prev.filter(s => s.id !== sessionId));
      
      if (currentSession?.id === sessionId) {
        const remaining = chatSessions.filter(s => s.id !== sessionId);
        setCurrentSession(remaining[0] || null);
      }

      showNotification('Chat session deleted', 'success');

    } catch (err: any) {
      showNotification('Failed to delete chat session', 'error');
    }
  };

  // Filter sessions based on search
  const filteredSessions = chatSessions.filter(session =>
    session.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="h-screen bg-gray-900 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const { user } = useAuth();
  const { apiKeys } = useApiKeys();
  const { showNotification } = useNotification();

  // State management
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // UI state
  const [inputMessage, setInputMessage] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<ApiKeyProvider>('OpenAI');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewSessionModal, setShowNewSessionModal] = useState(false);
  const [newSessionTitle, setNewSessionTitle] = useState('');

  // Load chat sessions on mount
  useEffect(() => {
    if (user) {
      loadChatSessions();
    }
  }, [user]);

  // Load messages when session changes
  useEffect(() => {
    if (currentSession) {
      setMessages(currentSession.messages || []);
    }
  }, [currentSession]);

  // Set default provider when API keys load
  useEffect(() => {
    if (apiKeys.length > 0 && !apiKeys.find(k => k.provider === selectedProvider)) {
      setSelectedProvider(apiKeys[0].provider);
    }
  }, [apiKeys, selectedProvider]);

  /**
   * Load all chat sessions for the current user
   */
  const loadChatSessions = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (fetchError) throw fetchError;

      setChatSessions(data || []);
      
      // Select first session if available
      if (data && data.length > 0 && !currentSession) {
        setCurrentSession(data[0]);
      }

    } catch (err: any) {
      setError(err.message);
      showNotification('Failed to load chat sessions', 'error');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Create a new chat session
   */
  const createNewSession = async () => {
    if (!user || !newSessionTitle.trim()) return;

    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .insert({
          user_id: user.id,
          title: newSessionTitle.trim(),
          messages: []
        })
        .select()
        .single();

      if (error) throw error;

      setChatSessions(prev => [data, ...prev]);
      setCurrentSession(data);
      setNewSessionTitle('');
      setShowNewSessionModal(false);
      showNotification('New chat session created', 'success');

    } catch (err: any) {
      showNotification('Failed to create chat session', 'error');
    }
  };

  /**
   * Send a message to AI
   */
  const sendMessage = async () => {
    if (!inputMessage.trim() || !currentSession || sending) return;

    const apiKey = apiKeys.find(key => key.provider === selectedProvider);
    if (!apiKey) {
      showNotification(`No API key found for ${selectedProvider}`, 'error');
      return;
    }

    setSending(true);

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: inputMessage,
      role: 'user',
      timestamp: new Date().toISOString(),
      provider: selectedProvider
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputMessage('');

    try {
      // Simulate AI response (replace with actual API call)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: `This is a simulated response from ${selectedProvider}. In production, this would connect to the actual AI API using your stored API key. The response would be generated based on your message: "${userMessage.content}"`,
        role: 'assistant',
        timestamp: new Date().toISOString(),
        provider: selectedProvider
      };

      const finalMessages = [...updatedMessages, aiMessage];
      setMessages(finalMessages);

      // Save to database
      await supabase
        .from('chat_sessions')
        .update({
          messages: finalMessages,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentSession.id);

      // Update current session in state
      setCurrentSession(prev => prev ? { ...prev, messages: finalMessages, updated_at: new Date().toISOString() } : null);

    } catch (err: any) {
      showNotification('Failed to send message', 'error');
    } finally {
      setSending(false);
    }
  };

  /**
   * Delete a chat session
   */
  const deleteSession = async (sessionId: string) => {
    if (!window.confirm('Are you sure you want to delete this chat session? This action cannot be undone.')) return;

    try {
      const { error } = await supabase
        .from('chat_sessions')
        .delete()
        .eq('id', sessionId);

      if (error) throw error;

      setChatSessions(prev => prev.filter(s => s.id !== sessionId));
      
      if (currentSession?.id === sessionId) {
        const remaining = chatSessions.filter(s => s.id !== sessionId);
        setCurrentSession(remaining[0] || null);
      }

      showNotification('Chat session deleted', 'success');

    } catch (err: any) {
      showNotification('Failed to delete chat session', 'error');
    }
  };

  /**
   * Handle keyboard shortcuts
   */
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Filter sessions based on search
  const filteredSessions = chatSessions.filter(session =>
    session.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="text-gray-400 mt-4">Loading chat sessions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-900 flex">
      {/* Sidebar - Chat Sessions */}
      <div className="w-80 bg-gray-800 border-r border-gray-700 flex flex-col">
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Chat Sessions</h2>
            <button
              onClick={() => setShowNewSessionModal(true)}
              className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              title="New chat session"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search sessions..."
              className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto">
          {filteredSessions.length > 0 ? (
            <div className="p-2">
              {filteredSessions.map((session) => (
                <div
                  key={session.id}
                  className={`p-3 rounded-lg mb-2 cursor-pointer transition-colors group ${
                    currentSession?.id === session.id
                      ? 'bg-green-600 text-white'
                      : 'text-gray-300 hover:bg-gray-700'
                  }`}
                  onClick={() => setCurrentSession(session)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{session.title}</h3>
                      <p className="text-xs opacity-75 mt-1">
                        {session.messages?.length || 0} messages
                      </p>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSession(session.id);
                        }}
                        className="p-1 hover:bg-red-600 rounded"
                        title="Delete session"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-gray-400">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-600" />
              <p>No chat sessions found</p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-green-400 hover:text-green-300 text-sm mt-2"
                >
                  Clear search
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {currentSession ? (
          <>
            {/* Chat Header */}
            <div className="bg-gray-800 border-b border-gray-700 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-semibold text-white">{currentSession.title}</h1>
                  <p className="text-gray-400 text-sm">
                    {messages.length} messages • Last updated {new Date(currentSession.updated_at).toLocaleDateString()}
                  </p>
                </div>
                
                {/* Provider Selector */}
                <div className="flex items-center gap-3">
                  <label className="text-gray-400 text-sm">Provider:</label>
                  <select
                    value={selectedProvider}
                    onChange={(e) => setSelectedProvider(e.target.value as ApiKeyProvider)}
                    className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    {apiKeys.map(key => (
                      <option key={key.id} value={key.provider}>{key.provider}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    message.role === 'user' ? 'bg-blue-600' : 'bg-gray-600'
                  }`}>
                    {message.role === 'user' ? (
                      <User className="w-4 h-4 text-white" />
                    ) : (
                      <Bot className="w-4 h-4 text-white" />
                    )}
                  </div>

                  {/* Message Bubble */}
                  <div className={`max-w-3xl ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
                    <div className={`inline-block px-4 py-2 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-100'
                    }`}>
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(message.timestamp).toLocaleTimeString()}
                      {message.provider && ` • ${message.provider}`}
                    </p>
                  </div>
                </div>
              ))}
              
              {sending && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-gray-700 text-gray-100 px-4 py-2 rounded-lg">
                    <div className="flex items-center gap-2">
                      <LoadingSpinner size="sm" />
                      <span>AI is thinking...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Message Input */}
            <div className="bg-gray-800 border-t border-gray-700 p-4">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Type your message..."
                  disabled={sending || apiKeys.length === 0}
                  className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                />
                <button
                  onClick={sendMessage}
                  disabled={!inputMessage.trim() || sending || apiKeys.length === 0}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              
              {apiKeys.length === 0 && (
                <p className="text-red-400 text-sm mt-2">
                  Add an API key to start chatting with AI
                </p>
              )}
            </div>
          </>
        ) : (
          /* No Session Selected */
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-white mb-2">No Chat Session Selected</h2>
              <p className="text-gray-400 mb-6">Select a session from the sidebar or create a new one</p>
              <button
                onClick={() => setShowNewSessionModal(true)}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Start New Chat
              </button>
            </div>
          </div>
        )}
      </div>

      {/* New Session Modal */}
      {showNewSessionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-white mb-4">New Chat Session</h3>
            <input
              type="text"
              value={newSessionTitle}
              onChange={(e) => setNewSessionTitle(e.target.value)}
              placeholder="Enter session title..."
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 mb-4"
              autoFocus
            />
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Chat Sessions
            </h2>
            <button
              onClick={() => setShowNewSessionModal(true)}
              className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              title="New chat session"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search sessions..."
              className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto">
          {filteredSessions.length > 0 ? (
            <div className="p-2">
              {filteredSessions.map((session) => (
                <div
                  key={session.id}
                  className={`p-3 rounded-lg mb-2 cursor-pointer transition-all duration-200 group ${
                    currentSession?.id === session.id
                      ? 'bg-green-600 text-white shadow-lg'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                  onClick={() => setCurrentSession(session)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{session.title}</h3>
                      <p className="text-xs opacity-75 mt-1">
                        {session.messages?.length || 0} messages
                      </p>
                      <p className="text-xs opacity-60 mt-1">
                        {new Date(session.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSession(session.id);
                        }}
                        className="p-1 hover:bg-red-600 rounded transition-colors"
                        title="Delete session"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-gray-400">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-600" />
              <p className="font-medium">No chat sessions found</p>
              {searchQuery ? (
                <div className="mt-3">
                  <p className="text-sm mb-2">No sessions match "{searchQuery}"</p>
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-green-400 hover:text-green-300 text-sm"
                  >
                    Clear search
                  </button>
                </div>
              ) : (
                <p className="text-sm mt-2">Create your first chat session to get started</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {currentSession ? (
          <>
            {/* Chat Header */}
            <div className="bg-gray-800 border-b border-gray-700 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-semibold text-white">{currentSession.title}</h1>
                  <p className="text-gray-400 text-sm">
                    {messages.length} messages • Last updated {new Date(currentSession.updated_at).toLocaleDateString()}
                  </p>
                </div>
                
                {/* Provider Selector */}
                {apiKeys.length > 0 && (
                  <div className="flex items-center gap-3">
                    <label className="text-gray-400 text-sm">Provider:</label>
                    <select
                      value={selectedProvider}
                      onChange={(e) => setSelectedProvider(e.target.value as ApiKeyProvider)}
                      className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      {apiKeys.map(key => (
                        <option key={key.id} value={key.provider}>{key.provider}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length > 0 ? (
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

                    {/* Message Bubble */}
                    <div className={`max-w-3xl ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
                      <div className={`inline-block px-4 py-3 rounded-lg ${
                        message.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-700 text-gray-100'
                      }`}>
                        <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                      </div>
                      <p className="text-xs text-gray-400 mt-1 px-1">
                        {new Date(message.timestamp).toLocaleTimeString()}
                        {message.provider && ` • ${message.provider}`}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <Bot className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">Start a Conversation</h3>
                    <p className="text-gray-400">Send a message to begin chatting with AI</p>
                  </div>
                </div>
              )}
              
              {sending && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-gray-700 text-gray-100 px-4 py-3 rounded-lg">
                    <div className="flex items-center gap-2">
                      <LoadingSpinner size="sm" />
                      <span>AI is thinking...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Message Input */}
            <div className="bg-gray-800 border-t border-gray-700 p-4">
              <div className="flex gap-3">
                <textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={apiKeys.length > 0 ? "Type your message... (Enter to send, Shift+Enter for new line)" : "Add an API key to start chatting"}
                  disabled={sending || apiKeys.length === 0}
                  className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 resize-none"
                  rows={1}
                  style={{ minHeight: '48px', maxHeight: '120px' }}
                />
                <button
                  onClick={sendMessage}
                  disabled={!inputMessage.trim() || sending || apiKeys.length === 0}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {sending ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>
              
              {apiKeys.length === 0 && (
                <p className="text-red-400 text-sm mt-2 flex items-center gap-2">
                  <span>⚠️</span>
                  <span>Add an API key in settings to start chatting with AI</span>
                </p>
              )}
            </div>
          </>
        ) : (
          /* No Session Selected */
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-white mb-2">No Chat Session Selected</h2>
              <p className="text-gray-400 mb-6">Select a session from the sidebar or create a new one</p>
              <button
                onClick={() => setShowNewSessionModal(true)}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 mx-auto"
              >
                <Plus className="w-4 h-4" />
                Start New Chat
              </button>
            </div>
          </div>
        )}
      </div>

      {/* New Session Modal */}
      {showNewSessionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">New Chat Session</h3>
              <button
                onClick={() => {
                  setShowNewSessionModal(false);
                  setNewSessionTitle('');
                }}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="sessionTitle" className="block text-sm font-medium text-gray-300 mb-2">
                  Session Title
                </label>
                <input
                  id="sessionTitle"
                  type="text"
                  value={newSessionTitle}
                  onChange={(e) => setNewSessionTitle(e.target.value)}
                  placeholder="Enter session title..."
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                  autoFocus
                  maxLength={100}
                />
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowNewSessionModal(false);
                    setNewSessionTitle('');
                  }}
                  className="flex-1 px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={createNewSession}
                  disabled={!newSessionTitle.trim()}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Create Session
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};