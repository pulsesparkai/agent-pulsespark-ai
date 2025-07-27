import React, { useState } from 'react';
import { Save, X, MessageSquare, Settings, CheckCircle, AlertCircle } from 'lucide-react';

// Type definitions for settings data and validation
interface ChatSettings {
  defaultProvider: string;
  messageLimit: number;
  responseStyle: string;
  enableStreaming: boolean;
  darkMode: boolean;
}

interface ValidationErrors {
  messageLimit?: string;
}

interface ChatSettingsPanelProps {
  initialSettings?: Partial<ChatSettings>;
  onSave?: (settings: ChatSettings) => Promise<void>;
  onCancel?: () => void;
  className?: string;
}

/**
 * ChatSettingsPanel Component
 * 
 * A comprehensive settings panel for chat configuration with PulseSpark branding.
 * Features form validation, toggle switches, and clean UI consistent with the design system.
 */
export const ChatSettingsPanel: React.FC<ChatSettingsPanelProps> = ({
  initialSettings = {},
  onSave,
  onCancel,
  className = ''
}) => {
  // Form state management - Initialize with provided settings or defaults
  const [formData, setFormData] = useState<ChatSettings>({
    defaultProvider: initialSettings.defaultProvider || 'OpenAI',
    messageLimit: initialSettings.messageLimit || 4000,
    responseStyle: initialSettings.responseStyle || 'Detailed',
    enableStreaming: initialSettings.enableStreaming ?? true,
    darkMode: initialSettings.darkMode ?? false
  });

  // Store initial state for cancel functionality
  const [initialState] = useState<ChatSettings>({
    defaultProvider: initialSettings.defaultProvider || 'OpenAI',
    messageLimit: initialSettings.messageLimit || 4000,
    responseStyle: initialSettings.responseStyle || 'Detailed',
    enableStreaming: initialSettings.enableStreaming ?? true,
    darkMode: initialSettings.darkMode ?? false
  });

  // Validation and UI state
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // AI Provider options for dropdown
  const providerOptions = [
    { value: 'OpenAI', label: 'OpenAI (GPT)' },
    { value: 'Claude', label: 'Anthropic Claude' },
    { value: 'DeepSeek', label: 'DeepSeek' },
    { value: 'Grok', label: 'Grok (X.AI)' },
    { value: 'Mistral', label: 'Mistral AI' }
  ];

  // Response style options for radio buttons
  const responseStyleOptions = [
    { value: 'Concise', label: 'Concise', description: 'Short, direct responses' },
    { value: 'Detailed', label: 'Detailed', description: 'Comprehensive explanations' },
    { value: 'Creative', label: 'Creative', description: 'Imaginative and expressive' }
  ];

  /**
   * Validate message limit input
   * Ensures positive integer within reasonable bounds
   */
  const validateMessageLimit = (value: number): string | undefined => {
    if (!Number.isInteger(value) || value <= 0) {
      return 'Message limit must be a positive integer';
    }
    if (value < 100) {
      return 'Message limit must be at least 100 tokens';
    }
    if (value > 32000) {
      return 'Message limit cannot exceed 32,000 tokens';
    }
    return undefined;
  };

  /**
   * Validate all form fields
   * Returns object with validation errors or empty object if valid
   */
  const validateForm = (): ValidationErrors => {
    const newErrors: ValidationErrors = {};

    // Message limit validation
    const messageLimitError = validateMessageLimit(formData.messageLimit);
    if (messageLimitError) {
      newErrors.messageLimit = messageLimitError;
    }

    return newErrors;
  };

  /**
   * Handle input field changes
   * Updates form data and clears related validation errors
   */
  const handleInputChange = (field: keyof ChatSettings, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear validation error for this field when user makes changes
    if (errors[field as keyof ValidationErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
    
    // Hide success message when user makes changes
    if (showSuccess) {
      setShowSuccess(false);
    }
  };

  /**
   * Handle toggle switch changes
   * Updates boolean values for switches
   */
  const handleToggleChange = (field: keyof ChatSettings) => {
    setFormData(prev => ({ ...prev, [field]: !prev[field] }));
    
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
      setErrors({ messageLimit: 'Failed to save chat settings. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle cancel action
   * Resets form to initial state
   */
  const handleCancel = () => {
    setFormData(initialState);
    setErrors({});
    setShowSuccess(false);
    
    if (onCancel) {
      onCancel();
    }
  };

  /**
   * Custom Toggle Switch Component
   * Styled with PulseSpark green branding
   */
  const ToggleSwitch: React.FC<{
    checked: boolean;
    onChange: () => void;
    label: string;
    description?: string;
    disabled?: boolean;
  }> = ({ checked, onChange, label, description, disabled = false }) => (
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          {label}
        </label>
        {description && (
          <p className="text-sm text-gray-500">{description}</p>
        )}
      </div>
      <button
        type="button"
        onClick={onChange}
        disabled={disabled}
        className={`
          relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200
          focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2
          disabled:opacity-50 disabled:cursor-not-allowed
          ${checked ? 'bg-green-600' : 'bg-gray-200'}
        `}
        role="switch"
        aria-checked={checked}
        aria-label={label}
      >
        <span
          className={`
            inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200
            ${checked ? 'translate-x-6' : 'translate-x-1'}
          `}
        />
      </button>
    </div>
  );

  return (
    <div className={`bg-white rounded-xl shadow-lg p-8 max-w-3xl mx-auto my-8 ${className}`}>
      {/* Panel Header - PulseSpark branding with icon */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
          <MessageSquare className="w-5 h-5 text-green-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Chat Settings</h2>
          <p className="text-gray-600">Customize your AI chat experience and preferences</p>
        </div>
      </div>

      {/* Success Message - Green themed success feedback */}
      {showSuccess && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
          <p className="text-green-700 font-medium">Chat settings saved successfully!</p>
        </div>
      )}

      {/* Settings Form - Clean form layout with proper spacing */}
      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* AI Provider Section */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Provider Settings</h3>
          
          <div>
            <label htmlFor="defaultProvider" className="block text-sm font-semibold text-gray-700 mb-2">
              Default AI Provider
            </label>
            <select
              id="defaultProvider"
              value={formData.defaultProvider}
              onChange={(e) => handleInputChange('defaultProvider', e.target.value)}
              className="
                w-full px-4 py-3 rounded-md border border-gray-300 transition-all duration-200
                text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-green-500 
                focus:border-transparent hover:border-gray-400 disabled:opacity-50 
                disabled:cursor-not-allowed
              "
              disabled={isLoading}
            >
              {providerOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-sm text-gray-500">
              Choose your preferred AI provider for chat responses
            </p>
          </div>
        </div>

        {/* Message Settings Section */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Message Settings</h3>
          
          <div>
            <label htmlFor="messageLimit" className="block text-sm font-semibold text-gray-700 mb-2">
              Message Length Limit (tokens)
            </label>
            <input
              id="messageLimit"
              type="number"
              min="100"
              max="32000"
              value={formData.messageLimit}
              onChange={(e) => handleInputChange('messageLimit', parseInt(e.target.value) || 0)}
              className={`
                w-full px-4 py-3 rounded-md border transition-all duration-200
                text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-green-500 
                focus:border-transparent hover:border-gray-400 disabled:opacity-50 
                disabled:cursor-not-allowed
                ${errors.messageLimit ? 'border-red-300 bg-red-50' : 'border-gray-300'}
              `}
              placeholder="4000"
              disabled={isLoading}
              aria-describedby={errors.messageLimit ? 'message-limit-error' : undefined}
            />
            {errors.messageLimit && (
              <p id="message-limit-error" className="mt-2 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.messageLimit}
              </p>
            )}
            <p className="mt-1 text-sm text-gray-500">
              Maximum number of tokens for AI responses (100-32,000)
            </p>
          </div>
        </div>

        {/* Response Style Section */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Response Style</h3>
          
          <div className="space-y-3">
            {responseStyleOptions.map((option) => (
              <div key={option.value} className="flex items-start">
                <input
                  id={`style-${option.value}`}
                  type="radio"
                  name="responseStyle"
                  value={option.value}
                  checked={formData.responseStyle === option.value}
                  onChange={(e) => handleInputChange('responseStyle', e.target.value)}
                  className="
                    mt-1 h-4 w-4 text-green-600 border-gray-300 focus:ring-green-500 
                    focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed
                  "
                  disabled={isLoading}
                />
                <div className="ml-3">
                  <label htmlFor={`style-${option.value}`} className="block text-sm font-medium text-gray-900">
                    {option.label}
                  </label>
                  <p className="text-sm text-gray-500">{option.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Advanced Settings Section */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Advanced Settings</h3>
          
          <div className="space-y-6">
            {/* Streaming Responses Toggle */}
            <ToggleSwitch
              checked={formData.enableStreaming}
              onChange={() => handleToggleChange('enableStreaming')}
              label="Enable Streaming Responses"
              description="Show AI responses as they're being generated in real-time"
              disabled={isLoading}
            />

            {/* Dark Mode Toggle */}
            <ToggleSwitch
              checked={formData.darkMode}
              onChange={() => handleToggleChange('darkMode')}
              label="Dark Mode"
              description="Use dark theme for the chat interface"
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Form Actions - Save and Cancel buttons */}
        <div className="flex gap-4 pt-6 border-t border-gray-200">
          <button
            type="submit"
            disabled={isLoading}
            className="
              flex-1 flex justify-center items-center gap-3 py-4 px-6
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
                <span>Save Settings</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleCancel}
            disabled={isLoading}
            className="
              flex-1 flex justify-center items-center gap-3 py-4 px-6
              bg-gray-100 text-gray-700 font-semibold rounded-md
              hover:bg-gray-200 transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            <X className="w-5 h-5" />
            <span>Cancel</span>
          </button>
        </div>

        {/* Form Footer - Helper text */}
        <div className="pt-4 text-center">
          <p className="text-sm text-gray-500">
            Settings will be applied to all future chat conversations
          </p>
        </div>
      </form>
    </div>
  );
};

export default ChatSettingsPanel;