import React, { useState } from 'react';
import { Settings, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { SUPABASE_CONFIG, APP_CONFIG } from '../../lib/config';

/**
 * DebugPanel Component
 * 
 * Development tool to check environment variables and Supabase connection
 */
export const DebugPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showKeys, setShowKeys] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [error, setError] = useState<string | null>(null);

  // Test Supabase connection
  const testConnection = async () => {
    setConnectionStatus('checking');
    setError(null);
    
    try {
      const { data, error } = await supabase.from('api_keys').select('count').limit(1);
      if (error) throw error;
      setConnectionStatus('connected');
    } catch (err: any) {
      setConnectionStatus('error');
      setError(err.message);
    }
  };

  // Environment variables to check
  const envVars = {
    'VITE_SUPABASE_URL': import.meta.env.VITE_SUPABASE_URL,
    'VITE_SUPABASE_ANON_KEY': import.meta.env.VITE_SUPABASE_ANON_KEY,
    'VITE_APP_NAME': import.meta.env.VITE_APP_NAME,
    'VITE_FRONTEND_URL': import.meta.env.VITE_FRONTEND_URL,
    'NODE_ENV': import.meta.env.NODE_ENV,
    'MODE': import.meta.env.MODE,
    'PROD': import.meta.env.PROD,
    'DEV': import.meta.env.DEV
  };

  const maskValue = (value: string, show: boolean) => {
    if (!value) return 'Not set';
    if (show) return value;
    return value.substring(0, 8) + '...';
  };

  const getStatusIcon = (value: any) => {
    return value ? (
      <CheckCircle className="w-4 h-4 text-green-500" />
    ) : (
      <XCircle className="w-4 h-4 text-red-500" />
    );
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 p-3 bg-gray-800 text-white rounded-full shadow-lg hover:bg-gray-700 transition-colors z-50"
        title="Open debug panel"
      >
        <Settings className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Debug Panel</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          ×
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* App Info */}
        <div>
          <h4 className="font-medium text-gray-900 mb-2">App Information</h4>
          <div className="text-sm space-y-1">
            <div>Name: {APP_CONFIG.NAME}</div>
            <div>Version: {APP_CONFIG.VERSION}</div>
            <div>Environment: {APP_CONFIG.ENVIRONMENT}</div>
          </div>
        </div>

        {/* Supabase Connection */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-gray-900">Supabase Connection</h4>
            <button
              onClick={testConnection}
              className="text-sm bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
            >
              Test
            </button>
          </div>
          <div className="flex items-center gap-2 text-sm">
            {connectionStatus === 'checking' && <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />}
            {connectionStatus === 'connected' && <CheckCircle className="w-4 h-4 text-green-500" />}
            {connectionStatus === 'error' && <XCircle className="w-4 h-4 text-red-500" />}
            <span className={
              connectionStatus === 'connected' ? 'text-green-600' :
              connectionStatus === 'error' ? 'text-red-600' :
              'text-gray-600'
            }>
              {connectionStatus === 'checking' ? 'Testing...' :
               connectionStatus === 'connected' ? 'Connected' :
               'Connection failed'}
            </span>
          </div>
          {error && (
            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
              {error}
            </div>
          )}
        </div>

        {/* Environment Variables */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-gray-900">Environment Variables</h4>
            <button
              onClick={() => setShowKeys(!showKeys)}
              className="text-sm text-gray-600 hover:text-gray-800 flex items-center gap-1"
            >
              {showKeys ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              {showKeys ? 'Hide' : 'Show'}
            </button>
          </div>
          <div className="space-y-2 text-xs">
            {Object.entries(envVars).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between">
                <span className="font-mono text-gray-600">{key}:</span>
                <div className="flex items-center gap-2">
                  {getStatusIcon(value)}
                  <span className="font-mono text-gray-800 max-w-32 truncate">
                    {maskValue(value || '', showKeys)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h4 className="font-medium text-gray-900 mb-2">Quick Actions</h4>
          <div className="space-y-2">
            <button
              onClick={() => {
                console.log('Environment Variables:', envVars);
                console.log('Supabase Config:', SUPABASE_CONFIG);
              }}
              className="w-full text-left text-sm bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded"
            >
              Log to Console
            </button>
            <button
              onClick={() => window.location.reload()}
              className="w-full text-left text-sm bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded"
            >
              Reload Page
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};