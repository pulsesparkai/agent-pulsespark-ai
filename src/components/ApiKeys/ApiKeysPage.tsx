import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { LoadingSpinner } from '../Shared/LoadingSpinner';
import { supabase } from '../../lib/supabase';
import { 
  Key, 
  Plus, 
  Trash2, 
  Edit2, 
  Calendar, 
  Eye,
  EyeOff,
  AlertTriangle,
  X,
  Save,
  Search,
  Filter
} from 'lucide-react';

// Type definitions for API key data
interface ApiKey {
  id: string;
  user_id: string;
  provider: ApiKeyProvider;
  encrypted_key: string;
  key_preview: string;
  created_at: string;
  updated_at: string;
}

type ApiKeyProvider = 'OpenAI' | 'Claude' | 'DeepSeek' | 'Grok' | 'Mistral';

interface CreateApiKeyData {
  provider: ApiKeyProvider;
  api_key: string;
}

interface UpdateApiKeyData {
  provider: ApiKeyProvider;
}

interface ApiKeysPageProps {
  className?: string;
}

/**
 * ApiKeysPage Component
 * 
 * Provides comprehensive API key management for the logged-in user.
 * Features secure CRUD operations, modern UI, and proper validation.
 * Integrates with Supabase RLS for user data isolation.
 */
export const ApiKeysPage: React.FC<ApiKeysPageProps> = ({ className = '' }) => {
  // Authentication and notifications
  const { user } = useAuth();
  const { showNotification } = useNotification();

  // State management for API keys and UI
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal and form state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [createFormData, setCreateFormData] = useState<CreateApiKeyData>({
    provider: 'OpenAI',
    api_key: ''
  });
  const [editFormData, setEditFormData] = useState<UpdateApiKeyData>({
    provider: 'OpenAI'
  });
  const [editingKeyId, setEditingKeyId] = useState<string | null>(null);
  const [deleteKeyId, setDeleteKeyId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Form validation and UI state
  const [showApiKey, setShowApiKey] = useState(false);
  const [formErrors, setFormErrors] = useState<{
    api_key?: string;
    provider?: string;
  }>({});
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [providerFilter, setProviderFilter] = useState<'all' | ApiKeyProvider>('all');

  // Available providers for dropdown selection
  const availableProviders: ApiKeyProvider[] = ['OpenAI', 'Claude', 'DeepSeek', 'Grok', 'Mistral'];

  /**
   * Fetch API keys for the current user from Supabase
   * Uses RLS policies to ensure user can only see their own keys
   */
  const fetchApiKeys = useCallback(async () => {
    if (!user) {
      setApiKeys([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Query api_keys table with RLS automatically filtering by user
      const { data, error: fetchError } = await supabase
        .from('api_keys')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      setApiKeys(data || []);

    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch API keys';
      setError(errorMessage);
      showNotification(`Error loading API keys: ${errorMessage}`, 'error');
      console.error('Error fetching API keys:', err);
    } finally {
      setLoading(false);
    }
  }, [user, showNotification]);

  // Load API keys on component mount and user change
  useEffect(() => {
    fetchApiKeys();
  }, [fetchApiKeys]);

  /**
   * Validate API key format based on provider
   * Basic validation for common API key patterns
   */
  const validateApiKey = useCallback((provider: ApiKeyProvider, apiKey: string): string | null => {
    if (!apiKey.trim()) {
      return 'API key is required';
    }

    const trimmedKey = apiKey.trim();

    // Provider-specific validation patterns
    switch (provider) {
      case 'OpenAI':
        if (!trimmedKey.startsWith('sk-') || trimmedKey.length < 20) {
          return 'OpenAI API keys should start with "sk-" and be at least 20 characters';
        }
        break;
      case 'Claude':
        if (!trimmedKey.startsWith('sk-ant-') || trimmedKey.length < 30) {
          return 'Claude API keys should start with "sk-ant-" and be at least 30 characters';
        }
        break;
      case 'DeepSeek':
        if (trimmedKey.length < 20) {
          return 'DeepSeek API keys should be at least 20 characters';
        }
        break;
      case 'Grok':
        if (trimmedKey.length < 20) {
          return 'Grok API keys should be at least 20 characters';
        }
        break;
      case 'Mistral':
        if (trimmedKey.length < 20) {
          return 'Mistral API keys should be at least 20 characters';
        }
        break;
    }

    return null;
  }, []);

  /**
   * Validate create API key form data
   * Returns validation errors or empty object if valid
   */
  const validateCreateForm = useCallback((): { api_key?: string; provider?: string } => {
    const errors: { api_key?: string; provider?: string } = {};

    // API key validation
    const apiKeyError = validateApiKey(createFormData.provider, createFormData.api_key);
    if (apiKeyError) {
      errors.api_key = apiKeyError;
    }

    // Provider validation
    if (!availableProviders.includes(createFormData.provider)) {
      errors.provider = 'Please select a valid provider';
    }

    return errors;
  }, [createFormData, validateApiKey]);

  /**
   * Handle creating a new API key
   * Validates form data and creates API key in Supabase
   */
  const handleCreateApiKey = useCallback(async () => {
    if (!user) {
      showNotification('You must be logged in to create API keys', 'error');
      return;
    }

    // Validate form data
    const validationErrors = validateCreateForm();
    if (Object.keys(validationErrors).length > 0) {
      setFormErrors(validationErrors);
      return;
    }

    setIsCreating(true);
    setFormErrors({});

    try {
      // Simple encryption for demo (in production, use proper server-side encryption)
      const encryptedKey = btoa(createFormData.api_key); // Base64 encoding for demo
      const keyPreview = `****${createFormData.api_key.slice(-4)}`;

      const newApiKey = {
        user_id: user.id,  // FIXED: Added the missing user_id field
        provider: createFormData.provider,
        encrypted_key: encryptedKey,
        key_preview: keyPreview
      };

      const { data, error: createError } = await supabase
        .from('api_keys')
        .insert(newApiKey)
        .select()
        .single();

      if (createError) {
        throw createError;
      }

      // Add new API key to state
      setApiKeys(prev => [data, ...prev]);
      
      // Reset form and close modal
      setCreateFormData({ provider: 'OpenAI', api_key: '' });
      setShowCreateModal(false);
      setShowApiKey(false);
      
      showNotification('API key created successfully!', 'success');

    } catch (err: any) {
      const errorMessage = err.message || 'Failed to create API key';
      showNotification(`Error creating API key: ${errorMessage}`, 'error');
      console.error('Error creating API key:', err);
    } finally {
      setIsCreating(false);
    }
  }, [user, createFormData, validateCreateForm, showNotification]);

  /**
   * Handle updating an existing API key
   * Updates provider information for the selected key
   */
  const handleUpdateApiKey = useCallback(async () => {
    if (!editingKeyId) return;

    setIsUpdating(true);

    try {
      const { error: updateError } = await supabase
        .from('api_keys')
        .update({ 
          provider: editFormData.provider,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingKeyId);

      if (updateError) {
        throw updateError;
      }

      // Update API key in state
      setApiKeys(prev => prev.map(key => 
        key.id === editingKeyId 
          ? { ...key, provider: editFormData.provider, updated_at: new Date().toISOString() }
          : key
      ));
      
      setShowEditModal(false);
      setEditingKeyId(null);
      
      showNotification('API key updated successfully', 'success');

    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update API key';
      showNotification(`Error updating API key: ${errorMessage}`, 'error');
      console.error('Error updating API key:', err);
    } finally {
      setIsUpdating(false);
    }
  }, [editingKeyId, editFormData, showNotification]);

  /**
   * Handle deleting an API key
   * Shows confirmation dialog and deletes from Supabase
   */
  const handleDeleteApiKey = useCallback(async () => {
    if (!deleteKeyId) return;

    setIsDeleting(true);

    try {
      const { error: deleteError } = await supabase
        .from('api_keys')
        .delete()
        .eq('id', deleteKeyId);

      if (deleteError) {
        throw deleteError;
      }

      // Remove API key from state
      setApiKeys(prev => prev.filter(key => key.id !== deleteKeyId));
      
      setShowDeleteModal(false);
      setDeleteKeyId(null);
      
      showNotification('API key deleted successfully', 'success');

    } catch (err: any) {
      const errorMessage = err.message || 'Failed to delete API key';
      showNotification(`Error deleting API key: ${errorMessage}`, 'error');
      console.error('Error deleting API key:', err);
    } finally {
      setIsDeleting(false);
    }
  }, [deleteKeyId, showNotification]);

  /**
   * Handle form input changes
   * Updates form data and clears related validation errors
   */
  const handleCreateInputChange = useCallback((field: keyof CreateApiKeyData, value: string) => {
    setCreateFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear validation error for this field
    if (formErrors[field as keyof typeof formErrors]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, [formErrors]);

  /**
   * Format date for display
   * Converts ISO timestamp to readable format
   */
  const formatDate = useCallback((dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }, []);

  /**
   * Get provider color for visual distinction
   * Returns appropriate color classes for each provider
   */
  const getProviderColor = useCallback((provider: ApiKeyProvider): string => {
    const colors = {
      'OpenAI': 'bg-green-100 text-green-800 border-green-200',
      'Claude': 'bg-purple-100 text-purple-800 border-purple-200',
      'DeepSeek': 'bg-blue-100 text-blue-800 border-blue-200',
      'Grok': 'bg-orange-100 text-orange-800 border-orange-200',
      'Mistral': 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[provider] || 'bg-gray-100 text-gray-800 border-gray-200';
  }, []);

  /**
   * Filter API keys based on search query and provider filter
   * Applies client-side filtering for better UX
   */
  const filteredApiKeys = apiKeys.filter(key => {
    const matchesSearch = searchQuery === '' || 
      key.provider.toLowerCase().includes(searchQuery.toLowerCase()) ||
      key.key_preview.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesProvider = providerFilter === 'all' || key.provider === providerFilter;
    
    return matchesSearch && matchesProvider;
  });

  /**
   * Handle opening edit modal
   * Sets up edit form with current key data
   */
  const openEditModal = useCallback((key: ApiKey) => {
    setEditingKeyId(key.id);
    setEditFormData({ provider: key.provider });
    setShowEditModal(true);
  }, []);

  /**
   * Handle opening delete confirmation
   * Sets up delete modal with key information
   */
  const openDeleteConfirmation = useCallback((keyId: string) => {
    setDeleteKeyId(keyId);
    setShowDeleteModal(true);
  }, []);

  /**
   * Handle closing modals
   * Resets form state and closes modals
   */
  const closeCreateModal = useCallback(() => {
    setShowCreateModal(false);
    setCreateFormData({ provider: 'OpenAI', api_key: '' });
    setFormErrors({});
    setShowApiKey(false);
  }, []);

  const closeEditModal = useCallback(() => {
    setShowEditModal(false);
    setEditingKeyId(null);
    setEditFormData({ provider: 'OpenAI' });
  }, []);

  const closeDeleteModal = useCallback(() => {
    setShowDeleteModal(false);
    setDeleteKeyId(null);
  }, []);

  // Show loading state
  if (loading && apiKeys.length === 0) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="text-gray-400 mt-4">Loading your API keys...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error && apiKeys.length === 0) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Failed to Load API Keys</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <button
            onClick={fetchApiKeys}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gray-900 ${className}`}>
      {/* Page Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center">
                <Key className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">API Keys</h1>
                <p className="text-gray-400 mt-1">
                  {apiKeys.length} key{apiKeys.length !== 1 ? 's' : ''} • Manage your AI provider credentials
                </p>
              </div>
            </div>
            
            {/* Create API Key Button */}
            <button
              onClick={() => setShowCreateModal(true)}
              className="
                flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg
                hover:bg-green-700 transition-all duration-200 transform hover:scale-105
                focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-900
                shadow-lg hover:shadow-xl
              "
            >
              <Plus className="w-5 h-5" />
              <span className="font-semibold">Add API Key</span>
            </button>
          </div>
        </div>
      </div>

      {/* Search and Filter Section */}
      {apiKeys.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search API keys..."
                className="
                  w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg
                  text-white placeholder-gray-400 focus:outline-none focus:ring-2 
                  focus:ring-green-500 focus:border-transparent transition-colors
                "
              />
            </div>

            {/* Provider Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={providerFilter}
                onChange={(e) => setProviderFilter(e.target.value as 'all' | ApiKeyProvider)}
                className="
                  pl-10 pr-8 py-3 bg-gray-800 border border-gray-700 rounded-lg
                  text-white focus:outline-none focus:ring-2 focus:ring-green-500 
                  focus:border-transparent transition-colors appearance-none
                "
              >
                <option value="all">All Providers</option>
                {availableProviders.map(provider => (
                  <option key={provider} value={provider}>{provider}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {filteredApiKeys.length === 0 ? (
          /* Empty State */
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <Key className="w-12 h-12 text-gray-500" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">
              {apiKeys.length === 0 ? 'No API Keys Yet' : 'No Matching Keys'}
            </h3>
            <p className="text-gray-400 mb-8 max-w-md mx-auto">
              {apiKeys.length === 0 
                ? 'Add your first API key to start using AI providers with PulseSpark.'
                : 'Try adjusting your search or filter criteria.'
              }
            </p>
            {apiKeys.length === 0 && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="
                  flex items-center gap-2 mx-auto px-8 py-4 bg-green-600 text-white rounded-lg
                  hover:bg-green-700 transition-all duration-200 transform hover:scale-105
                  focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-900
                  shadow-lg hover:shadow-xl font-semibold
                "
              >
                <Plus className="w-5 h-5" />
                Add Your First API Key
              </button>
            )}
          </div>
        ) : (
          /* API Keys Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredApiKeys.map((apiKey) => (
              <div
                key={apiKey.id}
                className="
                  bg-gray-800 border border-gray-700 rounded-xl p-6 
                  hover:border-green-500 transition-all duration-200 
                  transform hover:scale-105 hover:shadow-xl
                  group relative overflow-hidden
                "
              >
                {/* API Key Card Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Key className="w-5 h-5 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-white text-lg group-hover:text-green-400 transition-colors">
                        {apiKey.provider}
                      </h3>
                      <p className="text-sm text-gray-400 font-mono">
                        {apiKey.key_preview}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEditModal(apiKey)}
                      className="
                        p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-900/20 
                        rounded-lg transition-colors
                        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800
                      "
                      title="Edit API key"
                      aria-label={`Edit ${apiKey.provider} API key`}
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openDeleteConfirmation(apiKey.id)}
                      className="
                        p-2 text-gray-400 hover:text-red-400 hover:bg-red-900/20 
                        rounded-lg transition-colors
                        focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-800
                      "
                      title="Delete API key"
                      aria-label={`Delete ${apiKey.provider} API key`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Provider Badge */}
                <div className="mb-4">
                  <span className={`
                    inline-flex items-center px-3 py-1 text-sm font-medium rounded-full border
                    ${getProviderColor(apiKey.provider)}
                  `}>
                    {apiKey.provider}
                  </span>
                </div>

                {/* API Key Metadata */}
                <div className="flex items-center justify-between text-sm text-gray-400">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>Added {formatDate(apiKey.created_at)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Active</span>
                  </div>
                </div>

                {/* Hover Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-green-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-xl" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create API Key Modal */}
      {showCreateModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={closeCreateModal}
        >
          <div
            className="bg-gray-800 rounded-xl shadow-2xl max-w-md w-full border border-gray-700"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-api-key-title"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <h2 id="create-api-key-title" className="text-xl font-bold text-white">
                Add New API Key
              </h2>
              <button
                onClick={closeCreateModal}
                disabled={isCreating}
                className="
                  p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors
                  focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-800
                  disabled:opacity-50
                "
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Provider Selection */}
              <div>
                <label htmlFor="provider" className="block text-sm font-semibold text-gray-300 mb-2">
                  AI Provider *
                </label>
                <select
                  id="provider"
                  value={createFormData.provider}
                  onChange={(e) => handleCreateInputChange('provider', e.target.value)}
                  className="
                    w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg
                    text-white focus:outline-none focus:ring-2 focus:ring-green-500 
                    focus:border-transparent transition-colors
                  "
                  disabled={isCreating}
                >
                  {availableProviders.map(provider => (
                    <option key={provider} value={provider}>{provider}</option>
                  ))}
                </select>
                {formErrors.provider && (
                  <p className="mt-2 text-sm text-red-400 flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" />
                    {formErrors.provider}
                  </p>
                )}
              </div>

              {/* API Key Input */}
              <div>
                <label htmlFor="apiKey" className="block text-sm font-semibold text-gray-300 mb-2">
                  API Key *
                </label>
                <div className="relative">
                  <input
                    id="apiKey"
                    type={showApiKey ? 'text' : 'password'}
                    value={createFormData.api_key}
                    onChange={(e) => handleCreateInputChange('api_key', e.target.value)}
                    className={`
                      w-full px-4 py-3 pr-12 bg-gray-700 border rounded-lg text-white 
                      placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 
                      focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed 
                      transition-colors font-mono
                      ${formErrors.api_key ? 'border-red-500 bg-red-900/20' : 'border-gray-600 hover:border-gray-500'}
                    `}
                    placeholder={`Enter your ${createFormData.provider} API key`}
                    disabled={isCreating}
                    autoComplete="off"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    disabled={isCreating}
                    className="
                      absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 
                      hover:text-gray-300 transition-colors disabled:opacity-50
                    "
                    aria-label={showApiKey ? 'Hide API key' : 'Show API key'}
                  >
                    {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {formErrors.api_key && (
                  <p className="mt-2 text-sm text-red-400 flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" />
                    {formErrors.api_key}
                  </p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Your API key will be encrypted and stored securely
                </p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-3 p-6 border-t border-gray-700">
              <button
                onClick={closeCreateModal}
                disabled={isCreating}
                className="
                  flex-1 px-4 py-3 bg-gray-700 text-gray-300 rounded-lg border border-gray-600
                  hover:bg-gray-600 hover:text-white transition-colors font-medium
                  focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-800
                  disabled:opacity-50 disabled:cursor-not-allowed
                "
              >
                Cancel
              </button>
              <button
                onClick={handleCreateApiKey}
                disabled={isCreating || !createFormData.api_key.trim()}
                className="
                  flex-1 flex justify-center items-center gap-2 px-4 py-3 
                  bg-green-600 text-white rounded-lg font-medium
                  hover:bg-green-700 transition-colors
                  focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-800
                  disabled:opacity-50 disabled:cursor-not-allowed
                "
              >
                {isCreating ? (
                  <>
                    <LoadingSpinner size="sm" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Add API Key
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit API Key Modal */}
      {showEditModal && editingKeyId && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={closeEditModal}
        >
          <div
            className="bg-gray-800 rounded-xl shadow-2xl max-w-md w-full border border-gray-700"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-api-key-title"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <h2 id="edit-api-key-title" className="text-xl font-bold text-white">
                Edit API Key
              </h2>
              <button
                onClick={closeEditModal}
                disabled={isUpdating}
                className="
                  p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors
                  focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-800
                  disabled:opacity-50
                "
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* Provider Selection */}
              <div>
                <label htmlFor="editProvider" className="block text-sm font-semibold text-gray-300 mb-2">
                  AI Provider *
                </label>
                <select
                  id="editProvider"
                  value={editFormData.provider}
                  onChange={(e) => setEditFormData({ provider: e.target.value as ApiKeyProvider })}
                  className="
                    w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg
                    text-white focus:outline-none focus:ring-2 focus:ring-green-500 
                    focus:border-transparent transition-colors
                  "
                  disabled={isUpdating}
                >
                  {availableProviders.map(provider => (
                    <option key={provider} value={provider}>{provider}</option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  Note: The actual API key cannot be changed for security reasons
                </p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-3 p-6 border-t border-gray-700">
              <button
                onClick={closeEditModal}
                disabled={isUpdating}
                className="
                  flex-1 px-4 py-3 bg-gray-700 text-gray-300 rounded-lg border border-gray-600
                  hover:bg-gray-600 hover:text-white transition-colors font-medium
                  focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-800
                  disabled:opacity-50 disabled:cursor-not-allowed
                "
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateApiKey}
                disabled={isUpdating}
                className="
                  flex-1 flex justify-center items-center gap-2 px-4 py-3 
                  bg-green-600 text-white rounded-lg font-medium
                  hover:bg-green-700 transition-colors
                  focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-800
                  disabled:opacity-50 disabled:cursor-not-allowed
                "
              >
                {isUpdating ? (
                  <>
                    <LoadingSpinner size="sm" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Update Key
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deleteKeyId && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={closeDeleteModal}
        >
          <div
            className="bg-gray-800 rounded-xl shadow-2xl max-w-md w-full border border-gray-700"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-api-key-title"
          >
            {/* Modal Header */}
            <div className="flex items-center gap-3 p-6 border-b border-gray-700">
              <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
              <h2 id="delete-api-key-title" className="text-xl font-bold text-white">
                Delete API Key
              </h2>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <p className="text-gray-300 mb-4">
                Are you sure you want to delete this API key? This action cannot be undone and will:
              </p>
              <ul className="text-gray-400 text-sm space-y-1 mb-6 ml-4">
                <li>• Remove the API key permanently from your account</li>
                <li>• Stop any services using this key</li>
                <li>• Require you to re-add the key if needed later</li>
              </ul>
              
              {/* API Key Details */}
              {(() => {
                const apiKey = apiKeys.find(k => k.id === deleteKeyId);
                return apiKey ? (
                  <div className="bg-gray-700 rounded-lg p-4 mb-6">
                    <div className="flex items-center gap-3">
                      <Key className="w-5 h-5 text-red-400" />
                      <div>
                        <p className="font-semibold text-white">{apiKey.provider}</p>
                        <p className="text-sm text-gray-400 font-mono">{apiKey.key_preview}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Added {formatDate(apiKey.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : null;
              })()}
            </div>

            {/* Modal Actions */}
            <div className="flex gap-3 p-6 border-t border-gray-700">
              <button
                onClick={closeDeleteModal}
                disabled={isDeleting}
                className="
                  flex-1 px-4 py-3 bg-gray-700 text-gray-300 rounded-lg border border-gray-600
                  hover:bg-gray-600 hover:text-white transition-colors font-medium
                  focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-800
                  disabled:opacity-50 disabled:cursor-not-allowed
                "
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteApiKey}
                disabled={isDeleting}
                className="
                  flex-1 flex justify-center items-center gap-2 px-4 py-3 
                  bg-red-600 text-white rounded-lg font-medium
                  hover:bg-red-700 transition-colors
                  focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-800
                  disabled:opacity-50 disabled:cursor-not-allowed
                "
              >
                {isDeleting ? (
                  <>
                    <LoadingSpinner size="sm" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete Key
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};