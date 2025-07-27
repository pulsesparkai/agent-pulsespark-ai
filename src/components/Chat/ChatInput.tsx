import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { ProviderSelector } from './ProviderSelector';
import { useChat } from '../../contexts/ChatContext';
import { useApiKeys } from '../../contexts/ApiKeysContext';

export const ChatInput: React.FC = () => {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const { 
    sendMessage, 
    loading, 
    selectedProvider, 
    setSelectedProvider 
  } = useChat();
  const { apiKeys } = useApiKeys();

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim() || loading) return;

    const message = input.trim();
    setInput('');
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    await sendMessage(message);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const hasApiKey = apiKeys.some(key => key.provider === selectedProvider);
  const canSubmit = input.trim() && !loading && hasApiKey;

  return (
    <div className="border-t border-gray-200 bg-white p-4">
      <div className="max-w-4xl mx-auto">
        {/* Provider Selector */}
        <div className="mb-3">
          <ProviderSelector
            selectedProvider={selectedProvider}
            onProviderChange={setSelectedProvider}
            disabled={loading}
          />
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="flex gap-3 items-end">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                hasApiKey 
                  ? "Type your message... (Enter to send, Shift+Enter for new line)"
                  : `Add a ${selectedProvider} API key to start chatting`
              }
              disabled={loading || !hasApiKey}
              className={`
                w-full px-4 py-3 border rounded-lg resize-none transition-colors
                min-h-12 max-h-32 overflow-y-auto
                ${hasApiKey
                  ? 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                  : 'border-red-300 bg-red-50 text-red-700'
                }
                disabled:opacity-50 disabled:cursor-not-allowed
                focus:outline-none
              `}
              rows={1}
            />
            
            {!hasApiKey && (
              <div className="absolute inset-x-0 -bottom-6">
                <p className="text-xs text-red-600">
                  Configure a {selectedProvider} API key in settings to continue
                </p>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={!canSubmit}
            className={`
              flex items-center justify-center w-12 h-12 rounded-lg transition-colors
              ${canSubmit
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }
            `}
            title={canSubmit ? 'Send message' : 'Enter a message to send'}
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
};