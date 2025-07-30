import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase'; // Adjust path if needed
import { useApiKeys } from './ApiKeysContext';
import { decryptApiKey } from '../lib/encryption'; // Assume this exists; implement if not

interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: string;
  provider?: string;
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
  const { apiKeys } = useApiKeys();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState('OpenAI');
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);

  // Load chat sessions on mount
  useEffect(() => {
    loadChatSessions();
  }, []);

  // Load messages when session changes
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
      setError(err.message);
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
      setError(err.message);
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
      setError(err.message);
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
      setError(err.message);
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
        return { url: 'https://api.anthropic.com/v1/messages', model: 'claude-3-5-sonnet-20240620' };
      case 'Mistral':
        return { url: 'https://api.mistral.ai/v1/chat/completions', model: 'mistral-large-latest' };
      case 'Grok':
        return { url: 'https://api.x.ai/v1/chat/completions', model: 'grok-4' }; // Use Grok 4 model; for API details, visit https://docs.x.ai/docs/api-reference
      case 'DeepSeek':
        return { url: 'https://api.deepseek.com/v1/chat/completions', model: 'deepseek-chat' };
      default:
        throw new Error('Unsupported provider');
    }
  };

  const sendMessage = async (content: string) => {
    if (!currentSession) {
      setError('No active session');
      return;
    }
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
      // Find and decrypt API key
      const selectedKey = apiKeys.find(k => k.provider === selectedProvider);
      if (!selectedKey) throw new Error(`No API key for ${selectedProvider}`);
      const apiKey = decryptApiKey(selectedKey.encrypted_key);

      const { url, model } = getApiConfig(selectedProvider);

      // Prepare messages for API (include history)
      const apiMessages = messages.map(m => ({ role: m.role, content: m.content })).concat({ role: 'user', content });

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: apiMessages,
        }),
      });

      if (!response.ok) throw new Error(`API error: ${response.statusText}`);

      const data = await response.json();
      const aiContent = data.choices?.[0]?.message?.content || data.content; // Adjust for Claude (uses 'content' instead of choices)

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: aiContent,
        role: 'assistant',
        timestamp: new Date().toISOString(),
        provider: selectedProvider,
      };
      setMessages(prev => [...prev, aiMessage]);

      // Save to Supabase
      await supabase.from('chat_messages').insert([
        { ...userMessage, session_id: currentSession.id },
        { ...aiMessage, session_id: currentSession.id },
      ]);
    } catch (err: any) {
      setError(err.message);
      // Optionally remove the user message on error
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