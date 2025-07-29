import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ErrorBoundary } from './components/Shared/ErrorBoundary';
import { AuthProvider } from './contexts/AuthContext';
import { ApiKeysProvider } from './contexts/ApiKeysContext';
import { ProjectProvider } from './contexts/ProjectContext';
import { MemoryProvider } from './contexts/MemoryContext';
import { FeedbackProvider } from './contexts/FeedbackContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { AuthPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { ApiKeysPage } from './pages/ApiKeysPage';
import { ChatPage } from './pages/ChatPage';
import { MemoryPage } from './pages/MemoryPage';
import { FeedbackPage } from './pages/FeedbackPage';
import { SettingsPage } from './pages/SettingsPage';
import { Layout } from './components/Layout/Layout';
import { useAuth } from './contexts/AuthContext';
import { LoadingSpinner } from './components/Shared/LoadingSpinner';

/**
 * Protected Route Component
 * Redirects to auth page if user is not authenticated
 */
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="text-gray-400 mt-4">Loading PulseSpark...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};

/**
 * Public Route Component
 * Redirects to dashboard if user is already authenticated
 */
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="text-gray-400 mt-4">Loading PulseSpark...</p>
        </div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

/**
 * Main App Component
 * Sets up routing, context providers, and error boundaries
 */
function App() {
  // Handle uncaught errors in production
  React.useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('Uncaught error:', event.error);
      // In production, send to error monitoring service
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);
      // In production, send to error monitoring service
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return (
    <ErrorBoundary>
      <NotificationProvider>
        <AuthProvider>
          <ApiKeysProvider>
            <ProjectProvider>
              <MemoryProvider>
                <FeedbackProvider>
                  <Router>
                    <div className="min-h-screen bg-gray-900">
                      <Routes>
                        {/* Public Routes */}
                        <Route
                          path="/auth"
                          element={
                            <PublicRoute>
                              <AuthPage />
                            </PublicRoute>
                          }
                        />

                        {/* Protected Routes */}
                        <Route
                          path="/*"
                          element={
                            <ProtectedRoute>
                              <Layout>
                                <Routes>
                                  <Route path="/dashboard" element={<DashboardPage />} />
                                  <Route path="/projects" element={<ProjectsPage />} />
                                  <Route path="/api-keys" element={<ApiKeysPage />} />
                                  <Route path="/chat" element={<ChatPage />} />
                                  <Route path="/memory" element={<MemoryPage />} />
                                  <Route path="/feedback" element={<FeedbackPage />} />
                                  <Route path="/settings" element={<SettingsPage />} />
                                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                                </Routes>
                              </Layout>
                            </ProtectedRoute>
                          }
                        />
                      </Routes>
                    </div>
                  </Router>
                </FeedbackProvider>
              </MemoryProvider>
            </ProjectProvider>
          </ApiKeysProvider>
        </AuthProvider>
      </NotificationProvider>
    </ErrorBoundary>
  );
}

export default App;