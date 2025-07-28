import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  Calendar, 
  Tag, 
  ChevronLeft, 
  ChevronRight,
  Filter,
  RefreshCw,
  Brain,
  FileText
} from 'lucide-react';
import { useMemoryContext } from '../../contexts/MemoryContext';
import { useAuth } from '../../contexts/AuthContext';
import { useProject } from '../../contexts/ProjectContext';
import { LoadingSpinner } from '../Shared/LoadingSpinner';
import { MemoryItem } from '../../hooks/useMemory';

interface MemoryListProps {
  onEditMemory?: (memory: MemoryItem) => void;
  onCreateNew?: () => void;
  className?: string;
}

/**
 * MemoryList Component
 * 
 * Displays a paginated, searchable list of memory items for the current user.
 * Features semantic search, tag filtering, and project-based organization.
 * Integrates with the custom memory system API for intelligent context management.
 */
export const MemoryList: React.FC<MemoryListProps> = ({
  onEditMemory,
  onCreateNew,
  className = ''
}) => {
  // Context and authentication
  const { user } = useAuth();
  const { currentProject } = useProject();
  const { 
    searchMemory, 
    getRecentMemories, 
    deleteMemory, 
    loading, 
    error, 
    clearError 
  } = useMemoryContext();

  // State management for list functionality
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isSearching, setIsSearching] = useState(false);
  const [availableTags, setAvailableTags] = useState<string[]>([]);

  // Pagination and filtering constants
  const ITEMS_PER_PAGE = 20;
  const SEARCH_DEBOUNCE_MS = 500;

  /**
   * Load memories based on current filters and pagination
   * Handles both search queries and recent memory retrieval
   */
  const loadMemories = useCallback(async () => {
    if (!user) return;

    try {
      let results: MemoryItem[] = [];

      if (searchQuery.trim()) {
        // Perform semantic search
        setIsSearching(true);
        results = await searchMemory(searchQuery, {
          topK: ITEMS_PER_PAGE,
          projectId: currentProject?.id,
          tags: selectedTags.length > 0 ? selectedTags : undefined
        });
      } else {
        // Get recent memories
        results = await getRecentMemories(ITEMS_PER_PAGE);
        
        // Filter by tags if selected
        if (selectedTags.length > 0) {
          results = results.filter(memory => 
            selectedTags.some(tag => memory.tags.includes(tag))
          );
        }
        
        // Filter by project if selected
        if (currentProject) {
          results = results.filter(memory => 
            memory.metadata.projectId === currentProject.id
          );
        }
      }

      setMemories(results);
      
      // Extract available tags from results
      const tags = new Set<string>();
      results.forEach(memory => {
        memory.tags.forEach(tag => tags.add(tag));
      });
      setAvailableTags(Array.from(tags).sort());
      
      // Calculate pagination (simplified for demo)
      setTotalPages(Math.ceil(results.length / ITEMS_PER_PAGE));
      
    } catch (err) {
      console.error('Failed to load memories:', err);
    } finally {
      setIsSearching(false);
    }
  }, [user, currentProject, searchQuery, selectedTags, searchMemory, getRecentMemories]);

  /**
   * Debounced search effect
   * Triggers search after user stops typing for specified delay
   */
  useEffect(() => {
    const searchTimeout = setTimeout(() => {
      loadMemories();
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(searchTimeout);
  }, [loadMemories]);

  /**
   * Initial load effect
   * Loads memories when component mounts or user/project changes
   */
  useEffect(() => {
    if (user) {
      loadMemories();
    }
  }, [user, currentProject]);

  /**
   * Handle memory deletion with confirmation
   * Removes memory from list and updates UI
   */
  const handleDeleteMemory = useCallback(async (memoryId: string) => {
    if (!window.confirm('Are you sure you want to delete this memory? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteMemory(memoryId);
      setMemories(prev => prev.filter(memory => memory.id !== memoryId));
    } catch (err) {
      console.error('Failed to delete memory:', err);
    }
  }, [deleteMemory]);

  /**
   * Handle tag filter toggle
   * Adds or removes tags from selected filters
   */
  const handleTagToggle = useCallback((tag: string) => {
    setSelectedTags(prev => {
      if (prev.includes(tag)) {
        return prev.filter(t => t !== tag);
      } else {
        return [...prev, tag];
      }
    });
  }, []);

  /**
   * Clear all filters and search
   * Resets to default recent memories view
   */
  const handleClearFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedTags([]);
    setCurrentPage(1);
  }, []);

  /**
   * Format timestamp for display
   * Converts ISO timestamp to readable format
   */
  const formatTimestamp = useCallback((timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      if (diffInDays === 1) {
        return 'Yesterday';
      } else if (diffInDays < 7) {
        return `${diffInDays} days ago`;
      } else {
        return date.toLocaleDateString();
      }
    }
  }, []);

  /**
   * Truncate text for preview display
   * Limits text length with ellipsis
   */
  const truncateText = useCallback((text: string, maxLength: number = 150): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  }, []);

  if (!user) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500">Please sign in to view your memories.</p>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl shadow-lg p-6 ${className}`}>
      {/* Header Section */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <Brain className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Memory Bank</h2>
            <p className="text-gray-600">
              {memories.length} memories
              {currentProject && ` in ${currentProject.name}`}
            </p>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={loadMemories}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
            title="Refresh memories"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          
          {onCreateNew && (
            <button
              onClick={onCreateNew}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Memory
            </button>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4 mb-6">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search memories semantically..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            disabled={loading}
          />
          {isSearching && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <LoadingSpinner size="sm" />
            </div>
          )}
        </div>

        {/* Tag Filters */}
        {availableTags.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">Filter by tags:</span>
            {availableTags.slice(0, 10).map((tag) => (
              <button
                key={tag}
                onClick={() => handleTagToggle(tag)}
                className={`
                  px-3 py-1 text-sm rounded-full border transition-colors
                  ${selectedTags.includes(tag)
                    ? 'bg-green-100 text-green-800 border-green-300'
                    : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-green-50'
                  }
                `}
              >
                {tag}
              </button>
            ))}
            
            {(searchQuery || selectedTags.length > 0) && (
              <button
                onClick={handleClearFilters}
                className="px-3 py-1 text-sm text-red-600 hover:text-red-700 hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
          <p className="text-red-700">{error}</p>
          <button
            onClick={clearError}
            className="text-red-600 hover:text-red-700"
          >
            ×
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && memories.length === 0 && (
        <div className="flex justify-center items-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      )}

      {/* Memory Items List */}
      {memories.length > 0 ? (
        <div className="space-y-4">
          {memories.map((memory) => (
            <div
              key={memory.id}
              className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors"
            >
              {/* Memory Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-500">
                      {memory.metadata.type || 'Note'}
                    </span>
                    {memory.similarity && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                        {Math.round(memory.similarity * 100)}% match
                      </span>
                    )}
                  </div>
                  
                  {/* Memory Text Content */}
                  <p className="text-gray-900 leading-relaxed mb-3">
                    {truncateText(memory.text)}
                  </p>
                  
                  {/* Tags */}
                  {memory.tags.length > 0 && (
                    <div className="flex items-center gap-2 mb-2">
                      <Tag className="w-3 h-3 text-gray-400" />
                      <div className="flex gap-1 flex-wrap">
                        {memory.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Timestamp */}
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Calendar className="w-3 h-3" />
                    <span>{formatTimestamp(memory.created_at)}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 ml-4">
                  {onEditMemory && (
                    <button
                      onClick={() => onEditMemory(memory)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                      title="Edit memory"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  )}
                  
                  <button
                    onClick={() => handleDeleteMemory(memory.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    title="Delete memory"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : !loading && (
        /* Empty State */
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Brain className="w-8 h-8 text-gray-300" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchQuery ? 'No matching memories found' : 'No memories yet'}
          </h3>
          <p className="text-gray-600 mb-6">
            {searchQuery 
              ? 'Try adjusting your search query or filters'
              : 'Start building your knowledge base by adding your first memory'
            }
          </p>
          {onCreateNew && !searchQuery && (
            <button
              onClick={onCreateNew}
              className="flex items-center gap-2 mx-auto px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Your First Memory
            </button>
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1 || loading}
              className="flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages || loading}
              className="flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};