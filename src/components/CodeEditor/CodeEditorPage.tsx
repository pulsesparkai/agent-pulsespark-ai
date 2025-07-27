import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import Editor from '@monaco-editor/react';
import { FileExplorer, FileNode } from '../FileExplorer';
import { File } from 'lucide-react';

// Extended FileNode with additional properties for the editor
interface EditorFileNode extends FileNode {
  id: string;
  content?: string;
  language?: string;
}

// Sample file structure with realistic content
const initialFiles: EditorFileNode[] = [
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
 * MonacoEditor Component
 * Wraps the Monaco Editor with auto-save functionality
 */
interface MonacoEditorProps {
  activeFile: EditorFileNode | null;
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
  const [files, setFiles] = useState<EditorFileNode[]>(initialFiles);
  const [activeFile, setActiveFile] = useState<EditorFileNode | null>(null);
  const [selectedFilePath, setSelectedFilePath] = useState<string>('');

  // Initialize with the first file selected
  useEffect(() => {
    const firstFile = findFirstFile(initialFiles);
    if (firstFile) {
      setActiveFile(firstFile);
      setSelectedFilePath(getFilePath(firstFile, initialFiles));
    }
  }, []);

  // Helper function to find the first file in the tree
  const findFirstFile = (nodes: EditorFileNode[]): EditorFileNode | null => {
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
  const findFileById = (nodes: EditorFileNode[], id: string): EditorFileNode | null => {
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

  // Helper function to find a file by path
  const findFileByPath = (path: string, nodes: EditorFileNode[], currentPath = ''): EditorFileNode | null => {
    for (const node of nodes) {
      const nodePath = currentPath ? `${currentPath}/${node.name}` : node.name;
      if (nodePath === path) {
        return node;
      }
      if (node.children) {
        const found = findFileByPath(path, node.children, nodePath);
        if (found) return found;
      }
    }
    return null;
  };

  // Helper function to get file path
  const getFilePath = (file: EditorFileNode, nodes: EditorFileNode[], currentPath = ''): string => {
    for (const node of nodes) {
      const nodePath = currentPath ? `${currentPath}/${node.name}` : node.name;
      if (node.id === file.id) {
        return nodePath;
      }
      if (node.children) {
        const found = getFilePath(file, node.children, nodePath);
        if (found) return found;
      }
    }
    return '';
  };

  // Helper function to update a file's content in the tree
  const updateFileContent = (nodes: EditorFileNode[], fileId: string, content: string): EditorFileNode[] => {
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
  const handleFileSelect = useCallback((filePath: string) => {
    const file = findFileByPath(filePath, files);
    if (file && file.type === 'file') {
      setActiveFile(file);
      setSelectedFilePath(filePath);
    }
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

  // Convert EditorFileNode to FileNode for the FileExplorer
  const convertToFileNodes = (nodes: EditorFileNode[]): FileNode[] => {
    return nodes.map(node => ({
      name: node.name,
      type: node.type,
      children: node.children ? convertToFileNodes(node.children) : undefined
    }));
  };

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
              files={convertToFileNodes(files)}
              selectedFile={selectedFilePath}
              onFileSelect={handleFileSelect}
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