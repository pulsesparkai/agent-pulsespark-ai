import React from 'react';
import { MessageSquare } from 'lucide-react';

/**
 * Dashboard Component
 * 
 * Main dashboard interface with statistics and overview
 */
export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { showNotification } = useNotification();

  // State management for dashboard
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load dashboard on mount
  useEffect(() => {
    if (user) {
      setLoading(false);
    }
  }, [user]);

  if (loading) {
    return (
      <div className="h-screen bg-gray-900 flex items-center justify-center">
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
        <div className="text-center py-12">
          <MessageSquare className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Dashboard</h3>
          <p className="text-gray-400">Dashboard functionality coming soon</p>
        </div>
      </div>
    </div>
  );
};