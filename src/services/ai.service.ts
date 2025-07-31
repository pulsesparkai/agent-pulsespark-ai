// src/services/ai.service.ts
import { supabase } from '../lib/supabase';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
}

export interface GenerateRequest {
  user_id: string;                       // matches backend “user_id”
  prompt: string;
  conversation_history: ChatMessage[];   // matches backend “conversation_history”
  api_provider: string;                  // matches backend “api_provider”
  api_key: string;
}

export interface GenerateResponse {
  response: string;
  provider: string;
  timestamp: string;
  tokens_used?: number;
}

class AIService {
  // 🔒 hard-code your prod URL here
  private backendUrl = 'https://api.pulsespark.ai';

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

      // if you ever encrypt, decrypt here. For now assume plain-text base64.
      return atob(data.encrypted_key);
    } catch (err) {
      console.error('Error fetching API key:', err);
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
    // 1) fetch the user’s stored key
    const apiKey = await this.getUserApiKey(provider, userId);
    if (!apiKey) {
      throw new Error(
        `No API key found for ${provider}. Please add your ${provider} key in Settings → API Keys.`
      );
    }

    // 2) map UI “DeepSeek” → backend “deepseek”, etc
    const providerMap: Record<string, string> = {
      OpenAI: 'openai',
      Claude: 'claude',
      DeepSeek: 'deepseek',
      Grok: 'grok',
      Mistral: 'mistral',
    };
    const apiProvider = providerMap[provider] || provider.toLowerCase();

    // 3) build exactly what your FastAPI expects
    const requestBody: GenerateRequest = {
      user_id: userId,
      prompt: message,
      conversation_history: conversationHistory,
      api_provider: apiProvider,
      api_key: apiKey,
    };

    try {
      // grab the Supabase session token to auth your FastAPI
      const {
        data: { session },
      } = await supabase.auth.getSession();

      // 🔍 debug log so you can confirm it’s actually firing
      console.log('📡 AIService calling:', this.backendUrl, '/generate');

      const response = await fetch(`${this.backendUrl}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: session ? `Bearer ${session.access_token}` : '',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errPayload = await response.json().catch(() => ({ detail: 'Unknown error' }));
        if (response.status === 401) {
          throw new Error('Invalid API key. Please check your Settings.');
        } else if (response.status === 429) {
          throw new Error('Rate limit exceeded. Try again later.');
        } else if (response.status === 503) {
          throw new Error('Service unavailable. Please try again.');
        }
        throw new Error(errPayload.detail || errPayload.error || `Failed to get response`);
      }

      const data: GenerateResponse = await response.json();
      return data;
    } catch (err: any) {
      console.error('AI Service Error:', err);
      if (err.message.includes('fetch')) {
        throw new Error('Network error. Check your connection.');
      }
      throw err;
    }
  }

  async hasApiKey(provider: string, userId: string): Promise<boolean> {
    const key = await this.getUserApiKey(provider, userId);
    return !!key;
  }

  private getDefaultModel(provider: string): string {
    const models: Record<string, string> = {
      openai: 'gpt-3.5-turbo',
      claude: 'claude-3-sonnet-20240229',
      deepseek: 'deepseek-chat',
      grok: 'grok-beta',
      mistral: 'mistral-medium',
    };
    return models[provider.toLowerCase()] || 'gpt-3.5-turbo';
  }
}

export const aiService = new AIService();