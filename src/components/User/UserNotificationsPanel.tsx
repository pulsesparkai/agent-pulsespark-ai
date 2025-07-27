import React, { useState, useCallback } from 'react';
import { 
  CheckCircle, 
  AlertTriangle, 
  Info, 
  X, 
  Check, 
  Bell,
  Clock,
  User,
  Key,
  MessageSquare
} from 'lucide-react';

// Type definitions for notification data and management
interface Notification {
  id: string;
  type: 'success' | 'warning' | 'info';
  title: string;
  description: string;
  timestamp: Date;
  isRead: boolean;
  category?: 'system' | 'chat' | 'api' | 'project';
}

interface UserNotificationsPanelProps {
  isOpen?: boolean;
  onClose?: () => void;
  className?: string;
}

/**
 * UserNotificationsPanel Component
 * 
 * A dropdown notifications panel with PulseSpark branding featuring:
 * - Scrollable list of notifications with icons and timestamps
 * - Mark as read/unread functionality with visual indicators
 * - Categorized notifications with appropriate icons
 * - Clean, accessible design consistent with PulseSpark styling
 */
export const UserNotificationsPanel: React.FC<UserNotificationsPanelProps> = ({
  isOpen = true,
  onClose,
  className = ''
}) => {
  // Sample notifications data - replace with actual data from context/API
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'success',
      title: 'API Key Added Successfully',
      description: 'Your OpenAI API key has been securely stored and is ready to use.',
      timestamp: new Date(Date.now() - 300000), // 5 minutes ago
      isRead: false,
      category: 'api'
    },
    {
      id: '2',
      type: 'info',
      title: 'New Chat Session Started',
      description: 'You started a new conversation with the AI assistant.',
      timestamp: new Date(Date.now() - 900000), // 15 minutes ago
      isRead: false,
      category: 'chat'
    },
    {
      id: '3',
      type: 'warning',
      title: 'API Rate Limit Warning',
      description: 'You\'re approaching your monthly API usage limit for Claude.',
      timestamp: new Date(Date.now() - 3600000), // 1 hour ago
      isRead: true,
      category: 'api'
    },
    {
      id: '4',
      type: 'success',
      title: 'Project Saved',
      description: 'Your React project has been successfully saved to the cloud.',
      timestamp: new Date(Date.now() - 7200000), // 2 hours ago
      isRead: true,
      category: 'project'
    },
    {
      id: '5',
      type: 'info',
      title: 'Profile Updated',
      description: 'Your profile settings have been updated successfully.',
      timestamp: new Date(Date.now() - 86400000), // 1 day ago
      isRead: true,
      category: 'system'
    },
    {
      id: '6',
      type: 'warning',
      title: 'Security Alert',
      description: 'New login detected from a different device. Please verify if this was you.',
      timestamp: new Date(Date.now() - 172800000), // 2 days ago
      isRead: false,
      category: 'system'
    }
  ]);

  /**
   * Get the appropriate icon for notification type
   * Returns Lucide React icon component with proper styling
   */
  const getNotificationIcon = useCallback((type: Notification['type']) => {
    const iconClasses = "w-5 h-5 flex-shrink-0";
    
    switch (type) {
      case 'success':
        return <CheckCircle className={`${iconClasses} text-green-500`} />;
      case 'warning':
        return <AlertTriangle className={`${iconClasses} text-yellow-500`} />;
      case 'info':
      default:
        return <Info className={`${iconClasses} text-blue-500`} />;
    }
  }, []);

  /**
   * Get category icon for additional context
   * Returns small icon representing the notification category
   */
  const getCategoryIcon = useCallback((category?: Notification['category']) => {
    const iconClasses = "w-3 h-3 text-gray-400";
    
    switch (category) {
      case 'chat':
        return <MessageSquare className={iconClasses} />;
      case 'api':
        return <Key className={iconClasses} />;
      case 'project':
        return <User className={iconClasses} />;
      case 'system':
      default:
        return <Bell className={iconClasses} />;
    }
  }, []);

  /**
   * Format timestamp for display
   * Converts timestamps to human-readable relative time format
   */
  const formatTimestamp = useCallback((timestamp: Date): string => {
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
  }, []);

  /**
   * Handle marking a single notification as read/unread
   * Updates the notification state and provides visual feedback
   */
  const handleMarkAsRead = useCallback((notificationId: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, isRead: !notification.isRead }
          : notification
      )
    );
  }, []);

  /**
   * Handle marking all notifications as read
   * Updates all notifications to read state
   */
  const handleMarkAllAsRead = useCallback(() => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, isRead: true }))
    );
  }, []);

  /**
   * Handle notification click
   * Marks as read and can trigger additional actions
   */
  const handleNotificationClick = useCallback((notification: Notification) => {
    if (!notification.isRead) {
      handleMarkAsRead(notification.id);
    }
    
    // Here you could add navigation logic based on notification type/category
    console.log('Notification clicked:', notification);
  }, [handleMarkAsRead]);

  /**
   * Get count of unread notifications
   * Used for displaying unread count in header
   */
  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Don't render if panel is closed
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop overlay for mobile/tablet */}
      <div 
        className="fixed inset-0 z-40 bg-black bg-opacity-25 lg:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Notifications Panel Container */}
      <div 
        className={`
          fixed top-16 right-4 z-50 bg-white rounded-xl shadow-lg border border-gray-200
          max-w-md w-full max-h-96 flex flex-col
          ${className}
        `}
        role="dialog"
        aria-label="Notifications panel"
        aria-modal="true"
      >
        {/* Panel Header - Title, unread count, and close button */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                {unreadCount} new
              </span>
            )}
          </div>
          
          {/* Close button for mobile */}
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
              aria-label="Close notifications panel"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Mark All as Read Button */}
        {unreadCount > 0 && (
          <div className="px-4 py-2 border-b border-gray-100">
            <button
              onClick={handleMarkAllAsRead}
              className="
                flex items-center gap-2 text-sm text-green-600 hover:text-green-700 
                hover:bg-green-50 px-2 py-1 rounded transition-colors
                focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1
              "
            >
              <Check className="w-3 h-3" />
              Mark all as read
            </button>
          </div>
        )}

        {/* Notifications List - Scrollable container */}
        <div 
          className="flex-1 overflow-y-auto"
          style={{ maxHeight: '300px' }}
          role="list"
          aria-label="Notifications list"
        >
          {notifications.length > 0 ? (
            <ul className="divide-y divide-gray-100">
              {notifications.map((notification) => (
                <li 
                  key={notification.id}
                  role="listitem"
                >
                  <button
                    onClick={() => handleNotificationClick(notification)}
                    className={`
                      w-full text-left p-4 transition-colors duration-200
                      hover:bg-green-50 focus:bg-green-50 focus:outline-none
                      focus:ring-2 focus:ring-green-500 focus:ring-inset
                      ${!notification.isRead ? 'bg-blue-50' : ''}
                    `}
                    aria-label={`
                      ${notification.type} notification: ${notification.title}. 
                      ${notification.description}. 
                      ${formatTimestamp(notification.timestamp)}. 
                      ${notification.isRead ? 'Read' : 'Unread'}
                    `}
                  >
                    <div className="flex items-start gap-3">
                      {/* Notification Type Icon */}
                      <div className="flex-shrink-0 mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>

                      {/* Notification Content */}
                      <div className="flex-1 min-w-0">
                        {/* Title and Category */}
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className={`
                            text-sm font-semibold truncate
                            ${!notification.isRead ? 'text-gray-900' : 'text-gray-700'}
                          `}>
                            {notification.title}
                          </h4>
                          {getCategoryIcon(notification.category)}
                        </div>

                        {/* Description */}
                        <p className={`
                          text-sm mb-2 line-clamp-2 leading-relaxed
                          ${!notification.isRead ? 'text-gray-700' : 'text-gray-600'}
                        `}>
                          {notification.description}
                        </p>

                        {/* Timestamp and Read Status */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 text-xs text-gray-400">
                            <Clock className="w-3 h-3" />
                            <span>{formatTimestamp(notification.timestamp)}</span>
                          </div>
                          
                          {/* Unread Indicator */}
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-green-500 rounded-full" />
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            // Empty State - No notifications
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Bell className="w-8 h-8 text-gray-300" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Notifications</h3>
              <p className="text-sm text-gray-600">
                You're all caught up! New notifications will appear here.
              </p>
            </div>
          )}
        </div>

        {/* Panel Footer - Optional additional actions */}
        <div className="p-3 border-t border-gray-100 bg-gray-50 rounded-b-xl">
          <div className="text-center">
            <button
              className="text-xs text-gray-500 hover:text-green-600 transition-colors"
              onClick={() => console.log('View all notifications')}
            >
              View notification settings
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default UserNotificationsPanel;