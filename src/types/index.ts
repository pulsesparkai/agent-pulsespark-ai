// Type definitions for the application

export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface ApiKey {
  id: string;
  user_id: string;
  provider: ApiKeyProvider;
  encrypted_key: string;
  key_preview: string;
  created_at: string;
  updated_at: string;
}

export type ApiKeyProvider = 'OpenAI' | 'Claude' | 'DeepSeek' | 'Grok' | 'Mistral';

export interface CreateApiKeyRequest {
  provider: ApiKeyProvider;
  api_key: string;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export interface ApiKeysContextType {
  apiKeys: ApiKey[];
  loading: boolean;
  error: string | null;
  addApiKey: (data: CreateApiKeyRequest) => Promise<void>;
  deleteApiKey: (id: string) => Promise<void>;
  refreshApiKeys: () => Promise<void>;
}

export interface NotificationContextType {
  showNotification: (message: string, type: 'success' | 'error' | 'info') => void;
}

export interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: string;
  provider?: ApiKeyProvider;
  error?: string;
}

export interface ChatSession {
  id: string;
  user_id: string;
  title: string;
  messages: ChatMessage[];
  created_at: string;
  updated_at: string;
}

export interface ChatContextType {
  messages: ChatMessage[];
  currentSession: ChatSession | null;
  loading: boolean;
  error: string | null;
  selectedProvider: ApiKeyProvider;
  setSelectedProvider: (provider: ApiKeyProvider) => void;
  sendMessage: (content: string) => Promise<void>;
  clearChat: () => Promise<void>;
  loadChatHistory: () => Promise<void>;
  retryLastMessage: () => Promise<void>;
}