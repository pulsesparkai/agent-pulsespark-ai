import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useProject } from '../contexts/ProjectContext';
import { useNotification } from '../contexts/NotificationContext';
import { supabase } from '../lib/supabase';
import { LoadingSpinner } from '../components/Shared/LoadingSpinner';
import { MemorySearch } from '../components/Memory/MemorySearch';
import { 
  Brain, 
  Plus, 
  Search, 
  Filter, 
  Tag,
  Calendar,
  Trash2,
  Edit2,
  X,
  Save
} from 'lucide-react';

interface MemoryItem {
  id: string;
  user_id: string;
  project_id?: string;
  text: string;
  metadata: Record<string, any>;
  tags: string[];
  created_at: string;
  updated_at: string;
  similarity?: number;
}

/**
 * MemoryPage Component
 * 
 * Complete memory management interface with CRUD operations and semantic search
 */
export const MemoryPage: React.FC = () => {
  const { user } = useAuth();
  const { projects } = useProject();
  const { showNotification } = useNotification();

  // State management
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingMemory, setEditingMemory] = useState<MemoryItem | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    text: '',
    projectId: '',
    tags: '',
    type: 'note',
    importance: 1
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const ITEMS_PER_PAGE = 20;

  /**
   * Load memory items from Supabase
   */
  const loadMemories = useCallback(async (page = 1, append = false) => {
    if (!user) return;

    try {
      if (!append) setLoading(true);

      let query = supabase
        .from('memory_items')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE - 1);

      // Apply project filter
      if (selectedProject !== 'all') {
        query = query.eq('project_id', selectedProject);
      }

      // Apply search filter
      if (searchQuery.trim()) {
        query = query.textSearch('text', searchQuery.trim());
      }

      const { data, error, count } = await query;

      if (error) throw error;

      if (append) {
        setMemories(prev => [...prev, ...(data || [])]);
      } else {
        setMemories(data || []);
      }

      setHasMore((count || 0) > page * ITEMS_PER_PAGE);
      setCurrentPage(page);

    } catch (error: any) {
      showNotification('Failed to load memories', 'error');
    } finally {
      setLoading(false);
    }
  }, [user, selectedProject, searchQuery, showNotification]);

  /**
   * Create new memory item
   */
  const handleCreateMemory = async () => {
    if (!user || !formData.text.trim()) return;

    try {
      const memoryData = {
        user_id: user.id,
        project_id: formData.projectId || null,
        text: formData.text.trim(),
        metadata: {
          type: formData.type,
          importance: formData.importance,
          source: 'manual'
        },
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean)
      };

      const { error } = await supabase
        .from('memory_items')
        .insert(memoryData);

      if (error) throw error;

      setShowCreateModal(false);
      setFormData({ text: '', projectId: '', tags: '', type: 'note', importance: 1 });
      loadMemories();
      showNotification('Memory created successfully', 'success');

    } catch (error: any) {
      showNotification('Failed to create memory', 'error');
    }
  };

  /**
   * Update existing memory item
   */
  const handleUpdateMemory = async () => {
    if (!editingMemory || !formData.text.trim()) return;

    try {
      const updateData = {
        text: formData.text.trim(),
        metadata: {
          ...editingMemory.metadata,
          type: formData.type,
          importance: formData.importance
        },
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('memory_items')
        .update(updateData)
        .eq('id', editingMemory.id);

      if (error) throw error;

      setEditingMemory(null);
      setFormData({ text: '', projectId: '', tags: '', type: 'note', importance: 1 });
      loadMemories();
      showNotification('Memory updated successfully', 'success');

    } catch (error: any) {
      showNotification('Failed to update memory', 'error');
    }
  };

  /**
   * Delete memory item
   */
  const handleDeleteMemory = async (memoryId: string) => {
    try {
      const { error } = await supabase
        .from('memory_items')
        .delete()
        .eq('id', memoryId);

      if (error) throw error;

      setShowDeleteModal(null);
      loadMemories();
      showNotification('Memory deleted successfully', 'success');

    } catch (error: any) {
      showNotification('Failed to delete memory', 'error');
    }
  };

  /**
   * Start editing a memory
   */
  const startEdit = (memory: MemoryItem) => {
    setEditingMemory(memory);
    setFormData({
      text: memory.text,
      projectId: memory.project_id || '',
      tags: memory.tags.join(', '),
      type: memory.metadata.type || 'note',
      importance: memory.metadata.importance || 1
    });
  };

  /**
   * Get unique tags from all memories
   */
  const getAllTags = () => {
    const tagSet = new Set<string>();
    memories.forEach(memory => {
      memory.tags.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  };

  /**
   * Format timestamp for display
   */
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  // Load memories on mount and filter changes
  useEffect(() => {
    loadMemories();
  }, [loadMemories]);

  // Filter memories by selected tags
  const filteredMemories = memories.filter(memory => {
    if (selectedTags.length === 0) return true;
    return selectedTags.some(tag => memory.tags.includes(tag));
  });

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Memory Bank</h1>
              <p className="text-gray-400">
                {memories.length} memories • Organize your knowledge
              </p>
            </div>
          </div>
          
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Memory
          </button>
        </div>

        {/* Search and Filters */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search memories..."
                className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Project Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All Projects</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>{project.name}</option>
                ))}
              </select>
            </div>

            {/* Tag Filter */}
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                multiple
                value={selectedTags}
                onChange={(e) => setSelectedTags(Array.from(e.target.selectedOptions, option => option.value))}
                className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {getAllTags().map(tag => (
                  <option key={tag} value={tag}>{tag}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Memory List */}
        {loading && memories.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : filteredMemories.length === 0 ? (
          <div className="text-center py-12">
            <Brain className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No memories found</h3>
            <p className="text-gray-400 mb-6">
              {memories.length === 0 
                ? "Start building your knowledge base by adding your first memory"
                : "Try adjusting your search or filter criteria"
              }
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Add Your First Memory
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredMemories.map((memory) => (
              <div
                key={memory.id}
                className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-purple-500 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <p className="text-white leading-relaxed mb-3">{memory.text}</p>
                    
                    {/* Tags */}
                    {memory.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {memory.tags.map(tag => (
                          <span
                            key={tag}
                            className="px-2 py-1 bg-purple-600 text-white text-xs rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Metadata */}
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{formatTimestamp(memory.created_at)}</span>
                      </div>
                      {memory.metadata.type && (
                        <span className="px-2 py-1 bg-gray-700 rounded text-xs">
                          {memory.metadata.type}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => startEdit(memory)}
                      className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-900/20 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setShowDeleteModal(memory.id)}
                      className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Load More */}
        {hasMore && (
          <div className="text-center mt-8">
            <button
              onClick={() => loadMemories(currentPage + 1, true)}
              disabled={loading}
              className="px-6 py-3 bg-gray-800 text-white rounded-lg border border-gray-600 hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              {loading ? <LoadingSpinner size="sm" /> : 'Load More'}
            </button>
          </div>
        )}

        {/* Create/Edit Modal */}
        {(showCreateModal || editingMemory) && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-xl max-w-2xl w-full p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">
                  {editingMemory ? 'Edit Memory' : 'Add New Memory'}
                </h2>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingMemory(null);
                    setFormData({ text: '', projectId: '', tags: '', type: 'note', importance: 1 });
                  }}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Text Content */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Memory Content
                  </label>
                  <textarea
                    value={formData.text}
                    onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Enter your memory content..."
                  />
                </div>

                {/* Project Association */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Project (Optional)
                  </label>
                  <select
                    value={formData.projectId}
                    onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">No project</option>
                    {projects.map(project => (
                      <option key={project.id} value={project.id}>{project.name}</option>
                    ))}
                  </select>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="react, javascript, tutorial"
                  />
                </div>

                {/* Type and Importance */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Type
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="note">Note</option>
                      <option value="code">Code</option>
                      <option value="document">Document</option>
                      <option value="chat">Chat</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Importance (1-5)
                    </label>
                    <select
                      value={formData.importance}
                      onChange={(e) => setFormData({ ...formData, importance: parseInt(e.target.value) })}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value={1}>1 - Low</option>
                      <option value={2}>2 - Medium</option>
                      <option value={3}>3 - High</option>
                      <option value={4}>4 - Very High</option>
                      <option value={5}>5 - Critical</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingMemory(null);
                    setFormData({ text: '', projectId: '', tags: '', type: 'note', importance: 1 });
                  }}
                  className="flex-1 px-4 py-3 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={editingMemory ? handleUpdateMemory : handleCreateMemory}
                  disabled={!formData.text.trim()}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  {editingMemory ? 'Update Memory' : 'Create Memory'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-xl max-w-md w-full p-6 border border-gray-700">
              <h2 className="text-xl font-bold text-white mb-4">Delete Memory</h2>
              <p className="text-gray-300 mb-6">
                Are you sure you want to delete this memory? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(null)}
                  className="flex-1 px-4 py-3 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteMemory(showDeleteModal)}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};