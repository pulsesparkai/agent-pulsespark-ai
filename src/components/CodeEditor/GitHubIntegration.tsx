import React, { useState } from 'react';
import { Github, GitBranch, Upload, Plus, ExternalLink } from 'lucide-react';
import { useGitHub } from '../../contexts/GitHubContext';
import { useProject } from '../../contexts/ProjectContext';
import { useNotification } from '../../contexts/NotificationContext';
import { LoadingSpinner } from '../Shared/LoadingSpinner';

interface GitHubIntegrationProps {
  className?: string;
}

export const GitHubIntegration: React.FC<GitHubIntegrationProps> = ({ className = '' }) => {
  const { 
    isAuthenticated, 
    user, 
    repositories, 
    loading, 
    authenticate, 
    loadRepositories, 
    createRepository, 
    pushFiles 
  } = useGitHub();
  
  const { currentProject } = useProject();
  const { showNotification } = useNotification();
  
  const [showPushDialog, setShowPushDialog] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState<string>('');
  const [newRepoName, setNewRepoName] = useState('');
  const [newRepoDescription, setNewRepoDescription] = useState('');
  const [commitMessage, setCommitMessage] = useState('Initial commit from PulseSpark AI');
  const [isCreatingRepo, setIsCreatingRepo] = useState(false);
  const [isPushing, setIsPushing] = useState(false);

  const handleAuthenticate = async () => {
    try {
      await authenticate();
      if (isAuthenticated) {
        await loadRepositories();
      }
    } catch (error) {
      console.error('Authentication failed:', error);
    }
  };

  const handlePushToGitHub = () => {
    if (!currentProject) {
      showNotification('No project selected', 'error');
      return;
    }

    if (!isAuthenticated) {
      handleAuthenticate();
      return;
    }

    setShowPushDialog(true);
    setNewRepoName(currentProject.name.toLowerCase().replace(/\s+/g, '-'));
    setNewRepoDescription(currentProject.description || `Project created with PulseSpark AI`);
  };

  const handleCreateAndPush = async () => {
    if (!currentProject || !newRepoName.trim()) return;

    setIsCreatingRepo(true);
    try {
      const repo = await createRepository(newRepoName.trim(), newRepoDescription.trim());
      setSelectedRepo(repo.name);
      
      // Auto-push to the new repository
      await handlePush(repo.name);
    } catch (error) {
      console.error('Failed to create repository:', error);
    } finally {
      setIsCreatingRepo(false);
    }
  };

  const handlePush = async (repoName?: string) => {
    if (!currentProject) return;

    const targetRepo = repoName || selectedRepo;
    if (!targetRepo) {
      showNotification('Please select a repository', 'error');
      return;
    }

    setIsPushing(true);
    try {
      await pushFiles(targetRepo, currentProject.file_tree, commitMessage);
      setShowPushDialog(false);
      showNotification('Successfully pushed to GitHub!', 'success');
    } catch (error) {
      console.error('Failed to push to GitHub:', error);
    } finally {
      setIsPushing(false);
    }
  };

  return (
    <>
      {/* Push to GitHub Button */}
      <button
        onClick={handlePushToGitHub}
        disabled={!currentProject || loading}
        className={`
          flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg 
          hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed 
          transition-colors ${className}
        `}
        title="Push project to GitHub"
      >
        {loading ? (
          <LoadingSpinner size="sm" />
        ) : (
          <Github className="w-4 h-4" />
        )}
        <span className="hidden sm:inline">Push to GitHub</span>
      </button>

      {/* Push Dialog */}
      {showPushDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-screen overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Github className="w-5 h-5" />
                Push to GitHub
              </h2>
              <button
                onClick={() => setShowPushDialog(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6">
              {!isAuthenticated ? (
                <div className="text-center">
                  <Github className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium mb-2">Connect to GitHub</h3>
                  <p className="text-gray-600 mb-4">
                    Authenticate with GitHub to push your project
                  </p>
                  <button
                    onClick={handleAuthenticate}
                    disabled={loading}
                    className="flex items-center gap-2 mx-auto px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors"
                  >
                    {loading ? <LoadingSpinner size="sm" /> : <Github className="w-4 h-4" />}
                    Connect GitHub
                  </button>
                </div>
              ) : (
                <>
                  {/* User Info */}
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                      <Github className="w-4 h-4 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {user?.login || 'GitHub User'}
                      </p>
                      <p className="text-sm text-gray-600">Connected</p>
                    </div>
                  </div>

                  {/* Repository Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Repository
                    </label>
                    <select
                      value={selectedRepo}
                      onChange={(e) => setSelectedRepo(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select existing repository...</option>
                      {repositories.map((repo) => (
                        <option key={repo.id} value={repo.name}>
                          {repo.name} {repo.private ? '(Private)' : '(Public)'}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Create New Repository */}
                  <div className="border-t border-gray-200 pt-4">
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                      <Plus className="w-4 h-4" />
                      Or create new repository
                    </h4>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Repository Name
                        </label>
                        <input
                          type="text"
                          value={newRepoName}
                          onChange={(e) => setNewRepoName(e.target.value)}
                          placeholder="my-awesome-project"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Description (optional)
                        </label>
                        <input
                          type="text"
                          value={newRepoDescription}
                          onChange={(e) => setNewRepoDescription(e.target.value)}
                          placeholder="Project description"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Commit Message */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Commit Message
                    </label>
                    <input
                      type="text"
                      value={commitMessage}
                      onChange={(e) => setCommitMessage(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => setShowPushDialog(false)}
                      disabled={isPushing || isCreatingRepo}
                      className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    
                    {newRepoName.trim() ? (
                      <button
                        onClick={handleCreateAndPush}
                        disabled={isPushing || isCreatingRepo || !commitMessage.trim()}
                        className="flex-1 flex justify-center items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
                      >
                        {isCreatingRepo ? (
                          <>
                            <LoadingSpinner size="sm" />
                            Creating...
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4" />
                            Create & Push
                          </>
                        )}
                      </button>
                    ) : (
                      <button
                        onClick={() => handlePush()}
                        disabled={isPushing || !selectedRepo || !commitMessage.trim()}
                        className="flex-1 flex justify-center items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                      >
                        {isPushing ? (
                          <>
                            <LoadingSpinner size="sm" />
                            Pushing...
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4" />
                            Push
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};