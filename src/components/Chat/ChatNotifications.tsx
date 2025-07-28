import React, { useState, useEffect, useCallback } from 'react';
import { X, MessageSquare, Bell, User, AlertCircle, CheckCircle, Info } from 'lucide-react';

// Type definitions for notification data and management
interface ChatNotification {
  id: string;
  type: 'message' | 'system' | 'success' | 'error' | 'info';
  sender: string;
  message: string;
  timestamp: Date;
  autoRemove?: boolean;
}

interface ChatNotificationsProps {
  notifications?: ChatNotification[];
  onNotificationClick?: (notification: ChatNotification) => void;
  onNotificationDismiss?: (notificationId: string) => void;
  autoRemoveDelay?: number;
  maxNotifications?: number;
  className?: string;
}

/**
 * ChatNotifications Component
 * 
 * A fixed-position notification system for chat messages and system alerts with PulseSpark branding.
 * Features auto-dismiss functionality, accessibility support, and smooth animations.
 * Positioned in bottom-right corner with stacked toast notifications.
 */
export const ChatNotifications: React.FC<ChatNotificationsProps> = ({
  notifications: externalNotifications,
  onNotificationClick,
  onNotificationDismiss,
  autoRemoveDelay = 5000,
  maxNotifications = 5,
  className = ''
}) => {
  // Internal notifications state - used when no external notifications provided
  const [internalNotifications, setInternalNotifications] = useState<ChatNotification[]>([
    {
      id: '1',
      type: 'message',
      sender: 'AI Assistant',
      message: 'Your code analysis is complete! Check the results in your project.',
      timestamp: new Date(Date.now() - 30000), // 30 seconds ago
      autoRemove: true
    },
    {
      id: '2',
      type: 'system',
      sender: 'System',
      message: 'New API key successfully added to your account.',
      timestamp: new Date(Date.now() - 120000), // 2 minutes ago
      autoRemove: true
    },
    {
      id: '3',
      type: 'message',
      sender: 'Sarah Johnson',
      message: 'Thanks for the help with the React components! The solution worked perfectly.',
      timestamp: new Date(Date.now() - 300000), // 5 minutes ago
      autoRemove: true
    }
  ]);

  // Use external notifications if provided, otherwise use internal state
  const notifications = externalNotifications || internalNotifications;

  // Limit notifications to maximum count
  const displayedNotifications = notifications.slice(0, maxNotifications);

  /**
   * Get appropriate icon for notification type
   * Returns Lucide React icon component with proper styling
   */
  const getNotificationIcon = useCallback((type: ChatNotification['type']) => {
    const iconClasses = "w-5 h-5 flex-shrink-0";
    
    switch (type) {
      case 'message':
        return <MessageSquare className={`${iconClasses} text-green-600`} />;
      case 'system':
        return <Bell className={`${iconClasses} text-blue-600`} />;
      case 'success':
        return <CheckCircle className={`${iconClasses} text-green-600`} />;
      case 'error':
        return <AlertCircle className={`${iconClasses} text-red-600`} />;
      case 'info':
      default:
        return <Info className={`${iconClasses} text-blue-600`} />;
    }
  }, []);

  /**
   * Get notification styling based on type
   * Returns appropriate border and background colors
   */
  const getNotificationStyling = useCallback((type: ChatNotification['type']) => {
    switch (type) {
      case 'message':
        return 'border-l-green-600 bg-green-50';
      case 'system':
        return 'border-l-blue-600 bg-blue-50';
      case 'success':
        return 'border-l-green-600 bg-green-50';
      case 'error':
        return 'border-l-red-600 bg-red-50';
      case 'info':
      default:
        return 'border-l-blue-600 bg-blue-50';
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
      return `${diffInMinutes} min ago`;
    } else if (diffInMinutes < 1440) { // Less than 24 hours
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours}h ago`;
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      return `${days}d ago`;
    }
  }, []);

  /**
   * Handle notification click
   * Calls parent callback if provided
   */
  const handleNotificationClick = useCallback((notification: ChatNotification) => {
    if (onNotificationClick) {
      onNotificationClick(notification);
    }
  }, [onNotificationClick]);

  /**
   * Handle notification dismissal
   * Removes notification from internal state or calls parent callback
   */
  const handleDismissNotification = useCallback((notificationId: string) => {
    if (onNotificationDismiss) {
      // Use external dismiss handler if provided
      onNotificationDismiss(notificationId);
    } else {
      // Remove from internal state
      setInternalNotifications(prev => 
        prev.filter(notification => notification.id !== notificationId)
      );
    }
  }, [onNotificationDismiss]);

  /**
   * Auto-remove notifications after specified delay
   * Only applies to notifications with autoRemove flag
   */
  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];

    displayedNotifications.forEach(notification => {
      if (notification.autoRemove !== false) {
        const timer = setTimeout(() => {
          handleDismissNotification(notification.id);
        }, autoRemoveDelay);
        
        timers.push(timer);
      }
    });

    // Cleanup timers on unmount or dependency change
    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, [displayedNotifications, autoRemoveDelay, handleDismissNotification]);

  /**
   * Add new notification function for demo purposes
   * In real implementation, this would be called from parent component
   */
  const addDemoNotification = useCallback(() => {
    const demoNotifications: Omit<ChatNotification, 'id' | 'timestamp'>[] = [
      {
        type: 'message',
        sender: 'AI Assistant',
        message: 'Your project has been successfully deployed!',
        autoRemove: true
      },
      {
        type: 'system',
        sender: 'System',
        message: 'API usage limit warning: 90% of monthly quota used.',
        autoRemove: true
      },
      {
        type: 'success',
        sender: 'System',
        message: 'Payment processed successfully.',
        autoRemove: true
      },
      {
        type: 'error',
        sender: 'System',
        message: 'Failed to connect to external API. Please try again.',
        autoRemove: true
      }
    ];

    const randomDemo = demoNotifications[Math.floor(Math.random() * demoNotifications.length)];
    const newNotification: ChatNotification = {
      ...randomDemo,
      id: Date.now().toString(),
      timestamp: new Date()
    };

    setInternalNotifications(prev => [newNotification, ...prev]);
  }, []);

  // Don't render if no notifications
  if (displayedNotifications.length === 0) {
    return null;
  }

  return (
    <>
      {/* Notifications Container - Fixed position in bottom-right corner */}
      <div 
        className={`
          fixed bottom-6 right-6 max-w-sm w-full z-50 space-y-3
          ${className}
        `}
        role="region"
        aria-label="Chat notifications"
        aria-live="polite"
      >
        {/* Notification Toasts - Stacked with animations */}
        {displayedNotifications.map((notification, index) => (
          <div
            key={notification.id}
            className={`
              bg-white rounded-lg shadow-lg border-l-4 p-4 transform transition-all duration-300
              hover:shadow-xl hover:scale-[1.02] cursor-pointer
              ${getNotificationStyling(notification.type)}
              animate-slideInRight
            `}
            style={{
              animationDelay: `${index * 100}ms`,
              zIndex: 50 - index // Stack notifications properly
            }}
            onClick={() => handleNotificationClick(notification)}
            role="alert"
            aria-label={`Notification from ${notification.sender}: ${notification.message}`}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleNotificationClick(notification);
              }
            }}
          >
            {/* Notification Content */}
            <div className="flex items-start gap-3">
              {/* Notification Icon */}
              <div className="flex-shrink-0 mt-0.5">
                {getNotificationIcon(notification.type)}
              </div>

              {/* Notification Text Content */}
              <div className="flex-1 min-w-0">
                {/* Sender Name */}
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-sm font-semibold text-gray-900 truncate">
                    {notification.sender}
                  </h4>
                  <span className="text-xs text-gray-500">
                    {formatTimestamp(notification.timestamp)}
                  </span>
                </div>

                {/* Message Preview */}
                <p className="text-sm text-gray-700 leading-relaxed line-clamp-2">
                  {notification.message}
                </p>
              </div>

              {/* Close Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDismissNotification(notification.id);
                }}
                className="
                  flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 
                  hover:bg-gray-100 rounded transition-colors
                  focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1
                "
                aria-label={`Dismiss notification from ${notification.sender}`}
                title="Dismiss notification"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Demo Button - Only shown when using internal notifications */}
      {!externalNotifications && (
        <button
          onClick={addDemoNotification}
          className="
            fixed bottom-6 left-6 px-4 py-2 bg-green-600 text-white rounded-lg 
            hover:bg-green-700 transition-colors shadow-lg z-40
            focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2
          "
          title="Add demo notification"
        >
          + Add Notification
        </button>
      )}

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        .animate-slideInRight {
          animation: slideInRight 0.3s ease-out forwards;
        }
        
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </>
  );
};

export default ChatNotifications;