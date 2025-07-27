import React, { useEffect, useRef, useState } from 'react';
import Editor from '@monaco-editor/react';
import { FileNode } from '../../types';
import { useProject } from '../../contexts/ProjectContext';
import { Save, RotateCcw, Sun, Moon } from 'lucide-react';

interface MonacoEditorProps {
  className?: string;
}

export const MonacoEditor: React.FC<MonacoEditorProps> = ({ className = '' }) => {
  const { selectedFile, updateFileContent } = useProject();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSavedContent, setLastSavedContent] = useState('');
  const editorRef = useRef<any>(null);

  // Load theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('editor-theme') as 'light' | 'dark';
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  // Save theme to localStorage
  useEffect(() => {
    localStorage.setItem('editor-theme', theme);
  }, [theme]);

  // Update last saved content when file changes
  useEffect(() => {
    if (selectedFile?.content) {
      setLastSavedContent(selectedFile.content);
      setHasUnsavedChanges(false);
    }
  }, [selectedFile?.id]);

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;

    // Configure editor options
    editor.updateOptions({
      fontSize: 14,
      lineHeight: 20,
      fontFamily: 'JetBrains Mono, Consolas, Monaco, monospace',
      minimap: { enabled: true },
      scrollBeyondLastLine: false,
      automaticLayout: true,
      tabSize: 2,
      insertSpaces: true,
      wordWrap: 'on',
      lineNumbers: 'on',
      folding: true,
      foldingStrategy: 'indentation',
      renderLineHighlight: 'line',
      selectOnLineNumbers: true,
      roundedSelection: false,
      readOnly: false,
      cursorStyle: 'line',
      mouseWheelZoom: true,
    });

    // Add keyboard shortcuts
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      handleSave();
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyZ, () => {
      editor.trigger('keyboard', 'undo', null);
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyZ, () => {
      editor.trigger('keyboard', 'redo', null);
    });
  };

  const handleEditorChange = (value: string | undefined) => {
    if (!selectedFile || value === undefined) return;

    const newContent = value;
    setHasUnsavedChanges(newContent !== lastSavedContent);
    
    // Auto-save with debounce
    const timeoutId = setTimeout(() => {
      updateFileContent(selectedFile.id, newContent);
      setLastSavedContent(newContent);
      setHasUnsavedChanges(false);
    }, 1000);

    return () => clearTimeout(timeoutId);
  };

  const handleSave = () => {
    if (!selectedFile || !editorRef.current) return;

    const content = editorRef.current.getValue();
    updateFileContent(selectedFile.id, content);
    setLastSavedContent(content);
    setHasUnsavedChanges(false);
  };

  const handleUndo = () => {
    if (editorRef.current) {
      editorRef.current.trigger('keyboard', 'undo', null);
    }
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  if (!selectedFile) {
    return (
      <div className={`bg-gray-50 flex items-center justify-center ${className}`}>
        <div className="text-center text-gray-500">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-lg flex items-center justify-center">
            <Save className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium mb-2">No file selected</h3>
          <p className="text-sm">Select a file from the explorer to start editing</p>
        </div>
      </div>
    );
  }

  if (selectedFile.type === 'folder') {
    return (
      <div className={`bg-gray-50 flex items-center justify-center ${className}`}>
        <div className="text-center text-gray-500">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-lg flex items-center justify-center">
            <Save className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium mb-2">Folder selected</h3>
          <p className="text-sm">Select a file to view its contents</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col ${className}`}>
      {/* Editor Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <span className="font-medium text-gray-900">{selectedFile.name}</span>
          {hasUnsavedChanges && (
            <span className="w-2 h-2 bg-orange-400 rounded-full" title="Unsaved changes" />
          )}
          <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
            {selectedFile.language || 'plaintext'}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handleUndo}
            className="p-2 text-gray-600 hover:bg-gray-200 rounded transition-colors"
            title="Undo (Ctrl+Z)"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          
          <button
            onClick={handleSave}
            disabled={!hasUnsavedChanges}
            className="p-2 text-gray-600 hover:bg-gray-200 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Save (Ctrl+S)"
          >
            <Save className="w-4 h-4" />
          </button>
          
          <div className="w-px h-6 bg-gray-300" />
          
          <button
            onClick={toggleTheme}
            className="p-2 text-gray-600 hover:bg-gray-200 rounded transition-colors"
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
          >
            {theme === 'light' ? (
              <Moon className="w-4 h-4" />
            ) : (
              <Sun className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Monaco Editor */}
      <div className="flex-1">
        <Editor
          height="100%"
          language={selectedFile.language || 'plaintext'}
          value={selectedFile.content || ''}
          theme={theme === 'dark' ? 'vs-dark' : 'vs'}
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
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

      {/* Status Bar */}
      <div className="flex items-center justify-between px-4 py-1 bg-gray-100 border-t border-gray-200 text-xs text-gray-600">
        <div className="flex items-center gap-4">
          <span>Line 1, Column 1</span>
          <span>{selectedFile.language || 'Plain Text'}</span>
        </div>
        <div className="flex items-center gap-4">
          <span>UTF-8</span>
          <span>LF</span>
          {hasUnsavedChanges ? (
            <span className="text-orange-600">● Unsaved</span>
          ) : (
            <span className="text-green-600">✓ Saved</span>
          )}
        </div>
      </div>
    </div>
  );
};