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
  Zap
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
  type: 'project' | 'chat' | 'memory' | 'api_key';
  title: string;
  timestamp: string;
}

/**
 * DashboardPage Component
 * 
 * Main dashboard showing user statistics, recent activity, and quick actions
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
          title: p.name,
          timestamp: p.updated_at
        })),
        ...(chats || []).map(c => ({
          id: c.id,
          type: 'chat' as const,
          title: c.title,
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
      case 'project': return <FolderOpen className="w-4 h-4 text-blue-500" />;
      case 'chat': return <MessageSquare className="w-4 h-4 text-green-500" />;
      case 'memory': return <Brain className="w-4 h-4 text-purple-500" />;
      case 'api_key': return <Key className="w-4 h-4 text-orange-500" />;
      default: return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="text-gray-400 mt-4">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome back, {user?.email?.split('@')[0]}!
          </h1>
          <p className="text-gray-400">
            Here's what's happening with your PulseSpark workspace
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Projects</p>
                <p className="text-2xl font-bold text-white">{stats.projects}</p>
              </div>
              <FolderOpen className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">API Keys</p>
                <p className="text-2xl font-bold text-white">{stats.apiKeys}</p>
              </div>
              <Key className="w-8 h-8 text-orange-500" />
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Chat Sessions</p>
                <p className="text-2xl font-bold text-white">{stats.chatSessions}</p>
              </div>
              <MessageSquare className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Memories</p>
                <p className="text-2xl font-bold text-white">{stats.memoryItems}</p>
              </div>
              <Brain className="w-8 h-8 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-green-500" />
                Quick Actions
              </h2>
              <div className="space-y-3">
                <Link
                  to="/projects"
                  className="flex items-center gap-3 p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  <Plus className="w-4 h-4 text-green-500" />
                  <span className="text-white">Create Project</span>
                </Link>
                <Link
                  to="/api-keys"
                  className="flex items-center gap-3 p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  <Key className="w-4 h-4 text-orange-500" />
                  <span className="text-white">Add API Key</span>
                </Link>
                <Link
                  to="/chat"
                  className="flex items-center gap-3 p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  <MessageSquare className="w-4 h-4 text-blue-500" />
                  <span className="text-white">Start Chat</span>
                </Link>
                <Link
                  to="/memory"
                  className="flex items-center gap-3 p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  <Brain className="w-4 h-4 text-purple-500" />
                  <span className="text-white">Add Memory</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-500" />
                Recent Activity
              </h2>
              {recentActivity.length > 0 ? (
                <div className="space-y-3">
                  {recentActivity.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-center gap-3 p-3 bg-gray-700 rounded-lg"
                    >
                      {getActivityIcon(activity.type)}
                      <div className="flex-1">
                        <p className="text-white font-medium">{activity.title}</p>
                        <p className="text-gray-400 text-sm">
                          {activity.type} • {formatTimestamp(activity.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Activity className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">No recent activity</p>
                  <p className="text-gray-500 text-sm">Start by creating a project or chat session</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Getting Started */}
        {stats.projects === 0 && stats.apiKeys === 0 && (
          <div className="mt-8 bg-gradient-to-r from-green-900/20 to-blue-900/20 rounded-xl p-6 border border-green-700/30">
            <h2 className="text-xl font-bold text-white mb-4">🚀 Getting Started</h2>
            <p className="text-gray-300 mb-4">
              Welcome to PulseSpark! Let's get you set up with your first project and API key.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/api-keys"
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Add Your First API Key
              </Link>
              <Link
                to="/projects"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Your First Project
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};