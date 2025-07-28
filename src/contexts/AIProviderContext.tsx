import React, { createContext, useContext, useState, useCallback } from 'react';
import { useNotification } from './NotificationContext';

// Type definitions for AI provider management
export type AIProvider = 'OpenAI' | 'Claude' | 'DeepSeek' | 'Grok' | 'Mistral';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIResponse {
  content: string;
  provider: AIProvider;
  tokensUsed?: number;
  model?: string;
}

export interface ProviderConfig {
  name: AIProvider;
  apiKey: string | null;
  baseUrl: string;
  defaultModel: string;
  maxTokens: number;
}

export interface AIProviderContextType {
  // Provider management
  selectedProvider: AIProvider;
  setSelectedProvider: (provider: AIProvider) => void;
  availableProviders: AIProvider[];
  
  // API key management
  setApiKey: (provider: AIProvider, apiKey: string) => void;
  removeApiKey: (provider: AIProvider) => void;
  hasApiKey: (provider: AIProvider) => boolean;
  
  // AI generation
  generateResponse: (prompt: string, conversationHistory?: ChatMessage[]) => Promise<AIResponse>;
  
  // State management
  loading: boolean;
  error: string | null;
  clearError: () => void;
  
  // Provider info
  getProviderConfig: (provider: AIProvider) => ProviderConfig;
  isProviderConfigured: (provider: AIProvider) => boolean;
}

// Create the context with undefined default (will be provided by provider)
const AIProviderContext = createContext<AIProviderContextType | undefined>(undefined);

/**
 * Custom hook to access AI Provider context
 * Throws error if used outside of AIProviderProvider
 */
export const useAIProvider = (): AIProviderContextType => {
  const context = useContext(AIProviderContext);
  if (context === undefined) {
    throw new Error('useAIProvider must be used within an AIProviderProvider');
  }
  return context;
};

// Provider configurations with API endpoints and default settings
const PROVIDER_CONFIGS: Record<AIProvider, Omit<ProviderConfig, 'apiKey'>> = {
  OpenAI: {
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-3.5-turbo',
    maxTokens: 4000
  },
  Claude: {
    name: 'Claude',
    baseUrl: 'https://api.anthropic.com/v1',
    defaultModel: 'claude-3-sonnet-20240229',
    maxTokens: 4000
  },
  DeepSeek: {
    name: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com/v1',
    defaultModel: 'deepseek-chat',
    maxTokens: 4000
  },
  Grok: {
    name: 'Grok',
    baseUrl: 'https://api.x.ai/v1',
    defaultModel: 'grok-beta',
    maxTokens: 4000
  },
  Mistral: {
    name: 'Mistral',
    baseUrl: 'https://api.mistral.ai/v1',
    defaultModel: 'mistral-medium',
    maxTokens: 4000
  }
};

interface AIProviderProviderProps {
  children: React.ReactNode;
}

/**
 * AIProviderProvider Component
 * 
 * Provides unified access to multiple AI providers with secure API key management.
 * Handles provider selection, API key storage (in memory only), and request routing.
 * 
 * Security Features:
 * - API keys stored only in React state (memory)
 * - Keys never logged or exposed in UI
 * - Automatic cleanup on component unmount
 */
export const AIProviderProvider: React.FC<AIProviderProviderProps> = ({ children }) => {
  // State management for provider selection and configuration
  const [selectedProvider, setSelectedProvider] = useState<AIProvider>('OpenAI');
  const [apiKeys, setApiKeys] = useState<Map<AIProvider, string>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { showNotification } = useNotification();
  
  // Available providers list (all supported providers)
  const availableProviders: AIProvider[] = ['OpenAI', 'Claude', 'DeepSeek', 'Grok', 'Mistral'];

  /**
   * Securely store API key for a specific provider
   * Keys are stored only in memory and never persisted
   * 
   * @param provider - The AI provider to set the key for
   * @param apiKey - The API key to store (will be kept in memory only)
   */
  const setApiKey = useCallback((provider: AIProvider, apiKey: string) => {
    if (!apiKey || apiKey.trim().length === 0) {
      throw new Error('API key cannot be empty');
    }
    
    // Store API key in memory only (Map state)
    setApiKeys(prev => new Map(prev).set(provider, apiKey.trim()));
    
    // Clear any existing errors when successfully setting a key
    setError(null);
    
    // Provide user feedback
    showNotification(`${provider} API key configured successfully`, 'success');
  }, [showNotification]);

  /**
   * Remove API key for a specific provider
   * Clears the key from memory and provides user feedback
   * 
   * @param provider - The AI provider to remove the key for
   */
  const removeApiKey = useCallback((provider: AIProvider) => {
    setApiKeys(prev => {
      const newMap = new Map(prev);
      newMap.delete(provider);
      return newMap;
    });
    
    // Switch to a different provider if current one is removed
    if (provider === selectedProvider) {
      const remainingProviders = availableProviders.filter(p => 
        p !== provider && apiKeys.has(p)
      );
      if (remainingProviders.length > 0) {
        setSelectedProvider(remainingProviders[0]);
      }
    }
    
    showNotification(`${provider} API key removed`, 'info');
  }, [selectedProvider, apiKeys, showNotification]);

  /**
   * Check if a provider has an API key configured
   * 
   * @param provider - The AI provider to check
   * @returns boolean indicating if API key is available
   */
  const hasApiKey = useCallback((provider: AIProvider): boolean => {
    return apiKeys.has(provider) && apiKeys.get(provider)!.length > 0;
  }, [apiKeys]);

  /**
   * Get full configuration for a specific provider
   * Combines base config with stored API key
   * 
   * @param provider - The AI provider to get config for
   * @returns Complete provider configuration
   */
  const getProviderConfig = useCallback((provider: AIProvider): ProviderConfig => {
    const baseConfig = PROVIDER_CONFIGS[provider];
    const apiKey = apiKeys.get(provider) || null;
    
    return {
      ...baseConfig,
      apiKey
    };
  }, [apiKeys]);

  /**
   * Check if a provider is fully configured and ready to use
   * 
   * @param provider - The AI provider to check
   * @returns boolean indicating if provider is ready
   */
  const isProviderConfigured = useCallback((provider: AIProvider): boolean => {
    return hasApiKey(provider);
  }, [hasApiKey]);

  /**
   * Clear current error state
   * Used to reset error state after user acknowledgment
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Format conversation history for API calls
   * Ensures proper message format and limits history length
   * 
   * @param conversationHistory - Array of previous messages
   * @param prompt - Current user prompt
   * @returns Formatted messages array for API
   */
  const formatMessages = useCallback((conversationHistory: ChatMessage[] = [], prompt: string): ChatMessage[] => {
    // Limit conversation history to last 10 messages for context
    const limitedHistory = conversationHistory.slice(-10);
    
    // Add system message if not present
    const messages: ChatMessage[] = [];
    
    // Check if first message is system message
    if (limitedHistory.length === 0 || limitedHistory[0].role !== 'system') {
      messages.push({
        role: 'system',
        content: 'You are a helpful AI assistant for PulseSpark AI. Provide clear, accurate, and helpful responses.'
      });
    }
    
    // Add conversation history
    messages.push(...limitedHistory);
    
    // Add current user prompt
    messages.push({
      role: 'user',
      content: prompt
    });
    
    return messages;
  }, []);

  /**
   * Call OpenAI API with proper formatting and error handling
   * 
   * @param apiKey - OpenAI API key
   * @param messages - Formatted conversation messages
   * @returns AI response content and metadata
   */
  const callOpenAI = useCallback(async (apiKey: string, messages: ChatMessage[]): Promise<AIResponse> => {
    const config = PROVIDER_CONFIGS.OpenAI;
    
    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.defaultModel,
        messages,
        max_tokens: config.maxTokens,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    
    return {
      content: data.choices[0].message.content,
      provider: 'OpenAI',
      tokensUsed: data.usage?.total_tokens,
      model: config.defaultModel
    };
  }, []);

  /**
   * Call Anthropic Claude API with proper formatting and error handling
   * 
   * @param apiKey - Claude API key
   * @param messages - Formatted conversation messages
   * @returns AI response content and metadata
   */
  const callClaude = useCallback(async (apiKey: string, messages: ChatMessage[]): Promise<AIResponse> => {
    const config = PROVIDER_CONFIGS.Claude;
    
    // Claude API expects different format - separate system message
    const systemMessage = messages.find(m => m.role === 'system')?.content || '';
    const conversationMessages = messages.filter(m => m.role !== 'system');
    
    const response = await fetch(`${config.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: config.defaultModel,
        max_tokens: config.maxTokens,
        system: systemMessage,
        messages: conversationMessages,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `Claude API error: ${response.status}`);
    }

    const data = await response.json();
    
    return {
      content: data.content[0].text,
      provider: 'Claude',
      tokensUsed: data.usage?.output_tokens,
      model: config.defaultModel
    };
  }, []);

  /**
   * Call DeepSeek API with proper formatting and error handling
   * 
   * @param apiKey - DeepSeek API key
   * @param messages - Formatted conversation messages
   * @returns AI response content and metadata
   */
  const callDeepSeek = useCallback(async (apiKey: string, messages: ChatMessage[]): Promise<AIResponse> => {
    const config = PROVIDER_CONFIGS.DeepSeek;
    
    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.defaultModel,
        messages,
        max_tokens: config.maxTokens,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `DeepSeek API error: ${response.status}`);
    }

    const data = await response.json();
    
    return {
      content: data.choices[0].message.content,
      provider: 'DeepSeek',
      tokensUsed: data.usage?.total_tokens,
      model: config.defaultModel
    };
  }, []);

  /**
   * Call Grok API with proper formatting and error handling
   * 
   * @param apiKey - Grok API key
   * @param messages - Formatted conversation messages
   * @returns AI response content and metadata
   */
  const callGrok = useCallback(async (apiKey: string, messages: ChatMessage[]): Promise<AIResponse> => {
    const config = PROVIDER_CONFIGS.Grok;
    
    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.defaultModel,
        messages,
        max_tokens: config.maxTokens,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `Grok API error: ${response.status}`);
    }

    const data = await response.json();
    
    return {
      content: data.choices[0].message.content,
      provider: 'Grok',
      tokensUsed: data.usage?.total_tokens,
      model: config.defaultModel
    };
  }, []);

  /**
   * Call Mistral API with proper formatting and error handling
   * 
   * @param apiKey - Mistral API key
   * @param messages - Formatted conversation messages
   * @returns AI response content and metadata
   */
  const callMistral = useCallback(async (apiKey: string, messages: ChatMessage[]): Promise<AIResponse> => {
    const config = PROVIDER_CONFIGS.Mistral;
    
    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.defaultModel,
        messages,
        max_tokens: config.maxTokens,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `Mistral API error: ${response.status}`);
    }

    const data = await response.json();
    
    return {
      content: data.choices[0].message.content,
      provider: 'Mistral',
      tokensUsed: data.usage?.total_tokens,
      model: config.defaultModel
    };
  }, []);

  /**
   * Main method to generate AI responses
   * Routes requests to the appropriate provider based on current selection
   * Handles loading states, error management, and response formatting
   * 
   * @param prompt - User's input prompt
   * @param conversationHistory - Previous conversation messages
   * @returns Promise resolving to AI response with metadata
   */
  const generateResponse = useCallback(async (
    prompt: string, 
    conversationHistory: ChatMessage[] = []
  ): Promise<AIResponse> => {
    // Validate inputs
    if (!prompt || prompt.trim().length === 0) {
      throw new Error('Prompt cannot be empty');
    }

    // Check if selected provider is configured
    if (!isProviderConfigured(selectedProvider)) {
      throw new Error(`${selectedProvider} API key not configured. Please add your API key in settings.`);
    }

    // Get API key for selected provider
    const apiKey = apiKeys.get(selectedProvider)!;
    
    // Set loading state
    setLoading(true);
    setError(null);

    try {
      // Format messages for API call
      const messages = formatMessages(conversationHistory, prompt);
      
      // Route to appropriate provider API
      let response: AIResponse;
      
      switch (selectedProvider) {
        case 'OpenAI':
          response = await callOpenAI(apiKey, messages);
          break;
        case 'Claude':
          response = await callClaude(apiKey, messages);
          break;
        case 'DeepSeek':
          response = await callDeepSeek(apiKey, messages);
          break;
        case 'Grok':
          response = await callGrok(apiKey, messages);
          break;
        case 'Mistral':
          response = await callMistral(apiKey, messages);
          break;
        default:
          throw new Error(`Unsupported provider: ${selectedProvider}`);
      }

      // Log successful API call (without sensitive data)
      console.log(`✅ AI Response generated via ${selectedProvider}:`, {
        provider: response.provider,
        model: response.model,
        tokensUsed: response.tokensUsed,
        responseLength: response.content.length
      });

      return response;

    } catch (err: any) {
      // Handle and format errors
      const errorMessage = err.message || 'Failed to generate AI response';
      setError(errorMessage);
      
      // Log error for debugging (without sensitive data)
      console.error(`❌ AI Provider Error (${selectedProvider}):`, {
        error: errorMessage,
        provider: selectedProvider,
        promptLength: prompt.length
      });
      
      // Show user notification
      showNotification(`${selectedProvider} Error: ${errorMessage}`, 'error');
      
      // Re-throw error for component handling
      throw new Error(errorMessage);
      
    } finally {
      // Always clear loading state
      setLoading(false);
    }
  }, [
    selectedProvider, 
    apiKeys, 
    isProviderConfigured, 
    formatMessages, 
    callOpenAI, 
    callClaude, 
    callDeepSeek, 
    callGrok, 
    callMistral, 
    showNotification
  ]);

  /**
   * Context value object containing all provider functionality
   * Memoized to prevent unnecessary re-renders of consuming components
   */
  const contextValue: AIProviderContextType = {
    // Provider management
    selectedProvider,
    setSelectedProvider,
    availableProviders,
    
    // API key management
    setApiKey,
    removeApiKey,
    hasApiKey,
    
    // AI generation
    generateResponse,
    
    // State management
    loading,
    error,
    clearError,
    
    // Provider info
    getProviderConfig,
    isProviderConfigured
  };

  return (
    <AIProviderContext.Provider value={contextValue}>
      {children}
    </AIProviderContext.Provider>
  );
};

export default AIProviderProvider;