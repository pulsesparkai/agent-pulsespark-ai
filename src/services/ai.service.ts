// src/services/ai.service.ts
import { supabase } from '../lib/supabase';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
}

export interface GenerateRequest {
  user_id: string;  // Changed from userId
  prompt: string;
  conversation_history: ChatMessage[];  // Changed from conversationHistory
  api_provider: string;  // Changed from provider
  api_key: string;
}

export interface GenerateResponse {
  response: string;
  provider: string;
  timestamp: string;
  tokens_used?: number;
}

class AIService {
  private backendUrl = import.meta.env.VITE_API_URL || 'https://api.pulsespark.ai';

  async getUserApiKey(provider: string, userId: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('api_keys')
        .select('encrypted_key')
        .eq('user_id', userId)
        .eq('provider', provider)
        .single();

      if (error || !data) {
        console.error('No API key found for provider:', provider);
        return null;
      }

      // If the key is encrypted, you'll need to decrypt it here
      // For now, assuming it's stored in plain text (you should encrypt it!)
      return data.encrypted_key;
    } catch (error) {
      console.error('Error fetching API key:', error);
      return null;
    }
  }

  async sendMessage(
    message: string,
    provider: string,
    userId: string,
    projectId?: string,
    conversationHistory: ChatMessage[] = []
  ): Promise<GenerateResponse> {
    // Get user's API key for the selected provider
    const apiKey = await this.getUserApiKey(provider, userId);
    
    if (!apiKey) {
      throw new Error(`No API key found for ${provider}. Please add your ${provider} API key in Settings → API Keys.`);
    }

    // Map provider names to match backend enum
    const providerMap: Record<string, string> = {
      'OpenAI': 'openai',
      'Claude': 'claude',
      'DeepSeek': 'deepseek',
      'Grok': 'grok',
      'Mistral': 'mistral'
    };

    const apiProvider = providerMap[provider] || provider.toLowerCase();

    // Build request matching backend structure exactly
    const requestBody: GenerateRequest = {
      user_id: userId,
      prompt: message,
      conversation_history: conversationHistory,
      api_provider: apiProvider,
      api_key: apiKey
    };

    try {
      const response = await fetch(`${this.backendUrl}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Add bearer token if you have one from Supabase auth
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
        
        // Handle specific error cases
        if (response.status === 401) {
          throw new Error('Invalid API key. Please check your API key in Settings.');
        } else if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please try again later.');
        } else if (response.status === 503) {
          throw new Error('Service temporarily unavailable. Please try again.');
        }
        
        throw new Error(error.detail || error.error || `Failed to get response from ${provider}`);
      }

      const data: GenerateResponse = await response.json();
      return data;
    } catch (error: any) {
      console.error('AI Service Error:', error);
      
      // Re-throw with user-friendly message
      if (error.message.includes('fetch')) {
        throw new Error('Network error. Please check your connection and try again.');
      }
      
      throw error;
    }
  }

  async hasApiKey(provider: string, userId: string): Promise<boolean> {
    const apiKey = await this.getUserApiKey(provider, userId);
    return !!apiKey;
  }

  private getDefaultModel(provider: string): string {
    const models: Record<string, string> = {
      'openai': 'gpt-3.5-turbo',
      'claude': 'claude-3-sonnet-20240229',
      'deepseek': 'deepseek-chat',
      'grok': 'grok-beta',
      'mistral': 'mistral-medium'
    };
    return models[provider.toLowerCase()] || 'gpt-3.5-turbo';
  }
}

export const aiService = new AIService();