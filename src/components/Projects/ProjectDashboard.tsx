import React, { useState } from 'react';
import { 
  FolderOpen, 
  Plus, 
  Edit2, 
  Trash2, 
  Save, 
  X, 
  Github, 
  Calendar,
  Settings,
  Key,
  Home
} from 'lucide-react';

// Type definitions for project data
interface Project {
  id: string;
  name: string;
  description: string;
  githubRepo?: string;
  branch: string;
  lastUpdated: Date;
  createdAt: Date;
}

interface ProjectFormData {
  name: string;
  description: string;
  githubRepo: string;
  branch: string;
}

/**
 * ProjectDashboard Component
 * 
 * A comprehensive project management dashboard with PulseSpark branding featuring:
 * - Left sidebar navigation with menu items
 * - Main content area with project cards grid
 * - Project details panel for editing
 * - Add new project modal
 * - Responsive design with green and white branding
 */
export const ProjectDashboard: React.FC = () => {
  // Navigation state management
  const [activeMenuItem, setActiveMenuItem] = useState('Projects');
  
  // Project state management
  const [projects, setProjects] = useState<Project[]>([
    {
      id: '1',
      name: 'E-commerce Website',
      description: 'Full-stack React e-commerce platform with payment integration',
      githubRepo: 'https://github.com/user/ecommerce-app',
      branch: 'main',
      lastUpdated: new Date(Date.now() - 86400000), // 1 day ago
      createdAt: new Date(Date.now() - 604800000), // 1 week ago
    },
    {
      id: '2',
      name: 'Task Management App',
      description: 'Collaborative task management tool with real-time updates',
      githubRepo: 'https://github.com/user/task-manager',
      branch: 'develop',
      lastUpdated: new Date(Date.now() - 3600000), // 1 hour ago
      createdAt: new Date(Date.now() - 1209600000), // 2 weeks ago
    },
    {
      id: '3',
      name: 'Weather Dashboard',
      description: 'Interactive weather dashboard with charts and forecasts',
      branch: 'main',
      lastUpdated: new Date(Date.now() - 7200000), // 2 hours ago
      createdAt: new Date(Date.now() - 259200000), // 3 days ago
    }
  ]);
  
  // Selected project and editing state
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState<ProjectFormData>({
    name: '',
    description: '',
    githubRepo: '',
    branch: 'main'
  });
  
  // New project modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProjectData, setNewProjectData] = useState<ProjectFormData>({
    name: '',
    description: '',
    githubRepo: '',
    branch: 'main'
  });
  
  // Form validation errors
  const [errors, setErrors] = useState<{
    name?: string;
    description?: string;
  }>({});

  // Navigation menu items with icons
  const menuItems = [
    { name: 'Dashboard', icon: Home },
    { name: 'Projects', icon: FolderOpen },
    { name: 'API Keys', icon: Key },
    { name: 'Settings', icon: Settings }
  ];

  /**
   * Handle menu item selection
   */
  const handleMenuClick = (menuName: string) => {
    setActiveMenuItem(menuName);
    // Clear selected project when switching menu items
    if (menuName !== 'Projects') {
      setSelectedProject(null);
      setIsEditing(false);
    }
  };

  /**
   * Handle project card selection
   */
  const handleProjectSelect = (project: Project) => {
    setSelectedProject(project);
    setEditFormData({
      name: project.name,
      description: project.description,
      githubRepo: project.githubRepo || '',
      branch: project.branch
    });
    setIsEditing(false);
  };

  /**
   * Handle project editing
   */
  const handleEditProject = () => {
    setIsEditing(true);
  };

  /**
   * Handle saving project edits
   */
  const handleSaveEdit = () => {
    // Validate form data
    const newErrors: { name?: string; description?: string } = {};
    
    if (!editFormData.name.trim()) {
      newErrors.name = 'Project name is required';
    }
    
    if (!editFormData.description.trim()) {
      newErrors.description = 'Project description is required';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    // Update project in state
    if (selectedProject) {
      const updatedProjects = projects.map(project =>
        project.id === selectedProject.id
          ? {
              ...project,
              name: editFormData.name,
              description: editFormData.description,
              githubRepo: editFormData.githubRepo,
              branch: editFormData.branch,
              lastUpdated: new Date()
            }
          : project
      );
      
      setProjects(updatedProjects);
      setSelectedProject({
        ...selectedProject,
        name: editFormData.name,
        description: editFormData.description,
        githubRepo: editFormData.githubRepo,
        branch: editFormData.branch,
        lastUpdated: new Date()
      });
      setIsEditing(false);
      setErrors({});
    }
  };

  /**
   * Handle canceling project edit
   */
  const handleCancelEdit = () => {
    if (selectedProject) {
      setEditFormData({
        name: selectedProject.name,
        description: selectedProject.description,
        githubRepo: selectedProject.githubRepo || '',
        branch: selectedProject.branch
      });
    }
    setIsEditing(false);
    setErrors({});
  };

  /**
   * Handle project deletion
   */
  const handleDeleteProject = (projectId: string) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      const updatedProjects = projects.filter(project => project.id !== projectId);
      setProjects(updatedProjects);
      
      // Clear selection if deleted project was selected
      if (selectedProject?.id === projectId) {
        setSelectedProject(null);
        setIsEditing(false);
      }
    }
  };

  /**
   * Handle adding new project
   */
  const handleAddProject = () => {
    // Validate form data
    const newErrors: { name?: string; description?: string } = {};
    
    if (!newProjectData.name.trim()) {
      newErrors.name = 'Project name is required';
    }
    
    if (!newProjectData.description.trim()) {
      newErrors.description = 'Project description is required';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    // Create new project
    const newProject: Project = {
      id: Date.now().toString(),
      name: newProjectData.name,
      description: newProjectData.description,
      githubRepo: newProjectData.githubRepo || undefined,
      branch: newProjectData.branch,
      lastUpdated: new Date(),
      createdAt: new Date()
    };
    
    setProjects([...projects, newProject]);
    setShowAddModal(false);
    setNewProjectData({
      name: '',
      description: '',
      githubRepo: '',
      branch: 'main'
    });
    setErrors({});
  };

  /**
   * Format date for display
   */
  const formatDate = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left Sidebar Navigation - Fixed width with PulseSpark green accents */}
      <div className="w-72 bg-white border-r border-gray-200 flex flex-col">
        {/* Sidebar Header - PulseSpark branding */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="rounded-full w-10 h-10 bg-green-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">PS</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">PulseSpark</h1>
              <p className="text-sm text-gray-600">Project Dashboard</p>
            </div>
          </div>
        </div>

        {/* Navigation Menu - Green hover and active states */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeMenuItem === item.name;
              
              return (
                <li key={item.name}>
                  <button
                    onClick={() => handleMenuClick(item.name)}
                    className={`
                      w-full flex items-center gap-3 p-3 rounded-md transition-colors duration-200
                      ${isActive 
                        ? 'bg-green-100 text-green-600 font-semibold' 
                        : 'text-gray-700 hover:bg-green-50 hover:text-green-600'
                      }
                    `}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      {/* Main Content Area - Flexible width */}
      <div className="flex-1 flex flex-col">
        {/* Main Content Header */}
        <div className="bg-white border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{activeMenuItem}</h2>
              <p className="text-gray-600 mt-1">
                {activeMenuItem === 'Projects' 
                  ? `Manage your ${projects.length} project${projects.length !== 1 ? 's' : ''}`
                  : `${activeMenuItem} management and configuration`
                }
              </p>
            </div>
            
            {/* Add New Project Button - PulseSpark green styling */}
            {activeMenuItem === 'Projects' && (
              <button
                onClick={() => setShowAddModal(true)}
                className="
                  flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg
                  hover:bg-green-700 transition-colors duration-200
                  focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2
                "
              >
                <Plus className="w-4 h-4" />
                <span>New Project</span>
              </button>
            )}
          </div>
        </div>

        {/* Main Content Body */}
        <div className="flex-1 p-6">
          {activeMenuItem === 'Projects' ? (
            <div className="flex gap-6 h-full">
              {/* Projects List - Left side of main content */}
              <div className="flex-1">
                {projects.length === 0 ? (
                  // Empty state
                  <div className="text-center py-12">
                    <FolderOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
                    <p className="text-gray-600 mb-6">Create your first project to get started</p>
                    <button
                      onClick={() => setShowAddModal(true)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Create Project
                    </button>
                  </div>
                ) : (
                  // Projects grid
                  <div className="grid gap-4">
                    {projects.map((project) => (
                      <div
                        key={project.id}
                        onClick={() => handleProjectSelect(project)}
                        className={`
                          bg-white rounded-lg shadow-md p-4 cursor-pointer transition-all duration-200
                          hover:shadow-lg hover:border-green-200 border-2
                          ${selectedProject?.id === project.id 
                            ? 'border-green-300 bg-green-50' 
                            : 'border-transparent'
                          }
                        `}
                      >
                        {/* Project Card Header */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                              <FolderOpen className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                              <h3 className="font-bold text-gray-900">{project.name}</h3>
                              <p className="text-sm text-gray-600">{project.description}</p>
                            </div>
                          </div>
                          
                          {/* Project Actions */}
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleProjectSelect(project);
                                handleEditProject();
                              }}
                              className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors"
                              title="Edit project"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteProject(project.id);
                              }}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                              title="Delete project"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Project Metadata */}
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <div className="flex items-center gap-4">
                            {project.githubRepo && (
                              <div className="flex items-center gap-1">
                                <Github className="w-4 h-4" />
                                <span>{project.branch}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              <span>Updated {formatDate(project.lastUpdated)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Project Details Panel - Right side */}
              {selectedProject && (
                <div className="w-96 bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-gray-900">Project Details</h3>
                    {!isEditing && (
                      <button
                        onClick={handleEditProject}
                        className="flex items-center gap-2 px-3 py-2 text-green-600 hover:bg-green-50 rounded-md transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                        <span>Edit</span>
                      </button>
                    )}
                  </div>

                  {isEditing ? (
                    // Edit Form
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Project Name
                        </label>
                        <input
                          type="text"
                          value={editFormData.name}
                          onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                          className={`
                            w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500
                            ${errors.name ? 'border-red-500' : 'border-gray-300'}
                          `}
                          placeholder="Enter project name"
                        />
                        {errors.name && (
                          <p className="text-red-600 text-sm mt-1">{errors.name}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Description
                        </label>
                        <textarea
                          value={editFormData.description}
                          onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                          rows={3}
                          className={`
                            w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500
                            ${errors.description ? 'border-red-500' : 'border-gray-300'}
                          `}
                          placeholder="Enter project description"
                        />
                        {errors.description && (
                          <p className="text-red-600 text-sm mt-1">{errors.description}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          GitHub Repository (Optional)
                        </label>
                        <input
                          type="url"
                          value={editFormData.githubRepo}
                          onChange={(e) => setEditFormData({ ...editFormData, githubRepo: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                          placeholder="https://github.com/username/repo"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Branch
                        </label>
                        <input
                          type="text"
                          value={editFormData.branch}
                          onChange={(e) => setEditFormData({ ...editFormData, branch: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                          placeholder="main"
                        />
                      </div>

                      {/* Edit Form Actions */}
                      <div className="flex gap-3 pt-4">
                        <button
                          onClick={handleSaveEdit}
                          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                        >
                          <Save className="w-4 h-4" />
                          <span>Save</span>
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="flex items-center gap-2 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                        >
                          <X className="w-4 h-4" />
                          <span>Cancel</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    // View Mode
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Project Name
                        </label>
                        <p className="text-gray-900">{selectedProject.name}</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Description
                        </label>
                        <p className="text-gray-900">{selectedProject.description}</p>
                      </div>

                      {selectedProject.githubRepo && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            GitHub Repository
                          </label>
                          <a
                            href={selectedProject.githubRepo}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-green-600 hover:underline flex items-center gap-1"
                          >
                            <Github className="w-4 h-4" />
                            <span>View Repository</span>
                          </a>
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Branch
                        </label>
                        <p className="text-gray-900">{selectedProject.branch}</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Last Updated
                        </label>
                        <p className="text-gray-600 text-sm italic">
                          {formatDate(selectedProject.lastUpdated)}
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Created
                        </label>
                        <p className="text-gray-600 text-sm italic">
                          {selectedProject.createdAt.toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            // Placeholder for other menu items
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Settings className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">{activeMenuItem}</h3>
              <p className="text-gray-600">This section is coming soon!</p>
            </div>
          )}
        </div>
      </div>

      {/* Add New Project Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">Create New Project</h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewProjectData({ name: '', description: '', githubRepo: '', branch: 'main' });
                  setErrors({});
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Name
                </label>
                <input
                  type="text"
                  value={newProjectData.name}
                  onChange={(e) => setNewProjectData({ ...newProjectData, name: e.target.value })}
                  className={`
                    w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500
                    ${errors.name ? 'border-red-500' : 'border-gray-300'}
                  `}
                  placeholder="Enter project name"
                />
                {errors.name && (
                  <p className="text-red-600 text-sm mt-1">{errors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={newProjectData.description}
                  onChange={(e) => setNewProjectData({ ...newProjectData, description: e.target.value })}
                  rows={3}
                  className={`
                    w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500
                    ${errors.description ? 'border-red-500' : 'border-gray-300'}
                  `}
                  placeholder="Enter project description"
                />
                {errors.description && (
                  <p className="text-red-600 text-sm mt-1">{errors.description}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  GitHub Repository (Optional)
                </label>
                <input
                  type="url"
                  value={newProjectData.githubRepo}
                  onChange={(e) => setNewProjectData({ ...newProjectData, githubRepo: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="https://github.com/username/repo"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Branch
                </label>
                <input
                  type="text"
                  value={newProjectData.branch}
                  onChange={(e) => setNewProjectData({ ...newProjectData, branch: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="main"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleAddProject}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                Create Project
              </button>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewProjectData({ name: '', description: '', githubRepo: '', branch: 'main' });
                  setErrors({});
                }}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDashboard;