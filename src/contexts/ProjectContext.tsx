import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { ProjectContextType, Project, FileNode } from '../types';
import { useAuth } from './AuthContext';
import { useNotification } from './NotificationContext';
import { v4 as uuidv4 } from 'uuid';

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
};

interface ProjectProviderProps {
  children: React.ReactNode;
}

export const ProjectProvider: React.FC<ProjectProviderProps> = ({ children }) => {
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { user } = useAuth();
  const { showNotification } = useNotification();

  // Auto-save debounce timer
  const [saveTimer, setSaveTimer] = useState<NodeJS.Timeout | null>(null);

  // Load user's projects on mount
  useEffect(() => {
    if (user) {
      loadUserProjects();
    }
  }, [user]);

  /**
   * Load all projects for the current user from Supabase
   * Called on component mount and after project operations
   */
  const loadUserProjects = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Query projects table which references auth.users(id) via user_id foreign key
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
      
      // Load the most recent project if available
      if (data && data.length > 0) {
        setCurrentProject(data[0]);
      }
    } catch (err: any) {
      setError(err.message);
      showNotification('Failed to load projects', 'error');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Create a new project with default file structure
   * @param name - Project name
   * @param description - Optional project description
   */
  const createProject = async (name: string, description?: string) => {
    if (!user) return;

    setLoading(true);
    try {
      const newProject: Omit<Project, 'id' | 'created_at' | 'updated_at'> = {
        user_id: user.id,
        name,
        description,
        file_tree: [
          {
            id: uuidv4(),
            name: 'src',
            type: 'folder',
            path: '/src',
            children: [
              {
                id: uuidv4(),
                name: 'App.tsx',
                type: 'file',
                path: '/src/App.tsx',
                language: 'typescript',
                content: `import React from 'react';\n\nfunction App() {\n  return (\n    <div className="App">\n      <h1>Hello World</h1>\n    </div>\n  );\n}\n\nexport default App;`,
                lastModified: new Date().toISOString()
              }
            ],
            lastModified: new Date().toISOString()
          },
          {
            id: uuidv4(),
            name: 'README.md',
            type: 'file',
            path: '/README.md',
            language: 'markdown',
            content: `# ${name}\n\n${description || 'A new project created with PulseSpark AI'}\n\n## Getting Started\n\nThis project was generated using PulseSpark AI.\n`,
            lastModified: new Date().toISOString()
          }
        ]
      };

      const { data, error } = await supabase
        .from('projects')
        .insert(newProject)
        .select()
        .single();

      if (error) throw error;

      setCurrentProject(data);
      setProjects(prev => [data, ...prev]);
      showNotification('Project created successfully', 'success');
    } catch (err: any) {
      setError(err.message);
      showNotification('Failed to create project', 'error');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Load a specific project by ID
   * @param projectId - UUID of the project to load
   */
  const loadProject = async (projectId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (error) throw error;
      setCurrentProject(data);
      setSelectedFile(null); // Clear selected file when switching projects
    } catch (err: any) {
      setError(err.message);
      showNotification('Failed to load project', 'error');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Save current project to Supabase
   * Called automatically after file operations with debounce
   */
  const saveProject = async () => {
    if (!currentProject) return;

    try {
      const { error } = await supabase
        .from('projects')
        .update({
          file_tree: currentProject.file_tree,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentProject.id);

      if (error) throw error;
    } catch (err: any) {
      console.error('Failed to save project:', err);
      showNotification('Failed to save project', 'error');
    }
  };

  /**
   * Debounced save function to prevent excessive API calls
   * Saves project 1 second after the last change
   */
  const debouncedSave = () => {
    if (saveTimer) {
      clearTimeout(saveTimer);
    }
    
    const timer = setTimeout(() => {
      saveProject();
    }, 1000); // Save after 1 second of inactivity
    
    setSaveTimer(timer);
  };

  /**
   * Delete a project with confirmation
   * @param projectId - UUID of the project to delete
   */
  const deleteProject = async (projectId: string) => {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (error) throw error;

      setProjects(prev => prev.filter(p => p.id !== projectId));
      if (currentProject?.id === projectId) {
        setCurrentProject(null);
        setSelectedFile(null);
      }
      showNotification('Project deleted successfully', 'success');
    } catch (err: any) {
      showNotification('Failed to delete project', 'error');
    }
  };

  // Helper function to find a file by ID in the tree
  const findFileById = (files: FileNode[], id: string): FileNode | null => {
    for (const file of files) {
      if (file.id === id) return file;
      if (file.children) {
        const found = findFileById(file.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  // Helper function to update a file in the tree
  const updateFileInTree = (files: FileNode[], fileId: string, updates: Partial<FileNode>): FileNode[] => {
    return files.map(file => {
      if (file.id === fileId) {
        return { ...file, ...updates, lastModified: new Date().toISOString() };
      }
      if (file.children) {
        return { ...file, children: updateFileInTree(file.children, fileId, updates) };
      }
      return file;
    });
  };

  /**
   * Create a new file or folder
   * @param parentId - ID of parent folder (null for root)
   * @param name - Name of the new file/folder
   * @param type - 'file' or 'folder'
   */
  const createFile = async (parentId: string | null, name: string, type: 'file' | 'folder') => {
    if (!currentProject) return;

    const newFile: FileNode = {
      id: uuidv4(),
      name,
      type,
      path: parentId ? `${findFileById(currentProject.file_tree, parentId)?.path}/${name}` : `/${name}`,
      content: type === 'file' ? '' : undefined,
      children: type === 'folder' ? [] : undefined,
      parentId: parentId || undefined,
      language: type === 'file' ? getLanguageFromExtension(name) : undefined,
      lastModified: new Date().toISOString()
    };

    let updatedTree: FileNode[];
    
    if (parentId) {
      // Add to parent folder
      updatedTree = updateFileInTree(currentProject.file_tree, parentId, {
        children: [...(findFileById(currentProject.file_tree, parentId)?.children || []), newFile]
      });
    } else {
      // Add to root
      updatedTree = [...currentProject.file_tree, newFile];
    }

    setCurrentProject({ ...currentProject, file_tree: updatedTree });
    debouncedSave();
    showNotification(`${type === 'file' ? 'File' : 'Folder'} created successfully`, 'success');
  };

  /**
   * Select a file for editing
   * @param file - FileNode to select
   */
  const selectFile = (file: FileNode) => {
    setSelectedFile(file);
  };

  /**
   * Update file content with auto-save
   * @param fileId - ID of the file to update
   * @param content - New file content
   */
  const updateFileContent = async (fileId: string, content: string) => {
    if (!currentProject) return;

    const updatedTree = updateFileInTree(currentProject.file_tree, fileId, { content });
    setCurrentProject({ ...currentProject, file_tree: updatedTree });
    
    // Update selected file if it's the one being edited
    if (selectedFile?.id === fileId) {
      setSelectedFile({ ...selectedFile, content, lastModified: new Date().toISOString() });
    }
    
    debouncedSave();
  };

  /**
   * Rename a file or folder
   * @param fileId - ID of the file to rename
   * @param newName - New name for the file
   */
  const renameFile = async (fileId: string, newName: string) => {
    if (!currentProject) return;

    const file = findFileById(currentProject.file_tree, fileId);
    if (!file) return;

    const newPath = file.path.replace(file.name, newName);
    const updatedTree = updateFileInTree(currentProject.file_tree, fileId, { 
      name: newName, 
      path: newPath,
      language: file.type === 'file' ? getLanguageFromExtension(newName) : undefined
    });

    setCurrentProject({ ...currentProject, file_tree: updatedTree });
    
    if (selectedFile?.id === fileId) {
      setSelectedFile({ ...selectedFile, name: newName, path: newPath });
    }
    
    debouncedSave();
    showNotification('File renamed successfully', 'success');
  };

  // Helper function to remove a file from the tree
  const removeFileFromTree = (files: FileNode[], fileId: string): FileNode[] => {
    return files.filter(file => {
      if (file.id === fileId) return false;
      if (file.children) {
        file.children = removeFileFromTree(file.children, fileId);
      }
      return true;
    });
  };

  /**
   * Delete a file or folder
   * @param fileId - ID of the file to delete
   */
  const deleteFile = async (fileId: string) => {
    if (!currentProject) return;

    const updatedTree = removeFileFromTree(currentProject.file_tree, fileId);
    setCurrentProject({ ...currentProject, file_tree: updatedTree });
    
    if (selectedFile?.id === fileId) {
      setSelectedFile(null);
    }
    
    debouncedSave();
    showNotification('File deleted successfully', 'success');
  };

  /**
   * Push project to GitHub (placeholder for GitHub integration)
   * @param repoName - Name of the GitHub repository
   * @param isNewRepo - Whether to create a new repository
   */
  const pushToGitHub = async (repoName: string, isNewRepo: boolean) => {
    // This will be implemented with GitHub integration
    showNotification('GitHub integration coming soon!', 'info');
  };

  /**
   * Get programming language from file extension
   * @param filename - Name of the file
   * @returns Language identifier for syntax highlighting
   */
  const getLanguageFromExtension = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase();
    const languageMap: Record<string, string> = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'py': 'python',
      'json': 'json',
      'html': 'html',
      'css': 'css',
      'scss': 'scss',
      'md': 'markdown',
      'yml': 'yaml',
      'yaml': 'yaml',
      'xml': 'xml',
      'sql': 'sql',
      'sh': 'shell',
      'bash': 'shell'
    };
    return languageMap[ext || ''] || 'plaintext';
  };

  const value: ProjectContextType = {
    currentProject,
    projects,
    selectedFile,
    loading,
    error,
    createProject,
    loadProject,
    saveProject,
    deleteProject,
    createFile,
    selectFile,
    updateFileContent,
    renameFile,
    deleteFile,
    pushToGitHub
  };

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
};