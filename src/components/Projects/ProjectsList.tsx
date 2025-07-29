import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { LoadingSpinner } from '../Shared/LoadingSpinner';
import { supabase } from '../../lib/supabase';
import { 
  FolderOpen, 
  Plus, 
  Trash2, 
  Edit2, 
  Calendar, 
  FileText,
  AlertTriangle,
  X,
  Save
} from 'lucide-react';

// Type definitions for project data
interface Project {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  file_tree: any[];
  github_repo?: string;
  github_branch?: string;
  created_at: string;
  updated_at: string;
}

interface CreateProjectData {
  name: string;
  description: string;
}

interface ProjectsListProps {
  className?: string;
}

/**
 * ProjectsList Component
 * 
 * Displays and manages the current user's projects with full CRUD operations.
 * Features secure data fetching, modern UI, and comprehensive error handling.
 * Integrates with Supabase RLS for user data isolation.
 */
export const ProjectsList: React.FC<ProjectsListProps> = ({ className = '' }) => {
  // Authentication and notifications
  const { user } = useAuth();
  const { showNotification } = useNotification();

  // State management for projects and UI
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal and form state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [createFormData, setCreateFormData] = useState<CreateProjectData>({
    name: '',
    description: ''
  });
  const [deleteProjectId, setDeleteProjectId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Form validation errors
  const [formErrors, setFormErrors] = useState<{
    name?: string;
    description?: string;
  }>({});

  // Pagination state for future enhancement
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const PROJECTS_PER_PAGE = 12;

  /**
   * Fetch projects for the current user from Supabase
   * Uses RLS policies to ensure user can only see their own projects
   */
  const fetchProjects = useCallback(async () => {
    if (!user) {
      setProjects([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Query projects table with RLS automatically filtering by user
      const { data, error: fetchError, count } = await supabase
        .from('projects')
        .select('*', { count: 'exact' })
        .order('updated_at', { ascending: false })
        .range((currentPage - 1) * PROJECTS_PER_PAGE, currentPage * PROJECTS_PER_PAGE - 1);

      if (fetchError) {
        throw fetchError;
      }

      setProjects(data || []);
      setHasMore((count || 0) > currentPage * PROJECTS_PER_PAGE);

    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch projects';
      setError(errorMessage);
      showNotification(`Error loading projects: ${errorMessage}`, 'error');
      console.error('Error fetching projects:', err);
    } finally {
      setLoading(false);
    }
  }, [user, currentPage, showNotification]);

  // Load projects on component mount and user change
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  /**
   * Validate create project form data
   * Returns validation errors or empty object if valid
   */
  const validateCreateForm = useCallback((): { name?: string; description?: string } => {
    const errors: { name?: string; description?: string } = {};

    // Project name validation
    if (!createFormData.name.trim()) {
      errors.name = 'Project name is required';
    } else if (createFormData.name.trim().length < 2) {
      errors.name = 'Project name must be at least 2 characters';
    } else if (createFormData.name.trim().length > 100) {
      errors.name = 'Project name must be less than 100 characters';
    }

    // Description validation (optional but with length limit)
    if (createFormData.description.length > 500) {
      errors.description = 'Description must be less than 500 characters';
    }

    return errors;
  }, [createFormData]);

  /**
   * Handle creating a new project
   * Validates form data and creates project in Supabase
   */
  const handleCreateProject = useCallback(async () => {
    if (!user) {
      showNotification('You must be logged in to create projects', 'error');
      return;
    }

    // Validate form data
    const validationErrors = validateCreateForm();
    if (Object.keys(validationErrors).length > 0) {
      setFormErrors(validationErrors);
      return;
    }

    setIsCreating(true);
    setFormErrors({});

    try {
      // Create project with default file structure
      const newProject = {
        name: createFormData.name.trim(),
        description: createFormData.description.trim() || null,
        file_tree: [
          {
            id: crypto.randomUUID(),
            name: 'README.md',
            type: 'file',
            path: '/README.md',
            content: `# ${createFormData.name.trim()}\n\n${createFormData.description.trim() || 'A new project created with PulseSpark AI'}\n\n## Getting Started\n\nThis project was generated using PulseSpark AI.\n`,
            language: 'markdown',
            lastModified: new Date().toISOString()
          }
        ],
        github_branch: 'main'
      };

      const { data, error: createError } = await supabase
        .from('projects')
        .insert(newProject)
        .select()
        .single();

      if (createError) {
        throw createError;
      }

      // Add new project to state with animation
      setProjects(prev => [data, ...prev]);
      
      // Reset form and close modal
      setCreateFormData({ name: '', description: '' });
      setShowCreateModal(false);
      
      showNotification('Project created successfully!', 'success');

    } catch (err: any) {
      const errorMessage = err.message || 'Failed to create project';
      showNotification(`Error creating project: ${errorMessage}`, 'error');
      console.error('Error creating project:', err);
    } finally {
      setIsCreating(false);
    }
  }, [user, createFormData, validateCreateForm, showNotification]);

  /**
   * Handle deleting a project
   * Shows confirmation dialog and deletes from Supabase
   */
  const handleDeleteProject = useCallback(async () => {
    if (!deleteProjectId) return;

    setIsDeleting(true);

    try {
      const { error: deleteError } = await supabase
        .from('projects')
        .delete()
        .eq('id', deleteProjectId);

      if (deleteError) {
        throw deleteError;
      }

      // Remove project from state with animation
      setProjects(prev => prev.filter(project => project.id !== deleteProjectId));
      
      setShowDeleteModal(false);
      setDeleteProjectId(null);
      
      showNotification('Project deleted successfully', 'success');

    } catch (err: any) {
      const errorMessage = err.message || 'Failed to delete project';
      showNotification(`Error deleting project: ${errorMessage}`, 'error');
      console.error('Error deleting project:', err);
    } finally {
      setIsDeleting(false);
    }
  }, [deleteProjectId, showNotification]);

  /**
   * Handle form input changes
   * Updates form data and clears related validation errors
   */
  const handleInputChange = useCallback((field: keyof CreateProjectData, value: string) => {
    setCreateFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear validation error for this field
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, [formErrors]);

  /**
   * Format date for display
   * Converts ISO timestamp to readable format
   */
  const formatDate = useCallback((dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      if (diffInDays === 1) {
        return 'Yesterday';
      } else if (diffInDays < 7) {
        return `${diffInDays} days ago`;
      } else {
        return date.toLocaleDateString();
      }
    }
  }, []);

  /**
   * Handle opening delete confirmation
   * Sets up delete modal with project information
   */
  const openDeleteConfirmation = useCallback((projectId: string) => {
    setDeleteProjectId(projectId);
    setShowDeleteModal(true);
  }, []);

  /**
   * Handle closing modals
   * Resets form state and closes modals
   */
  const closeCreateModal = useCallback(() => {
    setShowCreateModal(false);
    setCreateFormData({ name: '', description: '' });
    setFormErrors({});
  }, []);

  const closeDeleteModal = useCallback(() => {
    setShowDeleteModal(false);
    setDeleteProjectId(null);
  }, []);

  // Show loading state
  if (loading && projects.length === 0) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="text-gray-400 mt-4">Loading your projects...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error && projects.length === 0) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Failed to Load Projects</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <button
            onClick={fetchProjects}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gray-900 ${className}`}>
      {/* Page Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center">
                <FolderOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Projects</h1>
                <p className="text-gray-400 mt-1">
                  {projects.length} project{projects.length !== 1 ? 's' : ''} • Manage your coding projects
                </p>
              </div>
            </div>
            
            {/* Create Project Button */}
            <button
              onClick={() => setShowCreateModal(true)}
              className="
                flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg
                hover:bg-green-700 transition-all duration-200 transform hover:scale-105
                focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-900
                shadow-lg hover:shadow-xl
              "
            >
              <Plus className="w-5 h-5" />
              <span className="font-semibold">New Project</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {projects.length === 0 ? (
          /* Empty State */
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <FolderOpen className="w-12 h-12 text-gray-500" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">No Projects Yet</h3>
            <p className="text-gray-400 mb-8 max-w-md mx-auto">
              Create your first project to start building amazing applications with PulseSpark AI.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="
                flex items-center gap-2 mx-auto px-8 py-4 bg-green-600 text-white rounded-lg
                hover:bg-green-700 transition-all duration-200 transform hover:scale-105
                focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-900
                shadow-lg hover:shadow-xl font-semibold
              "
            >
              <Plus className="w-5 h-5" />
              Create Your First Project
            </button>
          </div>
        ) : (
          /* Projects Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div
                key={project.id}
                className="
                  bg-gray-800 border border-gray-700 rounded-xl p-6 
                  hover:border-green-500 transition-all duration-200 
                  transform hover:scale-105 hover:shadow-xl
                  group relative overflow-hidden
                "
              >
                {/* Project Card Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FolderOpen className="w-5 h-5 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-white text-lg truncate group-hover:text-green-400 transition-colors">
                        {project.name}
                      </h3>
                      <p className="text-sm text-gray-400">
                        {project.file_tree?.length || 0} files
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openDeleteConfirmation(project.id)}
                      className="
                        p-2 text-gray-400 hover:text-red-400 hover:bg-red-900/20 
                        rounded-lg transition-colors
                        focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-800
                      "
                      title="Delete project"
                      aria-label={`Delete project ${project.name}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Project Description */}
                {project.description && (
                  <p className="text-gray-300 text-sm mb-4 line-clamp-3 leading-relaxed">
                    {project.description}
                  </p>
                )}

                {/* Project Metadata */}
                <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>Updated {formatDate(project.updated_at)}</span>
                  </div>
                  {project.github_repo && (
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>GitHub</span>
                    </div>
                  )}
                </div>

                {/* Open Project Button */}
                <button
                  onClick={() => {
                    // Navigate to project or open in editor
                    showNotification(`Opening project: ${project.name}`, 'info');
                  }}
                  className="
                    w-full flex items-center justify-center gap-2 py-3 px-4
                    bg-gray-700 text-white rounded-lg border border-gray-600
                    hover:bg-gray-600 hover:border-green-500 transition-all duration-200
                    focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-800
                    font-medium
                  "
                >
                  <FileText className="w-4 h-4" />
                  Open Project
                </button>

                {/* Hover Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-green-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-xl" />
              </div>
            ))}
          </div>
        )}

        {/* Load More Button (for future pagination) */}
        {hasMore && (
          <div className="text-center mt-8">
            <button
              onClick={() => setCurrentPage(prev => prev + 1)}
              disabled={loading}
              className="
                px-6 py-3 bg-gray-800 text-white rounded-lg border border-gray-600
                hover:bg-gray-700 hover:border-green-500 transition-colors
                disabled:opacity-50 disabled:cursor-not-allowed
                focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-900
              "
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <LoadingSpinner size="sm" />
                  Loading...
                </div>
              ) : (
                'Load More Projects'
              )}
            </button>
          </div>
        )}
      </div>

      {/* Create Project Modal */}
      {showCreateModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={closeCreateModal}
        >
          <div
            className="bg-gray-800 rounded-xl shadow-2xl max-w-md w-full border border-gray-700"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-project-title"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <h2 id="create-project-title" className="text-xl font-bold text-white">
                Create New Project
              </h2>
              <button
                onClick={closeCreateModal}
                disabled={isCreating}
                className="
                  p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors
                  focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-800
                  disabled:opacity-50
                "
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Project Name Field */}
              <div>
                <label htmlFor="projectName" className="block text-sm font-semibold text-gray-300 mb-2">
                  Project Name *
                </label>
                <input
                  id="projectName"
                  type="text"
                  value={createFormData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={`
                    w-full px-4 py-3 bg-gray-700 border rounded-lg text-white placeholder-gray-400
                    focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent
                    disabled:opacity-50 disabled:cursor-not-allowed transition-colors
                    ${formErrors.name ? 'border-red-500 bg-red-900/20' : 'border-gray-600 hover:border-gray-500'}
                  `}
                  placeholder="My Awesome Project"
                  disabled={isCreating}
                  autoFocus
                  maxLength={100}
                />
                {formErrors.name && (
                  <p className="mt-2 text-sm text-red-400 flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" />
                    {formErrors.name}
                  </p>
                )}
              </div>

              {/* Project Description Field */}
              <div>
                <label htmlFor="projectDescription" className="block text-sm font-semibold text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  id="projectDescription"
                  value={createFormData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={4}
                  className={`
                    w-full px-4 py-3 bg-gray-700 border rounded-lg text-white placeholder-gray-400
                    focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent
                    disabled:opacity-50 disabled:cursor-not-allowed transition-colors resize-vertical
                    ${formErrors.description ? 'border-red-500 bg-red-900/20' : 'border-gray-600 hover:border-gray-500'}
                  `}
                  placeholder="A brief description of your project (optional)"
                  disabled={isCreating}
                  maxLength={500}
                />
                {formErrors.description && (
                  <p className="mt-2 text-sm text-red-400 flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" />
                    {formErrors.description}
                  </p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  {createFormData.description.length}/500 characters
                </p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-3 p-6 border-t border-gray-700">
              <button
                onClick={closeCreateModal}
                disabled={isCreating}
                className="
                  flex-1 px-4 py-3 bg-gray-700 text-gray-300 rounded-lg border border-gray-600
                  hover:bg-gray-600 hover:text-white transition-colors font-medium
                  focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-800
                  disabled:opacity-50 disabled:cursor-not-allowed
                "
              >
                Cancel
              </button>
              <button
                onClick={handleCreateProject}
                disabled={isCreating || !createFormData.name.trim()}
                className="
                  flex-1 flex justify-center items-center gap-2 px-4 py-3 
                  bg-green-600 text-white rounded-lg font-medium
                  hover:bg-green-700 transition-colors
                  focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-800
                  disabled:opacity-50 disabled:cursor-not-allowed
                "
              >
                {isCreating ? (
                  <>
                    <LoadingSpinner size="sm" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Create Project
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deleteProjectId && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={closeDeleteModal}
        >
          <div
            className="bg-gray-800 rounded-xl shadow-2xl max-w-md w-full border border-gray-700"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-project-title"
          >
            {/* Modal Header */}
            <div className="flex items-center gap-3 p-6 border-b border-gray-700">
              <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
              <h2 id="delete-project-title" className="text-xl font-bold text-white">
                Delete Project
              </h2>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <p className="text-gray-300 mb-4">
                Are you sure you want to delete this project? This action cannot be undone and will permanently remove:
              </p>
              <ul className="text-gray-400 text-sm space-y-1 mb-6 ml-4">
                <li>• All project files and folders</li>
                <li>• Project configuration and settings</li>
                <li>• Associated memory items and chat history</li>
                <li>• Any linked GitHub repository connections</li>
              </ul>
              
              {/* Project Details */}
              {(() => {
                const project = projects.find(p => p.id === deleteProjectId);
                return project ? (
                  <div className="bg-gray-700 rounded-lg p-4 mb-6">
                    <div className="flex items-center gap-3">
                      <FolderOpen className="w-5 h-5 text-red-400" />
                      <div>
                        <p className="font-semibold text-white">{project.name}</p>
                        {project.description && (
                          <p className="text-sm text-gray-400">{project.description}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          Created {formatDate(project.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : null;
              })()}
            </div>

            {/* Modal Actions */}
            <div className="flex gap-3 p-6 border-t border-gray-700">
              <button
                onClick={closeDeleteModal}
                disabled={isDeleting}
                className="
                  flex-1 px-4 py-3 bg-gray-700 text-gray-300 rounded-lg border border-gray-600
                  hover:bg-gray-600 hover:text-white transition-colors font-medium
                  focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-800
                  disabled:opacity-50 disabled:cursor-not-allowed
                "
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteProject}
                disabled={isDeleting}
                className="
                  flex-1 flex justify-center items-center gap-2 px-4 py-3 
                  bg-red-600 text-white rounded-lg font-medium
                  hover:bg-red-700 transition-colors
                  focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-800
                  disabled:opacity-50 disabled:cursor-not-allowed
                "
              >
                {isDeleting ? (
                  <>
                    <LoadingSpinner size="sm" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete Project
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};