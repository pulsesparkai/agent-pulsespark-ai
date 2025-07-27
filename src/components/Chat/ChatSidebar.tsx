import React, { useState, useCallback } from 'react';
import { Plus, MessageSquare, Clock, User } from 'lucide-react';

// Type definitions for chat session data
interface ChatSession {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
  avatar?: string;
  isActive?: boolean;
}

interface ChatSidebarProps {
  selectedChatId?: string;
  onChatSelect?: (chatId: string) => void;
  onNewChat?: () => void;
  className?: string;
}

/**
 * ChatSidebar Component
 * 
 * A vertical sidebar for managing chat sessions with PulseSpark branding.
 * Features chat session list, new chat creation, and responsive design.
 * Provides clean navigation between different chat conversations.
 */
export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  selectedChatId,
  onChatSelect,
  onNewChat,
  className = ''
}) => {
  // Sample chat sessions data - replace with actual data from context/API
  const [chatSessions] = useState<ChatSession[]>([
    {
      id: '1',
      title: 'React Project Help',
      lastMessage: 'How do I implement useEffect for data fetching?',
      timestamp: new Date(Date.now() - 300000), // 5 minutes ago
      isActive: true
    },
    {
      id: '2',
      title: 'API Integration',
      lastMessage: 'Thanks for the help with the REST API setup!',
      timestamp: new Date(Date.now() - 3600000), // 1 hour ago
    },
    {
      id: '3',
      title: 'Database Design',
      lastMessage: 'What\'s the best approach for user authentication?',
      timestamp: new Date(Date.now() - 7200000), // 2 hours ago
    },
    {
      id: '4',
      title: 'UI Components',
      lastMessage: 'Can you help me style this button component?',
      timestamp: new Date(Date.now() - 86400000), // 1 day ago
    },
    {
      id: '5',
      title: 'Deployment Issues',
      lastMessage: 'The build is failing on production...',
      timestamp: new Date(Date.now() - 172800000), // 2 days ago
    },
    {
      id: '6',
      title: 'Performance Optimization',
      lastMessage: 'How can I improve my app\'s loading speed?',
      timestamp: new Date(Date.now() - 259200000), // 3 days ago
    }
  ]);

  /**
   * Format timestamp for display
   * Converts timestamps to human-readable relative time format
   */
  const formatTimestamp = (timestamp: Date): string => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) { // Less than 24 hours
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours}h ago`;
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      if (days === 1) {
        return 'Yesterday';
      } else if (days < 7) {
        return `${days} days ago`;
      } else {
        return timestamp.toLocaleDateString();
      }
    }
  };

  /**
   * Handle chat session selection
   * Calls parent callback with selected chat ID
   */
  const handleChatSelect = useCallback((chatId: string) => {
    if (onChatSelect) {
      onChatSelect(chatId);
    }
  }, [onChatSelect]);

  /**
   * Handle new chat creation
   * Calls parent callback to create new chat session
   */
  const handleNewChat = useCallback(() => {
    if (onNewChat) {
      onNewChat();
    }
  }, [onNewChat]);

  /**
   * Truncate message text for display
   * Limits message preview to reasonable length
   */
  const truncateMessage = (message: string, maxLength: number = 60): string => {
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength).trim() + '...';
  };

  /**
   * Get avatar display for chat session
   * Returns user initials or avatar image
   */
  const getAvatarDisplay = (session: ChatSession) => {
    if (session.avatar) {
      return (
        <img
          src={session.avatar}
          alt={`${session.title} avatar`}
          className="w-full h-full object-cover"
        />
      );
    }
    
    // Generate initials from title
    const initials = session.title
      .split(' ')
      .map(word => word[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
    
    return (
      <span className="text-sm font-medium text-white">
        {initials}
      </span>
    );
  };

  return (
    <aside 
      className={`
        bg-white shadow-md border-r border-gray-200 flex flex-col
        ${className}
      `}
      style={{ width: '280px' }}
      role="navigation"
      aria-label="Chat sessions navigation"
    >
      {/* Sidebar Header - PulseSpark branding and new chat button */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-green-600" />
            <h2 className="text-lg font-semibold text-gray-900">Chats</h2>
          </div>
          
          {/* Chat Sessions Count */}
          <span className="text-sm text-gray-500 bg-gray-200 px-2 py-1 rounded-full">
            {chatSessions.length}
          </span>
        </div>

        {/* New Chat Button - PulseSpark green styling */}
        <button
          onClick={handleNewChat}
          className="
            w-full flex items-center justify-center gap-2 py-3 px-4
            bg-gradient-to-r from-green-600 to-green-700 
            hover:from-green-500 hover:to-green-600
            text-white font-semibold rounded-lg shadow-sm
            transform transition-all duration-200 
            hover:scale-[1.02] hover:shadow-md
            focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2
            active:scale-[0.98]
          "
          aria-label="Start new chat conversation"
        >
          <Plus className="w-4 h-4" />
          <span>New Chat</span>
        </button>
      </div>

      {/* Chat Sessions List - Scrollable container */}
      <nav 
        className="flex-1 overflow-y-auto py-2"
        role="list"
        aria-label="Chat sessions list"
      >
        {chatSessions.length > 0 ? (
          <ul className="space-y-1 px-2">
            {chatSessions.map((session) => {
              const isSelected = selectedChatId === session.id;
              
              return (
                <li key={session.id} role="listitem">
                  <button
                    onClick={() => handleChatSelect(session.id)}
                    className={`
                      w-full flex items-start gap-3 p-3 rounded-lg text-left
                      transition-all duration-200 focus:outline-none focus:ring-2 
                      focus:ring-green-500 focus:ring-offset-1
                      ${isSelected 
                        ? 'bg-green-100 text-green-800 border-r-4 border-green-600' 
                        : 'text-gray-700 hover:bg-green-50 hover:text-green-700'
                      }
                    `}
                    aria-selected={isSelected}
                    aria-label={`Chat: ${session.title}. Last message: ${session.lastMessage}. ${formatTimestamp(session.timestamp)}`}
                  >
                    {/* Chat Avatar */}
                    <div className={`
                      flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center
                      ${isSelected 
                        ? 'bg-green-600' 
                        : 'bg-gradient-to-br from-gray-400 to-gray-500'
                      }
                    `}>
                      {getAvatarDisplay(session)}
                    </div>

                    {/* Chat Content */}
                    <div className="flex-1 min-w-0">
                      {/* Chat Title */}
                      <h3 className={`
                        text-sm font-semibold mb-1 truncate
                        ${isSelected ? 'text-green-800' : 'text-gray-900'}
                      `}>
                        {session.title}
                      </h3>

                      {/* Last Message Preview */}
                      <p className={`
                        text-xs mb-1 line-clamp-2 leading-relaxed
                        ${isSelected ? 'text-green-700' : 'text-gray-600'}
                      `}>
                        {truncateMessage(session.lastMessage)}
                      </p>

                      {/* Timestamp */}
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-gray-400" />
                        <span className={`
                          text-xs
                          ${isSelected ? 'text-green-600' : 'text-gray-500'}
                        `}>
                          {formatTimestamp(session.timestamp)}
                        </span>
                      </div>
                    </div>

                    {/* Active Indicator */}
                    {isSelected && (
                      <div className="flex-shrink-0 w-2 h-2 bg-green-600 rounded-full mt-2" />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          // Empty State - No chat sessions
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <MessageSquare className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Chats Yet</h3>
            <p className="text-sm text-gray-600 mb-4">
              Start your first conversation with the AI assistant
            </p>
            <button
              onClick={handleNewChat}
              className="
                flex items-center gap-2 px-4 py-2 bg-green-600 text-white 
                rounded-lg hover:bg-green-700 transition-colors
                focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2
              "
            >
              <Plus className="w-4 h-4" />
              Start Chatting
            </button>
          </div>
        )}
      </nav>

      {/* Sidebar Footer - Optional branding or status */}
      <div className="flex-shrink-0 p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span>AI Assistant Online</span>
        </div>
      </div>
    </aside>
  );
};

export default ChatSidebar;