import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Menu, User, Settings, LogOut, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface AppHeaderProps {
  onMenuClick?: () => void;
  className?: string;
}

/**
 * AppHeader Component
 * 
 * Fixed top navigation bar for agent.pulsespark.ai with PulseSpark branding.
 * Features logo, search functionality, user menu, and responsive design.
 * Consistent green and white color scheme throughout.
 */
export const AppHeader: React.FC<AppHeaderProps> = ({ 
  onMenuClick, 
  className = '' 
}) => {
  // Navigation and authentication hooks
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  // State management for interactive elements
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Refs for click outside detection
  const userMenuRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);

  /**
   * Handle clicks outside dropdown menus to close them
   * Improves UX by allowing users to click anywhere to dismiss menus
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Close user menu if clicking outside
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      
      // Close mobile search if clicking outside
      if (mobileSearchRef.current && !mobileSearchRef.current.contains(event.target as Node)) {
        setShowMobileSearch(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /**
   * Handle logo click navigation
   * Routes user back to main dashboard
   */
  const handleLogoClick = () => {
    navigate('/dashboard');
  };

  /**
   * Handle search form submission
   * Placeholder for search functionality - can be connected to search API
   */
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      console.log('Searching for:', searchQuery);
      // TODO: Implement actual search functionality
      // navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  /**
   * Handle user menu item clicks
   * Navigation and actions for user dropdown menu
   */
  const handleMenuItemClick = async (action: string) => {
    setShowUserMenu(false);
    
    switch (action) {
      case 'profile':
        navigate('/profile-settings');
        break;
      case 'settings':
        navigate('/settings');
        break;
      case 'logout':
        try {
          await signOut();
          navigate('/');
        } catch (error) {
          console.error('Logout error:', error);
        }
        break;
    }
  };

  /**
   * Get user initials for avatar display
   * Extracts first letters from user's email or name
   */
  const getUserInitials = (): string => {
    if (!user?.email) return 'U';
    
    const email = user.email;
    const parts = email.split('@')[0].split('.');
    
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    
    return email.substring(0, 2).toUpperCase();
  };

  /**
   * Toggle mobile search visibility
   * Shows/hides search input on mobile devices
   */
  const toggleMobileSearch = () => {
    setShowMobileSearch(!showMobileSearch);
    if (!showMobileSearch) {
      // Focus search input when opening
      setTimeout(() => {
        const input = document.getElementById('mobile-search-input');
        input?.focus();
      }, 100);
    }
  };

  return (
    <>
      {/* Main Header Bar - Simplified without duplicate logo */}
      <header className={`h-14 bg-gray-800 border-b border-gray-700 ${className}`}>
        <div className="flex items-center justify-between px-4 h-full">
          
          {/* Left Section - Just mobile menu button */}
          <div className="flex items-center">
            {/* Mobile Menu Button - Only visible on small screens */}
            {onMenuClick && (
              <button
                onClick={onMenuClick}
                className="p-2 text-gray-400 hover:text-white lg:hidden transition-colors rounded-md hover:bg-gray-700"
                aria-label="Open navigation menu"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Center Section - Search Bar */}
          <div className="flex-1 max-w-2xl mx-4">
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search projects, chats..."
                className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </form>
          </div>

          {/* Right Section - User Menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
            >
              <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                {getUserInitials()}
              </div>
              <span className="hidden md:block text-sm">{user?.email?.split('@')[0]}</span>
            </button>

            {/* User Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-lg py-1 z-50">
                <button
                  onClick={() => handleMenuItemClick('profile')}
                  className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors text-left"
                >
                  <User className="w-4 h-4" />
                  Profile Settings
                </button>
                
                <button
                  onClick={() => handleMenuItemClick('settings')}
                  className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors text-left"
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </button>
                
                <div className="border-t border-gray-700 my-1" />
                
                <button
                  onClick={() => handleMenuItemClick('logout')}
                  className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-400 hover:bg-red-900/20 hover:text-red-300 transition-colors text-left"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Search Overlay - Only show if mobile search is active */}
      {showMobileSearch && (
        <div ref={mobileSearchRef} className="fixed top-14 left-0 right-0 z-40 bg-gray-800 border-b border-gray-700 shadow-md md:hidden">
          <div className="px-6 py-4">
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                id="mobile-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-12 py-3 border border-gray-600 rounded-md text-white placeholder-gray-400 bg-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Search projects, chats..."
              />
              <button
                type="button"
                onClick={toggleMobileSearch}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default AppHeader;