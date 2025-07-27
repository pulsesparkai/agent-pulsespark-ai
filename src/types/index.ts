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

// Project and File Management Types
export interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  content?: string;
  children?: FileNode[];
  parentId?: string;
  path: string;
  language?: string;
  size?: number;
  lastModified: string;
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  file_tree: FileNode[];
  github_repo?: string;
  github_branch?: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectContextType {
  currentProject: Project | null;
  projects: Project[];
  selectedFile: FileNode | null;
  loading: boolean;
  error: string | null;
  
  // Project operations
  createProject: (name: string, description?: string) => Promise<void>;
  loadProject: (projectId: string) => Promise<void>;
  saveProject: () => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  
  // File operations
  createFile: (parentId: string | null, name: string, type: 'file' | 'folder') => Promise<void>;
  selectFile: (file: FileNode) => void;
  updateFileContent: (fileId: string, content: string) => Promise<void>;
  renameFile: (fileId: string, newName: string) => Promise<void>;
  deleteFile: (fileId: string) => Promise<void>;
  
  // GitHub integration
  pushToGitHub: (repoName: string, isNewRepo: boolean) => Promise<void>;
}

export interface GitHubContextType {
  isAuthenticated: boolean;
  user: any | null;
  repositories: any[];
  loading: boolean;
  error: string | null;
  
  authenticate: () => Promise<void>;
  loadRepositories: () => Promise<void>;
  createRepository: (name: string, description?: string) => Promise<any>;
  pushFiles: (repoName: string, files: FileNode[], commitMessage: string) => Promise<void>;
}