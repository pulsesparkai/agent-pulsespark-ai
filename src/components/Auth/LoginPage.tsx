import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

/**
 * LoginPage Component
 * 
 * A sleek light-themed login form for agent.pulsespark.ai with PulseSpark green branding
 * Features full viewport layout, form validation, and accessibility
 */
const LoginPage: React.FC = () => {
  // Form state management
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Validation state
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
  }>({});

  /**
   * Handle form submission with client-side validation
   * Validates empty fields and shows error messages
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset previous errors
    setErrors({});
    
    // Validation logic
    const newErrors: { email?: string; password?: string } = {};
    
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    }
    
    if (!password.trim()) {
      newErrors.password = 'Password is required';
    }
    
    // If there are errors, set them and return
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    // If validation passes, handle login logic here
    console.log('Login attempt:', { email, password });
    // TODO: Integrate with authentication system
  };

  /**
   * Toggle password visibility
   */
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    // Main container - Full viewport height with light gradient background (PulseSpark green tint)
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-green-50 flex items-center justify-center px-4">
      
      {/* Login Card Container - Pure white with subtle shadow */}
      <div className="bg-white rounded-xl shadow-lg p-10 max-w-md w-full">
        
        {/* Header Section - PulseSpark branding */}
        <div className="text-center mb-8">
          {/* Logo Placeholder - PulseSpark green circular logo */}
          <div className="rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-6 bg-green-600">
            <span className="text-white font-bold text-lg">PS</span>
          </div>
          
          {/* Main Heading - Dark gray for readability */}
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome Back
          </h1>
          
          {/* Subtitle - Medium gray */}
          <p className="text-gray-600">
            Sign in to your account
          </p>
        </div>

        {/* Login Form - Green focus states throughout */}
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
                focus:outline-none focus:ring-2 focus:ring-green-600
                ${errors.email 
                  ? 'border-red-600' 
                  : 'border-gray-300 focus:border-green-600'
                }
              `}
              placeholder="Enter your email address"
              autoComplete="email"
            />
            {/* Email Validation Error - Red text for errors */}
            {errors.email && (
              <p className="text-red-600 text-sm mt-2 mb-3">
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
                  focus:outline-none focus:ring-2 focus:ring-green-600
                  ${errors.password 
                    ? 'border-red-600' 
                    : 'border-gray-300 focus:border-green-600'
                  }
                `}
                placeholder="Enter your password"
                autoComplete="current-password"
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
              <p className="text-red-600 text-sm mt-2 mb-3">
                {errors.password}
              </p>
            )}
          </div>

          {/* Sign In Button - PulseSpark green gradient with hover effect */}
          <button
            type="submit"
            className="
              w-full bg-gradient-to-r from-green-600 to-green-700 
              hover:from-green-500 hover:to-green-600
              text-white font-bold py-3 rounded-md
              transition duration-200
              focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2
            "
          >
            Sign In
          </button>
        </form>

        {/* Footer Links - PulseSpark green accent */}
        <div className="text-center mt-6 text-gray-600">
          <p>
            Don't have an account?{' '}
            <span className="text-green-600 hover:underline cursor-pointer">
              Sign up
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;