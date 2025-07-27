import React, { useState } from 'react';
import { Save, AlertCircle, CheckCircle, Github, FolderOpen, FileText } from 'lucide-react';

// Type definitions for form data and validation
interface ProjectSettings {
  name: string;
  description: string;
  githubRepo: string;
  defaultBranch: string;
}

interface ValidationErrors {
  name?: string;
  githubRepo?: string;
  defaultBranch?: string;
}

interface ProjectSettingsPanelProps {
  initialSettings?: Partial<ProjectSettings>;
  onSave?: (settings: ProjectSettings) => Promise<void>;
  className?: string;
}

/**
 * ProjectSettingsPanel Component
 * 
 * A comprehensive settings panel for project configuration with PulseSpark branding.
 * Features form validation, loading states, and clean UI consistent with the design system.
 */
export const ProjectSettingsPanel: React.FC<ProjectSettingsPanelProps> = ({
  initialSettings = {},
  onSave,
  className = ''
}) => {
  // Form state management - Initialize with provided settings or defaults
  const [formData, setFormData] = useState<ProjectSettings>({
    name: initialSettings.name || '',
    description: initialSettings.description || '',
    githubRepo: initialSettings.githubRepo || '',
    defaultBranch: initialSettings.defaultBranch || 'main'
  });

  // Validation and UI state
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  /**
   * Validate GitHub URL format
   * Checks for proper GitHub repository URL structure
   */
  const validateGitHubUrl = (url: string): boolean => {
    if (!url.trim()) return true; // Optional field
    const githubUrlPattern = /^https:\/\/github\.com\/[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+\/?$/;
    return githubUrlPattern.test(url.trim());
  };

  /**
   * Validate all form fields
   * Returns object with validation errors or empty object if valid
   */
  const validateForm = (): ValidationErrors => {
    const newErrors: ValidationErrors = {};

    // Project name validation - Required field
    if (!formData.name.trim()) {
      newErrors.name = 'Project name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Project name must be at least 2 characters';
    }

    // GitHub repository URL validation - Optional but must be valid if provided
    if (formData.githubRepo.trim() && !validateGitHubUrl(formData.githubRepo)) {
      newErrors.githubRepo = 'Please enter a valid GitHub repository URL (e.g., https://github.com/user/repo)';
    }

    // Default branch validation - Required field
    if (!formData.defaultBranch.trim()) {
      newErrors.defaultBranch = 'Default branch name is required';
    } else if (!/^[a-zA-Z0-9/_.-]+$/.test(formData.defaultBranch.trim())) {
      newErrors.defaultBranch = 'Branch name contains invalid characters';
    }

    return newErrors;
  };

  /**
   * Handle input field changes
   * Updates form data and clears related validation errors
   */
  const handleInputChange = (field: keyof ProjectSettings, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear validation error for this field when user starts typing
    if (errors[field as keyof ValidationErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
    
    // Hide success message when user makes changes
    if (showSuccess) {
      setShowSuccess(false);
    }
  };

  /**
   * Handle form submission
   * Validates form, shows errors, or calls save function
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form data
    const validationErrors = validateForm();
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    // Clear any previous errors
    setErrors({});
    setIsLoading(true);

    try {
      // Call save function if provided, otherwise simulate save
      if (onSave) {
        await onSave(formData);
      } else {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
      
      // Show success feedback
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      
    } catch (error) {
      // Handle save errors
      setErrors({ name: 'Failed to save project settings. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Get input styling classes based on validation state
   * Returns appropriate Tailwind classes for different input states
   */
  const getInputClasses = (fieldName: keyof ValidationErrors) => {
    const baseClasses = `
      w-full px-4 py-3 rounded-md border transition-all duration-200
      text-gray-900 placeholder-gray-400 bg-white
      focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent
      disabled:opacity-50 disabled:cursor-not-allowed
    `;
    
    const errorClasses = errors[fieldName] 
      ? 'border-red-300 bg-red-50 focus:ring-red-500' 
      : 'border-gray-300 hover:border-gray-400';
    
    return `${baseClasses} ${errorClasses}`;
  };

  return (
    <div className={`bg-white rounded-xl shadow-lg p-8 max-w-3xl mx-auto my-8 ${className}`}>
      {/* Panel Header - PulseSpark branding with icon */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
          <FolderOpen className="w-5 h-5 text-green-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Project Settings</h2>
          <p className="text-gray-600">Configure your project details and repository settings</p>
        </div>
      </div>

      {/* Success Message - Green themed success feedback */}
      {showSuccess && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
          <p className="text-green-700 font-medium">Project settings saved successfully!</p>
        </div>
      )}

      {/* Settings Form - Clean form layout with proper spacing */}
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Project Name Field - Required field with validation */}
        <div>
          <label htmlFor="projectName" className="block text-sm font-semibold text-gray-700 mb-2">
            Project Name *
          </label>
          <div className="relative">
            <input
              id="projectName"
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={getInputClasses('name')}
              placeholder="Enter your project name"
              disabled={isLoading}
              aria-describedby={errors.name ? 'name-error' : undefined}
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <FileText className="h-5 w-5 text-gray-400" />
            </div>
          </div>
          {/* Name validation error display */}
          {errors.name && (
            <p id="name-error" className="mt-2 text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {errors.name}
            </p>
          )}
        </div>

        {/* Project Description Field - Optional multi-line text area */}
        <div>
          <label htmlFor="projectDescription" className="block text-sm font-semibold text-gray-700 mb-2">
            Description
          </label>
          <textarea
            id="projectDescription"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            rows={4}
            className={`
              w-full px-4 py-3 rounded-md border border-gray-300 transition-all duration-200
              text-gray-900 placeholder-gray-400 bg-white resize-vertical
              focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent
              hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed
              min-h-[100px]
            `}
            placeholder="Describe your project (optional)"
            disabled={isLoading}
          />
        </div>

        {/* GitHub Repository URL Field - Optional with URL validation */}
        <div>
          <label htmlFor="githubRepo" className="block text-sm font-semibold text-gray-700 mb-2">
            GitHub Repository URL
          </label>
          <div className="relative">
            <input
              id="githubRepo"
              type="url"
              value={formData.githubRepo}
              onChange={(e) => handleInputChange('githubRepo', e.target.value)}
              className={getInputClasses('githubRepo')}
              placeholder="https://github.com/user/repo"
              disabled={isLoading}
              aria-describedby={errors.githubRepo ? 'github-error' : undefined}
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <Github className="h-5 w-5 text-gray-400" />
            </div>
          </div>
          {/* GitHub URL validation error display */}
          {errors.githubRepo && (
            <p id="github-error" className="mt-2 text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {errors.githubRepo}
            </p>
          )}
          <p className="mt-1 text-sm text-gray-500">
            Optional: Link to your GitHub repository for version control integration
          </p>
        </div>

        {/* Default Branch Name Field - Required with pattern validation */}
        <div>
          <label htmlFor="defaultBranch" className="block text-sm font-semibold text-gray-700 mb-2">
            Default Branch Name *
          </label>
          <input
            id="defaultBranch"
            type="text"
            value={formData.defaultBranch}
            onChange={(e) => handleInputChange('defaultBranch', e.target.value)}
            className={getInputClasses('defaultBranch')}
            placeholder="main"
            disabled={isLoading}
            aria-describedby={errors.defaultBranch ? 'branch-error' : undefined}
          />
          {/* Branch name validation error display */}
          {errors.defaultBranch && (
            <p id="branch-error" className="mt-2 text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {errors.defaultBranch}
            </p>
          )}
          <p className="mt-1 text-sm text-gray-500">
            The primary branch for your project (usually "main" or "master")
          </p>
        </div>

        {/* Save Button - PulseSpark green gradient with loading state */}
        <div className="pt-6">
          <button
            type="submit"
            disabled={isLoading}
            className="
              w-full flex justify-center items-center gap-3 py-4 px-6
              bg-gradient-to-r from-green-600 to-green-700 
              hover:from-green-500 hover:to-green-600
              text-white font-semibold rounded-md shadow-lg
              transform transition-all duration-200 
              hover:scale-[1.02] hover:shadow-xl
              focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2
              disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
              active:scale-[0.98]
            "
          >
            {isLoading ? (
              <>
                {/* Loading spinner animation */}
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Saving Settings...</span>
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>Save Project Settings</span>
              </>
            )}
          </button>
        </div>

        {/* Form Footer - Helper text */}
        <div className="pt-4 text-center">
          <p className="text-sm text-gray-500">
            * Required fields. Changes will be saved to your project configuration.
          </p>
        </div>
      </form>
    </div>
  );
};

export default ProjectSettingsPanel;