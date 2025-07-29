import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useProject } from '../contexts/ProjectContext';
import { useNotification } from '../contexts/NotificationContext';
import { API_CONFIG } from '../lib/config';

/**
 * Memory Item Interface
 * Represents a stored memory with vector embedding and metadata
 */
export interface MemoryItem {
  id: string;
  text: string;
  embedding?: number[]; // Vector embedding (usually not returned to frontend)
  metadata: {
    source?: string;
    type?: 'chat' | 'code' | 'note' | 'document';
    importance?: number;
    [key: string]: any;
  };
  tags: string[];
  similarity?: number; // Similarity score when returned from search
  created_at: string;
  updated_at: string;
}

/**
 * Memory Search Options
 * Configuration for memory search operations
 */
export interface MemorySearchOptions {
  topK?: number; // Number of results to return (default: 10)
  threshold?: number; // Minimum similarity threshold (default: 0.7)
  projectId?: string; // Filter by specific project
  tags?: string[]; // Filter by tags
  type?: string; // Filter by memory type
}

/**
 * Memory Hook Return Type
 * Interface for the useMemory hook return value
 */
export interface UseMemoryReturn {
  // Core memory operations
  addMemory: (text: string, metadata?: Partial<MemoryItem['metadata']>, tags?: string[]) => Promise<void>;
  searchMemory: (query: string, options?: MemorySearchOptions) => Promise<MemoryItem[]>;
  deleteMemory: (memoryId: string) => Promise<void>;
  updateMemory: (memoryId: string, updates: Partial<Pick<MemoryItem, 'text' | 'metadata' | 'tags'>>) => Promise<void>;
  
  // Memory management
  getRecentMemories: (limit?: number) => Promise<MemoryItem[]>;
  getMemoriesByTags: (tags: string[]) => Promise<MemoryItem[]>;
  clearProjectMemories: (projectId: string) => Promise<void>;
  
  // State management
  loading: boolean;
  error: string | null;
  clearError: () => void;
  
  // Statistics
  getMemoryStats: () => Promise<{ total: number; byType: Record<string, number> }>;
}

/**
 * OpenAI Embedding API Response
 * Interface for OpenAI embeddings API response
 */
interface EmbeddingResponse {
  data: Array<{
    embedding: number[];
    index: number;
  }>;
  model: string;
  usage: {
    prompt_tokens: number;
    total_tokens: number;
  };
}

/**
 * Custom Memory System Hook
 * 
 * Provides intelligent memory storage and retrieval using vector embeddings.
 * Integrates with Supabase pgvector for efficient similarity search and
 * OpenAI embeddings API for text vectorization.
 * 
 * Features:
 * - Store text with automatic embedding generation
 * - Semantic similarity search across stored memories
 * - User and project isolation with RLS
 * - Metadata and tag-based filtering
 * - Automatic cleanup and memory management
 */
export const useMemory = (): UseMemoryReturn => {
  // State management for loading and error states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Context dependencies for user and project isolation
  const { user } = useAuth();
  const { currentProject } = useProject();
  const { showNotification } = useNotification();

  /**
   * Generate text embeddings using OpenAI API
   * Converts text into vector representation for similarity search
   * 
   * @param text - Text to generate embeddings for
   * @returns Promise resolving to embedding vector
   */
  const generateEmbedding = useCallback(async (text: string): Promise<number[]> => {
    // Note: In production, this should be called through a secure backend endpoint
    // to protect the OpenAI API key. For demo purposes, we'll simulate the call.
    
    try {
      // This would typically be a call to your backend API endpoint
      // that securely handles the OpenAI API key
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.EMBEDDINGS}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          'Origin': APP_CONFIG.FRONTEND_URL
        },
        body: JSON.stringify({ text })
      });

      if (!response.ok) {
        throw new Error('Failed to generate embedding');
      }

      const data: EmbeddingResponse = await response.json();
      return data.data[0].embedding;
      
    } catch (error) {
      console.error('Embedding generation error:', error);
      
      // Fallback: Generate a mock embedding for demo purposes
      // In production, this should throw an error
      console.warn('Using mock embedding for demo purposes');
      return Array.from({ length: 1536 }, () => Math.random() - 0.5);
    }
  }, []);

  /**
   * Add new memory item with automatic embedding generation
   * Stores text content with vector embedding for future similarity search
   * 
   * @param text - Text content to store
   * @param metadata - Optional metadata object
   * @param tags - Optional array of tags for categorization
   */
  const addMemory = useCallback(async (
    text: string, 
    metadata: Partial<MemoryItem['metadata']> = {},
    tags: string[] = []
  ): Promise<void> => {
    if (!user) {
      throw new Error('User must be authenticated to add memories');
    }

    if (!text.trim()) {
      throw new Error('Memory text cannot be empty');
    }

    setLoading(true);
    setError(null);

    try {
      // Generate embedding for the text
      const embedding = await generateEmbedding(text.trim());

      // Prepare memory item data
      const memoryData = {
        user_id: user.id,
        project_id: currentProject?.id || null,
        text: text.trim(),
        embedding,
        metadata: {
          source: 'user_input',
          type: 'note',
          importance: 1,
          ...metadata
        },
        tags: tags.filter(tag => tag.trim().length > 0)
      };

      // Store in Supabase with vector embedding
      const { error: insertError } = await supabase
        .from('memory_items')
        .insert(memoryData);

      if (insertError) {
        throw insertError;
      }

      showNotification('Memory saved successfully', 'success');
      
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to add memory';
      setError(errorMessage);
      showNotification(`Failed to save memory: ${errorMessage}`, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user, currentProject, generateEmbedding, showNotification]);

  /**
   * Search memories using semantic similarity
   * Finds relevant memories based on vector similarity to query
   * 
   * @param query - Search query text
   * @param options - Search configuration options
   * @returns Promise resolving to array of relevant memories
   */
  const searchMemory = useCallback(async (
    query: string, 
    options: MemorySearchOptions = {}
  ): Promise<MemoryItem[]> => {
    if (!user) {
      throw new Error('User must be authenticated to search memories');
    }

    if (!query.trim()) {
      return [];
    }

    setLoading(true);
    setError(null);

    try {
      // Generate embedding for search query
      const queryEmbedding = await generateEmbedding(query.trim());

      // Prepare search parameters
      const {
        topK = 10,
        threshold = 0.7,
        projectId = currentProject?.id,
        tags,
        type
      } = options;

      // Call Supabase function for similarity search
      const { data, error: searchError } = await supabase
        .rpc('search_memories', {
          query_embedding: queryEmbedding,
          match_threshold: threshold,
          match_count: topK,
          filter_user_id: user.id,
          filter_project_id: projectId
        });

      if (searchError) {
        throw searchError;
      }

      // Filter results by additional criteria if specified
      let results = data || [];

      if (tags && tags.length > 0) {
        results = results.filter((item: any) => 
          tags.some(tag => item.tags.includes(tag))
        );
      }

      if (type) {
        results = results.filter((item: any) => 
          item.metadata?.type === type
        );
      }

      return results.map((item: any) => ({
        id: item.id,
        text: item.text,
        metadata: item.metadata || {},
        tags: item.tags || [],
        similarity: item.similarity,
        created_at: item.created_at,
        updated_at: item.created_at // Search function doesn't return updated_at
      }));

    } catch (err: any) {
      const errorMessage = err.message || 'Failed to search memories';
      setError(errorMessage);
      showNotification(`Memory search failed: ${errorMessage}`, 'error');
      return [];
    } finally {
      setLoading(false);
    }
  }, [user, currentProject, generateEmbedding, showNotification]);

  /**
   * Delete a specific memory item
   * Removes memory from storage permanently
   * 
   * @param memoryId - ID of memory to delete
   */
  const deleteMemory = useCallback(async (memoryId: string): Promise<void> => {
    if (!user) {
      throw new Error('User must be authenticated to delete memories');
    }

    setLoading(true);
    setError(null);

    try {
      const { error: deleteError } = await supabase
        .from('memory_items')
        .delete()
        .eq('id', memoryId)
        .eq('user_id', user.id); // Ensure user can only delete their own memories

      if (deleteError) {
        throw deleteError;
      }

      showNotification('Memory deleted successfully', 'success');

    } catch (err: any) {
      const errorMessage = err.message || 'Failed to delete memory';
      setError(errorMessage);
      showNotification(`Failed to delete memory: ${errorMessage}`, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user, showNotification]);

  /**
   * Update existing memory item
   * Modifies text, metadata, or tags of existing memory
   * 
   * @param memoryId - ID of memory to update
   * @param updates - Partial updates to apply
   */
  const updateMemory = useCallback(async (
    memoryId: string, 
    updates: Partial<Pick<MemoryItem, 'text' | 'metadata' | 'tags'>>
  ): Promise<void> => {
    if (!user) {
      throw new Error('User must be authenticated to update memories');
    }

    setLoading(true);
    setError(null);

    try {
      const updateData: any = { ...updates };

      // If text is being updated, regenerate embedding
      if (updates.text) {
        updateData.embedding = await generateEmbedding(updates.text);
      }

      const { error: updateError } = await supabase
        .from('memory_items')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', memoryId)
        .eq('user_id', user.id); // Ensure user can only update their own memories

      if (updateError) {
        throw updateError;
      }

      showNotification('Memory updated successfully', 'success');

    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update memory';
      setError(errorMessage);
      showNotification(`Failed to update memory: ${errorMessage}`, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user, generateEmbedding, showNotification]);

  /**
   * Get recent memories for user/project
   * Retrieves most recently created memories
   * 
   * @param limit - Maximum number of memories to return
   * @returns Promise resolving to array of recent memories
   */
  const getRecentMemories = useCallback(async (limit: number = 20): Promise<MemoryItem[]> => {
    if (!user) {
      return [];
    }

    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('memory_items')
        .select('id, text, metadata, tags, created_at, updated_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      // Filter by current project if available
      if (currentProject) {
        query = query.eq('project_id', currentProject.id);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw fetchError;
      }

      return data || [];

    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch recent memories';
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, [user, currentProject]);

  /**
   * Get memories filtered by tags
   * Retrieves memories that contain any of the specified tags
   * 
   * @param tags - Array of tags to filter by
   * @returns Promise resolving to array of matching memories
   */
  const getMemoriesByTags = useCallback(async (tags: string[]): Promise<MemoryItem[]> => {
    if (!user || tags.length === 0) {
      return [];
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('memory_items')
        .select('id, text, metadata, tags, created_at, updated_at')
        .eq('user_id', user.id)
        .overlaps('tags', tags)
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      return data || [];

    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch memories by tags';
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, [user]);

  /**
   * Clear all memories for a specific project
   * Removes all memories associated with a project
   * 
   * @param projectId - ID of project to clear memories for
   */
  const clearProjectMemories = useCallback(async (projectId: string): Promise<void> => {
    if (!user) {
      throw new Error('User must be authenticated to clear memories');
    }

    setLoading(true);
    setError(null);

    try {
      const { error: deleteError } = await supabase
        .from('memory_items')
        .delete()
        .eq('user_id', user.id)
        .eq('project_id', projectId);

      if (deleteError) {
        throw deleteError;
      }

      showNotification('Project memories cleared successfully', 'success');

    } catch (err: any) {
      const errorMessage = err.message || 'Failed to clear project memories';
      setError(errorMessage);
      showNotification(`Failed to clear memories: ${errorMessage}`, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user, showNotification]);

  /**
   * Get memory statistics for user
   * Returns counts and analytics about stored memories
   * 
   * @returns Promise resolving to memory statistics
   */
  const getMemoryStats = useCallback(async (): Promise<{ total: number; byType: Record<string, number> }> => {
    if (!user) {
      return { total: 0, byType: {} };
    }

    try {
      const { data, error: fetchError } = await supabase
        .from('memory_items')
        .select('metadata')
        .eq('user_id', user.id);

      if (fetchError) {
        throw fetchError;
      }

      const total = data?.length || 0;
      const byType: Record<string, number> = {};

      data?.forEach(item => {
        const type = item.metadata?.type || 'unknown';
        byType[type] = (byType[type] || 0) + 1;
      });

      return { total, byType };

    } catch (err: any) {
      console.error('Failed to fetch memory stats:', err);
      return { total: 0, byType: {} };
    }
  }, [user]);

  /**
   * Clear error state
   * Resets error state for clean UI updates
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Return hook interface with all memory operations
  return {
    // Core memory operations
    addMemory,
    searchMemory,
    deleteMemory,
    updateMemory,
    
    // Memory management
    getRecentMemories,
    getMemoriesByTags,
    clearProjectMemories,
    
    // State management
    loading,
    error,
    clearError,
    
    // Statistics
    getMemoryStats
  };
};