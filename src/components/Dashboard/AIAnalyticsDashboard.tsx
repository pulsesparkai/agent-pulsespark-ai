import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { 
  Activity, 
  Zap, 
  Clock, 
  Users, 
  TrendingUp, 
  Calendar,
  Filter,
  BarChart3,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon
} from 'lucide-react';

// Type definitions for analytics data
interface StatCard {
  id: string;
  title: string;
  value: string;
  change: string;
  changeType: 'increase' | 'decrease' | 'neutral';
  icon: React.ComponentType<any>;
  color: string;
}

interface UsageData {
  date: string;
  apiCalls: number;
  tokens: number;
  responseTime: number;
}

interface ProviderData {
  provider: string;
  tokens: number;
  requests: number;
  color: string;
}

interface AIAnalyticsDashboardProps {
  className?: string;
}

/**
 * AIAnalyticsDashboard Component
 * 
 * A comprehensive analytics dashboard for AI API usage with PulseSpark branding.
 * Features interactive charts, statistics cards, and filtering capabilities.
 * Uses Recharts for data visualization with green and gray color palette.
 */
export const AIAnalyticsDashboard: React.FC<AIAnalyticsDashboardProps> = ({ 
  className = '' 
}) => {
  // State management for dashboard data and filters
  const [dateRange, setDateRange] = useState('30'); // Days
  const [selectedProvider, setSelectedProvider] = useState('all');
  const [loading, setLoading] = useState(true);
  const [statsData, setStatsData] = useState<StatCard[]>([]);
  const [usageData, setUsageData] = useState<UsageData[]>([]);
  const [providerData, setProviderData] = useState<ProviderData[]>([]);

  // Provider options for filtering
  const providerOptions = [
    { value: 'all', label: 'All Providers' },
    { value: 'OpenAI', label: 'OpenAI' },
    { value: 'Claude', label: 'Claude' },
    { value: 'DeepSeek', label: 'DeepSeek' },
    { value: 'Grok', label: 'Grok' },
    { value: 'Mistral', label: 'Mistral' }
  ];

  // Date range options
  const dateRangeOptions = [
    { value: '7', label: 'Last 7 days' },
    { value: '30', label: 'Last 30 days' },
    { value: '90', label: 'Last 90 days' },
    { value: '365', label: 'Last year' }
  ];

  // PulseSpark color palette for charts
  const chartColors = {
    primary: '#16a34a', // green-600
    secondary: '#22c55e', // green-500
    tertiary: '#4ade80', // green-400
    quaternary: '#86efac', // green-300
    accent: '#dcfce7', // green-100
    gray: '#6b7280', // gray-500
    lightGray: '#9ca3af' // gray-400
  };

  /**
   * Generate mock statistics data
   * Simulates real API analytics with realistic numbers and trends
   */
  const generateStatsData = (): StatCard[] => {
    return [
      {
        id: 'api-calls',
        title: 'Total API Calls',
        value: '24,847',
        change: '+12.5%',
        changeType: 'increase',
        icon: Activity,
        color: 'text-green-600'
      },
      {
        id: 'tokens-used',
        title: 'Total Tokens Used',
        value: '1.2M',
        change: '+8.3%',
        changeType: 'increase',
        icon: Zap,
        color: 'text-blue-600'
      },
      {
        id: 'avg-response-time',
        title: 'Avg Response Time',
        value: '1.4s',
        change: '-5.2%',
        changeType: 'decrease',
        icon: Clock,
        color: 'text-purple-600'
      },
      {
        id: 'active-users',
        title: 'Active Users',
        value: '342',
        change: '+18.7%',
        changeType: 'increase',
        icon: Users,
        color: 'text-orange-600'
      }
    ];
  };

  /**
   * Generate mock usage data for line chart
   * Creates realistic daily usage patterns over the selected date range
   */
  const generateUsageData = (days: number): UsageData[] => {
    const data: UsageData[] = [];
    const now = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      // Generate realistic usage patterns with some randomness
      const baseApiCalls = 800 + Math.random() * 400;
      const baseTokens = 45000 + Math.random() * 20000;
      const baseResponseTime = 1.2 + Math.random() * 0.8;
      
      data.push({
        date: date.toISOString().split('T')[0],
        apiCalls: Math.floor(baseApiCalls),
        tokens: Math.floor(baseTokens),
        responseTime: Math.round(baseResponseTime * 100) / 100
      });
    }
    
    return data;
  };

  /**
   * Generate mock provider data for charts
   * Creates realistic distribution across different AI providers
   */
  const generateProviderData = (): ProviderData[] => {
    return [
      {
        provider: 'OpenAI',
        tokens: 450000,
        requests: 12500,
        color: chartColors.primary
      },
      {
        provider: 'Claude',
        tokens: 320000,
        requests: 8900,
        color: chartColors.secondary
      },
      {
        provider: 'DeepSeek',
        tokens: 180000,
        requests: 5200,
        color: chartColors.tertiary
      },
      {
        provider: 'Grok',
        tokens: 95000,
        requests: 2800,
        color: chartColors.quaternary
      },
      {
        provider: 'Mistral',
        tokens: 75000,
        requests: 2100,
        color: chartColors.gray
      }
    ];
  };

  /**
   * Simulate API data fetching
   * Loads mock data with realistic loading delay
   */
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setStatsData(generateStatsData());
      setUsageData(generateUsageData(parseInt(dateRange)));
      setProviderData(generateProviderData());
      
      setLoading(false);
    };

    fetchData();
  }, [dateRange, selectedProvider]);

  /**
   * Handle date range filter change
   * Updates charts with new time period data
   */
  const handleDateRangeChange = (newRange: string) => {
    setDateRange(newRange);
  };

  /**
   * Handle provider filter change
   * Filters data to show specific provider metrics
   */
  const handleProviderChange = (provider: string) => {
    setSelectedProvider(provider);
  };

  /**
   * Format large numbers for display
   * Converts numbers to readable format (K, M, B)
   */
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  /**
   * Custom tooltip component for charts
   * Provides detailed information on hover with PulseSpark styling
   */
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {typeof entry.value === 'number' ? formatNumber(entry.value) : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`bg-white rounded-xl shadow-lg p-8 max-w-5xl mx-auto my-8 ${className}`}>
      {/* Dashboard Header - PulseSpark branding with analytics icon */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
          <TrendingUp className="w-5 h-5 text-green-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">AI Analytics Dashboard</h2>
          <p className="text-gray-600">Monitor your AI API usage and performance metrics</p>
        </div>
      </div>

      {/* Filters Section - Date range and provider selection */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-500" />
          <label htmlFor="dateRange" className="text-sm font-medium text-gray-700">
            Date Range:
          </label>
          <select
            id="dateRange"
            value={dateRange}
            onChange={(e) => handleDateRangeChange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            disabled={loading}
          >
            {dateRangeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <label htmlFor="providerFilter" className="text-sm font-medium text-gray-700">
            Provider:
          </label>
          <select
            id="providerFilter"
            value={selectedProvider}
            onChange={(e) => handleProviderChange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            disabled={loading}
          >
            {providerOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        // Loading State - Skeleton placeholders
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-gray-100 rounded-lg p-6 animate-pulse">
                <div className="h-4 bg-gray-300 rounded mb-4"></div>
                <div className="h-8 bg-gray-300 rounded mb-2"></div>
                <div className="h-3 bg-gray-300 rounded w-1/2"></div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {[1, 2].map((i) => (
              <div key={i} className="bg-gray-100 rounded-lg p-6 h-80 animate-pulse"></div>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Statistics Cards - Key metrics with icons and trend indicators */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {statsData.map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.id}
                  className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      stat.color === 'text-green-600' ? 'bg-green-100' :
                      stat.color === 'text-blue-600' ? 'bg-blue-100' :
                      stat.color === 'text-purple-600' ? 'bg-purple-100' :
                      'bg-orange-100'
                    }`}>
                      <Icon className={`w-5 h-5 ${stat.color}`} />
                    </div>
                    <div className={`text-sm font-medium ${
                      stat.changeType === 'increase' ? 'text-green-600' :
                      stat.changeType === 'decrease' ? 'text-red-600' :
                      'text-gray-600'
                    }`}>
                      {stat.change}
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-600">
                    {stat.title}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Charts Section - Interactive data visualizations */}
          <div className="space-y-8">
            {/* API Usage Over Time - Line Chart */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-6">
                <LineChartIcon className="w-5 h-5 text-green-600" />
                <h3 className="text-lg font-semibold text-gray-900">API Usage Over Time</h3>
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={usageData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#6b7280"
                      fontSize={12}
                      tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    />
                    <YAxis stroke="#6b7280" fontSize={12} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="apiCalls" 
                      stroke={chartColors.primary} 
                      strokeWidth={2}
                      name="API Calls"
                      dot={{ fill: chartColors.primary, strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: chartColors.primary, strokeWidth: 2 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="tokens" 
                      stroke={chartColors.secondary} 
                      strokeWidth={2}
                      name="Tokens (÷100)"
                      dot={{ fill: chartColors.secondary, strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: chartColors.secondary, strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Provider Comparison Charts - Bar and Pie Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Tokens by Provider - Bar Chart */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center gap-2 mb-6">
                  <BarChart3 className="w-5 h-5 text-green-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Tokens by Provider</h3>
                </div>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={providerData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                      <XAxis 
                        dataKey="provider" 
                        stroke="#6b7280"
                        fontSize={12}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis stroke="#6b7280" fontSize={12} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar 
                        dataKey="tokens" 
                        fill={chartColors.primary}
                        name="Tokens Used"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Request Distribution - Pie Chart */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center gap-2 mb-6">
                  <PieChartIcon className="w-5 h-5 text-green-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Request Distribution</h3>
                </div>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={providerData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ provider, percent }) => `${provider} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="requests"
                        name="Requests"
                      >
                        {providerData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Dashboard Footer - Summary and refresh info */}
      <div className="mt-8 pt-6 border-t border-gray-200 text-center">
        <p className="text-sm text-gray-500">
          Dashboard updates every 5 minutes. Last updated: {new Date().toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
};

export default AIAnalyticsDashboard;