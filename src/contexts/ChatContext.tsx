/**
 * Chat Context for PulseSpark AI
 * Manages chat sessions, messages, and AI provider interactions
 */

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { useNotification } from './NotificationContext';
import { aiService } from '../services/ai.service';
import type { ChatMessage, ChatSession, ChatContextType, ApiKeyProvider } from '../types';

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
};

interface ChatProviderProps {
  children: React.ReactNode;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  // State management
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<string>('OpenAI');
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);

  // Hooks
  const { user } = useAuth();
  const { showNotification } = useNotification();
  
  // Refs
  const pendingMessageRef = useRef<string | null>(null);

  /**
   * Load all chat sessions for the current user
   */
  const loadChatSessions = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      setChatSessions(data || []);
    } catch (error: any) {
      console.error('Error loading chat sessions:', error);
      setError('Failed to load chat sessions');
    }
  };

  /**
   * Load messages for a specific session
   */
  const loadSessionMessages = async (sessionId: string) => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .eq('user_id', user.id)
        .order('timestamp', { ascending: true });

      if (error) throw error;

      setMessages(data || []);
    } catch (error: any) {
      console.error('Error loading session messages:', error);
      setError('Failed to load messages');
    }
  };

  /**
   * Create a new chat session
   */
  const createNewSession = async (title: string = 'New Chat') => {
    if (!user?.id) {
      showNotification('Please log in to create a chat session', 'error');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .insert({
          user_id: user.id,
          title,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      const newSession: ChatSession = {
        ...data,
        messages: []
      };

      setCurrentSession(newSession);
      setChatSessions(prev => [newSession, ...prev]);
      setMessages([]);
      setError(null);

      // If there's a pending message, send it now
      if (pendingMessageRef.current) {
        const pendingMessage = pendingMessageRef.current;
        pendingMessageRef.current = null;
        await sendMessage(pendingMessage);
      }

      showNotification('New chat session created', 'success');
    } catch (error: any) {
      console.error('Error creating session:', error);
      setError('Failed to create new session');
      showNotification('Failed to create new session', 'error');
    }
  };

  /**
   * Switch to an existing session
   */
  const switchSession = async (session: ChatSession) => {
    setCurrentSession(session);
    await loadSessionMessages(session.id);
    setError(null);
  };

  /**
   * Delete a chat session
   */
  const deleteSession = async (sessionId: string) => {
    if (!user?.id) return;

    try {
      // Delete messages first (cascade should handle this, but being explicit)
      await supabase
        .from('chat_messages')
        .delete()
        .eq('session_id', sessionId)
        .eq('user_id', user.id);

      // Delete session
      const { error } = await supabase
        .from('chat_sessions')
        .delete()
        .eq('id', sessionId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Update local state
      setChatSessions(prev => prev.filter(s => s.id !== sessionId));
      
      // If deleted session was current, clear it
      if (currentSession?.id === sessionId) {
        setCurrentSession(null);
        setMessages([]);
      }

      showNotification('Session deleted successfully', 'success');
    } catch (error: any) {
      console.error('Error deleting session:', error);
      showNotification('Failed to delete session', 'error');
    }
  };

  /**
   * Save a message to the database
   */
  const saveMessage = async (message: Omit<ChatMessage, 'id'>, sessionId: string) => {
    if (!user?.id) return null;

    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          session_id: sessionId,
          user_id: user.id,
          content: message.content,
          role: message.role,
          provider: message.provider,
          timestamp: message.timestamp
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Error saving message:', error);
      throw error;
    }
  };

  /**
   * Update session's updated_at timestamp
   */
  const updateSessionTimestamp = async (sessionId: string) => {
    try {
      await supabase
        .from('chat_sessions')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', sessionId);
    } catch (error) {
      console.error('Error updating session timestamp:', error);
    }
  };

  /**
   * Send a message and get AI response
   */
  const sendMessage = async (content: string) => {
    if (!user?.id) {
      showNotification('Please log in to send messages', 'error');
      return;
    }

    if (!content.trim()) return;

    // Auto-create session if none exists
    if (!currentSession) {
      pendingMessageRef.current = content;
      await createNewSession(`Chat - ${new Date().toLocaleDateString()}`);
      return;
    }

    if (loading) {
      console.log('Already processing a message');
      return;
    }

    setLoading(true);
    setError(null);

    // Create user message
    const userMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      content,
      role: 'user',
      timestamp: new Date().toISOString(),
      provider: selectedProvider as ApiKeyProvider,
    };

    // Add user message to UI immediately
    setMessages(prev => [...prev, userMessage]);

    try {
      // Check if user has API key for selected provider
      const hasKey = await aiService.hasApiKey(selectedProvider as ApiKeyProvider, user.id);
      
      if (!hasKey) {
        throw new Error(`No API key found for ${selectedProvider}. Please add your API key in the Settings page.`);
      }

      // Save user message to database
      const savedUserMessage = await saveMessage({
        content: userMessage.content,
        role: userMessage.role,
        timestamp: userMessage.timestamp,
        provider: userMessage.provider
      }, currentSession.id);

      // Update user message with real ID
      if (savedUserMessage) {
        setMessages(prev => prev.map(m => 
          m.id === userMessage.id ? { ...m, id: savedUserMessage.id } : m
        ));
      }

      // Generate AI response
      const response = await aiService.generateResponse(
        user.id,
        content,
        selectedProvider as ApiKeyProvider,
        messages.slice(-10) // Send last 10 messages for context
      );

      // Create assistant message
      const assistantMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        content: response.content,
        role: 'assistant',
        timestamp: new Date().toISOString(),
        provider: selectedProvider as ApiKeyProvider,
      };

      // Add assistant message to UI
      setMessages(prev => [...prev, assistantMessage]);

      // Save assistant message to database
      await saveMessage({
        content: assistantMessage.content,
        role: assistantMessage.role,
        timestamp: assistantMessage.timestamp,
        provider: assistantMessage.provider
      }, currentSession.id);

      // Update session timestamp
      await updateSessionTimestamp(currentSession.id);

      // Update sessions list order
      setChatSessions(prev => {
        const updated = prev.map(s => 
          s.id === currentSession.id 
            ? { ...s, updated_at: new Date().toISOString() }
            : s
        );
        return updated.sort((a, b) => 
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        );
      });

    } catch (error: any) {
      console.error('Error sending message:', error);
      
      // Remove the user message from UI on error
      setMessages(prev => prev.filter(m => m.id !== userMessage.id));
      
      // Show error
      const errorMessage = error.message || 'Failed to send message';
      setError(errorMessage);
      showNotification(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Load chat history - loads sessions and sets up initial state
   */
  const loadChatHistory = async () => {
    await loadChatSessions();
  };

  // Load chat sessions when user changes
  useEffect(() => {
    if (user?.id) {
      loadChatHistory();
    } else {
      // Clear state when user logs out
      setChatSessions([]);
      setCurrentSession(null);
      setMessages([]);
      setError(null);
    }
  }, [user?.id]);

  // Context value
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