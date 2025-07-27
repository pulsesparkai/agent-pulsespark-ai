import React, { useState, useEffect } from 'react';
import SplitPane from 'react-split-pane';
import { FileExplorer } from './FileExplorer';
import { MonacoEditor } from './MonacoEditor';
import { GitHubIntegration } from './GitHubIntegration';
import { useProject } from '../../contexts/ProjectContext';
import { FolderOpen, Plus } from 'lucide-react';

export const CodeEditorPage: React.FC = () => {
  const { currentProject, projects, createProject, loadProject } = useProject();
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');

  // Auto-create a project if none exists
  useEffect(() => {
    if (projects.length === 0 && !currentProject) {
      setShowCreateProject(true);
      setNewProjectName('My First Project');
      setNewProjectDescription('A new project created with PulseSpark AI');
    }
  }, [projects, currentProject]);

  const handleCreateProject = async () => {
    if (newProjectName.trim()) {
      await createProject(newProjectName.trim(), newProjectDescription.trim());
      setShowCreateProject(false);
      setNewProjectName('');
      setNewProjectDescription('');
    }
  };

  if (showCreateProject) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FolderOpen className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Create Your First Project</h2>
            <p className="text-gray-600">Get started by creating a new project</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Name
              </label>
              <input
                type="text"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="Enter project name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description (optional)
              </label>
              <textarea
                value={newProjectDescription}
                onChange={(e) => setNewProjectDescription(e.target.value)}
                placeholder="Describe your project"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            <button
              onClick={handleCreateProject}
              disabled={!newProjectName.trim()}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Project
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentProject) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <FolderOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Project Selected</h3>
          <p className="text-gray-600 mb-6">Select a project to start coding</p>
          <button
            onClick={() => setShowCreateProject(true)}
            className="flex items-center gap-2 mx-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create New Project
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200">
        <div className="flex items-center gap-4">
          <select
            value={currentProject.id}
            onChange={(e) => loadProject(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
          
          <button
            onClick={() => setShowCreateProject(true)}
            className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Create new project"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Project</span>
          </button>
        </div>

        <GitHubIntegration />
      </div>

      {/* Editor Layout */}
      <div className="flex-1 overflow-hidden">
        <SplitPane
          split="vertical"
          minSize={200}
          maxSize={600}
          defaultSize={300}
          resizerStyle={{
            background: '#e5e7eb',
            width: '4px',
            cursor: 'col-resize',
            borderLeft: '1px solid #d1d5db',
            borderRight: '1px solid #d1d5db'
          }}
        >
          <FileExplorer className="h-full" />
          <MonacoEditor className="h-full" />
        </SplitPane>
      </div>
    </div>
  );
};