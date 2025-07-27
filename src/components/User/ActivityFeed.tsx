import React, { useState, useCallback } from 'react';
import { 
  MessageSquare, 
  FolderOpen, 
  Key, 
  Settings, 
  User, 
  CheckCircle, 
  Clock,
  Activity,
  X,
  Check
} from 'lucide-react';

// Type definitions for activity data and management
interface ActivityItem {
  id: string;
  type: 'message' | 'project' | 'api' | 'settings' | 'profile';
  description: string;
  timestamp: Date;
  isRead: boolean;
  metadata?: {
    projectName?: string;
    provider?: string;
    chatTitle?: string;
  };
}

interface ActivityFeedProps {
  className?: string;
  maxHeight?: string;
  showActions?: boolean;
  onActivityClick?: (activity: ActivityItem) => void;
  onClearAll?: () => void;
}

/**
 * ActivityFeed Component
 * 
 * A scrollable activity feed with PulseSpark branding featuring:
 * - Chronological list of user activities with icons and timestamps
 * - Read/unread states with visual indicators
 * - Bulk actions for managing activity history
 * - Clean, accessible design consistent with PulseSpark styling
 */
export const ActivityFeed: React.FC<ActivityFeedProps> = ({
  className = '',
  maxHeight = '400px',
  showActions = true,
  onActivityClick,
  onClearAll
}) => {
  // Sample activity data - replace with actual data from context/API
  const [activities, setActivities] = useState<ActivityItem[]>([
    {
      id: '1',
      type: 'message',
      description: 'Started a new chat conversation with AI assistant',
      timestamp: new Date(Date.now() - 300000), // 5 minutes ago
      isRead: false,
      metadata: { chatTitle: 'React Project Help' }
    },
    {
      id: '2',
      type: 'project',
      description: 'Created new project "E-commerce Website"',
      timestamp: new Date(Date.now() - 900000), // 15 minutes ago
      isRead: false,
      metadata: { projectName: 'E-commerce Website' }
    },
    {
      id: '3',
      type: 'api',
      description: 'Added OpenAI API key to your account',
      timestamp: new Date(Date.now() - 1800000), // 30 minutes ago
      isRead: true,
      metadata: { provider: 'OpenAI' }
    },
    {
      id: '4',
      type: 'message',
      description: 'Received AI response in "Database Design" chat',
      timestamp: new Date(Date.now() - 3600000), // 1 hour ago
      isRead: true,
      metadata: { chatTitle: 'Database Design' }
    },
    {
      id: '5',
      type: 'project',
      description: 'Updated project files in "Task Management App"',
      timestamp: new Date(Date.now() - 7200000), // 2 hours ago
      isRead: true,
      metadata: { projectName: 'Task Management App' }
    },
    {
      id: '6',
      type: 'settings',
      description: 'Updated chat preferences and default AI provider',
      timestamp: new Date(Date.now() - 14400000), // 4 hours ago
      isRead: true
    },
    {
      id: '7',
      type: 'profile',
      description: 'Updated profile information and timezone settings',
      timestamp: new Date(Date.now() - 86400000), // 1 day ago
      isRead: true
    },
    {
      id: '8',
      type: 'api',
      description: 'Added Claude API key for enhanced AI capabilities',
      timestamp: new Date(Date.now() - 172800000), // 2 days ago
      isRead: true,
      metadata: { provider: 'Claude' }
    },
    {
      id: '9',
      type: 'project',
      description: 'Deployed "Weather Dashboard" to production',
      timestamp: new Date(Date.now() - 259200000), // 3 days ago
      isRead: true,
      metadata: { projectName: 'Weather Dashboard' }
    },
    {
      id: '10',
      type: 'message',
      description: 'Completed 50+ chat interactions milestone',
      timestamp: new Date(Date.now() - 604800000), // 1 week ago
      isRead: true
    }
  ]);

  /**
   * Get the appropriate icon for activity type
   * Returns Lucide React icon component with proper styling
   */
  const getActivityIcon = useCallback((type: ActivityItem['type']) => {
    const iconClasses = "w-5 h-5 text-green-600 flex-shrink-0";
    
    switch (type) {
      case 'message':
        return <MessageSquare className={iconClasses} />;
      case 'project':
        return <FolderOpen className={iconClasses} />;
      case 'api':
        return <Key className={iconClasses} />;
      case 'settings':
        return <Settings className={iconClasses} />;
      case 'profile':
        return <User className={iconClasses} />;
      default:
        return <Activity className={iconClasses} />;
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
      return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    } else if (diffInMinutes < 1440) { // Less than 24 hours
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      if (days === 1) {
        return 'Yesterday';
      } else if (days < 7) {
        return `${days} days ago`;
      } else if (days < 30) {
        const weeks = Math.floor(days / 7);
        return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
      } else {
        return timestamp.toLocaleDateString();
      }
    }
  }, []);

  /**
   * Handle activity item click
   * Marks as read and calls parent callback if provided
   */
  const handleActivityClick = useCallback((activity: ActivityItem) => {
    // Mark as read if not already read
    if (!activity.isRead) {
      setActivities(prev => 
        prev.map(item => 
          item.id === activity.id 
            ? { ...item, isRead: true }
            : item
        )
      );
    }
    
    // Call parent callback if provided
    if (onActivityClick) {
      onActivityClick(activity);
    }
  }, [onActivityClick]);

  /**
   * Handle marking all activities as read
   * Updates all activities to read state
   */
  const handleMarkAllAsRead = useCallback(() => {
    setActivities(prev => 
      prev.map(activity => ({ ...activity, isRead: true }))
    );
  }, []);

  /**
   * Handle clearing all activities
   * Removes all activities from the list
   */
  const handleClearAll = useCallback(() => {
    if (window.confirm('Are you sure you want to clear all activity history? This action cannot be undone.')) {
      setActivities([]);
      
      // Call parent callback if provided
      if (onClearAll) {
        onClearAll();
      }
    }
  }, [onClearAll]);

  /**
   * Get count of unread activities
   * Used for displaying unread count and conditional rendering
   */
  const unreadCount = activities.filter(activity => !activity.isRead).length;

  return (
    <div className={`bg-white rounded-xl shadow-lg p-6 max-w-xl w-full ${className}`}>
      {/* Feed Header - Title, unread count, and actions */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <Activity className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Activity Feed</h3>
            <p className="text-sm text-gray-600">
              {activities.length} activities
              {unreadCount > 0 && (
                <span className="ml-2 bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons - Mark all read and clear all */}
      {showActions && activities.length > 0 && (
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="
                flex items-center gap-2 text-sm text-green-600 hover:text-green-700 
                hover:bg-green-50 px-3 py-2 rounded-lg transition-colors
                focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1
              "
            >
              <Check className="w-4 h-4" />
              Mark all as read
            </button>
          )}
          
          <button
            onClick={handleClearAll}
            className="
              flex items-center gap-2 text-sm text-gray-500 hover:text-red-600 
              hover:bg-red-50 px-3 py-2 rounded-lg transition-colors
              focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1
            "
          >
            <X className="w-4 h-4" />
            Clear all
          </button>
        </div>
      )}

      {/* Activities List - Scrollable container */}
      <div 
        className="overflow-y-auto space-y-3"
        style={{ maxHeight }}
        role="feed"
        aria-label="Activity feed"
        aria-live="polite"
      >
        {activities.length > 0 ? (
          <ul className="space-y-2" role="list">
            {activities.map((activity) => (
              <li key={activity.id} role="listitem">
                <button
                  onClick={() => handleActivityClick(activity)}
                  className={`
                    w-full text-left p-4 rounded-lg transition-all duration-200
                    hover:bg-green-50 focus:bg-green-50 focus:outline-none
                    focus:ring-2 focus:ring-green-500 focus:ring-offset-1
                    ${!activity.isRead 
                      ? 'bg-green-100 border-l-4 border-green-500' 
                      : 'bg-gray-50 hover:bg-green-50'
                    }
                  `}
                  aria-label={`
                    Activity: ${activity.description}. 
                    ${formatTimestamp(activity.timestamp)}. 
                    ${activity.isRead ? 'Read' : 'Unread'}
                  `}
                >
                  <div className="flex items-start gap-3">
                    {/* Activity Type Icon */}
                    <div className="flex-shrink-0 mt-0.5">
                      {getActivityIcon(activity.type)}
                    </div>

                    {/* Activity Content */}
                    <div className="flex-1 min-w-0">
                      {/* Activity Description */}
                      <p className={`
                        text-sm mb-2 leading-relaxed
                        ${!activity.isRead ? 'text-gray-900 font-medium' : 'text-gray-700'}
                      `}>
                        {activity.description}
                      </p>

                      {/* Metadata Display */}
                      {activity.metadata && (
                        <div className="flex items-center gap-2 mb-2">
                          {activity.metadata.projectName && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                              {activity.metadata.projectName}
                            </span>
                          )}
                          {activity.metadata.provider && (
                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                              {activity.metadata.provider}
                            </span>
                          )}
                          {activity.metadata.chatTitle && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                              {activity.metadata.chatTitle}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Timestamp and Read Status */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          <Clock className="w-3 h-3" />
                          <span>{formatTimestamp(activity.timestamp)}</span>
                        </div>
                        
                        {/* Unread Indicator */}
                        {!activity.isRead && (
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
          // Empty State - No activities
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Activity className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Activity Yet</h3>
            <p className="text-sm text-gray-600">
              Your recent activities will appear here as you use PulseSpark AI
            </p>
          </div>
        )}
      </div>

      {/* Feed Footer - Optional status or additional info */}
      <div className="mt-6 pt-4 border-t border-gray-100">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Activity updates in real-time</span>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span>Live</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityFeed;