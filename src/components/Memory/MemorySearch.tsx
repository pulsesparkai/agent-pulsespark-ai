import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Brain, Clock, Tag, X } from 'lucide-react';
import { useMemoryContext } from '../../contexts/MemoryContext';
import { useAuth } from '../../contexts/AuthContext';
import { useProject } from '../../contexts/ProjectContext';
import { LoadingSpinner } from '../Shared/LoadingSpinner';
import { MemoryItem } from '../../hooks/useMemory';
import { API_CONFIG } from '../../lib/config';

interface MemorySearchProps {
  onMemorySelect?: (memory: MemoryItem) => void;
  placeholder?: string;
  maxResults?: number;
  className?: string;
  autoFocus?: boolean;
}

/**
 * MemorySearch Component
 * 
 * Provides real-time semantic search functionality for memory items.
 * Features debounced input, live results, and intelligent context filtering.
 * Integrates with the custom memory system API for instant knowledge retrieval.
 */
export const MemorySearch: React.FC<MemorySearchProps> = ({
  onMemorySelect,
  placeholder = "Search your memories...",
  maxResults = 5,
  className = '',
  autoFocus = false
}) => {
  // Context and authentication
  const { user } = useAuth();
  const { currentProject } = useProject();
  const { searchMemory, loading } = useMemoryContext();

  // State management for search functionality
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MemoryItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  // Refs for DOM manipulation and cleanup
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  // Search configuration
  const SEARCH_DEBOUNCE_MS = 300;
  const MIN_QUERY_LENGTH = 2;

  /**
   * Perform semantic search with debouncing
   * Searches memory items using vector similarity
   */
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!user || searchQuery.length < MIN_QUERY_LENGTH) {
      setResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    
    try {
      const searchResults = await searchMemory(searchQuery, {
        topK: maxResults,
        threshold: 0.6, // Lower threshold for more inclusive results
        projectId: currentProject?.id,
      });

      setResults(searchResults);
      setShowResults(searchResults.length > 0);
      setSelectedIndex(-1); // Reset selection
      
    } catch (error) {
      console.error('Search failed:', error);
      setResults([]);
      setShowResults(false);
    } finally {
      setIsSearching(false);
    }
  }, [user, currentProject, searchMemory, maxResults]);

  /**
   * Debounced search effect
   * Triggers search after user stops typing
   */
  useEffect(() => {
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set new timeout for debounced search
    if (query.trim()) {
      searchTimeoutRef.current = setTimeout(() => {
        performSearch(query.trim());
      }, SEARCH_DEBOUNCE_MS);
    } else {
      setResults([]);
      setShowResults(false);
      setIsSearching(false);
    }

    // Cleanup timeout on unmount or query change
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query, performSearch]);

  /**
   * Handle input change
   * Updates query state and manages search visibility
   */
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    
    // Hide results if query is cleared
    if (!newQuery.trim()) {
      setShowResults(false);
      setSelectedIndex(-1);
    }
  }, []);

  /**
   * Handle keyboard navigation
   * Supports arrow keys for result selection and Enter for selection
   */
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!showResults || results.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < results.length - 1 ? prev + 1 : 0
        );
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : results.length - 1
        );
        break;
        
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < results.length) {
          handleMemorySelect(results[selectedIndex]);
        }
        break;
        
      case 'Escape':
        e.preventDefault();
        setShowResults(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  }, [showResults, results, selectedIndex]);

  /**
   * Handle memory selection
   * Calls callback and manages UI state
   */
  const handleMemorySelect = useCallback((memory: MemoryItem) => {
    if (onMemorySelect) {
      onMemorySelect(memory);
    }
    
    // Update input with selected memory text preview
    const preview = memory.text.length > 50 
      ? memory.text.substring(0, 50) + '...' 
      : memory.text;
    setQuery(preview);
    
    setShowResults(false);
    setSelectedIndex(-1);
  }, [onMemorySelect]);

  /**
   * Handle input focus
   * Shows results if available
   */
  const handleInputFocus = useCallback(() => {
    if (results.length > 0 && query.trim()) {
      setShowResults(true);
    }
  }, [results.length, query]);

  /**
   * Handle input blur with delay
   * Hides results after a short delay to allow for clicks
   */
  const handleInputBlur = useCallback(() => {
    // Delay hiding results to allow for result clicks
    setTimeout(() => {
      setShowResults(false);
      setSelectedIndex(-1);
    }, 150);
  }, []);

  /**
   * Clear search
   * Resets all search state
   */
  const handleClearSearch = useCallback(() => {
    setQuery('');
    setResults([]);
    setShowResults(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  }, []);

  /**
   * Format timestamp for display
   * Converts ISO timestamp to relative time
   */
  const formatTimestamp = useCallback((timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours}h ago`;
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      return `${days}d ago`;
    }
  }, []);

  /**
   * Truncate text for preview
   * Limits text length with ellipsis
   */
  const truncateText = useCallback((text: string, maxLength: number = 100): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  }, []);

  /**
   * Auto-focus effect
   * Focuses input when autoFocus prop is true
   */
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  if (!user) {
    return null;
  }

  return (
    <div className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-gray-400" />
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          placeholder={placeholder}
          className="
            block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg
            text-gray-900 placeholder-gray-500 bg-white
            focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent
            hover:border-gray-400 transition-colors
          "
          aria-label="Search memories"
          aria-expanded={showResults}
          aria-haspopup="listbox"
          role="combobox"
          aria-autocomplete="list"
          aria-activedescendant={selectedIndex >= 0 ? `memory-result-${selectedIndex}` : undefined}
        />

        {/* Loading Indicator */}
        {isSearching && (
          <div className="absolute inset-y-0 right-0 pr-8 flex items-center">
            <LoadingSpinner size="sm" />
          </div>
        )}

        {/* Clear Button */}
        {query && (
          <button
            onClick={handleClearSearch}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {showResults && (
        <div
          ref={resultsRef}
          className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto"
          role="listbox"
          aria-label="Search results"
        >
          {results.length > 0 ? (
            <div className="py-2">
              {/* Results Header */}
              <div className="px-4 py-2 border-b border-gray-100">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Brain className="w-4 h-4 text-green-600" />
                  <span>{results.length} relevant memories found</span>
                </div>
              </div>

              {/* Results List */}
              {results.map((memory, index) => (
                <button
                  key={memory.id}
                  id={`memory-result-${index}`}
                  onClick={() => handleMemorySelect(memory)}
                  className={`
                    w-full text-left px-4 py-3 hover:bg-green-50 transition-colors
                    focus:outline-none focus:bg-green-50 border-b border-gray-50 last:border-b-0
                    ${selectedIndex === index ? 'bg-green-50' : ''}
                  `}
                  role="option"
                  aria-selected={selectedIndex === index}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      {/* Memory Text Preview */}
                      <p className="text-sm text-gray-900 font-medium mb-1 line-clamp-2">
                        {truncateText(memory.text)}
                      </p>
                      
                      {/* Memory Metadata */}
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{formatTimestamp(memory.created_at)}</span>
                        </div>
                        
                        {memory.metadata.type && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full">
                            {memory.metadata.type}
                          </span>
                        )}
                      </div>
                      
                      {/* Tags */}
                      {memory.tags.length > 0 && (
                        <div className="flex items-center gap-1 mt-2">
                          <Tag className="w-3 h-3 text-gray-400" />
                          <div className="flex gap-1 flex-wrap">
                            {memory.tags.slice(0, 3).map((tag) => (
                              <span
                                key={tag}
                                className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full"
                              >
                                {tag}
                              </span>
                            ))}
                            {memory.tags.length > 3 && (
                              <span className="text-xs text-gray-500">
                                +{memory.tags.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Similarity Score */}
                    {memory.similarity && (
                      <div className="flex-shrink-0 ml-3">
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                          {Math.round(memory.similarity * 100)}% match
                        </span>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          ) : query.length >= MIN_QUERY_LENGTH && !isSearching ? (
            /* No Results State */
            <div className="px-4 py-6 text-center">
              <Brain className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-600 mb-1">No memories found</p>
              <p className="text-xs text-gray-500">
                Try different keywords or check your spelling
              </p>
            </div>
          ) : null}
        </div>
      )}

      {/* Search Instructions */}
      {query.length > 0 && query.length < MIN_QUERY_LENGTH && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 px-4 py-3">
          <p className="text-sm text-gray-600">
            Type at least {MIN_QUERY_LENGTH} characters to search your memories
          </p>
        </div>
      )}

      {/* Keyboard Shortcuts Help */}
      <div className="sr-only" aria-live="polite">
        {showResults && results.length > 0 && (
          <span>
            {results.length} search results available. 
            Use arrow keys to navigate, Enter to select, Escape to close.
          </span>
        )}
      </div>
    </div>
  );
};