import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { useNotification } from './NotificationContext';
import { aiService } from '../services/ai.service';

interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: string;
  provider?: string;
  error?: string;
}

interface ChatSession {
  id: string;
  title: string;
  created_at: string;
}

interface ChatContextType {
  messages: ChatMessage[];
  loading: boolean;
  error: string | null;
  selectedProvider: string;
  setSelectedProvider: (provider: string) => void;
  sendMessage: (content: string) => Promise<void>;
  currentSession: ChatSession | null;
  loadChatHistory: () => Promise<void>;
  createNewSession: (title: string) => Promise<void>;
  deleteSession: (id: string) => Promise<void>;
  switchSession: (session: ChatSession) => Promise<void>;
  chatSessions: ChatSession[];
  setMessages: (messages: ChatMessage[]) => void;
  setCurrentSession: (session: ChatSession | null) => void;
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
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState('OpenAI');
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);

  useEffect(() => {
    loadChatSessions();
  }, []);

  useEffect(() => {
    if (currentSession) {
      loadMessagesForSession(currentSession.id);
    } else {
      setMessages([]);
    }
  }, [currentSession]);

  const loadChatSessions = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: sbError } = await supabase
        .from('chat_sessions')
        .select('*')
        .order('created_at', { ascending: false });
      if (sbError) throw sbError;
      setChatSessions(data || []);
      if (data?.length > 0 && !currentSession) {
        setCurrentSession(data[0]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  const loadMessagesForSession = async (sessionId: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: sbError } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('timestamp', { ascending: true });
      if (sbError) throw sbError;
      setMessages(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const createNewSession = async (title: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: sbError } = await supabase
        .from('chat_sessions')
        .insert({ title })
        .select();
      if (sbError) throw sbError;
      if (data?.[0]) {
        setChatSessions(prev => [data[0], ...prev]);
        setCurrentSession(data[0]);
        setMessages([]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create session');
    } finally {
      setLoading(false);
    }
  };

  const deleteSession = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const { error: sbError } = await supabase
        .from('chat_sessions')
        .delete()
        .eq('id', id);
      if (sbError) throw sbError;
      setChatSessions(prev => prev.filter(s => s.id !== id));
      if (currentSession?.id === id) {
        setCurrentSession(null);
        setMessages([]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete session');
    } finally {
      setLoading(false);
    }
  };

  const switchSession = async (session: ChatSession) => {
    setCurrentSession(session);
  };

  const loadChatHistory = async () => {
    await loadChatSessions();
  };

  const getApiConfig = (provider: string) => {
    switch (provider) {
      case 'OpenAI':
        return { url: 'https://api.openai.com/v1/chat/completions', model: 'gpt-4o' };
      case 'Claude':
        return { url: 'https://api.anthropic.com/v1/messages', model: 'claude-3-5-sonnet-20240620', responseKey: 'content[0].text' };
      case 'Mistral':
        return { url: 'https://api.mistral.ai/v1/chat/completions', model: 'mistral-large-latest' };
      case 'Grok':
        return { url: 'https://api.x.ai/v1/chat/completions', model: 'grok-4' };
      case 'DeepSeek':
        return { url: 'https://api.deepseek.com/v1/chat/completions', model: 'deepseek-chat' };
      default:
        throw new Error('Unsupported provider');
    }
  };

const sendMessage = async (content: string) => {
  // Auto-create session if none exists
  if (!currentSession) {
    console.log('No current session, creating one...');
    await createNewSession('Chat - ' + new Date().toLocaleDateString());
    // Wait for state to update
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  if (!user) {
    setError('User must be authenticated to send messages.');
    return;
  }
  if (!content.trim()) return;
    
    setLoading(true);
    setError(null);

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content,
      role: 'user',
      timestamp: new Date().toISOString(),
      provider: selectedProvider,
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      // Check if user has API key for selected provider
      const hasKey = await aiService.hasApiKey(selectedProvider, user.id);
      if (!hasKey) {
        throw new Error(`No API key found for ${selectedProvider}. Please add your ${selectedProvider} API key in Settings.`);
      }

      // Convert messages to AI service format
      const conversationHistory = messages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content
      }));

      // Call AI service instead of direct API
      const aiResponse = await aiService.sendMessage(
  content,                    // message (not prompt!)
  selectedProvider,          // provider
  user.id,                   // userId
  currentSession.id,         // projectId
  conversationHistory        // conversationHistory
);

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: aiResponse.response,
        role: 'assistant',
        timestamp: new Date().toISOString(),
        provider: selectedProvider,
      };
      setMessages(prev => [...prev, aiMessage]);

      // Save messages to database
      await supabase.from('chat_messages').insert([
        { ...userMessage, session_id: currentSession.id },
        { ...aiMessage, session_id: currentSession.id },
      ]);
      
      showNotification('Message sent successfully', 'success');
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to send message';
      setError(errorMessage);
      
      // Add error message to chat
      const errorChatMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: errorMessage,
        role: 'assistant',
        timestamp: new Date().toISOString(),
        provider: selectedProvider,
        error: errorMessage
      };
      setMessages(prev => [...prev, errorChatMessage]);
      
      // Show helpful notification
      if (errorMessage.includes('No API key')) {
        showNotification(`Please add your ${selectedProvider} API key in Settings`, 'error');
      } else {
        showNotification(errorMessage, 'error');
      }
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
    sendMessage,
    currentSession,
    loadChatHistory,
    createNewSession,
    deleteSession,
    switchSession,
    chatSessions,
    setMessages,
    setCurrentSession,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};