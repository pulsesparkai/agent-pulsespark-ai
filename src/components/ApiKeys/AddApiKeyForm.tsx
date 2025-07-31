import React, { useState } from 'react';
import { useApiKeys } from '../../contexts/ApiKeysContext';
import { useNotification } from '../../contexts/NotificationContext';
import { LoadingSpinner } from '../Shared/LoadingSpinner';
import { X, Eye, EyeOff, Brain } from 'lucide-react';
import { ApiKeyProvider } from '../../types';

interface AddApiKeyFormProps {
  isOpen: boolean;
  onClose: () => void;
}

// UPDATED: Added DeepSeek-R1 to the providers list
const PROVIDERS: { value: ApiKeyProvider; label: string; note?: string }[] = [
  { value: 'OpenAI', label: 'OpenAI' },
  { value: 'Claude', label: 'Claude' },
  { value: 'DeepSeek', label: 'DeepSeek V3', note: 'Fast general chat' },
  { value: 'DeepSeek-R1', label: 'DeepSeek R1', note: '🧠 Advanced reasoning (uses same API key as DeepSeek)' },
  { value: 'Grok', label: 'Grok' },
  { value: 'Mistral', label: 'Mistral' }
];

export const AddApiKeyForm: React.FC<AddApiKeyFormProps> = ({ isOpen, onClose }) => {
  const [provider, setProvider] = useState<ApiKeyProvider>('OpenAI');
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { addApiKey } = useApiKeys();
  const { showNotification } = useNotification();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!provider || !apiKey.trim()) {
      showNotification('Please fill in all fields', 'error');
      return;
    }

    if (apiKey.length < 10) {
      showNotification('API key seems too short', 'error');
      return;
    }

    // Special handling for DeepSeek-R1 - store as DeepSeek
    const actualProvider = provider === 'DeepSeek-R1' ? 'DeepSeek' : provider;

    setIsSubmitting(true);
    try {
      await addApiKey({
        provider: actualProvider,
        api_key: apiKey
      });
      
      if (provider === 'DeepSeek-R1') {
        showNotification('DeepSeek API key added! This enables both DeepSeek V3 and DeepSeek R1 models.', 'success');
      }
      
      // Reset form
      setProvider('OpenAI');
      setApiKey('');
      setShowApiKey(false);
      onClose();
    } catch (error) {
      // Error is already handled in the context
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setProvider('OpenAI');
      setApiKey('');
      setShowApiKey(false);
      onClose();
    }
  };

  if (!isOpen) return null;

  const selectedProvider = PROVIDERS.find(p => p.value === provider);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-screen overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Add API Key</h2>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label htmlFor="provider" className="block text-sm font-medium text-gray-700 mb-2">
              Provider
            </label>
            <select
              id="provider"
              value={provider}
              onChange={(e) => setProvider(e.target.value as ApiKeyProvider)}
              disabled={isSubmitting}
              className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors disabled:opacity-50"
            >
              {PROVIDERS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
            {/* NEW: Show provider note */}
            {selectedProvider?.note && (
              <p className="mt-2 text-sm text-gray-500 flex items-center gap-1">
                {provider === 'DeepSeek-R1' && <Brain className="w-4 h-4" />}
                {selectedProvider.note}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-2">
              API Key
              {provider === 'DeepSeek-R1' && (
                <span className="text-purple-600 font-normal"> (Use your DeepSeek API key)</span>
              )}
            </label>
            <div className="relative">
              <input
                id="apiKey"
                type={showApiKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                disabled={isSubmitting}
                className="block w-full px-3 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors disabled:opacity-50"
                placeholder={
                  provider === 'DeepSeek-R1' 
                    ? "Enter your DeepSeek API key (enables both V3 and R1)"
                    : "Enter your API key"
                }
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                disabled={isSubmitting}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
              >
                {showApiKey ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            <p className="mt-2 text-sm text-gray-500">
              {provider === 'DeepSeek-R1' 
                ? 'Your DeepSeek API key will enable both fast chat (V3) and advanced reasoning (R1) models.'
                : 'Your API key will be encrypted and stored securely.'
              }
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!apiKey.trim() || isSubmitting}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <LoadingSpinner size="sm" />
                  Adding...
                </>
              ) : (
                'Add API Key'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};