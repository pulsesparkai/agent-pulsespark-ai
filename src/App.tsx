import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ApiKeysProvider } from './contexts/ApiKeysContext';
import { ChatProvider } from './contexts/ChatContext';
import { ProjectProvider } from './contexts/ProjectContext';
import { GitHubProvider } from './contexts/GitHubContext';
import { LoginForm } from './components/Auth/LoginForm';
import LoginPage from './components/Auth/LoginPage';
import SignupPage from './components/Auth/SignupPage';
import { SignupForm } from './components/Auth/SignupForm';
import { Dashboard } from './components/Dashboard/Dashboard';
import { ApiKeysPage } from './components/ApiKeys/ApiKeysPage';
import { ChatPage } from './components/Chat/ChatPage';
import { ChatInterface } from './components/Chat/ChatInterface';
import CodeEditorPage from './components/CodeEditor/CodeEditorPage';
import { ProjectsList } from './components/Projects/ProjectsList';
import { ProjectDashboard } from './components/Projects/ProjectDashboard';
import { PlaceholderPage } from './components/Shared/PlaceholderPage';
import { Sidebar } from './components/Layout/Sidebar';
import { Header } from './components/Layout/Header';
import { LoadingSpinner } from './components/Shared/LoadingSpinner';
import { Settings } from 'lucide-react';

// Auth wrapper component
const AuthWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return <AuthPages />;
  }

  return <>{children}</>;
};

// Auth pages component
const AuthPages: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <>
      {isLogin ? (
        <LoginForm onToggleForm={() => setIsLogin(false)} />
      ) : (
        <SignupForm onToggleForm={() => setIsLogin(true)} />
      )}
    </>
  );
};

// Main app layout with sidebar
const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
};

function App() {
  return (
    <NotificationProvider>
      <AuthProvider>
        <Router>
          <AuthWrapper>
            <ApiKeysProvider>
              <ChatProvider>
                <ProjectProvider>
                  <GitHubProvider>
                    <AppLayout>
                      <Routes>
                        <Route path="/" element={<Navigate to="/dashboard" replace />} />
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/chat" element={<ChatPage />} />
                        <Route path="/chat-interface" element={<ChatInterface />} />
                        <Route path="/editor" element={<CodeEditorPage />} />
                        <Route path="/signup" element={<SignupPage />} />
                        <Route path="/api-keys" element={<ApiKeysPage />} />
                        <Route path="/projects" element={<ProjectsList />} />
                        <Route path="/project-dashboard" element={<ProjectDashboard />} />
                        <Route
                          path="/settings"
                          element={
                            <PlaceholderPage
                              title="Settings"
                              description="Configure your account and application preferences."
                              icon={<Settings className="w-full h-full" />}
                            />
                          }
                        />
                        <Route path="*" element={<Navigate to="/dashboard" replace />} />
                      </Routes>
                    </AppLayout>
                  </GitHubProvider>
                </ProjectProvider>
              </ChatProvider>
            </ApiKeysProvider>
          </AuthWrapper>
        </Router>
      </AuthProvider>
    </NotificationProvider>
  );
}

export default App;