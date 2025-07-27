import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronRight, ChevronDown, File, Folder, FolderOpen } from 'lucide-react';

// Type definition for file/folder nodes in the tree structure
export interface FileNode {
  name: string;
  type: 'file' | 'folder';
  children?: FileNode[];
}

// Props interface for the FileExplorer component
interface FileExplorerProps {
  files: FileNode[];
  selectedFile: string;
  onFileSelect: (filename: string) => void;
}

// Internal interface for flattened tree items used for keyboard navigation
interface FlatTreeItem {
  node: FileNode;
  path: string;
  depth: number;
  isVisible: boolean;
}

/**
 * FileExplorer Component
 * 
 * A hierarchical file tree explorer with keyboard navigation and accessibility support.
 * Features:
 * - Collapsible folders with expand/collapse functionality
 * - File selection with visual highlighting
 * - Full keyboard navigation (arrow keys, Enter, Space)
 * - ARIA roles for screen reader accessibility
 * - Proper indentation to show tree structure
 */
export const FileExplorer: React.FC<FileExplorerProps> = ({
  files,
  selectedFile,
  onFileSelect
}) => {
  // State to track which folders are expanded
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  
  // State for keyboard navigation - tracks currently focused item
  const [focusedIndex, setFocusedIndex] = useState<number>(0);
  
  // Ref to the container for managing focus
  const containerRef = useRef<HTMLDivElement>(null);

  /**
   * Toggle folder expansion state
   * @param folderPath - The path of the folder to toggle
   */
  const toggleFolder = useCallback((folderPath: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderPath)) {
        newSet.delete(folderPath);
      } else {
        newSet.add(folderPath);
      }
      return newSet;
    });
  }, []);

  /**
   * Flatten the tree structure for easier keyboard navigation
   * Creates a linear array of visible items with their depth and path information
   */
  const flattenTree = useCallback((nodes: FileNode[], parentPath = '', depth = 0): FlatTreeItem[] => {
    const result: FlatTreeItem[] = [];
    
    nodes.forEach(node => {
      const currentPath = parentPath ? `${parentPath}/${node.name}` : node.name;
      
      // Add current node to flattened list
      result.push({
        node,
        path: currentPath,
        depth,
        isVisible: true
      });
      
      // If it's a folder and expanded, recursively add children
      if (node.type === 'folder' && node.children && expandedFolders.has(currentPath)) {
        result.push(...flattenTree(node.children, currentPath, depth + 1));
      }
    });
    
    return result;
  }, [expandedFolders]);

  // Get flattened tree for current state
  const flatTree = flattenTree(files);

  /**
   * Handle keyboard navigation
   */
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    const currentItem = flatTree[focusedIndex];
    if (!currentItem) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setFocusedIndex(prev => Math.min(prev + 1, flatTree.length - 1));
        break;
        
      case 'ArrowUp':
        event.preventDefault();
        setFocusedIndex(prev => Math.max(prev - 1, 0));
        break;
        
      case 'ArrowRight':
        event.preventDefault();
        if (currentItem.node.type === 'folder') {
          if (!expandedFolders.has(currentItem.path)) {
            toggleFolder(currentItem.path);
          } else {
            // If already expanded, move to first child
            setFocusedIndex(prev => Math.min(prev + 1, flatTree.length - 1));
          }
        }
        break;
        
      case 'ArrowLeft':
        event.preventDefault();
        if (currentItem.node.type === 'folder' && expandedFolders.has(currentItem.path)) {
          toggleFolder(currentItem.path);
        } else if (currentItem.depth > 0) {
          // Move to parent folder
          const parentDepth = currentItem.depth - 1;
          for (let i = focusedIndex - 1; i >= 0; i--) {
            if (flatTree[i].depth === parentDepth) {
              setFocusedIndex(i);
              break;
            }
          }
        }
        break;
        
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (currentItem.node.type === 'file') {
          onFileSelect(currentItem.path);
        } else {
          toggleFolder(currentItem.path);
        }
        break;
    }
  }, [flatTree, focusedIndex, expandedFolders, toggleFolder, onFileSelect]);

  /**
   * Handle mouse click on tree items
   */
  const handleItemClick = useCallback((item: FlatTreeItem, index: number) => {
    setFocusedIndex(index);
    
    if (item.node.type === 'file') {
      onFileSelect(item.path);
    } else {
      toggleFolder(item.path);
    }
  }, [onFileSelect, toggleFolder]);

  /**
   * Get appropriate icon for file or folder
   */
  const getIcon = useCallback((node: FileNode, path: string) => {
    if (node.type === 'folder') {
      const isExpanded = expandedFolders.has(path);
      return isExpanded ? (
        <FolderOpen className="w-4 h-4 text-blue-500" />
      ) : (
        <Folder className="w-4 h-4 text-blue-500" />
      );
    }
    return <File className="w-4 h-4 text-gray-500" />;
  }, [expandedFolders]);

  /**
   * Get chevron icon for folders (expand/collapse indicator)
   */
  const getChevron = useCallback((node: FileNode, path: string) => {
    if (node.type !== 'folder') return null;
    
    const isExpanded = expandedFolders.has(path);
    return (
      <button
        className="p-0.5 hover:bg-gray-200 rounded transition-colors"
        onClick={(e) => {
          e.stopPropagation();
          toggleFolder(path);
        }}
        aria-label={isExpanded ? `Collapse ${node.name}` : `Expand ${node.name}`}
      >
        {isExpanded ? (
          <ChevronDown className="w-3 h-3 text-gray-600" />
        ) : (
          <ChevronRight className="w-3 h-3 text-gray-600" />
        )}
      </button>
    );
  }, [expandedFolders, toggleFolder]);

  // Update focused index when selected file changes externally
  useEffect(() => {
    const selectedIndex = flatTree.findIndex(item => item.path === selectedFile);
    if (selectedIndex !== -1) {
      setFocusedIndex(selectedIndex);
    }
  }, [selectedFile, flatTree]);

  // Ensure container can receive focus for keyboard navigation
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.focus();
    }
  }, []);

  return (
    <div
      ref={containerRef}
      className="h-full bg-gray-50 border-r border-gray-200 overflow-y-auto focus:outline-none"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      role="tree"
      aria-label="File explorer"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-100">
        <h3 className="text-sm font-semibold text-gray-700">Explorer</h3>
      </div>
      
      {/* File tree */}
      <div className="py-2">
        {flatTree.map((item, index) => {
          const isSelected = item.path === selectedFile;
          const isFocused = index === focusedIndex;
          
          return (
            <div
              key={item.path}
              className={`
                flex items-center gap-2 px-2 py-1.5 cursor-pointer transition-colors
                ${isSelected ? 'bg-blue-50 border-r-2 border-blue-500' : ''}
                ${isFocused ? 'bg-gray-100' : ''}
                hover:bg-gray-100
              `}
              style={{ paddingLeft: `${item.depth * 16 + 8}px` }}
              onClick={() => handleItemClick(item, index)}
              role="treeitem"
              aria-selected={isSelected}
              aria-expanded={item.node.type === 'folder' ? expandedFolders.has(item.path) : undefined}
              aria-level={item.depth + 1}
            >
              {/* Chevron for folders */}
              <div className="w-4 flex justify-center">
                {getChevron(item.node, item.path)}
              </div>
              
              {/* File/folder icon */}
              {getIcon(item.node, item.path)}
              
              {/* File/folder name */}
              <span 
                className={`
                  text-sm truncate flex-1
                  ${isSelected ? 'font-medium text-blue-700' : 'text-gray-700'}
                `}
              >
                {item.node.name}
              </span>
            </div>
          );
        })}
      </div>
      
      {/* Empty state */}
      {flatTree.length === 0 && (
        <div className="p-4 text-center text-gray-500">
          <Folder className="w-8 h-8 mx-auto mb-2 text-gray-300" />
          <p className="text-sm">No files or folders</p>
        </div>
      )}
    </div>
  );
};

export default FileExplorer;