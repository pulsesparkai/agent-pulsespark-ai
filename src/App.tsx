import React, { useState } from 'react';
import ChatWindow from './components/Chat/ChatWindow';
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
import { ChatSidebar } from './components/Chat/ChatSidebar';
import CodeEditorPage from './components/CodeEditor/CodeEditorPage';
import { ProjectsList } from './components/Projects/ProjectsList';
import { ProjectDashboard } from './components/Projects/ProjectDashboard';
import { ProjectFileExplorer } from './components/Projects/ProjectFileExplorer';
import ProjectSettingsPanel from './components/Projects/ProjectSettingsPanel';
import ChatSettingsPanel from './components/Chat/ChatSettingsPanel';
import UserProfileSettings from './components/User/UserProfileSettings';
import { AIAnalyticsDashboard } from './components/Dashboard/AIAnalyticsDashboard';
import { ChatMessageBubble } from './components/Chat/ChatMessageBubble';
import ChatInputBar from './components/Chat/ChatInputBar';
import { PlaceholderPage } from './components/Shared/PlaceholderPage';
import { Sidebar } from './components/Layout/Sidebar';
import { Header } from './components/Layout/Header';
import { AppHeader } from './components/Layout/AppHeader';
import { SidebarNavigation } from './components/Layout/SidebarNavigation';
import { LoadingSpinner } from './components/Shared/LoadingSpinner';
import UserNotificationsPanel from './components/User/UserNotificationsPanel';
import { ActivityFeed } from './components/User/ActivityFeed';
import SubscriptionBillingPage from './components/Billing/SubscriptionBillingPage';
import PaymentMethodForm from './components/Billing/PaymentMethodForm';
import { SupportFAQPage } from './components/Support/SupportFAQPage';
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
    <>
      <AppHeader onMenuClick={() => setSidebarOpen(true)} />
      
      <div className="flex min-h-screen bg-gray-50 pt-16">
        <SidebarNavigation isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="flex-1 flex flex-col overflow-hidden lg:ml-72">
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </div>
    </>
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
                        <Route 
                          path="/chat-window" 
                          element={
                            <div className="h-screen">
                              <ChatWindow />
                            </div>
                          } 
                        />
                        <Route path="/editor" element={<CodeEditorPage />} />
                        <Route path="/signup" element={<SignupPage />} />
                        <Route path="/api-keys" element={<ApiKeysPage />} />
                        <Route path="/projects" element={<ProjectsList />} />
                        <Route path="/project-dashboard" element={<ProjectDashboard />} />
                        <Route path="/file-explorer" element={<ProjectFileExplorer />} />
                        <Route path="/project-settings" element={<ProjectSettingsPanel />} />
                        <Route path="/chat-settings" element={<ChatSettingsPanel />} />
                        <Route path="/profile-settings" element={<UserProfileSettings />} />
                        <Route path="/analytics" element={<AIAnalyticsDashboard />} />
                        <Route 
                          path="/activity-feed-demo" 
                          element={
                            <div className="max-w-4xl mx-auto p-8">
                              <h2 className="text-2xl font-bold text-gray-900 mb-6">Activity Feed Demo</h2>
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div>
                                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Default Activity Feed</h3>
                                  <ActivityFeed 
                                    onActivityClick={(activity) => {
                                      console.log('Activity clicked:', activity);
                                      alert(`Clicked: ${activity.description}`);
                                    }}
                                    onClearAll={() => {
                                      console.log('Clear all clicked');
                                      alert('All activities cleared!');
                                    }}
                                  />
                                </div>
                                <div>
                                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Compact Feed (No Actions)</h3>
                                  <ActivityFeed 
                                    showActions={false}
                                    maxHeight="300px"
                                    className="max-w-sm"
                                  />
                                </div>
                              </div>
                            </div>
                          } 
                        />
                        <Route 
                          path="/chat-input-demo" 
                          element={
                            <div className="max-w-2xl mx-auto p-8">
                              <h2 className="text-2xl font-bold text-gray-900 mb-6">Chat Input Bar Demo</h2>
                              <div className="border border-gray-200 rounded-lg overflow-hidden">
                                <div className="h-64 bg-gray-50 flex items-center justify-center">
                                  <p className="text-gray-500">Chat messages would appear here</p>
                                </div>
                                <ChatInputBar 
                                  onSendMessage={(message) => {
                                    console.log('Message sent:', message);
                                    alert(`Message sent: "${message}"`);
                                  }}
                                  placeholder="Try typing a message..."
                                />
                              </div>
                            </div>
                          } 
                        />
                        <Route 
                          path="/chat-bubble-demo" 
                          element={
                            <div className="max-w-2xl mx-auto p-8 space-y-4">
                              <h2 className="text-2xl font-bold text-gray-900 mb-6">Chat Message Bubble Demo</h2>
                              <ChatMessageBubble 
                                message="Hello! How can I help you today?" 
                                isUser={false} 
                                timestamp={new Date(Date.now() - 300000)} 
                              />
                              <ChatMessageBubble 
                                message="I need help with my React project. Can you explain how to use hooks?" 
                                isUser={true} 
                                timestamp={new Date(Date.now() - 240000)} 
                              />
                              <ChatMessageBubble 
                                message="I'd be happy to help! React hooks are functions that let you use state and other React features in functional components. The most common hooks are useState for managing state and useEffect for side effects." 
                                isUser={false} 
                                timestamp={new Date(Date.now() - 180000)} 
                              />
                              <ChatMessageBubble 
                                message="That's really helpful, thank you!" 
                                isUser={true} 
                                timestamp={new Date(Date.now() - 120000)} 
                              />
                            </div>
                          } 
                        />
                        <Route 
                          path="/chat-sidebar-demo" 
                          element={
                            <div className="h-screen flex">
                              <ChatSidebar 
                                selectedChatId="1"
                                onChatSelect={(id) => console.log('Selected chat:', id)}
                                onNewChat={() => console.log('New chat clicked')}
                              />
                              <div className="flex-1 flex items-center justify-center bg-gray-50">
                                <div className="text-center">
                                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Chat Sidebar Demo</h2>
                                  <p className="text-gray-600">Select a chat from the sidebar to view conversation</p>
                                </div>
                              </div>
                            </div>
                          } 
                        />
                        <Route 
                          path="/notifications-demo" 
                          element={
                            <div className="max-w-4xl mx-auto p-8">
                              <h2 className="text-2xl font-bold text-gray-900 mb-6">User Notifications Panel Demo</h2>
                              <div className="relative">
                                <div className="bg-gray-100 p-8 rounded-lg">
                                  <p className="text-gray-600 mb-4">
                                    This demo shows the notifications panel that would typically appear as a dropdown from the header.
                                  </p>
                                  <UserNotificationsPanel 
                                    isOpen={true}
                                    onClose={() => console.log('Close notifications')}
                                  />
                                </div>
                              </div>
                            </div>
                          } 
                        />
                        <Route 
                          path="/billing" 
                          element={
                            <div className="max-w-6xl mx-auto">
                              <SubscriptionBillingPage />
                            </div>
                          } 
                        />
                        <Route 
                          path="/payment-method" 
                          element={
                            <div className="max-w-4xl mx-auto">
                              <PaymentMethodForm 
                                onSubmit={async (data) => {
                                  console.log('Payment method data:', data);
                                  // Simulate API call
                                  await new Promise(resolve => setTimeout(resolve, 2000));
                                  alert('Payment method saved successfully!');
                                }}
                                onCancel={() => {
                                  console.log('Payment form cancelled');
                                  alert('Payment form cancelled');
                                }}
                              />
                            </div>
                          } 
                        />
                        <Route 
                          path="/support" 
                          element={
                            <div className="max-w-6xl mx-auto">
                              <SupportFAQPage />
                            </div>
                          } 
                        />
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