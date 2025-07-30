import React from 'react';
import { AlertCircle } from 'lucide-react';

interface PlaceholderPageProps {
  title?: string;
  message?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

/**
 * PlaceholderPage Component
 * 
 * Generic placeholder for pages under development
 */
export const PlaceholderPage: React.FC<PlaceholderPageProps> = ({
  title = "Page Under Development",
  message = "This page is currently being built. Check back soon!",
  icon: Icon = AlertCircle
}) => {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
          <Icon className="w-8 h-8 text-gray-400" />
        </div>
        
        <h1 className="text-2xl font-bold text-white mb-4">{title}</h1>
        <p className="text-gray-400 leading-relaxed">{message}</p>
        
        <div className="mt-8">
          <button
            onClick={() => window.history.back()}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
};