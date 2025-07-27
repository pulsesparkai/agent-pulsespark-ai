import React, { useState } from 'react';
import { 
  ChevronRight, 
  ChevronDown, 
  File, 
  Folder, 
  FolderOpen,
  Plus,
  MoreHorizontal,
  Edit2,
  Trash2,
  FileText,
  Image,
  Code,
  Database
} from 'lucide-react';
import { FileNode } from '../../types';
import { useProject } from '../../contexts/ProjectContext';
import { useNotification } from '../../contexts/NotificationContext';

interface FileExplorerProps {
  className?: string;
}

export const FileExplorer: React.FC<FileExplorerProps> = ({ className = '' }) => {
  const { currentProject, selectedFile, selectFile, createFile, renameFile, deleteFile } = useProject();
  const { showNotification } = useNotification();
  
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['root']));
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; fileId: string } | null>(null);
  const [editingFile, setEditingFile] = useState<string | null>(null);
  const [newFileName, setNewFileName] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState<{ parentId: string | null; type: 'file' | 'folder' } | null>(null);

  if (!currentProject) {
    return (
      <div className={`bg-gray-50 border-r border-gray-200 ${className}`}>
        <div className="p-4 text-center text-gray-500">
          <Folder className="w-12 h-12 mx-auto mb-2 text-gray-300" />
          <p>No project selected</p>
        </div>
      </div>
    );
  }

  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const getFileIcon = (file: FileNode) => {
    if (file.type === 'folder') {
      return expandedFolders.has(file.id) ? (
        <FolderOpen className="w-4 h-4 text-blue-500" />
      ) : (
        <Folder className="w-4 h-4 text-blue-500" />
      );
    }

    const extension = file.name.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'tsx':
      case 'jsx':
      case 'ts':
      case 'js':
        return <Code className="w-4 h-4 text-yellow-500" />;
      case 'json':
        return <Database className="w-4 h-4 text-green-500" />;
      case 'md':
        return <FileText className="w-4 h-4 text-blue-500" />;
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
      case 'svg':
        return <Image className="w-4 h-4 text-purple-500" />;
      default:
        return <File className="w-4 h-4 text-gray-500" />;
    }
  };

  const handleContextMenu = (e: React.MouseEvent, fileId: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, fileId });
  };

  const handleRename = (fileId: string) => {
    const file = findFileById(currentProject.file_tree, fileId);
    if (file) {
      setEditingFile(fileId);
      setNewFileName(file.name);
    }
    setContextMenu(null);
  };

  const handleDelete = async (fileId: string) => {
    const file = findFileById(currentProject.file_tree, fileId);
    if (file && window.confirm(`Are you sure you want to delete "${file.name}"?`)) {
      await deleteFile(fileId);
    }
    setContextMenu(null);
  };

  const handleRenameSubmit = async (fileId: string) => {
    if (newFileName.trim() && newFileName !== findFileById(currentProject.file_tree, fileId)?.name) {
      await renameFile(fileId, newFileName.trim());
    }
    setEditingFile(null);
    setNewFileName('');
  };

  const handleCreateFile = async (type: 'file' | 'folder') => {
    if (newFileName.trim()) {
      await createFile(showCreateDialog?.parentId || null, newFileName.trim(), type);
      setShowCreateDialog(null);
      setNewFileName('');
    }
  };

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

  const renderFileNode = (file: FileNode, depth: number = 0) => {
    const isSelected = selectedFile?.id === file.id;
    const isExpanded = expandedFolders.has(file.id);
    const isEditing = editingFile === file.id;

    return (
      <div key={file.id}>
        <div
          className={`
            flex items-center gap-2 px-2 py-1 cursor-pointer hover:bg-gray-100 group
            ${isSelected ? 'bg-blue-50 border-r-2 border-blue-500' : ''}
          `}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={() => {
            if (file.type === 'folder') {
              toggleFolder(file.id);
            } else {
              selectFile(file);
            }
          }}
          onContextMenu={(e) => handleContextMenu(e, file.id)}
        >
          {file.type === 'folder' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFolder(file.id);
              }}
              className="p-0.5 hover:bg-gray-200 rounded"
            >
              {isExpanded ? (
                <ChevronDown className="w-3 h-3 text-gray-500" />
              ) : (
                <ChevronRight className="w-3 h-3 text-gray-500" />
              )}
            </button>
          )}
          
          {getFileIcon(file)}
          
          {isEditing ? (
            <input
              type="text"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              onBlur={() => handleRenameSubmit(file.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleRenameSubmit(file.id);
                } else if (e.key === 'Escape') {
                  setEditingFile(null);
                  setNewFileName('');
                }
              }}
              className="flex-1 px-1 py-0.5 text-sm border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              autoFocus
            />
          ) : (
            <span className={`flex-1 text-sm truncate ${isSelected ? 'font-medium text-blue-700' : 'text-gray-700'}`}>
              {file.name}
            </span>
          )}
          
          {file.type === 'folder' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowCreateDialog({ parentId: file.id, type: 'file' });
                setNewFileName('');
              }}
              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded transition-opacity"
              title="Add file"
            >
              <Plus className="w-3 h-3 text-gray-500" />
            </button>
          )}
        </div>

        {file.type === 'folder' && isExpanded && file.children && (
          <div>
            {file.children.map(child => renderFileNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`bg-white border-r border-gray-200 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50">
        <h3 className="font-medium text-gray-900 text-sm">Explorer</h3>
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              setShowCreateDialog({ parentId: null, type: 'file' });
              setNewFileName('');
            }}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
            title="New file"
          >
            <Plus className="w-4 h-4 text-gray-600" />
          </button>
          <button
            onClick={() => {
              setShowCreateDialog({ parentId: null, type: 'folder' });
              setNewFileName('');
            }}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
            title="New folder"
          >
            <Folder className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Project Name */}
      <div className="px-3 py-2 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Folder className="w-4 h-4 text-blue-500" />
          <span className="font-medium text-sm text-gray-900 truncate">
            {currentProject.name}
          </span>
        </div>
      </div>

      {/* File Tree */}
      <div className="overflow-y-auto flex-1">
        {currentProject.file_tree.map(file => renderFileNode(file))}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setContextMenu(null)}
          />
          <div
            className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-32"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            <button
              onClick={() => handleRename(contextMenu.fileId)}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              <Edit2 className="w-4 h-4" />
              Rename
            </button>
            <button
              onClick={() => handleDelete(contextMenu.fileId)}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        </>
      )}

      {/* Create Dialog */}
      {showCreateDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">
              Create New {showCreateDialog.type === 'file' ? 'File' : 'Folder'}
            </h3>
            <input
              type="text"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              placeholder={`Enter ${showCreateDialog.type} name`}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCreateFile(showCreateDialog.type);
                } else if (e.key === 'Escape') {
                  setShowCreateDialog(null);
                  setNewFileName('');
                }
              }}
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => {
                  setShowCreateDialog(null);
                  setNewFileName('');
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleCreateFile(showCreateDialog.type)}
                disabled={!newFileName.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};