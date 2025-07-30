import { supabase } from '../lib/supabase';
import { decryptApiKey } from '../lib/encryption';

export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIResponse {
  content: string;
  provider: string;
  model: string;
  tokensUsed?: number;
}

export interface GenerateRequest {
  prompt: string;
  provider: string;
  userId: string;
  projectId?: string;
  conversationHistory?: AIMessage[];
}

/**
 * AI Service - Handles all AI API calls through backend
 * Prevents CORS issues by routing through api.pulsespark.ai
 */
export class AIService {
  private backendUrl = import.meta.env.VITE_API_URL || 'https://api.pulsespark.ai';

  /**
   * Get user's API key for a specific provider
   */
  async getUserApiKey(provider: string, userId: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('api_keys')
        .select('encrypted_key')
        .eq('user_id', userId)
        .eq('provider', provider)
        .single();

      if (error || !data) {
        return null;
      }

      // Decrypt the API key
      return decryptApiKey(data.encrypted_key);
    } catch (error) {
      console.error('Error getting API key:', error);
      return null;
    }
  }

  /**
   * Check if user has API key for provider
   */
  async hasApiKey(provider: string, userId: string): Promise<boolean> {
    const apiKey = await this.getUserApiKey(provider, userId);
    return !!apiKey;
  }

  /**
   * Get default model for provider
   */
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

  /**
   * Send message to AI through backend
   * This prevents CORS issues by using our backend as proxy
   */
  async sendMessage(request: GenerateRequest): Promise<AIResponse> {
    const { prompt, provider, userId, projectId, conversationHistory = [] } = request;

    // Check if user has API key for this provider
    const apiKey = await this.getUserApiKey(provider, userId);
    if (!apiKey) {
      throw new Error(`No API key found for ${provider}. Please add your ${provider} API key in Settings.`);
    }

    try {
      // Get current session for auth
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('User not authenticated');
      }

      // Call backend API
      const response = await fetch(`${this.backendUrl}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'Origin': import.meta.env.VITE_FRONTEND_URL || 'https://agent.pulsespark.ai'
        },
        body: JSON.stringify({
          user_id: userId,
          prompt,
          provider: provider.toLowerCase(),
          api_key: apiKey,
          conversation_history: conversationHistory,
          project_id: projectId,
          model: this.getDefaultModel(provider)
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `AI API error: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        content: data.response,
        provider: data.provider,
        model: data.model || this.getDefaultModel(provider),
        tokensUsed: data.tokens_used
      };

    } catch (error: any) {
      console.error('AI Service error:', error);
      
      // Provide helpful error messages
      if (error.message.includes('API key')) {
        throw new Error(`${provider} API key issue: ${error.message}`);
      } else if (error.message.includes('rate limit')) {
        throw new Error(`${provider} rate limit exceeded. Please try again later.`);
      } else if (error.message.includes('CORS')) {
        throw new Error('Network error. Please check your connection and try again.');
      } else {
        throw new Error(error.message || `Failed to get response from ${provider}`);
      }
    }
  }

  /**
   * Get available providers for user
   */
  async getAvailableProviders(userId: string): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('api_keys')
        .select('provider')
        .eq('user_id', userId);

      if (error) {
        console.error('Error getting providers:', error);
        return [];
      }

      return data.map(item => item.provider);
    } catch (error) {
      console.error('Error getting available providers:', error);
      return [];
    }
  }
}

// Export singleton instance
export const aiService = new AIService();