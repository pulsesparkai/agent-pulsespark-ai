import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

/**
 * SignupPage Component
 * 
 * A clean, modern signup form for agent.pulsespark.ai with PulseSpark green branding
 * Features form validation, password visibility toggles, and accessibility support
 */
const SignupPage: React.FC = () => {
  // Form state management
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Validation state
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
    terms?: string;
  }>({});

  /**
   * Validate email format using regex
   */
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  /**
   * Handle form submission with comprehensive validation
   * Validates email format, password requirements, password match, and terms agreement
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset previous errors
    setErrors({});
    
    // Validation logic
    const newErrors: { 
      email?: string; 
      password?: string; 
      confirmPassword?: string;
      terms?: string;
    } = {};
    
    // Email validation
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    // Password validation
    if (!password.trim()) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long';
    }
    
    // Confirm password validation
    if (!confirmPassword.trim()) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    // Terms agreement validation
    if (!agreeToTerms) {
      newErrors.terms = 'You must agree to the Terms of Service and Privacy Policy';
    }
    
    // If there are errors, set them and return
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    // If validation passes, handle signup logic here
    console.log('Signup attempt:', { email, password, agreeToTerms });
    // TODO: Integrate with authentication system
  };

  /**
   * Toggle password visibility for password field
   */
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  /**
   * Toggle password visibility for confirm password field
   */
  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  return (
    // Main container - Full viewport height with light gradient background (PulseSpark green tint)
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-green-50 flex items-center justify-center px-4">
      
      {/* Signup Card Container - Pure white with subtle shadow */}
      <div className="bg-white rounded-xl shadow-lg p-10 max-w-md w-full">
        
        {/* Header Section - PulseSpark branding */}
        <div className="text-center mb-8">
          {/* Logo Placeholder - PulseSpark green circular logo */}
          <div className="rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-6 bg-green-600">
            <span className="text-white font-bold text-lg">PS</span>
          </div>
          
          {/* Main Heading - Dark gray for readability */}
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Create your account
          </h1>
          
          {/* Subtitle - Medium gray */}
          <p className="text-gray-600 mb-8">
            Sign up to start using agent.pulsespark.ai
          </p>
        </div>

        {/* Signup Form - Green focus states throughout */}
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Email Input Field - Light gray background with green focus ring */}
          <div>
            <label htmlFor="email" className="sr-only">
              Email address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`
                w-full p-3 rounded-md bg-gray-100 text-gray-900 placeholder-gray-400
                border transition duration-200
                focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-green-600
                ${errors.email 
                  ? 'border-red-600' 
                  : 'border-gray-300'
                }
              `}
              placeholder="Enter your email address"
              autoComplete="email"
            />
            {/* Email Validation Error - Red text for errors */}
            {errors.email && (
              <p className="text-red-600 text-sm mb-3 mt-2">
                {errors.email}
              </p>
            )}
          </div>

          {/* Password Input Field - Light gray background with green focus ring */}
          <div>
            <label htmlFor="password" className="sr-only">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`
                  w-full p-3 pr-12 rounded-md bg-gray-100 text-gray-900 placeholder-gray-400
                  border transition duration-200
                  focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-green-600
                  ${errors.password 
                    ? 'border-red-600' 
                    : 'border-gray-300'
                  }
                `}
                placeholder="Create a password (min 8 characters)"
                autoComplete="new-password"
              />
              
              {/* Password Toggle Button - Gray with hover effect */}
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition duration-200"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
            
            {/* Password Validation Error - Red text for errors */}
            {errors.password && (
              <p className="text-red-600 text-sm mb-3 mt-2">
                {errors.password}
              </p>
            )}
          </div>

          {/* Confirm Password Input Field - Light gray background with green focus ring */}
          <div>
            <label htmlFor="confirmPassword" className="sr-only">
              Confirm Password
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`
                  w-full p-3 pr-12 rounded-md bg-gray-100 text-gray-900 placeholder-gray-400
                  border transition duration-200
                  focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-green-600
                  ${errors.confirmPassword 
                    ? 'border-red-600' 
                    : 'border-gray-300'
                  }
                `}
                placeholder="Confirm your password"
                autoComplete="new-password"
              />
              
              {/* Confirm Password Toggle Button - Gray with hover effect */}
              <button
                type="button"
                onClick={toggleConfirmPasswordVisibility}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition duration-200"
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
            
            {/* Confirm Password Validation Error - Red text for errors */}
            {errors.confirmPassword && (
              <p className="text-red-600 text-sm mb-3 mt-2">
                {errors.confirmPassword}
              </p>
            )}
          </div>

          {/* Terms and Conditions Checkbox - PulseSpark green accent */}
          <div>
            <div className="flex items-start">
              <input
                id="agreeToTerms"
                type="checkbox"
                checked={agreeToTerms}
                onChange={(e) => setAgreeToTerms(e.target.checked)}
                className={`
                  mt-1 h-4 w-4 rounded border-gray-300 
                  text-green-600 focus:ring-green-600 focus:ring-2
                  ${errors.terms ? 'border-red-600' : ''}
                `}
              />
              <label htmlFor="agreeToTerms" className="ml-3 text-sm text-gray-700">
                I agree to the{' '}
                <span className="text-green-600 hover:underline cursor-pointer">
                  Terms of Service
                </span>
                {' '}and{' '}
                <span className="text-green-600 hover:underline cursor-pointer">
                  Privacy Policy
                </span>
              </label>
            </div>
            
            {/* Terms Validation Error - Red text for errors */}
            {errors.terms && (
              <p className="text-red-600 text-sm mb-3 mt-2">
                {errors.terms}
              </p>
            )}
          </div>

          {/* Sign Up Button - PulseSpark green gradient with hover effect */}
          <button
            type="submit"
            className="
              w-full bg-gradient-to-r from-green-600 to-green-700 
              hover:from-green-500 hover:to-green-600
              text-white font-semibold py-3 rounded-md
              transition duration-200
              focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2
            "
          >
            Sign Up
          </button>
        </form>

        {/* Footer Links - PulseSpark green accent */}
        <div className="text-center mt-6 text-gray-600">
          <p>
            Already have an account?{' '}
            <span className="text-green-600 hover:underline cursor-pointer">
              Sign in
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;