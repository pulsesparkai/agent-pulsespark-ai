import React, { createContext, useContext, useState } from 'react';
import { ChatMessage, ApiKeyProvider } from '../types';
import { useAuth } from './AuthContext';
import { useApiKeys } from './ApiKeysContext';
import { useNotification } from './NotificationContext';

interface ChatContextType {
  messages: ChatMessage[];
  loading: boolean;
  error: string | null;
  selectedProvider: ApiKeyProvider;
  setSelectedProvider: (provider: ApiKeyProvider) => void;
  sendMessage: (content: string) => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<ApiKeyProvider>('OpenAI');
  
  const { user } = useAuth();
  const { apiKeys } = useApiKeys();
  const { showNotification } = useNotification();

  const sendMessage = async (content: string) => {
    if (!user) {
      showNotification('Please log in to send messages', 'error');
      return;
    }

    const apiKey = apiKeys.find(key => key.provider === selectedProvider);
    if (!apiKey) {
      showNotification(`Please add an API key for ${selectedProvider}`, 'error');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Add user message immediately
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        content,
        role: 'user',
        timestamp: new Date().toISOString(),
        provider: selectedProvider
      };
      
      setMessages(prev => [...prev, userMessage]);

      // Simulate AI response for now (replace with actual API call)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: `This is a simulated response to: "${content}". Please configure your backend API to get real responses.`,
        role: 'assistant',
        timestamp: new Date().toISOString(),
        provider: selectedProvider
      };
      
      setMessages(prev => [...prev, aiMessage]);
      
    } catch (err: any) {
      console.error('Error sending message:', err);
      setError(err.message || 'Failed to send message');
      showNotification('Failed to send message', 'error');
    } finally {
      setLoading(false);
    }
  };

  const value: ChatContextType = {
    messages,
    loading,
    error,
    selectedProvider,
    setSelectedProvider,
    sendMessage
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};