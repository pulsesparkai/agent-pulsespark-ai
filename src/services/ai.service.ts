/**
 * AI Service for PulseSpark AI
 * Handles communication with the FastAPI backend at api.pulsespark.ai
 */

import { supabase } from '../lib/supabase';
import { API_CONFIG } from '../lib/config';
import type { ApiKeyProvider, ChatMessage, AIProviderMessage } from '../types';

export interface GenerateRequest {
  user_id: string;
  prompt: string;
  conversation_history: AIProviderMessage[];
  api_provider: string; // Backend expects lowercase
  api_key: string;
}

export interface GenerateResponse {
  content: string;
  provider: string;
  model?: string;
  tokens_used?: number;
}

// Map frontend provider names to backend enum values
const PROVIDER_MAPPING: Record<string, string> = {
  'OpenAI': 'openai',
  'Claude': 'claude', 
  'DeepSeek': 'deepseek',
  'Grok': 'grok',
  'Mistral': 'mistral'
};

class AIService {
  private baseUrl = API_CONFIG.BASE_URL;

  /**
   * Check if user has an API key for the specified provider
   */
  async hasApiKey(provider: ApiKeyProvider, userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('api_keys')
        .select('id')
        .eq('user_id', userId)
        .eq('provider', provider)
        .single();

      if (error) {
        console.log('No API key found for provider:', provider);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('Error checking API key:', error);
      return false;
    }
  }

  /**
   * Get decrypted API key for the specified provider
   */
  private async getApiKey(provider: ApiKeyProvider, userId: string): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('api_keys')
        .select('encrypted_key')
        .eq('user_id', userId)
        .eq('provider', provider)
        .single();

      if (error || !data) {
        throw new Error(`No API key found for ${provider}`);
      }

      // Note: In a real app, you'd decrypt this key client-side
      // For now, assuming the key is stored in a usable format
      return data.encrypted_key;
    } catch (error) {
      console.error('Error fetching API key:', error);
      throw new Error(`Failed to retrieve API key for ${provider}`);
    }
  }

  /**
   * Generate AI response using the backend API
   */
  async generateResponse(
    userId: string,
    prompt: string,
    provider: ApiKeyProvider,
    conversationHistory: ChatMessage[] = []
  ): Promise<GenerateResponse> {
    try {
      // Get user's session token for authentication
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('No authentication session found');
      }

      // Get API key for the provider
      const apiKey = await this.getApiKey(provider, userId);

      // Convert chat messages to the format expected by backend
      const history: AIProviderMessage[] = conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      // Map provider name to backend enum
      const backendProvider = PROVIDER_MAPPING[provider];
      if (!backendProvider) {
        throw new Error(`Unsupported provider: ${provider}`);
      }

      // Prepare request payload
      const requestBody: GenerateRequest = {
        user_id: userId,
        prompt,
        conversation_history: history,
        api_provider: backendProvider,
        api_key: apiKey
      };

      console.log('Sending request to backend:', {
        url: `${this.baseUrl}${API_CONFIG.ENDPOINTS.GENERATE}`,
        provider: backendProvider,
        userId,
        historyLength: history.length
      });

      // Make request to backend
      const response = await fetch(`${this.baseUrl}${API_CONFIG.ENDPOINTS.GENERATE}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'Origin': window.location.origin
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Backend error: ${response.status}`;
        
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.detail || errorJson.message || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        
        throw new Error(errorMessage);
      }

      const result: GenerateResponse = await response.json();
      
      console.log('Backend response received:', {
        provider: result.provider,
        contentLength: result.content?.length,
        tokensUsed: result.tokens_used
      });

      return result;

    } catch (error: any) {
      console.error('AI Service Error:', error);
      
      // Provide helpful error messages
      if (error.message?.includes('API key')) {
        throw new Error(`API key issue for ${provider}: ${error.message}`);
      } else if (error.message?.includes('authentication')) {
        throw new Error('Please log in again to continue');
      } else if (error.message?.includes('Network')) {
        throw new Error('Network error - please check your connection');
      } else {
        throw new Error(error.message || `Failed to generate response using ${provider}`);
      }
    }
  }

  /**
   * Test connection to the backend API
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      return response.ok;
    } catch (error) {
      console.error('Backend connection test failed:', error);
      return false;
    }
  }

  /**
   * Get available providers from backend
   */
  async getAvailableProviders(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}${API_CONFIG.ENDPOINTS.PROVIDERS}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        return data.providers || Object.keys(PROVIDER_MAPPING);
      }
    } catch (error) {
      console.warn('Could not fetch providers from backend:', error);
    }

    // Fallback to hardcoded list
    return Object.keys(PROVIDER_MAPPING);
  }
}

// Export singleton instance
export const aiService = new AIService();
export default aiService;