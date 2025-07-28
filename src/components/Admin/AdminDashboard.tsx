import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users, 
  CreditCard, 
  Activity, 
  Shield, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Edit2,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  Download,
  RefreshCw,
  Clock,
  User,
  Mail,
  Crown
} from 'lucide-react';
import { LoadingSpinner } from '../Shared/LoadingSpinner';
import { useNotification } from '../../contexts/NotificationContext';

// Type definitions for admin dashboard data
interface MetricCard {
  id: string;
  title: string;
  value: string;
  change: string;
  changeType: 'increase' | 'decrease' | 'neutral';
  icon: React.ComponentType<any>;
  color: string;
  bgColor: string;
}

interface UserData {
  id: string;
  name: string;
  email: string;
  subscriptionPlan: 'Free' | 'Professional' | 'Enterprise';
  status: 'active' | 'inactive' | 'suspended';
  joinDate: string;
  lastActive: string;
  apiUsage: number;
}

interface SystemLog {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error';
  message: string;
  source: string;
}

interface AdminDashboardProps {
  className?: string;
}

/**
 * AdminDashboard Component
 * 
 * A comprehensive administrative dashboard with PulseSpark branding featuring:
 * - Key metrics overview with summary cards
 * - User management table with actions and pagination
 * - System logs with severity levels and filtering
 * - Responsive design with consistent green and white styling
 */
export const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  className = '' 
}) => {
  // State management for dashboard data and UI
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [metrics, setMetrics] = useState<MetricCard[]>([]);
  const [users, setUsers] = useState<UserData[]>([]);
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([]);
  
  // User management state
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'suspended'>('all');
  const [planFilter, setPlanFilter] = useState<'all' | 'Free' | 'Professional' | 'Enterprise'>('all');
  
  // System logs state
  const [logFilter, setLogFilter] = useState<'all' | 'info' | 'warning' | 'error'>('all');
  
  const { showNotification } = useNotification();

  /**
   * Generate mock metrics data
   * Simulates real admin dashboard metrics with realistic numbers
   */
  const generateMetricsData = (): MetricCard[] => {
    return [
      {
        id: 'total-users',
        title: 'Total Users',
        value: '2,847',
        change: '+12.5%',
        changeType: 'increase',
        icon: Users,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50'
      },
      {
        id: 'active-subscriptions',
        title: 'Active Subscriptions',
        value: '1,234',
        change: '+8.3%',
        changeType: 'increase',
        icon: CreditCard,
        color: 'text-green-600',
        bgColor: 'bg-green-50'
      },
      {
        id: 'api-usage-today',
        title: 'API Usage Today',
        value: '847K',
        change: '+15.2%',
        changeType: 'increase',
        icon: Activity,
        color: 'text-purple-600',
        bgColor: 'bg-purple-50'
      },
      {
        id: 'system-health',
        title: 'System Health',
        value: '99.9%',
        change: 'Stable',
        changeType: 'neutral',
        icon: Shield,
        color: 'text-emerald-600',
        bgColor: 'bg-emerald-50'
      }
    ];
  };

  /**
   * Generate mock user data
   * Creates realistic user data for demonstration
   */
  const generateUserData = (): UserData[] => {
    const plans: UserData['subscriptionPlan'][] = ['Free', 'Professional', 'Enterprise'];
    const statuses: UserData['status'][] = ['active', 'inactive', 'suspended'];
    const users: UserData[] = [];

    for (let i = 1; i <= 50; i++) {
      users.push({
        id: `user-${i}`,
        name: `User ${i}`,
        email: `user${i}@example.com`,
        subscriptionPlan: plans[Math.floor(Math.random() * plans.length)],
        status: statuses[Math.floor(Math.random() * statuses.length)],
        joinDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        lastActive: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        apiUsage: Math.floor(Math.random() * 10000)
      });
    }

    return users;
  };

  /**
   * Generate mock system logs
   * Creates realistic system log entries
   */
  const generateSystemLogs = (): SystemLog[] => {
    const levels: SystemLog['level'][] = ['info', 'warning', 'error'];
    const sources = ['API Gateway', 'Database', 'Auth Service', 'Payment System', 'Chat Service'];
    const messages = [
      'User authentication successful',
      'API rate limit exceeded for user',
      'Database connection timeout',
      'Payment processing completed',
      'New user registration',
      'System backup completed',
      'High memory usage detected',
      'SSL certificate renewal required',
      'Chat service restarted',
      'API key validation failed'
    ];

    const logs: SystemLog[] = [];
    for (let i = 1; i <= 20; i++) {
      logs.push({
        id: `log-${i}`,
        timestamp: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
        level: levels[Math.floor(Math.random() * levels.length)],
        message: messages[Math.floor(Math.random() * messages.length)],
        source: sources[Math.floor(Math.random() * sources.length)]
      });
    }

    return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  };

  /**
   * Load dashboard data
   * Simulates API calls to fetch admin dashboard data
   */
  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setMetrics(generateMetricsData());
      setUsers(generateUserData());
      setSystemLogs(generateSystemLogs());
    } catch (error) {
      showNotification('Failed to load dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  /**
   * Refresh dashboard data
   * Reloads all dashboard data with loading indicator
   */
  const refreshDashboard = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadDashboardData();
      showNotification('Dashboard data refreshed', 'success');
    } finally {
      setRefreshing(false);
    }
  }, [loadDashboardData, showNotification]);

  // Load data on component mount
  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  /**
   * Filter users based on search term and filters
   * Applies search and filter criteria to user list
   */
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    const matchesPlan = planFilter === 'all' || user.subscriptionPlan === planFilter;
    
    return matchesSearch && matchesStatus && matchesPlan;
  });

  /**
   * Get paginated users for current page
   * Calculates users to display based on pagination
   */
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * usersPerPage,
    currentPage * usersPerPage
  );

  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  /**
   * Filter system logs based on level filter
   * Applies severity level filter to logs
   */
  const filteredLogs = systemLogs.filter(log => 
    logFilter === 'all' || log.level === logFilter
  );

  /**
   * Handle user action (edit, deactivate, delete)
   * Simulates user management actions
   */
  const handleUserAction = useCallback(async (userId: string, action: 'edit' | 'deactivate' | 'activate' | 'delete') => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (action === 'delete') {
        setUsers(prev => prev.filter(user => user.id !== userId));
        showNotification('User deleted successfully', 'success');
      } else if (action === 'deactivate') {
        setUsers(prev => prev.map(user => 
          user.id === userId ? { ...user, status: 'inactive' as const } : user
        ));
        showNotification('User deactivated', 'success');
      } else if (action === 'activate') {
        setUsers(prev => prev.map(user => 
          user.id === userId ? { ...user, status: 'active' as const } : user
        ));
        showNotification('User activated', 'success');
      } else {
        showNotification('Edit user functionality would open here', 'info');
      }
    } catch (error) {
      showNotification(`Failed to ${action} user`, 'error');
    }
  }, [showNotification]);

  /**
   * Format timestamp for display
   * Converts ISO timestamp to readable format
   */
  const formatTimestamp = (timestamp: string): string => {
    return new Date(timestamp).toLocaleString();
  };

  /**
   * Get status badge styling
   * Returns appropriate styling for different user statuses
   */
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'suspended':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  /**
   * Get plan badge styling
   * Returns appropriate styling for different subscription plans
   */
  const getPlanBadge = (plan: string) => {
    switch (plan) {
      case 'Enterprise':
        return 'bg-purple-100 text-purple-800';
      case 'Professional':
        return 'bg-blue-100 text-blue-800';
      case 'Free':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  /**
   * Get log level styling
   * Returns appropriate styling for different log levels
   */
  const getLogLevelStyle = (level: string) => {
    switch (level) {
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'info':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl shadow-lg p-8 max-w-6xl mx-auto my-8 ${className}`}>
      {/* Dashboard Header - PulseSpark branding with admin icon */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600">Manage users, monitor system health, and view analytics</p>
          </div>
        </div>
        
        {/* Refresh Button */}
        <button
          onClick={refreshDashboard}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
          title="Refresh dashboard data"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Summary Metrics Cards - Key performance indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <div
              key={metric.id}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${metric.bgColor}`}>
                  <Icon className={`w-6 h-6 ${metric.color}`} />
                </div>
                <div className={`text-sm font-medium ${
                  metric.changeType === 'increase' ? 'text-green-600' :
                  metric.changeType === 'decrease' ? 'text-red-600' :
                  'text-gray-600'
                }`}>
                  {metric.change}
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {metric.value}
              </div>
              <div className="text-sm text-gray-600">
                {metric.title}
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Content Grid - User management and system logs */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* User Management Section - Takes up 2/3 of the width */}
        <div className="xl:col-span-2">
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-green-600" />
                User Management
              </h2>
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm">
                  <Download className="w-4 h-4" />
                  Export
                </button>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search users..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
              
              <select
                value={planFilter}
                onChange={(e) => setPlanFilter(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="all">All Plans</option>
                <option value="Free">Free</option>
                <option value="Professional">Professional</option>
                <option value="Enterprise">Enterprise</option>
              </select>
            </div>

            {/* Users Table */}
            <div className="overflow-x-auto">
              <table className="w-full" role="table" aria-label="Users management table">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">User</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Plan</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">API Usage</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedUsers.map((user, index) => (
                    <tr 
                      key={user.id} 
                      className={`border-b border-gray-100 hover:bg-green-50 transition-colors ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-green-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{user.name}</p>
                            <p className="text-sm text-gray-600">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPlanBadge(user.subscriptionPlan)}`}>
                          {user.subscriptionPlan}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(user.status)}`}>
                          {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-gray-900">{user.apiUsage.toLocaleString()}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleUserAction(user.id, 'edit')}
                            className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                            title="Edit user"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleUserAction(user.id, user.status === 'active' ? 'deactivate' : 'activate')}
                            className="p-1 text-gray-400 hover:text-yellow-600 transition-colors"
                            title={user.status === 'active' ? 'Deactivate user' : 'Activate user'}
                          >
                            {user.status === 'active' ? (
                              <XCircle className="w-4 h-4" />
                            ) : (
                              <CheckCircle className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`Are you sure you want to delete ${user.name}?`)) {
                                handleUserAction(user.id, 'delete');
                              }
                            }}
                            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                            title="Delete user"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-gray-600">
                  Showing {((currentPage - 1) * usersPerPage) + 1} to {Math.min(currentPage * usersPerPage, filteredUsers.length)} of {filteredUsers.length} users
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>
                  <span className="px-3 py-2 text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* System Logs Section - Takes up 1/3 of the width */}
        <div className="xl:col-span-1">
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Activity className="w-5 h-5 text-green-600" />
                System Logs
              </h2>
              <select
                value={logFilter}
                onChange={(e) => setLogFilter(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
              >
                <option value="all">All Levels</option>
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="error">Error</option>
              </select>
            </div>

            {/* Logs List */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getLogLevelStyle(log.level)}`}>
                      {log.level.toUpperCase()}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <Clock className="w-3 h-3" />
                      <span>{formatTimestamp(log.timestamp)}</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-900 mb-1">{log.message}</p>
                  <p className="text-xs text-gray-600">Source: {log.source}</p>
                </div>
              ))}
            </div>

            {filteredLogs.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Activity className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No logs found for selected filter</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dashboard Footer - Summary and last update info */}
      <div className="mt-8 pt-6 border-t border-gray-200 text-center">
        <p className="text-sm text-gray-500">
          Dashboard last updated: {new Date().toLocaleString()} • Auto-refresh every 5 minutes
        </p>
      </div>
    </div>
  );
};

export default AdminDashboard;