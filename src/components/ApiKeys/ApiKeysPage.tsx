import React, { useState } from 'react';
import { ApiKeysList } from './ApiKeysList';
import { AddApiKeyForm } from './AddApiKeyForm';
import { Plus, RefreshCw } from 'lucide-react';
import { useApiKeys } from '../../contexts/ApiKeysContext';

export const ApiKeysPage: React.FC = () => {
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const { refreshApiKeys, loading } = useApiKeys();

  const handleRefresh = () => {
    refreshApiKeys();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">API Keys</h1>
          <p className="text-gray-600">Manage your API keys securely</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
            title="Refresh API keys"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          
          <button
            onClick={() => setIsAddFormOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add API Key
          </button>
        </div>
      </div>

      {/* API Keys List */}
      <ApiKeysList />

      {/* Add API Key Form Modal */}
      <AddApiKeyForm
        isOpen={isAddFormOpen}
        onClose={() => setIsAddFormOpen(false)}
      />
    </div>
  );
};