import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { ChatContextType, ChatMessage, ChatSession, ApiKeyProvider } from '../types';
import { useAuth } from './AuthContext';
import { useApiKeys } from './ApiKeysContext';
import { useNotification } from './NotificationContext';

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

  // Load chat history on mount
  useEffect(() => {
    if (user) {
      loadChatHistory();
    }
  }, [user]);

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

    // Add user message
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
      // Call backend API
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          prompt: content,
          provider: selectedProvider,
          apiKeyId: apiKey.id,
          conversationHistory: updatedMessages.slice(-10) // Last 10 messages for context
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate response');
      }

      const data = await response.json();

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
      setError(err.message);
      
      // Add error message
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: 'Sorry, I encountered an error generating a response.',
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