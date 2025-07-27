import React, { useState, useRef } from 'react';
import { Save, X, User, Mail, Lock, Camera, Globe, Languages, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';

// Type definitions for user profile data and validation
interface UserProfile {
  fullName: string;
  email: string;
  profilePicture?: string;
  timezone: string;
  language: string;
}

interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface ValidationErrors {
  fullName?: string;
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

interface UserProfileSettingsProps {
  initialProfile?: Partial<UserProfile>;
  onSave?: (profile: UserProfile) => Promise<void>;
  onPasswordChange?: (passwordData: PasswordChangeData) => Promise<void>;
  className?: string;
}

/**
 * UserProfileSettings Component
 * 
 * A comprehensive user profile settings panel with PulseSpark branding.
 * Features profile editing, password change modal, and avatar upload functionality.
 */
export const UserProfileSettings: React.FC<UserProfileSettingsProps> = ({
  initialProfile = {},
  onSave,
  onPasswordChange,
  className = ''
}) => {
  // Form state management - Initialize with provided profile or defaults
  const [formData, setFormData] = useState<UserProfile>({
    fullName: initialProfile.fullName || '',
    email: initialProfile.email || 'user@example.com',
    profilePicture: initialProfile.profilePicture || '',
    timezone: initialProfile.timezone || 'America/New_York',
    language: initialProfile.language || 'English'
  });

  // Store initial state for cancel functionality
  const [initialState] = useState<UserProfile>({
    fullName: initialProfile.fullName || '',
    email: initialProfile.email || 'user@example.com',
    profilePicture: initialProfile.profilePicture || '',
    timezone: initialProfile.timezone || 'America/New_York',
    language: initialProfile.language || 'English'
  });

  // Password change modal state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState<PasswordChangeData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  // Validation and UI state
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);

  // File input ref for avatar upload
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Timezone options for dropdown
  const timezoneOptions = [
    { value: 'America/New_York', label: 'Eastern Time (ET)' },
    { value: 'America/Chicago', label: 'Central Time (CT)' },
    { value: 'America/Denver', label: 'Mountain Time (MT)' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
    { value: 'Europe/London', label: 'Greenwich Mean Time (GMT)' },
    { value: 'Europe/Paris', label: 'Central European Time (CET)' },
    { value: 'Asia/Tokyo', label: 'Japan Standard Time (JST)' },
    { value: 'Asia/Shanghai', label: 'China Standard Time (CST)' },
    { value: 'Australia/Sydney', label: 'Australian Eastern Time (AET)' }
  ];

  // Language options for dropdown
  const languageOptions = [
    { value: 'English', label: 'English' },
    { value: 'Spanish', label: 'Español' },
    { value: 'French', label: 'Français' },
    { value: 'German', label: 'Deutsch' },
    { value: 'Italian', label: 'Italiano' },
    { value: 'Portuguese', label: 'Português' },
    { value: 'Japanese', label: '日本語' },
    { value: 'Chinese', label: '中文' }
  ];

  /**
   * Validate profile form fields
   * Returns object with validation errors or empty object if valid
   */
  const validateProfile = (): ValidationErrors => {
    const newErrors: ValidationErrors = {};

    // Full name validation - Required field
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Full name must be at least 2 characters';
    }

    return newErrors;
  };

  /**
   * Validate password change form
   * Returns object with validation errors or empty object if valid
   */
  const validatePasswordChange = (): ValidationErrors => {
    const newErrors: ValidationErrors = {};

    // Current password validation
    if (!passwordData.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }

    // New password validation
    if (!passwordData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (passwordData.newPassword.length < 8) {
      newErrors.newPassword = 'New password must be at least 8 characters';
    }

    // Confirm password validation
    if (!passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your new password';
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    return newErrors;
  };

  /**
   * Handle profile input field changes
   * Updates form data and clears related validation errors
   */
  const handleInputChange = (field: keyof UserProfile, value: string) => {
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
   * Handle password field changes
   * Updates password data and clears related validation errors
   */
  const handlePasswordChange = (field: keyof PasswordChangeData, value: string) => {
    setPasswordData(prev => ({ ...prev, [field]: value }));
    
    // Clear validation error for this field when user starts typing
    if (errors[field as keyof ValidationErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  /**
   * Handle avatar file upload
   * Processes selected image file and updates profile picture
   */
  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({ ...prev, fullName: 'Please select a valid image file' }));
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, fullName: 'Image file must be less than 5MB' }));
        return;
      }

      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        setFormData(prev => ({ ...prev, profilePicture: imageUrl }));
        
        // Hide success message when user makes changes
        if (showSuccess) {
          setShowSuccess(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  /**
   * Handle profile form submission
   * Validates form, shows errors, or calls save function
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form data
    const validationErrors = validateProfile();
    
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
      setErrors({ fullName: 'Failed to save profile. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle password change submission
   * Validates passwords and calls password change function
   */
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate password data
    const validationErrors = validatePasswordChange();
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    // Clear any previous errors
    setErrors({});
    setIsPasswordLoading(true);

    try {
      // Call password change function if provided, otherwise simulate
      if (onPasswordChange) {
        await onPasswordChange(passwordData);
      } else {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
      
      // Reset password form and close modal
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setShowPasswordModal(false);
      setShowPasswords({ current: false, new: false, confirm: false });
      
      // Show success feedback
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      
    } catch (error) {
      // Handle password change errors
      setErrors({ currentPassword: 'Failed to change password. Please try again.' });
    } finally {
      setIsPasswordLoading(false);
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
  };

  /**
   * Toggle password visibility
   * Shows/hides password fields in the modal
   */
  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  return (
    <div className={`bg-white rounded-xl shadow-lg p-8 max-w-3xl mx-auto my-8 ${className}`}>
      {/* Panel Header - PulseSpark branding with icon */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
          <User className="w-5 h-5 text-green-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Profile Settings</h2>
          <p className="text-gray-600">Manage your account information and preferences</p>
        </div>
      </div>

      {/* Success Message - Green themed success feedback */}
      {showSuccess && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
          <p className="text-green-700 font-medium">Profile settings saved successfully!</p>
        </div>
      )}

      {/* Profile Form - Clean form layout with proper spacing */}
      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Profile Picture Section */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Picture</h3>
          
          <div className="flex items-center gap-6">
            {/* Avatar Display */}
            <div className="relative">
              <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                {formData.profilePicture ? (
                  <img
                    src={formData.profilePicture}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-8 h-8 text-gray-400" />
                )}
              </div>
              
              {/* Upload Button Overlay */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                title="Change profile picture"
              >
                <Camera className="w-5 h-5 text-white" />
              </button>
            </div>
            
            {/* Upload Button */}
            <div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                Upload Photo
              </button>
              <p className="text-sm text-gray-500 mt-1">
                JPG, PNG or GIF. Max size 5MB.
              </p>
            </div>
            
            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
            />
          </div>
        </div>

        {/* Personal Information Section */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Full Name Field */}
            <div>
              <label htmlFor="fullName" className="block text-sm font-semibold text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                id="fullName"
                type="text"
                value={formData.fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                className={`
                  w-full px-4 py-3 bg-gray-100 border rounded-md transition-all duration-200
                  text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 
                  focus:ring-green-500 focus:border-transparent disabled:opacity-50 
                  disabled:cursor-not-allowed
                  ${errors.fullName ? 'border-red-300 bg-red-50' : 'border-gray-300'}
                `}
                placeholder="Enter your full name"
                disabled={isLoading}
                aria-describedby={errors.fullName ? 'fullName-error' : undefined}
              />
              {errors.fullName && (
                <p id="fullName-error" className="mt-2 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.fullName}
                </p>
              )}
            </div>

            {/* Email Field - Read Only */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  readOnly
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-md text-gray-500 cursor-not-allowed"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Contact support to change your email address
              </p>
            </div>
          </div>
        </div>

        {/* Security Section */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Security</h3>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Password
            </label>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <input
                  type="password"
                  value="••••••••••••"
                  readOnly
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-md text-gray-500 cursor-not-allowed"
                />
              </div>
              <button
                type="button"
                onClick={() => setShowPasswordModal(true)}
                className="flex items-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              >
                <Lock className="w-4 h-4" />
                Change Password
              </button>
            </div>
          </div>
        </div>

        {/* Preferences Section */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Preferences</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Timezone Field */}
            <div>
              <label htmlFor="timezone" className="block text-sm font-semibold text-gray-700 mb-2">
                Timezone
              </label>
              <div className="relative">
                <select
                  id="timezone"
                  value={formData.timezone}
                  onChange={(e) => handleInputChange('timezone', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isLoading}
                >
                  {timezoneOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <Globe className="h-5 w-5 text-gray-400" />
                </div>
              </div>
            </div>

            {/* Language Field */}
            <div>
              <label htmlFor="language" className="block text-sm font-semibold text-gray-700 mb-2">
                Language
              </label>
              <div className="relative">
                <select
                  id="language"
                  value={formData.language}
                  onChange={(e) => handleInputChange('language', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isLoading}
                >
                  {languageOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <Languages className="h-5 w-5 text-gray-400" />
                </div>
              </div>
            </div>
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
                <span>Saving Changes...</span>
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>Save Changes</span>
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
            * Required fields. Changes will be saved to your profile.
          </p>
        </div>
      </form>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">Change Password</h3>
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                  setErrors({});
                  setShowPasswords({ current: false, new: false, confirm: false });
                }}
                disabled={isPasswordLoading}
                className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              {/* Current Password */}
              <div>
                <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    id="currentPassword"
                    type={showPasswords.current ? 'text' : 'password'}
                    value={passwordData.currentPassword}
                    onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                    className={`
                      block w-full px-4 py-3 pr-12 border rounded-md transition-all duration-200
                      text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 
                      focus:ring-green-500 focus:border-transparent disabled:opacity-50 
                      disabled:cursor-not-allowed
                      ${errors.currentPassword ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'}
                    `}
                    placeholder="Enter current password"
                    disabled={isPasswordLoading}
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('current')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                    disabled={isPasswordLoading}
                  >
                    {showPasswords.current ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.currentPassword && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.currentPassword}
                  </p>
                )}
              </div>

              {/* New Password */}
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    id="newPassword"
                    type={showPasswords.new ? 'text' : 'password'}
                    value={passwordData.newPassword}
                    onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                    className={`
                      block w-full px-4 py-3 pr-12 border rounded-md transition-all duration-200
                      text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 
                      focus:ring-green-500 focus:border-transparent disabled:opacity-50 
                      disabled:cursor-not-allowed
                      ${errors.newPassword ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'}
                    `}
                    placeholder="Enter new password"
                    disabled={isPasswordLoading}
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('new')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                    disabled={isPasswordLoading}
                  >
                    {showPasswords.new ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.newPassword && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.newPassword}
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showPasswords.confirm ? 'text' : 'password'}
                    value={passwordData.confirmPassword}
                    onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                    className={`
                      block w-full px-4 py-3 pr-12 border rounded-md transition-all duration-200
                      text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 
                      focus:ring-green-500 focus:border-transparent disabled:opacity-50 
                      disabled:cursor-not-allowed
                      ${errors.confirmPassword ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'}
                    `}
                    placeholder="Confirm new password"
                    disabled={isPasswordLoading}
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('confirm')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                    disabled={isPasswordLoading}
                  >
                    {showPasswords.confirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.confirmPassword}
                  </p>
                )}
              </div>

              {/* Modal Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                    setErrors({});
                    setShowPasswords({ current: false, new: false, confirm: false });
                  }}
                  disabled={isPasswordLoading}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md font-medium transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPasswordLoading || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                  className="flex-1 flex justify-center items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isPasswordLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Changing...
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      Change Password
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfileSettings;