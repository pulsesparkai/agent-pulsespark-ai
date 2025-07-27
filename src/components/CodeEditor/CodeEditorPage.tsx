import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import Editor from '@monaco-editor/react';
import { 
  ChevronRight, 
  ChevronDown, 
  File, 
  Folder, 
  FolderOpen,
  FileText,
  Code,
  Database,
  Image,
  Settings
} from 'lucide-react';

// Type definitions for our file system
interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  content?: string;
  children?: FileNode[];
  language?: string;
}

// Sample file structure with realistic content
const initialFiles: FileNode[] = [
  {
    id: '1',
    name: 'src',
    type: 'folder',
    children: [
      {
        id: '2',
        name: 'App.tsx',
        type: 'file',
        language: 'typescript',
        content: `import React from 'react';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Welcome to PulseSpark AI</h1>
        <p>
          Edit <code>src/App.tsx</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;`
      },
      {
        id: '3',
        name: 'index.tsx',
        type: 'file',
        language: 'typescript',
        content: `import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`
      },
      {
        id: '4',
        name: 'components',
        type: 'folder',
        children: [
          {
            id: '5',
            name: 'Header.tsx',
            type: 'file',
            language: 'typescript',
            content: `import React from 'react';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export const Header: React.FC<HeaderProps> = ({ title, subtitle }) => {
  return (
    <header className="bg-blue-600 text-white p-6">
      <h1 className="text-3xl font-bold">{title}</h1>
      {subtitle && (
        <p className="text-blue-100 mt-2">{subtitle}</p>
      )}
    </header>
  );
};`
          }
        ]
      }
    ]
  },
  {
    id: '6',
    name: 'package.json',
    type: 'file',
    language: 'json',
    content: `{
  "name": "pulsespark-project",
  "version": "0.1.0",
  "private": true,
  "dependencies": {
    "@testing-library/jest-dom": "^5.16.4",
    "@testing-library/react": "^13.3.0",
    "@testing-library/user-event": "^13.5.0",
    "@types/jest": "^27.5.2",
    "@types/node": "^16.11.56",
    "@types/react": "^18.0.17",
    "@types/react-dom": "^18.0.6",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-scripts": "5.0.1",
    "typescript": "^4.7.4",
    "web-vitals": "^2.1.4"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  },
  "eslintConfig": {
    "extends": [
      "react-app",
      "react-app/jest"
    ]
  },
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  }
}`
  },
  {
    id: '7',
    name: 'README.md',
    type: 'file',
    language: 'markdown',
    content: `# PulseSpark AI Project

This project was created with PulseSpark AI - the intelligent code generation platform.

## Available Scripts

In the project directory, you can run:

### \`npm start\`

Runs the app in the development mode.
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

### \`npm test\`

Launches the test runner in the interactive watch mode.

### \`npm run build\`

Builds the app for production to the \`build\` folder.

## Learn More

You can learn more about React in the [React documentation](https://reactjs.org/).

## Features

- ⚡ Fast development with hot reload
- 🎨 Modern UI with Tailwind CSS
- 📱 Responsive design
- 🔧 TypeScript support
- 🧪 Testing setup with Jest

## Getting Started

1. Install dependencies: \`npm install\`
2. Start the development server: \`npm start\`
3. Open your browser and navigate to \`http://localhost:3000\`

Happy coding! 🚀`
  }
];

/**
 * FileExplorer Component
 * Renders a collapsible tree view of files and folders
 */
interface FileExplorerProps {
  files: FileNode[];
  activeFileId: string | null;
  onFileSelect: (file: FileNode) => void;
  expandedFolders: Set<string>;
  onToggleFolder: (folderId: string) => void;
}

const FileExplorer: React.FC<FileExplorerProps> = ({
  files,
  activeFileId,
  onFileSelect,
  expandedFolders,
  onToggleFolder
}) => {
  // Get appropriate icon for file type
  const getFileIcon = (file: FileNode) => {
    if (file.type === 'folder') {
      return expandedFolders.has(file.id) ? (
        <FolderOpen className="w-4 h-4 text-blue-500" />
      ) : (
        <Folder className="w-4 h-4 text-blue-500" />
      );
    }

    // File type icons based on extension
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
      case 'css':
      case 'scss':
        return <Settings className="w-4 h-4 text-pink-500" />;
      default:
        return <File className="w-4 h-4 text-gray-500" />;
    }
  };

  // Recursive component to render file tree
  const renderFileNode = (file: FileNode, depth: number = 0) => {
    const isExpanded = expandedFolders.has(file.id);
    const isActive = activeFileId === file.id;

    return (
      <div key={file.id}>
        <div
          className={`
            flex items-center gap-2 px-2 py-1.5 cursor-pointer hover:bg-gray-100 
            transition-colors duration-150 group
            ${isActive ? 'bg-blue-50 border-r-2 border-blue-500' : ''}
          `}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={() => {
            if (file.type === 'folder') {
              onToggleFolder(file.id);
            } else {
              onFileSelect(file);
            }
          }}
          role={file.type === 'folder' ? 'treeitem' : 'option'}
          aria-expanded={file.type === 'folder' ? isExpanded : undefined}
          aria-selected={isActive}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              if (file.type === 'folder') {
                onToggleFolder(file.id);
              } else {
                onFileSelect(file);
              }
            }
          }}
        >
          {/* Folder expand/collapse chevron */}
          {file.type === 'folder' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFolder(file.id);
              }}
              className="p-0.5 hover:bg-gray-200 rounded transition-colors"
              aria-label={isExpanded ? 'Collapse folder' : 'Expand folder'}
            >
              {isExpanded ? (
                <ChevronDown className="w-3 h-3 text-gray-500" />
              ) : (
                <ChevronRight className="w-3 h-3 text-gray-500" />
              )}
            </button>
          )}
          
          {/* File/folder icon */}
          {getFileIcon(file)}
          
          {/* File/folder name */}
          <span 
            className={`
              text-sm truncate flex-1
              ${isActive ? 'font-medium text-blue-700' : 'text-gray-700'}
            `}
          >
            {file.name}
          </span>
        </div>

        {/* Render children if folder is expanded */}
        {file.type === 'folder' && isExpanded && file.children && (
          <div role="group">
            {file.children.map(child => renderFileNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div 
      className="h-full bg-gray-50 border-r border-gray-200 overflow-y-auto"
      role="tree"
      aria-label="File explorer"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-100">
        <h3 className="text-sm font-semibold text-gray-700">Explorer</h3>
      </div>
      
      {/* File tree */}
      <div className="py-2">
        {files.map(file => renderFileNode(file))}
      </div>
    </div>
  );
};

/**
 * MonacoEditor Component
 * Wraps the Monaco Editor with auto-save functionality
 */
interface MonacoEditorProps {
  activeFile: FileNode | null;
  onContentChange: (fileId: string, content: string) => void;
}

const MonacoEditor: React.FC<MonacoEditorProps> = ({ activeFile, onContentChange }) => {
  const [theme, setTheme] = useState<'light' | 'vs-dark'>('light');
  const debounceRef = useRef<NodeJS.Timeout>();

  // Handle editor content changes with debounced auto-save
  const handleEditorChange = useCallback((value: string | undefined) => {
    if (!activeFile || value === undefined) return;

    // Clear existing debounce timer
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Set new debounce timer for auto-save (1 second delay)
    debounceRef.current = setTimeout(() => {
      onContentChange(activeFile.id, value);
    }, 1000);
  }, [activeFile, onContentChange]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  // Toggle theme function
  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'vs-dark' : 'light');
  };

  if (!activeFile) {
    return (
      <div className="h-full flex items-center justify-center bg-white">
        <div className="text-center text-gray-500">
          <File className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium mb-2">No file selected</h3>
          <p className="text-sm">Select a file from the explorer to start editing</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Editor header with file info and theme toggle */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-3">
          <span className="font-medium text-gray-900">{activeFile.name}</span>
          <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
            {activeFile.language || 'plaintext'}
          </span>
        </div>
        
        <button
          onClick={toggleTheme}
          className="px-3 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded transition-colors"
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
        >
          {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
        </button>
      </div>

      {/* Monaco Editor */}
      <div className="flex-1">
        <Editor
          height="100%"
          language={activeFile.language || 'plaintext'}
          value={activeFile.content || ''}
          theme={theme}
          onChange={handleEditorChange}
          options={{
            selectOnLineNumbers: true,
            roundedSelection: false,
            readOnly: false,
            cursorStyle: 'line',
            automaticLayout: true,
            minimap: { enabled: true },
            scrollBeyondLastLine: false,
            fontSize: 14,
            lineHeight: 20,
            fontFamily: 'JetBrains Mono, Consolas, Monaco, monospace',
            tabSize: 2,
            insertSpaces: true,
            wordWrap: 'on',
            lineNumbers: 'on',
            folding: true,
            renderLineHighlight: 'line',
            mouseWheelZoom: true,
          }}
        />
      </div>
    </div>
  );
};

/**
 * Main CodeEditorPage Component
 * Manages the overall layout and state for the code editor
 */
export const CodeEditorPage: React.FC = () => {
  // State management for files and UI
  const [files, setFiles] = useState<FileNode[]>(initialFiles);
  const [activeFile, setActiveFile] = useState<FileNode | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(['1']) // Initially expand the 'src' folder
  );

  // Initialize with the first file selected
  useEffect(() => {
    const firstFile = findFirstFile(initialFiles);
    if (firstFile) {
      setActiveFile(firstFile);
    }
  }, []);

  // Helper function to find the first file in the tree
  const findFirstFile = (nodes: FileNode[]): FileNode | null => {
    for (const node of nodes) {
      if (node.type === 'file') {
        return node;
      }
      if (node.children) {
        const found = findFirstFile(node.children);
        if (found) return found;
      }
    }
    return null;
  };

  // Helper function to find a file by ID in the tree
  const findFileById = (nodes: FileNode[], id: string): FileNode | null => {
    for (const node of nodes) {
      if (node.id === id) {
        return node;
      }
      if (node.children) {
        const found = findFileById(node.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  // Helper function to update a file's content in the tree
  const updateFileContent = (nodes: FileNode[], fileId: string, content: string): FileNode[] => {
    return nodes.map(node => {
      if (node.id === fileId) {
        return { ...node, content };
      }
      if (node.children) {
        return { ...node, children: updateFileContent(node.children, fileId, content) };
      }
      return node;
    });
  };

  // Handle file selection
  const handleFileSelect = useCallback((file: FileNode) => {
    setActiveFile(file);
  }, []);

  // Handle folder expand/collapse
  const handleToggleFolder = useCallback((folderId: string) => {
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

  // Handle content changes with auto-save
  const handleContentChange = useCallback((fileId: string, content: string) => {
    setFiles(prev => updateFileContent(prev, fileId, content));
    
    // Update active file if it's the one being edited
    if (activeFile?.id === fileId) {
      setActiveFile(prev => prev ? { ...prev, content } : null);
    }

    // Here you would typically save to Supabase
    console.log(`Auto-saving file ${fileId} with ${content.length} characters`);
  }, [activeFile]);

  // Keyboard navigation for file explorer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if focus is in the file explorer area
      if (!document.activeElement?.closest('[role="tree"]')) return;

      switch (e.key) {
        case 'ArrowUp':
        case 'ArrowDown':
          e.preventDefault();
          // Implementation for arrow key navigation would go here
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          // Handle selection
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="h-screen bg-white">
      {/* Header */}
      <div className="h-12 bg-gray-100 border-b border-gray-200 flex items-center px-4">
        <h1 className="text-lg font-semibold text-gray-800">
          PulseSpark AI - Code Editor
        </h1>
      </div>

      {/* Main editor layout with resizable panels */}
      <div className="h-[calc(100vh-3rem)]">
        <PanelGroup direction="horizontal">
          {/* File Explorer Panel */}
          <Panel 
            defaultSize={30} 
            minSize={20} 
            maxSize={50}
            className="min-w-0"
          >
            <FileExplorer
              files={files}
              activeFileId={activeFile?.id || null}
              onFileSelect={handleFileSelect}
              expandedFolders={expandedFolders}
              onToggleFolder={handleToggleFolder}
            />
          </Panel>

          {/* Resize handle */}
          <PanelResizeHandle className="w-1 bg-gray-200 hover:bg-gray-300 transition-colors" />

          {/* Monaco Editor Panel */}
          <Panel 
            defaultSize={70} 
            minSize={50}
            className="min-w-0"
          >
            <MonacoEditor
              activeFile={activeFile}
              onContentChange={handleContentChange}
            />
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
};

export default CodeEditorPage;