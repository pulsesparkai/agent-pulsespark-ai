import React, { useState, useCallback } from 'react';
import { 
  ChevronRight, 
  ChevronDown, 
  File, 
  Folder, 
  FolderOpen, 
  Plus, 
  Edit2, 
  Trash2, 
  X 
} from 'lucide-react';

// Type definitions for file tree structure
interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  children?: FileNode[];
  parentId?: string;
}

interface ProjectFileExplorerProps {
  className?: string;
}

/**
 * ProjectFileExplorer Component
 * 
 * A file tree explorer with PulseSpark branding that allows users to:
 * - Browse nested file/folder structures
 * - Create, rename, and delete files/folders
 * - Navigate with keyboard and mouse
 * - Manage project file organization
 */
export const ProjectFileExplorer: React.FC<ProjectFileExplorerProps> = ({ 
  className = '' 
}) => {
  // Sample file tree data - replace with actual project data
  const [fileTree, setFileTree] = useState<FileNode[]>([
    {
      id: '1',
      name: 'src',
      type: 'folder',
      children: [
        {
          id: '2',
          name: 'components',
          type: 'folder',
          parentId: '1',
          children: [
            { id: '3', name: 'App.tsx', type: 'file', parentId: '2' },
            { id: '4', name: 'Header.tsx', type: 'file', parentId: '2' }
          ]
        },
        { id: '5', name: 'index.tsx', type: 'file', parentId: '1' },
        { id: '6', name: 'styles.css', type: 'file', parentId: '1' }
      ]
    },
    {
      id: '7',
      name: 'public',
      type: 'folder',
      children: [
        { id: '8', name: 'index.html', type: 'file', parentId: '7' },
        { id: '9', name: 'favicon.ico', type: 'file', parentId: '7' }
      ]
    },
    { id: '10', name: 'package.json', type: 'file' },
    { id: '11', name: 'README.md', type: 'file' }
  ]);

  // State management for UI interactions
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['1', '2'])); // Default expanded
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [createType, setCreateType] = useState<'file' | 'folder'>('file');
  const [createParentId, setCreateParentId] = useState<string | null>(null);
  const [newItemName, setNewItemName] = useState('');
  const [renameItemId, setRenameItemId] = useState<string | null>(null);
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);

  /**
   * Toggle folder expansion state
   * Manages which folders are open/closed in the tree
   */
  const toggleFolder = useCallback((folderId: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  }, []);

  /**
   * Handle file/folder selection
   * Updates the selected item and highlights it in green
   */
  const handleItemSelect = useCallback((itemId: string) => {
    setSelectedFile(itemId);
  }, []);

  /**
   * Find a file/folder by ID in the tree structure
   * Recursive search through nested folders
   */
  const findItemById = useCallback((items: FileNode[], id: string): FileNode | null => {
    for (const item of items) {
      if (item.id === id) return item;
      if (item.children) {
        const found = findItemById(item.children, id);
        if (found) return found;
      }
    }
    return null;
  }, []);

  /**
   * Handle creating new files or folders
   * Opens modal for user input and validates name
   */
  const handleCreateItem = useCallback((type: 'file' | 'folder', parentId: string | null = null) => {
    setCreateType(type);
    setCreateParentId(parentId);
    setNewItemName('');
    setShowCreateModal(true);
  }, []);

  /**
   * Handle renaming existing items
   * Opens modal with current name pre-filled
   */
  const handleRenameItem = useCallback((itemId: string) => {
    const item = findItemById(fileTree, itemId);
    if (item) {
      setRenameItemId(itemId);
      setNewItemName(item.name);
      setShowRenameModal(true);
    }
  }, [fileTree, findItemById]);

  /**
   * Handle deleting items
   * Shows confirmation modal before deletion
   */
  const handleDeleteItem = useCallback((itemId: string) => {
    setDeleteItemId(itemId);
    setShowDeleteModal(true);
  }, []);

  /**
   * Confirm creation of new file/folder
   * Validates name and adds to tree structure
   */
  const confirmCreate = useCallback(() => {
    if (!newItemName.trim()) return;

    const newItem: FileNode = {
      id: Date.now().toString(), // Simple ID generation - use UUID in production
      name: newItemName.trim(),
      type: createType,
      parentId: createParentId || undefined,
      children: createType === 'folder' ? [] : undefined
    };

    // Add item to tree structure
    setFileTree(prev => {
      const updateTree = (items: FileNode[]): FileNode[] => {
        if (createParentId === null) {
          // Add to root level
          return [...items, newItem];
        }
        
        return items.map(item => {
          if (item.id === createParentId && item.type === 'folder') {
            return {
              ...item,
              children: [...(item.children || []), newItem]
            };
          }
          if (item.children) {
            return {
              ...item,
              children: updateTree(item.children)
            };
          }
          return item;
        });
      };
      
      return updateTree(prev);
    });

    // Expand parent folder if creating inside it
    if (createParentId) {
      setExpandedFolders(prev => new Set([...prev, createParentId]));
    }

    setShowCreateModal(false);
    setNewItemName('');
  }, [newItemName, createType, createParentId]);

  /**
   * Confirm rename operation
   * Updates item name in tree structure
   */
  const confirmRename = useCallback(() => {
    if (!newItemName.trim() || !renameItemId) return;

    setFileTree(prev => {
      const updateTree = (items: FileNode[]): FileNode[] => {
        return items.map(item => {
          if (item.id === renameItemId) {
            return { ...item, name: newItemName.trim() };
          }
          if (item.children) {
            return { ...item, children: updateTree(item.children) };
          }
          return item;
        });
      };
      
      return updateTree(prev);
    });

    setShowRenameModal(false);
    setRenameItemId(null);
    setNewItemName('');
  }, [newItemName, renameItemId]);

  /**
   * Confirm delete operation
   * Removes item from tree structure
   */
  const confirmDelete = useCallback(() => {
    if (!deleteItemId) return;

    setFileTree(prev => {
      const removeFromTree = (items: FileNode[]): FileNode[] => {
        return items.filter(item => {
          if (item.id === deleteItemId) return false;
          if (item.children) {
            item.children = removeFromTree(item.children);
          }
          return true;
        });
      };
      
      return removeFromTree(prev);
    });

    // Clear selection if deleted item was selected
    if (selectedFile === deleteItemId) {
      setSelectedFile(null);
    }

    setShowDeleteModal(false);
    setDeleteItemId(null);
  }, [deleteItemId, selectedFile]);

  /**
   * Get appropriate icon for file or folder
   * Returns Lucide React icon component
   */
  const getItemIcon = useCallback((item: FileNode) => {
    if (item.type === 'folder') {
      const isExpanded = expandedFolders.has(item.id);
      return isExpanded ? (
        <FolderOpen className="w-4 h-4 text-blue-500" />
      ) : (
        <Folder className="w-4 h-4 text-blue-500" />
      );
    }
    return <File className="w-4 h-4 text-gray-500" />;
  }, [expandedFolders]);

  /**
   * Render file tree recursively
   * Handles nested folder structure with proper indentation
   */
  const renderFileTree = useCallback((items: FileNode[], depth: number = 0) => {
    return items.map(item => {
      const isSelected = selectedFile === item.id;
      const isExpanded = expandedFolders.has(item.id);
      const hasChildren = item.children && item.children.length > 0;

      return (
        <div key={item.id}>
          {/* File/Folder Row */}
          <div
            className={`
              flex items-center gap-2 py-2 px-3 cursor-pointer transition-colors duration-200
              hover:bg-green-50 group
              ${isSelected ? 'bg-green-100 text-green-800 font-semibold' : 'text-gray-700'}
            `}
            style={{ paddingLeft: `${depth * 20 + 12}px` }}
            onClick={() => handleItemSelect(item.id)}
            role="treeitem"
            aria-selected={isSelected}
            aria-expanded={item.type === 'folder' ? isExpanded : undefined}
          >
            {/* Expand/Collapse Arrow for Folders */}
            {item.type === 'folder' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFolder(item.id);
                }}
                className="p-1 hover:bg-green-100 rounded transition-colors"
                aria-label={isExpanded ? `Collapse ${item.name}` : `Expand ${item.name}`}
              >
                {isExpanded ? (
                  <ChevronDown className="w-3 h-3 text-gray-600" />
                ) : (
                  <ChevronRight className="w-3 h-3 text-gray-600" />
                )}
              </button>
            )}

            {/* File/Folder Icon */}
            {getItemIcon(item)}

            {/* File/Folder Name */}
            <span className="flex-1 truncate text-sm">
              {item.name}
            </span>

            {/* Action Buttons (visible on hover) */}
            <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
              {item.type === 'folder' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCreateItem('file', item.id);
                  }}
                  className="p-1 hover:bg-green-200 rounded transition-colors"
                  title="Add file"
                >
                  <Plus className="w-3 h-3 text-green-600" />
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRenameItem(item.id);
                }}
                className="p-1 hover:bg-blue-100 rounded transition-colors"
                title="Rename"
              >
                <Edit2 className="w-3 h-3 text-blue-600" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteItem(item.id);
                }}
                className="p-1 hover:bg-red-100 rounded transition-colors"
                title="Delete"
              >
                <Trash2 className="w-3 h-3 text-red-600" />
              </button>
            </div>
          </div>

          {/* Render Children if Folder is Expanded */}
          {item.type === 'folder' && isExpanded && hasChildren && (
            <div role="group">
              {renderFileTree(item.children!, depth + 1)}
            </div>
          )}
        </div>
      );
    });
  }, [selectedFile, expandedFolders, handleItemSelect, toggleFolder, getItemIcon, handleCreateItem, handleRenameItem, handleDeleteItem]);

  return (
    <div className={`bg-white border-r border-gray-200 flex flex-col ${className}`} style={{ width: '280px' }}>
      {/* Header Section - PulseSpark branding */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <h3 className="font-semibold text-gray-900 text-sm">File Explorer</h3>
        
        {/* Add New File/Folder Buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleCreateItem('file')}
            className="p-2 hover:bg-green-100 rounded transition-colors"
            title="New file"
          >
            <Plus className="w-4 h-4 text-green-600" />
          </button>
          <button
            onClick={() => handleCreateItem('folder')}
            className="p-2 hover:bg-green-100 rounded transition-colors"
            title="New folder"
          >
            <Folder className="w-4 h-4 text-green-600" />
          </button>
        </div>
      </div>

      {/* File Tree Container - Scrollable */}
      <div 
        className="flex-1 overflow-y-auto py-2"
        role="tree"
        aria-label="Project file tree"
      >
        {fileTree.length > 0 ? (
          renderFileTree(fileTree)
        ) : (
          // Empty State
          <div className="p-4 text-center text-gray-500">
            <Folder className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No files or folders</p>
            <button
              onClick={() => handleCreateItem('file')}
              className="mt-2 text-xs text-green-600 hover:underline"
            >
              Create your first file
            </button>
          </div>
        )}
      </div>

      {/* Create New Item Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-96">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Create New {createType === 'file' ? 'File' : 'Folder'}
            </h3>
            <input
              type="text"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              placeholder={`Enter ${createType} name`}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') confirmCreate();
                if (e.key === 'Escape') setShowCreateModal(false);
              }}
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmCreate}
                disabled={!newItemName.trim()}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rename Item Modal */}
      {showRenameModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-96">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Rename Item
            </h3>
            <input
              type="text"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              placeholder="Enter new name"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') confirmRename();
                if (e.key === 'Escape') setShowRenameModal(false);
              }}
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setShowRenameModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmRename}
                disabled={!newItemName.trim()}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Rename
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deleteItemId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-96">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Confirm Delete
            </h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete "{findItemById(fileTree, deleteItemId)?.name}"? 
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectFileExplorer;