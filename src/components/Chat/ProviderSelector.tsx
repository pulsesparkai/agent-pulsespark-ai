import React, { useState } from 'react';
import { ChevronDown, Check, Brain } from 'lucide-react';
import { ApiKeyProvider } from '../../types';
import { useApiKeys } from '../../contexts/ApiKeysContext';

interface ProviderSelectorProps {
  selectedProvider: ApiKeyProvider;
  onProviderChange: (provider: ApiKeyProvider) => void;
  disabled?: boolean;
}

/**
 * UPDATED: Provider information with colors and styling - Added DeepSeek-R1
 */
const PROVIDER_INFO: Record<ApiKeyProvider, { name: string; color: string; bgColor: string; icon?: React.ReactNode }> = {
  'OpenAI': { name: 'OpenAI', color: 'text-green-700', bgColor: 'bg-green-50' },
  'Claude': { name: 'Claude', color: 'text-purple-700', bgColor: 'bg-purple-50' },
  'DeepSeek': { name: 'DeepSeek V3', color: 'text-blue-700', bgColor: 'bg-blue-50' },
  'DeepSeek-R1': { name: 'DeepSeek R1', color: 'text-purple-700', bgColor: 'bg-purple-50', icon: <Brain className="w-3 h-3" /> },
  'Grok': { name: 'Grok', color: 'text-orange-700', bgColor: 'bg-orange-50' },
  'Mistral': { name: 'Mistral', color: 'text-red-700', bgColor: 'bg-red-50' }
};

/**
 * ProviderSelector Component
 * 
 * Dropdown selector for AI providers with visual indicators for availability.
 * Shows only providers that have configured API keys.
 */
export const ProviderSelector: React.FC<ProviderSelectorProps> = ({
  selectedProvider,
  onProviderChange,
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { apiKeys } = useApiKeys();

  // UPDATED: Get available providers - DeepSeek-R1 shows if DeepSeek key exists
  const configuredProviders = apiKeys.map(key => key.provider);
  const availableProviders: ApiKeyProvider[] = [];
  
  // Add providers based on configured keys
  configuredProviders.forEach(provider => {
    availableProviders.push(provider);
    // If DeepSeek is configured, also make DeepSeek-R1 available
    if (provider === 'DeepSeek' && !availableProviders.includes('DeepSeek-R1')) {
      availableProviders.push('DeepSeek-R1');
    }
  });

  const hasSelectedProviderKey = availableProviders.includes(selectedProvider);

  /**
   * Handle provider selection
   */
  const handleProviderSelect = (provider: ApiKeyProvider) => {
    onProviderChange(provider);
    setIsOpen(false);
  };

  // Show warning if no API keys are configured
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
      {/* Selector Button */}
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
        <div className="flex items-center gap-1">
          {selectedInfo.icon}
          <span className="text-sm font-medium">{selectedInfo.name}</span>
        </div>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg z-10">
          {availableProviders.map((provider) => {
            const info = PROVIDER_INFO[provider];
            const isSelected = selectedProvider === provider;
            
            return (
              <button
                key={provider}
                onClick={() => handleProviderSelect(provider)}
                className={`
                  w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-50 transition-colors
                  ${isSelected ? 'bg-blue-50' : ''}
                  first:rounded-t-lg last:rounded-b-lg
                `}
              >
                <div className={`w-2 h-2 rounded-full ${info.bgColor} ${info.color}`} />
                <div className="flex items-center gap-1 flex-1">
                  {info.icon}
                  <span className="text-sm font-medium">{info.name}</span>
                  {provider === 'DeepSeek-R1' && (
                    <span className="text-xs text-purple-600">🧠 Reasoning</span>
                  )}
                </div>
                {isSelected && <Check className="w-4 h-4 text-blue-600" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};