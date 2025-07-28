import React, { useState, useEffect, useCallback } from 'react';
import { 
  Save, 
  X, 
  Plus, 
  Tag, 
  FileText, 
  AlertCircle, 
  CheckCircle,
  Brain
} from 'lucide-react';
import { useMemoryContext } from '../../contexts/MemoryContext';
import { useAuth } from '../../contexts/AuthContext';
import { useProject } from '../../contexts/ProjectContext';
import { LoadingSpinner } from '../Shared/LoadingSpinner';
import { MemoryItem } from '../../hooks/useMemory';

interface MemoryItemEditorProps {
  memory?: MemoryItem | null;
  onSave?: (memory: MemoryItem) => void;
  onCancel?: () => void;
  className?: string;
}

/**
 * MemoryItemEditor Component
 * 
 * Provides a form interface for creating and editing memory items.
 * Features rich text input, tag management, and metadata configuration.
 * Integrates with the custom memory system API for intelligent storage.
 */
export const MemoryItemEditor: React.FC<MemoryItemEditorProps> = ({
  memory,
  onSave,
  onCancel,
  className = ''
}) => {
  // Context and authentication
  const { user } = useAuth();
  const { currentProject } = useProject();
  const { 
    addMemory, 
    updateMemory, 
    loading, 
    error, 
    clearError 
  } = useMemoryContext();

  // Form state management
  const [text, setText] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [metadata, setMetadata] = useState({
    type: 'note' as 'chat' | 'code' | 'note' | 'document',
    importance: 1,
    source: 'user_input'
  });
  
  // UI state management
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{
    text?: string;
    tags?: string;
  }>({});

  // Form validation constants
  const MAX_TEXT_LENGTH = 10000;
  const MIN_TEXT_LENGTH = 5;
  const MAX_TAGS = 20;
  const MAX_TAG_LENGTH = 50;

  // Editing mode detection
  const isEditing = !!memory;

  /**
   * Initialize form with existing memory data
   * Populates form fields when editing existing memory
   */
  useEffect(() => {
    if (memory) {
      setText(memory.text);
      setTags(memory.tags);
      setMetadata({
        type: memory.metadata.type || 'note',
        importance: memory.metadata.importance || 1,
        source: memory.metadata.source || 'user_input'
      });
    }
  }, [memory]);

  /**
   * Validate form inputs
   * Returns validation errors or empty object if valid
   */
  const validateForm = useCallback((): { text?: string; tags?: string } => {
    const errors: { text?: string; tags?: string } = {};

    // Text validation
    if (!text.trim()) {
      errors.text = 'Memory text is required';
    } else if (text.trim().length < MIN_TEXT_LENGTH) {
      errors.text = `Memory text must be at least ${MIN_TEXT_LENGTH} characters`;
    } else if (text.length > MAX_TEXT_LENGTH) {
      errors.text = `Memory text must be less than ${MAX_TEXT_LENGTH} characters`;
    }

    // Tags validation
    if (tags.length > MAX_TAGS) {
      errors.tags = `Cannot have more than ${MAX_TAGS} tags`;
    }

    const invalidTags = tags.filter(tag => tag.length > MAX_TAG_LENGTH);
    if (invalidTags.length > 0) {
      errors.tags = `Tags must be less than ${MAX_TAG_LENGTH} characters`;
    }

    return errors;
  }, [text, tags]);

  /**
   * Handle form submission
   * Validates input and calls appropriate API method
   */
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      return;
    }

    // Clear previous errors
    setValidationErrors({});
    clearError();

    // Validate form
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setIsSubmitting(true);

    try {
      const memoryData = {
        text: text.trim(),
        metadata: {
          ...metadata,
          projectId: currentProject?.id,
          editedAt: new Date().toISOString()
        },
        tags: tags.filter(tag => tag.trim().length > 0)
      };

      if (isEditing && memory) {
        // Update existing memory
        await updateMemory(memory.id, memoryData);
      } else {
        // Create new memory
        await addMemory(memoryData.text, memoryData.metadata, memoryData.tags);
      }

      // Show success feedback
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);

      // Call success callback if provided
      if (onSave) {
        // Create a mock updated memory for callback
        const updatedMemory: MemoryItem = {
          id: memory?.id || 'new-memory',
          text: memoryData.text,
          metadata: memoryData.metadata,
          tags: memoryData.tags,
          created_at: memory?.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        onSave(updatedMemory);
      }

      // Reset form if creating new memory
      if (!isEditing) {
        setText('');
        setTags([]);
        setNewTag('');
        setMetadata({
          type: 'note',
          importance: 1,
          source: 'user_input'
        });
      }

    } catch (err) {
      console.error('Failed to save memory:', err);
    } finally {
      setIsSubmitting(false);
    }
  }, [
    user,
    currentProject,
    text,
    tags,
    metadata,
    memory,
    isEditing,
    validateForm,
    addMemory,
    updateMemory,
    clearError,
    onSave
  ]);

  /**
   * Handle adding new tag
   * Validates and adds tag to the tags array
   */
  const handleAddTag = useCallback(() => {
    const trimmedTag = newTag.trim().toLowerCase();
    
    if (!trimmedTag) return;
    
    if (trimmedTag.length > MAX_TAG_LENGTH) {
      setValidationErrors(prev => ({
        ...prev,
        tags: `Tag must be less than ${MAX_TAG_LENGTH} characters`
      }));
      return;
    }
    
    if (tags.includes(trimmedTag)) {
      setValidationErrors(prev => ({
        ...prev,
        tags: 'Tag already exists'
      }));
      return;
    }
    
    if (tags.length >= MAX_TAGS) {
      setValidationErrors(prev => ({
        ...prev,
        tags: `Cannot have more than ${MAX_TAGS} tags`
      }));
      return;
    }

    setTags(prev => [...prev, trimmedTag]);
    setNewTag('');
    setValidationErrors(prev => ({ ...prev, tags: undefined }));
  }, [newTag, tags]);

  /**
   * Handle removing tag
   * Removes tag from the tags array
   */
  const handleRemoveTag = useCallback((tagToRemove: string) => {
    setTags(prev => prev.filter(tag => tag !== tagToRemove));
    setValidationErrors(prev => ({ ...prev, tags: undefined }));
  }, []);

  /**
   * Handle tag input key press
   * Adds tag on Enter key press
   */
  const handleTagKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  }, [handleAddTag]);

  /**
   * Handle text input change
   * Updates text state and clears validation errors
   */
  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    if (validationErrors.text) {
      setValidationErrors(prev => ({ ...prev, text: undefined }));
    }
  }, [validationErrors.text]);

  /**
   * Handle cancel action
   * Resets form or calls cancel callback
   */
  const handleCancel = useCallback(() => {
    if (onCancel) {
      onCancel();
    } else {
      // Reset form
      setText('');
      setTags([]);
      setNewTag('');
      setValidationErrors({});
      clearError();
    }
  }, [onCancel, clearError]);

  if (!user) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500">Please sign in to manage memories.</p>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl shadow-lg p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
          <Brain className="w-5 h-5 text-green-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Edit Memory' : 'Add New Memory'}
          </h2>
          <p className="text-gray-600">
            {isEditing ? 'Update your memory entry' : 'Store knowledge for future reference'}
          </p>
        </div>
      </div>

      {/* Success Message */}
      {showSuccess && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
          <p className="text-green-700 font-medium">
            Memory {isEditing ? 'updated' : 'created'} successfully!
          </p>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-red-700 font-medium">Error saving memory</p>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
          <button
            onClick={clearError}
            className="text-red-500 hover:text-red-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Memory Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Text Content Field */}
        <div>
          <label htmlFor="memoryText" className="block text-sm font-semibold text-gray-700 mb-2">
            Memory Content *
          </label>
          <div className="relative">
            <textarea
              id="memoryText"
              value={text}
              onChange={handleTextChange}
              placeholder="Enter the knowledge or information you want to remember..."
              disabled={isSubmitting}
              className={`
                w-full px-4 py-3 border rounded-lg resize-vertical transition-colors
                focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent
                disabled:opacity-50 disabled:cursor-not-allowed min-h-32
                ${validationErrors.text 
                  ? 'border-red-300 bg-red-50 focus:ring-red-500' 
                  : 'border-gray-300 hover:border-gray-400'
                }
              `}
              rows={6}
              maxLength={MAX_TEXT_LENGTH}
              aria-describedby={validationErrors.text ? 'text-error' : 'text-help'}
            />
            <div className="absolute bottom-3 right-3 text-xs text-gray-400">
              {text.length}/{MAX_TEXT_LENGTH}
            </div>
          </div>
          
          {validationErrors.text && (
            <p id="text-error" className="mt-2 text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {validationErrors.text}
            </p>
          )}
          
          <p id="text-help" className="mt-1 text-sm text-gray-500">
            Describe the knowledge, code snippet, or information you want to store for future reference.
          </p>
        </div>

        {/* Memory Type and Importance */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Memory Type */}
          <div>
            <label htmlFor="memoryType" className="block text-sm font-semibold text-gray-700 mb-2">
              Memory Type
            </label>
            <select
              id="memoryType"
              value={metadata.type}
              onChange={(e) => setMetadata(prev => ({ 
                ...prev, 
                type: e.target.value as typeof metadata.type 
              }))}
              disabled={isSubmitting}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:opacity-50"
            >
              <option value="note">Note</option>
              <option value="code">Code</option>
              <option value="chat">Chat</option>
              <option value="document">Document</option>
            </select>
          </div>

          {/* Importance Level */}
          <div>
            <label htmlFor="importance" className="block text-sm font-semibold text-gray-700 mb-2">
              Importance Level
            </label>
            <select
              id="importance"
              value={metadata.importance}
              onChange={(e) => setMetadata(prev => ({ 
                ...prev, 
                importance: parseInt(e.target.value) 
              }))}
              disabled={isSubmitting}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:opacity-50"
            >
              <option value={1}>1 - Low</option>
              <option value={2}>2 - Medium</option>
              <option value={3}>3 - High</option>
              <option value={4}>4 - Very High</option>
              <option value={5}>5 - Critical</option>
            </select>
          </div>
        </div>

        {/* Tags Section */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Tags
          </label>
          
          {/* Existing Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                >
                  <Tag className="w-3 h-3" />
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    disabled={isSubmitting}
                    className="ml-1 text-blue-600 hover:text-blue-800 disabled:opacity-50"
                    aria-label={`Remove ${tag} tag`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Add New Tag */}
          <div className="flex gap-2">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyPress={handleTagKeyPress}
              placeholder="Add a tag..."
              disabled={isSubmitting || tags.length >= MAX_TAGS}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:opacity-50"
              maxLength={MAX_TAG_LENGTH}
            />
            <button
              type="button"
              onClick={handleAddTag}
              disabled={!newTag.trim() || isSubmitting || tags.length >= MAX_TAGS}
              className="flex items-center gap-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>
          
          {validationErrors.tags && (
            <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {validationErrors.tags}
            </p>
          )}
          
          <p className="mt-1 text-sm text-gray-500">
            Add tags to help categorize and find this memory later. Press Enter to add a tag.
          </p>
        </div>

        {/* Project Context */}
        {currentProject && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">
                This memory will be associated with project: {currentProject.name}
              </span>
            </div>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex gap-4 pt-6 border-t border-gray-200">
          <button
            type="submit"
            disabled={isSubmitting || !text.trim()}
            className="
              flex-1 flex justify-center items-center gap-3 py-3 px-6
              bg-gradient-to-r from-green-600 to-green-700 
              hover:from-green-500 hover:to-green-600
              text-white font-semibold rounded-lg shadow-sm
              transform transition-all duration-200 
              hover:scale-[1.02] hover:shadow-md
              focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2
              disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
              active:scale-[0.98]
            "
          >
            {isSubmitting ? (
              <>
                <LoadingSpinner size="sm" />
                <span>{isEditing ? 'Updating...' : 'Saving...'}</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>{isEditing ? 'Update Memory' : 'Save Memory'}</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleCancel}
            disabled={isSubmitting}
            className="
              flex-1 flex justify-center items-center gap-3 py-3 px-6
              bg-gray-100 text-gray-700 font-semibold rounded-lg
              hover:bg-gray-200 transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            <X className="w-4 h-4" />
            <span>Cancel</span>
          </button>
        </div>

        {/* Form Footer */}
        <div className="pt-4 text-center">
          <p className="text-sm text-gray-500">
            * Required fields. Your memory will be stored securely and searchable using AI.
          </p>
        </div>
      </form>
    </div>
  );
};