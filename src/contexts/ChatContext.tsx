import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { ChatContextType, ChatMessage, ChatSession, ApiKeyProvider } from '../types';
import { useAuth } from './AuthContext';
import { useApiKeys } from './ApiKeysContext';
import { useNotification } from './NotificationContext';
import { useMemoryContext } from './MemoryContext';
import { decryptApiKey } from '../lib/encryption';
import { API_CONFIG } from '../lib/config';

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

interface ChatProviderProps {
  children: React.ReactNode;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<ApiKeyProvider>('OpenAI');
  
  const { user } = useAuth();
  const { apiKeys } = useApiKeys();
  const { showNotification } = useNotification();
  const { searchMemory } = useMemoryContext();

  // Load chat history on mount
  useEffect(() => {
    if (user) {
      loadChatHistory();
    }
  }, [user]);

  /**
   * Load or create a chat session for the current user
   * Loads the most recent session or creates a new one if none exists
   */
  const loadChatHistory = async () => {
    if (!user) return;

    try {
      // Get or create current session
      let { data: sessions, error: sessionError } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(1);

      if (sessionError) throw sessionError;

      let session = sessions?.[0];
      
      if (!session) {
        // Create new session
        const { data: newSession, error: createError } = await supabase
          .from('chat_sessions')
          .insert({
            user_id: user.id,
            title: 'New Chat',
            messages: []
          })
          .select()
          .single();

        if (createError) throw createError;
        session = newSession;
      }

      setCurrentSession(session);
      setMessages(session.messages || []);
    } catch (err: any) {
      setError(err.message);
      showNotification('Failed to load chat history', 'error');
    }
  };

  /**
   * Save the current chat session to Supabase
   * Updates the messages and timestamp in the database
   */
  const saveSession = async (updatedMessages: ChatMessage[]) => {
    if (!currentSession || !user) return;

    try {
      const { error } = await supabase
        .from('chat_sessions')
        .update({
          messages: updatedMessages,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentSession.id);

      if (error) throw error;
    } catch (err: any) {
      console.error('Failed to save session:', err);
    }
  };

  /**
   * Send a message to the AI and handle the response
   * Integrates with the backend API to get AI responses
   * Enhanced with memory context for intelligent responses
   */
  const sendMessage = async (content: string) => {
    if (!user || !currentSession) return;

    // Find API key for selected provider
    const apiKey = apiKeys.find(key => key.provider === selectedProvider);
    if (!apiKey) {
      showNotification(`No API key found for ${selectedProvider}`, 'error');
      return;
    }

    setLoading(true);
    setError(null);

    // Add user message immediately for better UX
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content,
      role: 'user',
      timestamp: new Date().toISOString(),
      provider: selectedProvider
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);

    try {
      // Debug logging for API connection
      console.log('API URL:', API_CONFIG.BASE_URL);
      const session = await supabase.auth.getSession();
      console.log('Auth token present:', !!session.data.session?.access_token);
      console.log('API call starting...');
      
      // Search for relevant memories to enhance context
      let memoryContext = '';
      try {
        const relevantMemories = await searchMemory(content, {
          topK: 3,
          threshold: 0.7,
          projectId: undefined // Remove currentProject dependency for now
        });
        
        if (relevantMemories.length > 0) {
          memoryContext = '\n\nRelevant context from your memory:\n' + 
            relevantMemories.map(memory => 
              `- ${memory.text.substring(0, 200)}${memory.text.length > 200 ? '...' : ''}`
            ).join('\n');
        }
      } catch (memoryError) {
        console.warn('Failed to fetch memory context:', memoryError);
      }

      // Decrypt the API key for backend use
      const decryptedKey = decryptApiKey(apiKey.encrypted_key);

      // Prepare conversation history (last 10 messages for context)
      const conversationHistory = updatedMessages
        .slice(-10)
        .map(msg => ({
          role: msg.role,
          content: msg.content
        }));

      console.log('Making API call to:', `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.GENERATE}`);
      
      // Call backend API
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.GENERATE}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.data.session?.access_token}`,
          'Origin': APP_CONFIG.FRONTEND_URL
        },
        body: JSON.stringify({
          user_id: user.id,
          prompt: content + memoryContext,
          conversation_history: conversationHistory,
          api_provider: selectedProvider.toLowerCase(),
          api_key: decryptedKey
        })
      });

      console.log('API response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('API error response:', errorData);
        throw new Error(errorData.error || 'Failed to generate response');
      }

      const data = await response.json();
      console.log('API response received:', data);

      // Add AI response
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: data.response,
        role: 'assistant',
        timestamp: new Date().toISOString(),
        provider: selectedProvider
      };

      const finalMessages = [...updatedMessages, aiMessage];
      setMessages(finalMessages);
      await saveSession(finalMessages);

    } catch (err: any) {
      console.error('Chat API error:', err);
      setError(err.message);
      
      // Add error message to chat
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: 'Sorry, I encountered an error generating a response. Please try again.',
        role: 'assistant',
        timestamp: new Date().toISOString(),
        provider: selectedProvider,
        error: err.message
      };

      const errorMessages = [...updatedMessages, errorMessage];
      setMessages(errorMessages);
      showNotification(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Retry the last AI message if it failed
   * Removes the error message and resends the last user message
   */
  const retryLastMessage = async () => {
    if (messages.length < 2) return;
    
    const lastUserMessage = [...messages].reverse().find(msg => msg.role === 'user');
    if (!lastUserMessage) return;

    // Remove last AI message if it was an error
    const filteredMessages = messages.filter(msg => 
      !(msg.role === 'assistant' && msg.timestamp > lastUserMessage.timestamp)
    );
    
    setMessages(filteredMessages);
    await sendMessage(lastUserMessage.content);
  };

  /**
   * Clear the current chat session
   * Removes all messages from the current session
   */
  const clearChat = async () => {
    if (!currentSession) return;

    try {
      const { error } = await supabase
        .from('chat_sessions')
        .update({
          messages: [],
          updated_at: new Date().toISOString()
        })
        .eq('id', currentSession.id);

      if (error) throw error;

      setMessages([]);
      showNotification('Chat history cleared', 'success');
    } catch (err: any) {
      showNotification('Failed to clear chat history', 'error');
    }
  };

  const value: ChatContextType = {
    messages,
    currentSession,
    loading,
    error,
    selectedProvider,
    setSelectedProvider,
    sendMessage,
    clearChat,
    loadChatHistory,
    retryLastMessage
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};