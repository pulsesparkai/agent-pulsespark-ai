import React, { createContext, useContext, useState } from 'react';

interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: string;
  provider?: string;
}

interface ChatContextType {
  messages: ChatMessage[];
  loading: boolean;
  error: string | null;
  selectedProvider: string;
  setSelectedProvider: (provider: string) => void;
  sendMessage: (content: string) => Promise<void>;
  currentSession: any;
  loadChatHistory: () => Promise<void>;
  createNewSession: (title: string) => Promise<void>;
  deleteSession: (id: string) => Promise<void>;
  switchSession: (session: any) => Promise<void>;
  chatSessions: any[];
  setMessages: (messages: ChatMessage[]) => void;
  setCurrentSession: (session: any) => void;
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
  const [selectedProvider, setSelectedProvider] = useState('OpenAI');
  const [currentSession, setCurrentSession] = useState<any>(null);
  const [chatSessions, setChatSessions] = useState<any[]>([]);

  const sendMessage = async (content: string) => {
    setLoading(true);
    setError(null);
    
    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content,
      role: 'user',
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, userMessage]);

    // Simulate AI response for now
    setTimeout(() => {
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: `I received your message: "${content}". Please configure your API keys to get real AI responses.`,
        role: 'assistant',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, aiMessage]);
      setLoading(false);
    }, 1000);
  };

  const loadChatHistory = async () => {
    // Placeholder - will be implemented with Supabase
    console.log('Loading chat history...');
  };

  const createNewSession = async (title: string) => {
    // Placeholder
    console.log('Creating new session:', title);
  };

  const deleteSession = async (id: string) => {
    // Placeholder
    console.log('Deleting session:', id);
  };

  const switchSession = async (session: any) => {
    // Placeholder
    setCurrentSession(session);
  };

  const value: ChatContextType = {
    messages,
    loading,
    error,
    selectedProvider,
    setSelectedProvider,
    sendMessage,
    currentSession,
    loadChatHistory,
    createNewSession,
    deleteSession,
    switchSession,
    chatSessions,
    setMessages,
    setCurrentSession
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};