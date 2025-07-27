import React, { createContext, useContext, useState } from 'react';
import { GitHubContextType, FileNode } from '../types';
import { useNotification } from './NotificationContext';
import { Octokit } from '@octokit/rest';

const GitHubContext = createContext<GitHubContextType | undefined>(undefined);

export const useGitHub = () => {
  const context = useContext(GitHubContext);
  if (context === undefined) {
    throw new Error('useGitHub must be used within a GitHubProvider');
  }
  return context;
};

interface GitHubProviderProps {
  children: React.ReactNode;
}

export const GitHubProvider: React.FC<GitHubProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any | null>(null);
  const [repositories, setRepositories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [octokit, setOctokit] = useState<Octokit | null>(null);
  
  const { showNotification } = useNotification();

  const authenticate = async () => {
    setLoading(true);
    try {
      // In a real implementation, you would use GitHub OAuth
      // For now, we'll simulate the authentication flow
      showNotification('GitHub OAuth integration coming soon!', 'info');
      
      // Placeholder for OAuth flow
      // const token = await performGitHubOAuth();
      // const octokitInstance = new Octokit({ auth: token });
      // setOctokit(octokitInstance);
      // 
      // const { data: userData } = await octokitInstance.rest.users.getAuthenticated();
      // setUser(userData);
      // setIsAuthenticated(true);
      
    } catch (err: any) {
      setError(err.message);
      showNotification('GitHub authentication failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadRepositories = async () => {
    if (!octokit) return;

    setLoading(true);
    try {
      const { data } = await octokit.rest.repos.listForAuthenticatedUser({
        sort: 'updated',
        per_page: 100
      });
      setRepositories(data);
    } catch (err: any) {
      setError(err.message);
      showNotification('Failed to load repositories', 'error');
    } finally {
      setLoading(false);
    }
  };

  const createRepository = async (name: string, description?: string) => {
    if (!octokit) throw new Error('Not authenticated');

    try {
      const { data } = await octokit.rest.repos.createForAuthenticatedUser({
        name,
        description,
        private: false,
        auto_init: true
      });
      
      setRepositories(prev => [data, ...prev]);
      showNotification('Repository created successfully', 'success');
      return data;
    } catch (err: any) {
      showNotification('Failed to create repository', 'error');
      throw err;
    }
  };

  const pushFiles = async (repoName: string, files: FileNode[], commitMessage: string) => {
    if (!octokit || !user) throw new Error('Not authenticated');

    setLoading(true);
    try {
      // Get the repository
      const { data: repo } = await octokit.rest.repos.get({
        owner: user.login,
        repo: repoName
      });

      // Get the latest commit SHA
      const { data: ref } = await octokit.rest.git.getRef({
        owner: user.login,
        repo: repoName,
        ref: 'heads/main'
      });

      const latestCommitSha = ref.object.sha;

      // Create blobs for all files
      const blobs = await Promise.all(
        flattenFiles(files)
          .filter(file => file.type === 'file' && file.content)
          .map(async (file) => {
            const { data: blob } = await octokit.rest.git.createBlob({
              owner: user.login,
              repo: repoName,
              content: file.content!,
              encoding: 'utf-8'
            });
            return {
              path: file.path.startsWith('/') ? file.path.slice(1) : file.path,
              mode: '100644' as const,
              type: 'blob' as const,
              sha: blob.sha
            };
          })
      );

      // Create tree
      const { data: tree } = await octokit.rest.git.createTree({
        owner: user.login,
        repo: repoName,
        tree: blobs,
        base_tree: latestCommitSha
      });

      // Create commit
      const { data: commit } = await octokit.rest.git.createCommit({
        owner: user.login,
        repo: repoName,
        message: commitMessage,
        tree: tree.sha,
        parents: [latestCommitSha]
      });

      // Update reference
      await octokit.rest.git.updateRef({
        owner: user.login,
        repo: repoName,
        ref: 'heads/main',
        sha: commit.sha
      });

      showNotification('Files pushed to GitHub successfully', 'success');
    } catch (err: any) {
      setError(err.message);
      showNotification('Failed to push files to GitHub', 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const flattenFiles = (files: FileNode[]): FileNode[] => {
    const result: FileNode[] = [];
    
    const traverse = (nodes: FileNode[]) => {
      for (const node of nodes) {
        result.push(node);
        if (node.children) {
          traverse(node.children);
        }
      }
    };
    
    traverse(files);
    return result;
  };

  const value: GitHubContextType = {
    isAuthenticated,
    user,
    repositories,
    loading,
    error,
    authenticate,
    loadRepositories,
    createRepository,
    pushFiles
  };

  return (
    <GitHubContext.Provider value={value}>
      {children}
    </GitHubContext.Provider>
  );
};