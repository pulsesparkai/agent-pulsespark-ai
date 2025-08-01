import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Home, Key, FolderOpen, Settings, LogOut, X, MessageSquare, Code, Brain, BarChart3 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useErrorHandler } from '../../hooks/useErrorHandler';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SidebarNavigation: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { signOut } = useAuth();
  const { handleError, handleSuccess } = useErrorHandler();

  const menuItems = [
    { icon: Home, label: 'Dashboard', path: '/dashboard' },
    { icon: MessageSquare, label: 'AI Chat', path: '/chat' },
    { icon: FolderOpen, label: 'Projects', path: '/projects' },
    { icon: Brain, label: 'Memory Bank', path: '/memory' },
    { icon: Key, label: 'API Keys', path: '/api-keys' },
    { icon: BarChart3, label: 'Feedback', path: '/feedback' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  const handleSignOut = async () => {
    try {
      await signOut();
      handleSuccess('Successfully signed out');
    } catch (error) {
      handleError(error, 'Sign out');
    }
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar - Fix height to extend full screen */}
      <div className={`
        fixed top-0 left-0 h-screen bg-gray-800 shadow-lg z-50 transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:shadow-none
        w-64 flex flex-col
      `}>
        
        {/* Header Section - PulseSpark branding */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">PS</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">PulseSpark</h1>
              <p className="text-xs text-gray-400">AI Platform</p>
            </div>
          </div>
          
          {/* Close button for mobile */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 text-gray-400 hover:text-white lg:hidden"
          >
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white lg:hidden transition-colors rounded-md hover:bg-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </button>
        </div>

        {/* Navigation Menu - Takes remaining space */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    onClick={onClose}
                    className={`
                      flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                      ${isActive 
                        ? 'bg-green-600 text-white' 
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                      }
                    `}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Sign Out Button - Fixed at bottom */}
        <div className="p-3 border-t border-gray-700">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-gray-300 hover:bg-red-600 hover:text-white transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </>
  );
};