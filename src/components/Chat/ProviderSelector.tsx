import React, { useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { ApiKeyProvider } from '../../types';
import { useApiKeys } from '../../contexts/ApiKeysContext';

interface ProviderSelectorProps {
  selectedProvider: ApiKeyProvider;
  onProviderChange: (provider: ApiKeyProvider) => void;
  disabled?: boolean;
}

const PROVIDER_INFO: Record<ApiKeyProvider, { name: string; color: string; bgColor: string }> = {
  'OpenAI': { name: 'OpenAI', color: 'text-green-700', bgColor: 'bg-green-50' },
  'Claude': { name: 'Claude', color: 'text-purple-700', bgColor: 'bg-purple-50' },
  'DeepSeek': { name: 'DeepSeek', color: 'text-blue-700', bgColor: 'bg-blue-50' },
  'Grok': { name: 'Grok', color: 'text-orange-700', bgColor: 'bg-orange-50' },
  'Mistral': { name: 'Mistral', color: 'text-red-700', bgColor: 'bg-red-50' }
};

export const ProviderSelector: React.FC<ProviderSelectorProps> = ({
  selectedProvider,
  onProviderChange,
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { apiKeys } = useApiKeys();

  // Get available providers based on user's API keys
  const availableProviders = apiKeys.map(key => key.provider);
  const hasSelectedProviderKey = availableProviders.includes(selectedProvider);

  const handleProviderSelect = (provider: ApiKeyProvider) => {
    onProviderChange(provider);
    setIsOpen(false);
  };

  if (availableProviders.length === 0) {
    return (
      <div className="flex items-center px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
        <span className="text-sm text-amber-700">No API keys configured</span>
      </div>
    );
  }

  const selectedInfo = PROVIDER_INFO[selectedProvider];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          flex items-center gap-2 px-3 py-2 border rounded-lg transition-colors min-w-32
          ${disabled 
            ? 'bg-gray-50 text-gray-400 cursor-not-allowed' 
            : hasSelectedProviderKey
              ? 'bg-white border-gray-300 hover:border-gray-400 text-gray-700'
              : 'bg-red-50 border-red-300 text-red-700'
          }
        `}
      >
        <div className={`w-2 h-2 rounded-full ${selectedInfo.bgColor} ${selectedInfo.color}`} />
        <span className="text-sm font-medium">{selectedInfo.name}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
            <div className="py-1">
              {availableProviders.map((provider) => {
                const info = PROVIDER_INFO[provider];
                const isSelected = provider === selectedProvider;
                
                return (
                  <button
                    key={provider}
                    onClick={() => handleProviderSelect(provider)}
                    className={`
                      w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-50 transition-colors
                      ${isSelected ? 'bg-blue-50' : ''}
                    `}
                  >
                    <div className={`w-2 h-2 rounded-full ${info.bgColor} ${info.color}`} />
                    <span className="text-sm font-medium text-gray-900 flex-1">
                      {info.name}
                    </span>
                    {isSelected && (
                      <Check className="w-4 h-4 text-blue-600" />
                    )}
                  </button>
                );
              })}
            </div>
            
            {!hasSelectedProviderKey && (
              <div className="border-t border-gray-200 px-3 py-2">
                <p className="text-xs text-red-600">
                  No API key for {selectedInfo.name}
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};