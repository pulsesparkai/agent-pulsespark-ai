import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { ApiKeysContextType, ApiKey, CreateApiKeyRequest } from '../types';
import { encryptApiKey, getKeyPreview } from '../lib/encryption';
import { useAuth } from './AuthContext';
import { useNotification } from './NotificationContext';

const ApiKeysContext = createContext<ApiKeysContextType | undefined>(undefined);

export const useApiKeys = () => {
  const context = useContext(ApiKeysContext);
  if (context === undefined) {
    throw new Error('useApiKeys must be used within an ApiKeysProvider');
  }
  return context;
};

interface ApiKeysProviderProps {
  children: React.ReactNode;
}

export const ApiKeysProvider: React.FC<ApiKeysProviderProps> = ({ children }) => {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { showNotification } = useNotification();

  const refreshApiKeys = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      // Query api_keys table which references auth.users(id) via user_id foreign key
      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApiKeys(data || []);
    } catch (err: any) {
      setError(err.message);
      showNotification('Failed to load API keys', 'error');
    } finally {
      setLoading(false);
    }
  };

  const addApiKey = async (data: CreateApiKeyRequest) => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const encryptedKey = encryptApiKey(data.api_key);
      const keyPreview = getKeyPreview(data.api_key);

      const { error } = await supabase
        .from('api_keys')
        .insert({
          user_id: user.id,
          provider: data.provider,
          encrypted_key: encryptedKey,
          key_preview: keyPreview
        });

      if (error) throw error;

      showNotification('API key added successfully', 'success');
      await refreshApiKeys();
    } catch (err: any) {
      setError(err.message);
      showNotification('Failed to add API key', 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteApiKey = async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('api_keys')
        .delete()
        .eq('id', id);

      if (error) throw error;

      showNotification('API key deleted successfully', 'success');
      await refreshApiKeys();
    } catch (err: any) {
      setError(err.message);
      showNotification('Failed to delete API key', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      refreshApiKeys();
    } else {
      setApiKeys([]);
    }
  }, [user]);

  const value: ApiKeysContextType = {
    apiKeys,
    loading,
    error,
    addApiKey,
    deleteApiKey,
    refreshApiKeys
  };

  return (
    <ApiKeysContext.Provider value={value}>
      {children}
    </ApiKeysContext.Provider>
  );
};