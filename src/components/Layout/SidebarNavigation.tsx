import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { 
  Home, 
  FolderOpen, 
  MessageSquare, 
  Key, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  X,
  Menu
} from 'lucide-react';

interface NavigationItem {
  id: string;
  label: string;
  path: string;
  icon: React.ComponentType<any>;
}

interface SidebarNavigationProps {
  isOpen?: boolean;
  onClose?: () => void;
  className?: string;
}

/**
 * SidebarNavigation Component
 * 
 * Fixed vertical navigation sidebar for agent.pulsespark.ai with PulseSpark branding.
 * Features collapsible design, responsive mobile drawer, and smooth animations.
 * Consistent green and white color scheme with proper accessibility support.
 */
export const SidebarNavigation: React.FC<SidebarNavigationProps> = ({
  isOpen = true,
  onClose,
  className = ''
}) => {
  // Navigation state management
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Navigation menu items with icons and paths
  const navigationItems: NavigationItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      path: '/dashboard',
      icon: Home
    },
    {
      id: 'projects',
     label: 'Projects',
     path: '/projects-list',
      icon: FolderOpen
    },
    {
      id: 'api-keys',
      label: 'API Keys',
      path: '/api-keys',
      icon: Key
    },
    {
      id: 'chat',
      label: 'Chat',
      path: '/chat',
      icon: MessageSquare
    },
    {
      id: 'api-keys',
      label: 'API Keys',
      path: '/api-keys',
      icon: Key
    },
    {
      id: 'settings',
      label: 'Settings',
      path: '/settings',
      icon: Settings
    }
  ];

  /**
   * Handle window resize to detect mobile breakpoint
   * Updates mobile state and manages sidebar behavior accordingly
   */
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024; // lg breakpoint
      setIsMobile(mobile);
      
      // Auto-collapse on mobile
      if (mobile) {
        setIsCollapsed(false); // Don't collapse on mobile, use drawer instead
      }
    };

    // Initial check
    handleResize();
    
    // Add resize listener
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  /**
   * Toggle sidebar collapse state
   * Only available on desktop view
   */
  const toggleCollapse = () => {
    if (!isMobile) {
      setIsCollapsed(!isCollapsed);
    }
  };

  /**
   * Handle mobile drawer close
   * Calls parent onClose callback if provided
   */
  const handleMobileClose = () => {
    if (onClose) {
      onClose();
    }
  };

  /**
   * Check if navigation item is currently active
   * Compares current location with item path
   */
  const isActiveItem = (path: string): boolean => {
    return location.pathname === path;
  };

  /**
   * Render navigation item with proper styling and states
   * Handles active, hover, and collapsed states
   */
  const renderNavigationItem = (item: NavigationItem) => {
    const Icon = item.icon;
    const isActive = isActiveItem(item.path);

    return (
      <li key={item.id}>
        <Link
          to={item.path}
          onClick={isMobile ? handleMobileClose : undefined}
          className={`
            flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2
            ${isActive 
              ? 'bg-green-100 text-green-700 font-semibold border-r-4 border-green-600' 
              : 'text-gray-700 hover:bg-green-50 hover:text-green-600'
            }
            ${isCollapsed && !isMobile ? 'justify-center px-2' : ''}
          `}
          title={isCollapsed && !isMobile ? item.label : undefined}
          aria-label={isCollapsed && !isMobile ? item.label : undefined}
        >
          {/* Navigation Icon */}
          <Icon className={`
            w-5 h-5 flex-shrink-0
            ${isActive ? 'text-green-600' : 'text-current'}
          `} />
          
          {/* Navigation Label - Hidden when collapsed on desktop */}
          {(!isCollapsed || isMobile) && (
            <span className="truncate">{item.label}</span>
          )}
        </Link>
      </li>
    );
  };

  // Mobile drawer overlay and sidebar
  if (isMobile) {
    return (
      <>
        {/* Mobile Overlay - Dark background when drawer is open */}
        {isOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={handleMobileClose}
            aria-hidden="true"
          />
        )}

        {/* Mobile Drawer - Slides in from left */}
        <aside
          className={`
            fixed top-0 left-0 h-full bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out
            ${isOpen ? 'translate-x-0' : '-translate-x-full'}
            lg:hidden w-72 ${className}
          `}
          aria-label="Main navigation"
        >
          {/* Mobile Header with Close Button */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              {/* PulseSpark Logo */}
              <div className="rounded-full w-10 h-10 bg-gradient-to-br from-green-600 to-green-700 flex items-center justify-center font-bold text-white">
                PS
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">PulseSpark</h2>
                <p className="text-xs text-gray-500">AI Agent Platform</p>
              </div>
            </div>
            
            {/* Close Button */}
            <button
              onClick={handleMobileClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
              aria-label="Close navigation menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Mobile Navigation Menu */}
          <nav className="flex-1 px-4 py-6" role="navigation">
            <ul className="space-y-2" role="list">
              {navigationItems.map(renderNavigationItem)}
            </ul>
          </nav>
        </aside>
      </>
    );
  }

  // Desktop sidebar
  return (
    <aside
      className={`
        fixed top-16 left-0 h-[calc(100vh-4rem)] bg-white shadow-lg border-r border-gray-200 z-30
        transition-all duration-300 ease-in-out
        ${isCollapsed ? 'w-20' : 'w-72'}
        ${className}
      `}
      aria-label="Main navigation"
    >
      <div className="flex flex-col h-full">
        {/* Desktop Header - Only show when not collapsed */}
        {!isCollapsed && (
          <div className="flex items-center gap-3 p-6 border-b border-gray-200">
            {/* PulseSpark Logo */}
            <div className="rounded-full w-10 h-10 bg-gradient-to-br from-green-600 to-green-700 flex items-center justify-center font-bold text-white">
              PS
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">PulseSpark</h2>
              <p className="text-xs text-gray-500">AI Agent Platform</p>
            </div>
          </div>
        )}

        {/* Collapsed Header - Show minimal logo when collapsed */}
        {isCollapsed && (
          <div className="flex justify-center p-4 border-b border-gray-200">
            <div className="rounded-full w-10 h-10 bg-gradient-to-br from-green-600 to-green-700 flex items-center justify-center font-bold text-white">
              PS
            </div>
          </div>
        )}

        {/* Desktop Navigation Menu */}
        <nav className="flex-1 px-4 py-6 overflow-y-auto" role="navigation">
          <ul className="space-y-2" role="list">
            {navigationItems.map(renderNavigationItem)}
          </ul>
        </nav>

        {/* Collapse Toggle Button - Desktop only */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={toggleCollapse}
            className={`
              flex items-center gap-3 w-full px-4 py-3 text-gray-600 hover:text-green-600 
              hover:bg-green-50 rounded-lg transition-colors focus:outline-none 
              focus:ring-2 focus:ring-green-500 focus:ring-offset-2
              ${isCollapsed ? 'justify-center px-2' : ''}
            `}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-expanded={!isCollapsed}
          >
            {/* Toggle Icon */}
            {isCollapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <>
                <ChevronLeft className="w-5 h-5" />
                <span className="text-sm font-medium">Collapse</span>
              </>
            )}
          </button>
        </div>
      </div>
    </aside>
  );
};

export default SidebarNavigation;