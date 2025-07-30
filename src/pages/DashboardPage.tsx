import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useApiKeys } from '../contexts/ApiKeysContext';
import { useNotification } from '../contexts/NotificationContext';
import { supabase } from '../lib/supabase';
import { LoadingSpinner } from '../components/Shared/LoadingSpinner';
import { 
  FolderOpen, 
  Key, 
  MessageSquare, 
  Brain, 
  TrendingUp,
  Plus,
  Activity,
  Clock,
  Users,
  Zap,
  ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface DashboardStats {
  projects: number;
  apiKeys: number;
  chatSessions: number;
  memoryItems: number;
  feedbackEntries: number;
}

interface RecentActivity {
  id: string;
  type: 'message' | 'project' | 'api' | 'settings' | 'profile';
  description: string;
  timestamp: string;
}

/**
 * DashboardPage Component
 * 
 * Modern dashboard with gradient hero section, enhanced stats cards, and improved visual hierarchy
 */
export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { apiKeys } = useApiKeys();
  const { showNotification } = useNotification();

  const [stats, setStats] = useState<DashboardStats>({
    projects: 0,
    apiKeys: 0,
    chatSessions: 0,
    memoryItems: 0,
    feedbackEntries: 0
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  /**
   * Load dashboard statistics from Supabase
   */
  const loadDashboardStats = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch counts for all user's data
      const [projectsRes, chatSessionsRes, memoryItemsRes, feedbackRes] = await Promise.all([
        supabase.from('projects').select('id', { count: 'exact' }).eq('user_id', user.id),
        supabase.from('chat_sessions').select('id', { count: 'exact' }).eq('user_id', user.id),
        supabase.from('memory_items').select('id', { count: 'exact' }).eq('user_id', user.id),
        supabase.from('feedback_entries').select('id', { count: 'exact' }).eq('user_id', user.id)
      ]);

      setStats({
        projects: projectsRes.count || 0,
        apiKeys: apiKeys.length,
        chatSessions: chatSessionsRes.count || 0,
        memoryItems: memoryItemsRes.count || 0,
        feedbackEntries: feedbackRes.count || 0
      });

      // Load recent activity
      await loadRecentActivity();

    } catch (error: any) {
      showNotification('Failed to load dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Load recent user activity
   */
  const loadRecentActivity = async () => {
    if (!user) return;

    try {
      // Get recent projects
      const { data: projects } = await supabase
        .from('projects')
        .select('id, name, updated_at')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(3);

      // Get recent chat sessions
      const { data: chats } = await supabase
        .from('chat_sessions')
        .select('id, title, updated_at')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(3);

      // Combine and sort by timestamp
      const activities: RecentActivity[] = [
        ...(projects || []).map(p => ({
          id: p.id,
          type: 'project' as const,
          description: p.name,
          timestamp: p.updated_at
        })),
        ...(chats || []).map(c => ({
          id: c.id,
          type: 'message' as const,
          description: c.title,
          timestamp: c.updated_at
        }))
      ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
       .slice(0, 5);

      setRecentActivity(activities);
    } catch (error) {
      console.error('Failed to load recent activity:', error);
    }
  };

  useEffect(() => {
    loadDashboardStats();
  }, [user, apiKeys]);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'project': return FolderOpen;
      case 'message': return MessageSquare;
      case 'api': return Key;
      case 'settings': return Activity;
      case 'profile': return Users;
      default: return Activity;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'project': return 'text-blue-600 bg-blue-50';
      case 'message': return 'text-green-600 bg-green-50';
      case 'api': return 'text-orange-600 bg-orange-50';
      case 'settings': return 'text-gray-600 bg-gray-50';
      case 'profile': return 'text-purple-600 bg-purple-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="text-gray-600 mt-4 text-lg">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Modern Hero Section */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-2xl p-8 mb-8 text-white shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                Welcome back, {user?.email?.split('@')[0]}!
              </h1>
              <p className="text-green-100 text-lg">Let's build something amazing today</p>
            </div>
            <div className="hidden md:block">
              <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
                <Zap className="w-10 h-10 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { 
              title: 'Projects', 
              value: stats.projects.toString(), 
              icon: FolderOpen, 
              color: 'from-blue-500 to-blue-600',
              textColor: 'text-blue-600',
              bgColor: 'bg-blue-50'
            },
            { 
              title: 'API Keys', 
              value: stats.apiKeys.toString(), 
              icon: Key, 
              color: 'from-orange-500 to-orange-600',
              textColor: 'text-orange-600',
              bgColor: 'bg-orange-50'
            },
            { 
              title: 'Chat Sessions', 
              value: stats.chatSessions.toString(), 
              icon: MessageSquare, 
              color: 'from-green-500 to-green-600',
              textColor: 'text-green-600',
              bgColor: 'bg-green-50'
            },
            { 
              title: 'Memories', 
              value: stats.memoryItems.toString(), 
              icon: Brain, 
              color: 'from-purple-500 to-purple-600',
              textColor: 'text-purple-600',
              bgColor: 'bg-purple-50'
            }
          ].map((stat) => (
            <div 
              key={stat.title} 
              className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                  <stat.icon className={`w-6 h-6 ${stat.textColor}`} />
                </div>
                <TrendingUp className="w-4 h-4 text-gray-400" />
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</div>
              <div className="text-sm text-gray-600">{stat.title}</div>
            </div>
          ))}
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Enhanced Quick Actions - 2/3 width on desktop */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <Zap className="w-4 h-4 text-green-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Quick Actions</h2>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { 
                    icon: Plus, 
                    label: 'Create Project', 
                    color: 'bg-blue-500 hover:bg-blue-600',
                    path: '/projects'
                  },
                  { 
                    icon: Key, 
                    label: 'Add API Key', 
                    color: 'bg-orange-500 hover:bg-orange-600',
                    path: '/api-keys'
                  },
                  { 
                    icon: MessageSquare, 
                    label: 'Start Chat', 
                    color: 'bg-green-500 hover:bg-green-600',
                    path: '/chat'
                  },
                  { 
                    icon: Brain, 
                    label: 'Add Memory', 
                    color: 'bg-purple-500 hover:bg-purple-600',
                    path: '/memory'
                  }
                ].map((action) => (
                  <Link
                    key={action.label}
                    to={action.path}
                    className={`${action.color} text-white p-4 rounded-lg transition-all duration-200 transform hover:scale-105 flex flex-col items-center gap-2 shadow-lg hover:shadow-xl`}
                  >
                    <action.icon className="w-6 h-6" />
                    <span className="text-sm font-medium text-center">{action.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Enhanced Recent Activity - 1/3 width on desktop */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-4 h-4 text-green-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
                </div>
                <button className="text-green-600 hover:text-green-700 text-sm font-medium transition-colors">
                  View All
                </button>
              </div>
              
              {recentActivity.length > 0 ? (
                <div className="space-y-4">
                  {recentActivity.map((activity) => {
                    const Icon = getActivityIcon(activity.type);
                    return (
                      <div 
                        key={activity.id} 
                        className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer group"
                      >
                        <div className={`w-10 h-10 rounded-lg ${getActivityColor(activity.type)} flex items-center justify-center`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 truncate">{activity.description}</h3>
                          <p className="text-sm text-gray-600">
                            {activity.type} • {formatTimestamp(activity.timestamp)}
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No recent activity</p>
                  <p className="text-gray-400 text-sm mt-1">Start by creating a project or chat session</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Getting Started Section - Only show if user has no data */}
        {stats.projects === 0 && stats.apiKeys === 0 && (
          <div className="mt-8 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-8 border border-green-100">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">🚀 Getting Started with PulseSpark</h2>
              <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                Welcome to PulseSpark AI! Let's get you set up with your first project and API key to start building amazing applications.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/api-keys"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-500 hover:to-green-600 transition-all duration-200 transform hover:scale-105 shadow-lg font-medium"
                >
                  <Key className="w-5 h-5" />
                  Add Your First API Key
                </Link>
                <Link
                  to="/projects"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-500 hover:to-blue-600 transition-all duration-200 transform hover:scale-105 shadow-lg font-medium"
                >
                  <Plus className="w-5 h-5" />
                  Create Your First Project
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};