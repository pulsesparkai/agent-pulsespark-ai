import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useProject } from '../../contexts/ProjectContext';
import { useApiKeys } from '../../contexts/ApiKeysContext';
import { Key, FolderOpen, Shield, TrendingUp, Plus } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { projects, createProject, loadProject, loading: projectsLoading } = useProject();
  const { apiKeys } = useApiKeys();

  const stats = [
    {
      icon: Key,
      label: 'API Keys',
      value: apiKeys.length,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700'
    },
    {
      icon: FolderOpen,
      label: 'Projects', 
      value: projects.length,
      color: 'bg-emerald-500',
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-700'
    },
    {
      icon: Shield,
      label: 'Secure Keys',
      value: apiKeys.length,
      color: 'bg-amber-500',
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-700'
    },
    {
      icon: TrendingUp,
      label: 'Active',
      value: apiKeys.length,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back!
        </h1>
        <p className="text-gray-600">
          Signed in as <span className="font-medium">{user?.email}</span>
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`w-6 h-6 ${stat.textColor}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <button
            onClick={() => createProject(`Project ${projects.length + 1}`, 'A new project created with PulseSpark AI')}
            disabled={projectsLoading}
            className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 text-left"
          >
            <Plus className="w-5 h-5 text-green-600" />
            <div>
              <h3 className="font-medium text-gray-900">Create Project</h3>
              <p className="text-sm text-gray-600">Start a new coding project</p>
            </div>
          </button>
          
          <a
            href="/api-keys"
            className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Key className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="font-medium text-gray-900">Manage API Keys</h3>
              <p className="text-sm text-gray-600">Add, view, or delete your API keys</p>
            </div>
          </a>
          
          <a
            href="/projects"
            className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <FolderOpen className="w-5 h-5 text-emerald-600" />
            <div>
              <h3 className="font-medium text-gray-900">View Projects</h3>
              <p className="text-sm text-gray-600">Browse your project portfolio</p>
            </div>
          </a>
          
          <a
            href="/settings"
            className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Shield className="w-5 h-5 text-amber-600" />
            <div>
              <h3 className="font-medium text-gray-900">Security Settings</h3>
              <p className="text-sm text-gray-600">Manage your account security</p>
            </div>
          </a>
        </div>
      </div>

      {/* Recent Projects */}
      {projects.length > 0 && (
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Projects</h2>
          <div className="space-y-3">
            {projects.slice(0, 3).map((project) => (
              <button
                key={project.id}
                onClick={() => loadProject(project.id)}
                className="flex items-center justify-between w-full p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                    <FolderOpen className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{project.name}</p>
                    <p className="text-sm text-gray-600">{project.description || 'No description'}</p>
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  {new Date(project.updated_at).toLocaleDateString()}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};