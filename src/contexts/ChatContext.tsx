import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { ChatContextType, ChatMessage, ChatSession, ApiKeyProvider } from '../types';
import { useAuth } from './AuthContext';
import { useApiKeys } from './ApiKeysContext';
import { useNotification } from './NotificationContext';
import { useMemoryContext } from './MemoryContext';
import { decryptApiKey } from '../lib/encryption';
import { API_CONFIG, APP_CONFIG } from '../lib/config';

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
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
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
   */
  const loadChatHistory = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);

    try {
      // Get all sessions
      const { data: sessions, error: sessionError } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (sessionError) throw sessionError;

      setChatSessions(sessions || []);

      // Get or create current session
      let session = sessions?.[0];

      if (!session) {
        // Create a new session if none exist
        const { data: newSession, error: createError } = await supabase
          .from('chat_sessions')
          .insert({
            user_id: user.id,
            title: 'New Chat',
            model_type: selectedProvider.toLowerCase()
          })
          .select()
          .single();

        if (createError) throw createError;
        session = newSession;
        setChatSessions([session]);
      }

      setCurrentSession(session);

      // Load messages for the session
      if (session) {
        const { data: sessionMessages, error: messagesError } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('session_id', session.id)
          .order('created_at', { ascending: true });

        if (messagesError) throw messagesError;

        const formattedMessages: ChatMessage[] = (sessionMessages || []).map(msg => ({
          id: msg.id,
          content: msg.content,
          role: msg.role,
          timestamp: msg.created_at,
          provider: msg.model_type as ApiKeyProvider
        }));

        setMessages(formattedMessages);
      }
    } catch (err: any) {
      console.error('Failed to load chat history:', err);
      setError('Failed to load chat history');
      showNotification('Failed to load chat history', 'error');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Create a new chat session
   */
  const createNewSession = async (title: string) => {
    if (!user) return;

    try {
      const { data: newSession, error } = await supabase
        .from('chat_sessions')
        .insert({
          user_id: user.id,
          title,
          model_type: selectedProvider.toLowerCase()
        })
        .select()
        .single();

      if (error) throw error;

      setChatSessions([newSession, ...chatSessions]);
      setCurrentSession(newSession);
      setMessages([]);
      
      showNotification('New chat session created', 'success');
    } catch (err: any) {
      console.error('Failed to create session:', err);
      showNotification('Failed to create new session', 'error');
    }
  };

  /**
   * Delete a chat session
   */
  const deleteSession = async (sessionId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('chat_sessions')
        .delete()
        .eq('id', sessionId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Remove from local state
      setChatSessions(chatSessions.filter(s => s.id !== sessionId));
      
      if (currentSession?.id === sessionId) {
        const remainingSessions = chatSessions.filter(s => s.id !== sessionId);
        if (remainingSessions.length > 0) {
          setCurrentSession(remainingSessions[0]);
          // Load messages for the new current session
          loadMessagesForSession(remainingSessions[0].id);
        } else {
          setCurrentSession(null);
          setMessages([]);
        }
      }

      showNotification('Chat session deleted', 'success');
    } catch (err: any) {
      console.error('Failed to delete session:', err);
      showNotification('Failed to delete session', 'error');
    }
  };

  /**
   * Load messages for a specific session
   */
  const loadMessagesForSession = async (sessionId: string) => {
    try {
      const { data: sessionMessages, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const formattedMessages: ChatMessage[] = (sessionMessages || []).map(msg => ({
        id: msg.id,
        content: msg.content,
        role: msg.role,
        timestamp: msg.created_at,
        provider: msg.model_type as ApiKeyProvider
      }));

      setMessages(formattedMessages);
    } catch (err: any) {
      console.error('Failed to load messages:', err);
      showNotification('Failed to load messages', 'error');
    }
  };

  /**
   * Switch to a different session
   */
  const switchSession = async (session: ChatSession) => {
    setCurrentSession(session);
    await loadMessagesForSession(session.id);
  };

  /**
   * Save the current session state
   */
  const saveSession = async (updatedMessages: ChatMessage[]) => {
    if (!currentSession || !user) return;

    try {
      // Update session's updated_at timestamp
      await supabase
        .from('chat_sessions')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', currentSession.id);

      // Save new messages to database
      const messagesToSave = updatedMessages.filter(
        msg => !messages.find(m => m.id === msg.id)
      );

      for (const msg of messagesToSave) {
        await supabase
          .from('chat_messages')
          .insert({
            session_id: currentSession.id,
            user_id: user.id,
            content: msg.content,
            role: msg.role,
            model_type: msg.provider?.toLowerCase() || selectedProvider.toLowerCase()
          });
      }
    } catch (err: any) {
      console.error('Failed to save session:', err);
    }
  };

  /**
   * Send a message to the AI
   */
  const sendMessage = async (content: string) => {
    if (!user || !currentSession) {
      showNotification('Please create or select a chat session', 'error');
      return;
    }

    const apiKey = apiKeys.find(key => key.provider === selectedProvider);
    if (!apiKey) {
      showNotification(`No API key found for ${selectedProvider}`, 'error');
      return;
    }

    setLoading(true);
    setError(null);

    try {
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

      // Get memory context if available
      let memoryContext = '';
      try {
        const memories = await searchMemory(content, 5);
        if (memories.length > 0) {
          memoryContext = '\n\nRelevant context from memory:\n' + 
            memories.map(m => `- ${m.content}${m.metadata ? ` (${JSON.stringify(m.metadata)})` : ''}`).join('\n');
        }
      } catch (memoryError) {
        console.warn('Failed to fetch memory context:', memoryError);
      }

      // Decrypt the API key
      const decryptedKey = decryptApiKey(apiKey.encrypted_key);

      // Prepare conversation history
      const conversationHistory = updatedMessages
        .slice(-10)
        .map(msg => ({
          role: msg.role,
          content: msg.content
        }));

      // Get session for auth
      const { data: { session } } = await supabase.auth.getSession();
      
      // Call backend API
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.GENERATE}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
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

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error ${response.status}: ${errorText}`);
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
      console.error('Chat API error:', err);
      setError(err.message);
      showNotification('Failed to send message', 'error');
    } finally {
      setLoading(false);
    }
  };

  const value: ChatContextType = {
    messages,
    currentSession,
    chatSessions,
    loading,
    error,
    selectedProvider,
    setSelectedProvider,
    sendMessage,
    loadChatHistory,
    createNewSession,
    deleteSession,
    switchSession,
    setMessages,
    setCurrentSession
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};