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
      {/* Main Header Bar - Fixed positioning with PulseSpark styling */}
      <header className={`h-16 bg-gray-800 border-b border-gray-700 ${className}`}>
        <div className="flex items-center justify-between px-6 h-full">
          
          {/* Left Section - Logo and Mobile Menu */}
          <div className="flex items-center gap-4">
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

            {/* PulseSpark Logo - Clickable brand identifier */}
            <div
              onClick={handleLogoClick}
              className="
                rounded-lg w-10 h-10 bg-gradient-to-br from-green-600 to-green-700
                flex items-center justify-center font-bold text-white
                hover:from-green-500 hover:to-green-600 transition-all duration-200
                transform hover:scale-105 focus:outline-none focus:ring-2 
                focus:ring-green-500 focus:ring-offset-2
              "
              aria-label="PulseSpark - Go to dashboard"
            >
              PS
            </div>

            {/* Brand Text - Hidden on very small screens */}
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold text-white">PulseSpark</h1>
              <p className="text-xs text-gray-400 -mt-1">AI Agent Platform</p>
            </div>
          </div>

          {/* Center Section - Search Input (Desktop) */}
          <div className="hidden md:block flex-1 max-w-md mx-8">
            <form onSubmit={handleSearchSubmit} className="relative">
              <div className="relative">
                {/* Search Icon */}
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                
                {/* Search Input */}
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="
                    block w-full pl-10 pr-4 py-2 border border-gray-600 rounded-md
                    text-white placeholder-gray-400 bg-gray-700
                    focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent
                    hover:border-gray-500 transition-colors
                  "
                  placeholder="Search projects, chats..."
                  aria-label="Search projects and chats"
                />
              </div>
            </form>
          </div>

          {/* Right Section - Search Toggle (Mobile) and User Menu */}
          <div className="flex items-center gap-3">
            {/* Mobile Search Toggle Button */}
            <button
              onClick={toggleMobileSearch}
              className="p-2 text-gray-400 hover:text-white md:hidden transition-colors rounded-md hover:bg-gray-700"
              aria-label="Toggle search"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* User Avatar and Dropdown Menu */}
            <div className="relative" ref={userMenuRef}>
              {/* User Avatar Button */}
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="
                  flex items-center gap-2 p-1 rounded-full hover:bg-gray-700 
                  transition-colors focus:outline-none focus:ring-2 
                  focus:ring-green-500 focus:ring-offset-2
                "
                aria-label="User menu"
                aria-expanded={showUserMenu}
                aria-haspopup="true"
              >
                {/* Avatar Circle with Initials */}
                <div className="
                  w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-500 
                  rounded-full flex items-center justify-center text-white
                  text-sm font-medium
                ">
                  {getUserInitials()}
                </div>
                
                {/* User Email - Hidden on small screens */}
                <span className="hidden lg:block text-sm text-gray-300 font-medium">
                  {user?.email}
                </span>
              </button>

              {/* User Dropdown Menu */}
              {showUserMenu && (
                <div className="
                  absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg 
                  border border-gray-200 py-1 z-50
                ">
                  {/* Profile Menu Item */}
                  <button
                    onClick={() => handleMenuItemClick('profile')}
                    className="
                      flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-300 
                      hover:bg-gray-700 hover:text-white transition-colors text-left
                    "
                  >
                    <User className="w-4 h-4" />
                    Profile Settings
                  </button>

                  {/* Settings Menu Item */}
                  <button
                    onClick={() => handleMenuItemClick('settings')}
                    className="
                      flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-300 
                      hover:bg-gray-700 hover:text-white transition-colors text-left
                    "
                  >
                    <Settings className="w-4 h-4" />
                    Settings
                  </button>

                  {/* Divider */}
                  <div className="border-t border-gray-100 my-1" />

                  {/* Logout Menu Item */}
                  <button
                    onClick={() => handleMenuItemClick('logout')}
                    className="
                      flex items-center gap-3 w-full px-4 py-2 text-sm text-red-400 
                      hover:bg-red-900/20 hover:text-red-300 transition-colors text-left
                    "
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Search Overlay - Slides down from header on mobile */}
      {showMobileSearch && (
        <div 
          ref={mobileSearchRef}
          className="
            fixed top-16 left-0 right-0 z-40 bg-gray-800 border-b border-gray-700 
            shadow-md md:hidden
          "
        >
          <div className="px-6 py-4">
            <form onSubmit={handleSearchSubmit} className="relative">
              <div className="relative">
                {/* Mobile Search Icon */}
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                
                {/* Mobile Search Input */}
                <input
                  id="mobile-search-input"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="
                    block w-full pl-10 pr-12 py-3 border border-gray-600 rounded-md
                    text-white placeholder-gray-400 bg-gray-700
                    focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent
                  "
                  placeholder="Search projects, chats..."
                  aria-label="Search projects and chats"
                />
                
                {/* Close Mobile Search Button */}
                <button
                  type="button"
                  onClick={toggleMobileSearch}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white"
                  aria-label="Close search"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Spacer div to prevent content from hiding behind fixed header */}
      <div className="h-0" />
    </>
  );
};

export default AppHeader;