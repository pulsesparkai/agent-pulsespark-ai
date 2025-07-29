import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { supabase } from '../lib/supabase';
import { LoadingSpinner } from '../components/Shared/LoadingSpinner';
import { 
  MessageSquare, 
  ThumbsUp, 
  ThumbsDown, 
  Star, 
  TrendingUp,
  Calendar,
  Filter,
  BarChart3
} from 'lucide-react';

interface FeedbackEntry {
  id: string;
  ai_provider: string;
  rating_type: string;
  rating_value: number;
  feedback_text?: string;
  created_at: string;
  response_context: Record<string, any>;
}

interface FeedbackStats {
  total: number;
  averageRating: number;
  byProvider: Record<string, { count: number; avgRating: number }>;
  byRatingType: Record<string, number>;
}

/**
 * FeedbackPage Component
 * 
 * View and analyze feedback submitted for AI responses
 */
export const FeedbackPage: React.FC = () => {
  const { user } = useAuth();
  const { showNotification } = useNotification();

  const [feedback, setFeedback] = useState<FeedbackEntry[]>([]);
  const [stats, setStats] = useState<FeedbackStats>({
    total: 0,
    averageRating: 0,
    byProvider: {},
    byRatingType: {}
  });
  const [loading, setLoading] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState('all');
  const [selectedRatingType, setSelectedRatingType] = useState('all');

  /**
   * Load feedback entries from Supabase
   */
  const loadFeedback = async () => {
    if (!user) return;

    try {
      setLoading(true);

      let query = supabase
        .from('feedback_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      // Apply filters
      if (selectedProvider !== 'all') {
        query = query.eq('ai_provider', selectedProvider);
      }
      if (selectedRatingType !== 'all') {
        query = query.eq('rating_type', selectedRatingType);
      }

      const { data, error } = await query;

      if (error) throw error;

      setFeedback(data || []);
      calculateStats(data || []);

    } catch (error: any) {
      showNotification('Failed to load feedback', 'error');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Calculate feedback statistics
   */
  const calculateStats = (feedbackData: FeedbackEntry[]) => {
    const total = feedbackData.length;
    
    if (total === 0) {
      setStats({ total: 0, averageRating: 0, byProvider: {}, byRatingType: {} });
      return;
    }

    // Calculate average rating
    const totalRating = feedbackData.reduce((sum, item) => sum + item.rating_value, 0);
    const averageRating = totalRating / total;

    // Group by provider
    const byProvider: Record<string, { count: number; avgRating: number }> = {};
    feedbackData.forEach(item => {
      if (!byProvider[item.ai_provider]) {
        byProvider[item.ai_provider] = { count: 0, avgRating: 0 };
      }
      byProvider[item.ai_provider].count++;
    });

    // Calculate average rating per provider
    Object.keys(byProvider).forEach(provider => {
      const providerFeedback = feedbackData.filter(item => item.ai_provider === provider);
      const providerTotal = providerFeedback.reduce((sum, item) => sum + item.rating_value, 0);
      byProvider[provider].avgRating = providerTotal / providerFeedback.length;
    });

    // Group by rating type
    const byRatingType: Record<string, number> = {};
    feedbackData.forEach(item => {
      byRatingType[item.rating_type] = (byRatingType[item.rating_type] || 0) + 1;
    });

    setStats({ total, averageRating, byProvider, byRatingType });
  };

  /**
   * Get rating display based on type and value
   */
  const getRatingDisplay = (type: string, value: number) => {
    switch (type) {
      case 'thumbs':
        return value === 1 ? (
          <ThumbsUp className="w-4 h-4 text-green-500" />
        ) : (
          <ThumbsDown className="w-4 h-4 text-red-500" />
        );
      case 'stars':
        return (
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map(star => (
              <Star
                key={star}
                className={`w-3 h-3 ${star <= value ? 'text-yellow-500 fill-current' : 'text-gray-400'}`}
              />
            ))}
          </div>
        );
      case 'scale':
        return (
          <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded-full">
            {value}/10
          </span>
        );
      default:
        return <span>{value}</span>;
    }
  };

  /**
   * Format timestamp for display
   */
  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  useEffect(() => {
    loadFeedback();
  }, [user, selectedProvider, selectedRatingType]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Feedback Analytics</h1>
              <p className="text-gray-400">
                {stats.total} feedback entries • Track AI response quality
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Feedback</p>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Average Rating</p>
                <p className="text-2xl font-bold text-white">
                  {stats.averageRating.toFixed(1)}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Providers</p>
                <p className="text-2xl font-bold text-white">
                  {Object.keys(stats.byProvider).length}
                </p>
              </div>
              <Star className="w-8 h-8 text-yellow-500" />
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">This Month</p>
                <p className="text-2xl font-bold text-white">
                  {feedback.filter(f => {
                    const date = new Date(f.created_at);
                    const now = new Date();
                    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
                  }).length}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={selectedProvider}
                onChange={(e) => setSelectedProvider(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Providers</option>
                {Object.keys(stats.byProvider).map(provider => (
                  <option key={provider} value={provider}>{provider}</option>
                ))}
              </select>
            </div>

            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={selectedRatingType}
                onChange={(e) => setSelectedRatingType(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Rating Types</option>
                <option value="thumbs">Thumbs</option>
                <option value="stars">Stars</option>
                <option value="scale">Scale</option>
              </select>
            </div>
          </div>
        </div>

        {/* Provider Stats */}
        {Object.keys(stats.byProvider).length > 0 && (
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 mb-8">
            <h2 className="text-xl font-bold text-white mb-4">Provider Performance</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(stats.byProvider).map(([provider, data]) => (
                <div key={provider} className="bg-gray-700 rounded-lg p-4">
                  <h3 className="font-semibold text-white mb-2">{provider}</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Feedback Count:</span>
                      <span className="text-white">{data.count}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Avg Rating:</span>
                      <span className="text-white">{data.avgRating.toFixed(1)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Feedback List */}
        {feedback.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No feedback yet</h3>
            <p className="text-gray-400">
              Feedback will appear here as you rate AI responses in chat sessions
            </p>
          </div>
        ) : (
          <div className="bg-gray-800 rounded-xl border border-gray-700">
            <div className="p-6 border-b border-gray-700">
              <h2 className="text-xl font-bold text-white">Recent Feedback</h2>
            </div>
            <div className="divide-y divide-gray-700">
              {feedback.map((entry) => (
                <div key={entry.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="px-3 py-1 bg-blue-600 text-white text-sm rounded-full">
                          {entry.ai_provider}
                        </span>
                        {getRatingDisplay(entry.rating_type, entry.rating_value)}
                        <span className="text-gray-400 text-sm">
                          {formatTimestamp(entry.created_at)}
                        </span>
                      </div>
                      
                      {entry.feedback_text && (
                        <p className="text-gray-300 mt-2">{entry.feedback_text}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};