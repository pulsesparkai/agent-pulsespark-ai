import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
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
  
  // Use ref to track pending messages when session is being created
  const pendingMessageRef = useRef<string | null>(null);

  // Debug user changes
  useEffect(() => {
    console.log('ChatProvider - User changed:', user);
  }, [user]);

  // Load sessions when user is available
  useEffect(() => {
    if (user) {
      loadChatSessions();
    } else {
      // Clear state when user logs out
      setChatSessions([]);
      setCurrentSession(null);
      setMessages([]);
    }
  }, [user]);

  useEffect(() => {
    if (currentSession) {
      loadMessagesForSession(currentSession.id);
      
      // Check if there's a pending message to send
      if (pendingMessageRef.current) {
        const message = pendingMessageRef.current;
        pendingMessageRef.current = null;
        // Send the pending message
        sendMessage(message);
      }
    } else {
      setMessages([]);
    }
  }, [currentSession]);

  const loadChatSessions = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    try {
      const { data, error: sbError } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (sbError) throw sbError;
      
      setChatSessions(data || []);
      
      // Only set current session if we don't have one already
      if (data?.length > 0 && !currentSession) {
        setCurrentSession(data[0]);
      }
    } catch (err: any) {
      console.error('Failed to load sessions:', err);
      setError(err.message || 'Failed to load sessions');
      showNotification('Failed to load chat sessions', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadMessagesForSession = async (sessionId: string) => {
    if (!user) return;
    
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
      console.error('Failed to load messages:', err);
      setError(err.message || 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const createNewSession = async (title: string): Promise<ChatSession | null> => {
    if (!user) {
      console.error('Cannot create session - no user');
      showNotification('Please log in to create a chat session', 'error');
      return null;
    }
    
    setLoading(true);
    setError(null);
    try {
      const { data, error: sbError } = await supabase
        .from('chat_sessions')
        .insert({ 
          title,
          user_id: user.id
        })
        .select()
        .single();
        
      if (sbError) {
        console.error('Session creation error:', sbError);
        throw sbError;
      }
      
      if (data) {
        setChatSessions(prev => [data, ...prev]);
        setCurrentSession(data);
        setMessages([]);
        showNotification('New chat session created', 'success');
        return data;
      }
      
      return null;
    } catch (err: any) {
      console.error('Failed to create session:', err);
      setError(err.message || 'Failed to create session');
      showNotification('Failed to create chat session', 'error');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const deleteSession = async (id: string) => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    try {
      const { error: sbError } = await supabase
        .from('chat_sessions')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id); // Extra safety check
        
      if (sbError) throw sbError;
      
      setChatSessions(prev => prev.filter(s => s.id !== id));
      
      if (currentSession?.id === id) {
        setCurrentSession(null);
        setMessages([]);
      }
      
      showNotification('Chat session deleted', 'success');
    } catch (err: any) {
      console.error('Failed to delete session:', err);
      setError(err.message || 'Failed to delete session');
      showNotification('Failed to delete chat session', 'error');
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

  const sendMessage = async (content: string) => {
    console.log('=== SENDMESSAGE DEBUG ===');
    console.log('User object:', user);
    console.log('User ID:', user?.id);
    console.log('Selected Provider:', selectedProvider);
    console.log('Current Session:', currentSession);
    console.log('Content:', content);
    
    // Ensure user is loaded
    if (!user || !user.id) {
      console.error('User not loaded or missing ID');
      showNotification('Please log in to send messages', 'error');
      return;
    }
    
    // Auto-create session if none exists
    if (!currentSession) {
      console.log('No current session, creating one...');
      pendingMessageRef.current = content; // Store the message to send after session creation
      await createNewSession('Chat - ' + new Date().toLocaleDateString());
      return; // The message will be sent automatically after session is created
    }
    
    if (!content.trim()) return;
    
    // Check if we're already sending a message
    if (loading) {
      console.log('Already processing a message');
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
      // Check if user has API key for selected provider
      console.log('Checking API key for provider:', selectedProvider, 'and user:', user.id);
      const hasKey = await aiService.hasApiKey(selectedProvider, user.id);
      console.log('Has API key:', hasKey);
      
      if (!hasKey) {
        throw new Error(`No API key found for ${selectedProvider}. Please add your ${selectedProvider} API key in Settings.`);
      }

      // Convert messages to AI service format
      const conversationHistory = messages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content
      }));

      // Call AI service
      console.log('Calling AI service...');
      const aiResponse = await aiService.sendMessage(
        content,
        selectedProvider,
        user.id,
        currentSession.id,
        conversationHistory
      );
      
      console.log('AI Response received:', aiResponse);

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: aiResponse.response,
        role: 'assistant',
        timestamp: new Date().toISOString(),
        provider: selectedProvider,
      };
      
      setMessages(prev => [...prev, aiMessage]);

      // Save both messages to database
      const messagesToInsert = [
        { 
          session_id: currentSession.id,
          content: userMessage.content,
          role: userMessage.role,
          timestamp: userMessage.timestamp,
          provider: userMessage.provider
        },
        { 
          session_id: currentSession.id,
          content: aiMessage.content,
          role: aiMessage.role,
          timestamp: aiMessage.timestamp,
          provider: aiMessage.provider
        }
      ];
      
      console.log('Saving messages to database:', messagesToInsert);
      
      const { error: insertError } = await supabase
        .from('chat_messages')
        .insert(messagesToInsert);
        
      if (insertError) {
        console.error('Error saving messages:', insertError);
        throw insertError;
      }
      
      showNotification('Message sent successfully', 'success');
    } catch (err: any) {
      console.error('Error in sendMessage:', err);
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
        showNotification(`Please add your ${selectedProvider} API key in Settings → API Keys`, 'error');
      } else if (errorMessage.includes('Invalid API key')) {
        showNotification(`Your ${selectedProvider} API key appears to be invalid. Please check it in Settings → API Keys`, 'error');
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