import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { LoadingSpinner } from '../Shared/LoadingSpinner';
import { 
  Brain, 
  Plus, 
  Search, 
  Filter,
  Calendar,
  Tag,
  Trash2,
  Edit2
} from 'lucide-react';

/**
 * MemoryPage Component
 * 
 * Memory management interface for storing and searching memories
 */
export const MemoryPage: React.FC = () => {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  
  // State management
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Load memories on mount
  useEffect(() => {
    if (user) {
      loadMemories();
    }
  }, [user]);

  const loadMemories = async () => {
    try {
      setLoading(true);
      // Add your memory loading logic here
      setMemories([]);
    } catch (error) {
      showNotification('Failed to load memories', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Memory Bank</h1>
              <p className="text-gray-400">Store and search your knowledge</p>
            </div>
          </div>
          
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Memory
          </button>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search memories..."
              className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        {/* Memory List */}
        <div className="bg-gray-800 rounded-lg p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : memories.length === 0 ? (
            <div className="text-center py-12">
              <Brain className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No memories yet</h3>
              <p className="text-gray-400 mb-6">Start building your knowledge base</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Add Your First Memory
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {memories.map((memory: any) => (
                <div key={memory.id} className="bg-gray-700 rounded-lg p-4">
                  <p className="text-white">{memory.text}</p>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Calendar className="w-4 h-4" />
                      {new Date(memory.created_at).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="p-1 text-gray-400 hover:text-white transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button className="p-1 text-gray-400 hover:text-red-400 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};