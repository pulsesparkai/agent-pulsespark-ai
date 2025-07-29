import React, { useState } from 'react';
import { SidebarNavigation } from './SidebarNavigation';
import { AppHeader } from './AppHeader';

interface LayoutProps {
  children: React.ReactNode;
}

/**
 * Layout Component
 * 
 * Main layout wrapper with sidebar navigation and header
 */
export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-900 flex">
      {/* Sidebar */}
      <SidebarNavigation 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:ml-64">
        {/* Header */}
        <AppHeader onMenuClick={() => setSidebarOpen(true)} />
        
        {/* Page Content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
};