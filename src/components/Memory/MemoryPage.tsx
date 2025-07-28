import React, { useState, useCallback } from 'react';
import { Plus, Search, Brain, Settings } from 'lucide-react';
import { MemoryList } from './MemoryList';
import { MemoryItemEditor } from './MemoryItemEditor';
import { MemorySearch } from './MemorySearch';
import { useAuth } from '../../contexts/AuthContext';
import { useProject } from '../../contexts/ProjectContext';
import { MemoryItem } from '../../hooks/useMemory';

/**
 * MemoryPage Component
 * 
 * Main page for the Custom Memory System providing a comprehensive interface
 * for managing, searching, and organizing memory items. Features tabbed navigation
 * between list view and editor, with integrated search functionality.
 */
export const MemoryPage: React.FC = () => {
  // Context and authentication
  const { user } = useAuth();
  const { currentProject } = useProject();

  // State management for page functionality
  const [activeTab, setActiveTab] = useState<'list' | 'editor' | 'search'>('list');
  const [editingMemory, setEditingMemory] = useState<MemoryItem | null>(null);
  const [showEditor, setShowEditor] = useState(false);

  /**
   * Handle creating new memory
   * Switches to editor tab for new memory creation
   */
  const handleCreateNew = useCallback(() => {
    setEditingMemory(null);
    setShowEditor(true);
    setActiveTab('editor');
  }, []);

  /**
   * Handle editing existing memory
   * Switches to editor tab with selected memory
   */
  const handleEditMemory = useCallback((memory: MemoryItem) => {
    setEditingMemory(memory);
    setShowEditor(true);
    setActiveTab('editor');
  }, []);

  /**
   * Handle memory save completion
   * Returns to list view after successful save
   */
  const handleMemorySaved = useCallback((memory: MemoryItem) => {
    setShowEditor(false);
    setEditingMemory(null);
    setActiveTab('list');
  }, []);

  /**
   * Handle editor cancel
   * Returns to list view without saving
   */
  const handleEditorCancel = useCallback(() => {
    setShowEditor(false);
    setEditingMemory(null);
    setActiveTab('list');
  }, []);

  /**
   * Handle memory selection from search
   * Shows memory details or switches to edit mode
   */
  const handleMemorySelect = useCallback((memory: MemoryItem) => {
    console.log('Selected memory:', memory);
    // Could open a detail view or edit the memory
    handleEditMemory(memory);
  }, [handleEditMemory]);

  /**
   * Handle tab change
   * Manages navigation between different views
   */
  const handleTabChange = useCallback((tab: 'list' | 'editor' | 'search') => {
    setActiveTab(tab);
    
    if (tab !== 'editor') {
      setShowEditor(false);
      setEditingMemory(null);
    }
  }, []);

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <Brain className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Memory System</h2>
          <p className="text-gray-600">Please sign in to access your personal memory bank.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
            <Brain className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Memory System</h1>
            <p className="text-gray-600">
              Store and retrieve knowledge with AI-powered semantic search
              {currentProject && ` • ${currentProject.name}`}
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleCreateNew}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Memory
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => handleTabChange('list')}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors
            ${activeTab === 'list'
              ? 'bg-white text-green-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
            }
          `}
        >
          <Brain className="w-4 h-4" />
          Memory Bank
        </button>
        
        <button
          onClick={() => handleTabChange('search')}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors
            ${activeTab === 'search'
              ? 'bg-white text-green-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
            }
          `}
        >
          <Search className="w-4 h-4" />
          Search
        </button>
        
        {showEditor && (
          <button
            onClick={() => handleTabChange('editor')}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors
              ${activeTab === 'editor'
                ? 'bg-white text-green-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
              }
            `}
          >
            <Settings className="w-4 h-4" />
            {editingMemory ? 'Edit Memory' : 'New Memory'}
          </button>
        )}
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {/* Memory List Tab */}
        {activeTab === 'list' && (
          <MemoryList
            onEditMemory={handleEditMemory}
            onCreateNew={handleCreateNew}
          />
        )}

        {/* Search Tab */}
        {activeTab === 'search' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Semantic Memory Search
              </h2>
              <p className="text-gray-600">
                Search your memories using natural language. The AI will find relevant content
                based on meaning, not just keywords.
              </p>
            </div>

            <div className="max-w-2xl">
              <MemorySearch
                onMemorySelect={handleMemorySelect}
                placeholder="Ask about anything you've stored..."
                maxResults={10}
                autoFocus={true}
              />
            </div>

            <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">Search Tips</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Use natural language: "How do I implement React hooks?"</li>
                <li>• Search by concept: "database optimization techniques"</li>
                <li>• Find code examples: "authentication middleware"</li>
                <li>• Discover related topics: "machine learning algorithms"</li>
              </ul>
            </div>
          </div>
        )}

        {/* Editor Tab */}
        {activeTab === 'editor' && showEditor && (
          <MemoryItemEditor
            memory={editingMemory}
            onSave={handleMemorySaved}
            onCancel={handleEditorCancel}
          />
        )}
      </div>

      {/* Memory System Info */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl">
          <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center mb-4">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <h3 className="font-semibold text-green-900 mb-2">Semantic Search</h3>
          <p className="text-green-700 text-sm">
            Find memories by meaning, not just keywords. Our AI understands context and relationships.
          </p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
            <Settings className="w-5 h-5 text-white" />
          </div>
          <h3 className="font-semibold text-blue-900 mb-2">Smart Organization</h3>
          <p className="text-blue-700 text-sm">
            Automatically organize memories by project, type, and importance for easy retrieval.
          </p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl">
          <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center mb-4">
            <Search className="w-5 h-5 text-white" />
          </div>
          <h3 className="font-semibold text-purple-900 mb-2">Instant Recall</h3>
          <p className="text-purple-700 text-sm">
            Access your knowledge instantly with lightning-fast vector similarity search.
          </p>
        </div>
      </div>
    </div>
  );
};