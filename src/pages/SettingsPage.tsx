import React from 'react';
import { UserProfileSettings } from '../components/User/UserProfileSettings';

/**
 * SettingsPage Component
 * 
 * Main page for user settings and preferences
 */
export const SettingsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        <UserProfileSettings />
      </div>
    </div>
  );
};