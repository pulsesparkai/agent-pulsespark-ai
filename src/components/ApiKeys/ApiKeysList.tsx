import React, { useState } from 'react';
import { useApiKeys } from '../../contexts/ApiKeysContext';
import { LoadingSpinner } from '../Shared/LoadingSpinner';
import { Trash2, Key, Calendar } from 'lucide-react';
import { ApiKey } from '../../types';

export const ApiKeysList: React.FC = () => {
  const { apiKeys, loading, deleteApiKey } = useApiKeys();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteApiKey(id);
    } catch (error) {
      // Error is handled in context
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  const getProviderColor = (provider: string) => {
    const colors: Record<string, string> = {
      'OpenAI': 'bg-green-100 text-green-800',
      'Claude': 'bg-purple-100 text-purple-800',
      'DeepSeek': 'bg-blue-100 text-blue-800',
      'Grok': 'bg-orange-100 text-orange-800',
      'Mistral': 'bg-red-100 text-red-800'
    };
    return colors[provider] || 'bg-gray-100 text-gray-800';
  };

  if (loading && apiKeys.length === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (apiKeys.length === 0) {
    return (
      <div className="text-center py-12">
        <Key className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No API Keys</h3>
        <p className="text-gray-600 mb-6">You haven't added any API keys yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {apiKeys.map((apiKey) => (
        <div
          key={apiKey.id}
          className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                <Key className="w-6 h-6 text-blue-600" />
              </div>
              
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-gray-900">{apiKey.provider}</h3>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getProviderColor(apiKey.provider)}`}>
                    {apiKey.provider}
                  </span>
                </div>
                
                <p className="text-gray-600 font-mono text-sm">
                  {apiKey.key_preview}
                </p>
                
                <div className="flex items-center gap-1 mt-2 text-sm text-gray-500">
                  <Calendar className="w-4 h-4" />
                  <span>Added {new Date(apiKey.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {confirmDeleteId === apiKey.id ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Are you sure?</span>
                  <button
                    onClick={() => handleDelete(apiKey.id)}
                    disabled={deletingId === apiKey.id}
                    className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50 transition-colors"
                  >
                    {deletingId === apiKey.id ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      'Delete'
                    )}
                  </button>
                  <button
                    onClick={() => setConfirmDeleteId(null)}
                    disabled={deletingId === apiKey.id}
                    className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400 disabled:opacity-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDeleteId(apiKey.id)}
                  disabled={deletingId !== null}
                  className="p-2 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
                  title="Delete API key"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};