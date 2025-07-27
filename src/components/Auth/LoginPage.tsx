import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

/**
 * LoginPage Component
 * 
 * A sleek dark-themed login form for agent.pulsespark.ai
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
    // Main container - Full viewport height with dark background
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      
      {/* Login Card Container */}
      <div className="bg-gray-800 rounded-xl shadow-xl p-10 max-w-md w-full">
        
        {/* Header Section */}
        <div className="text-center mb-8">
          {/* Logo Placeholder */}
          <div className="rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-6 bg-purple-600">
            <span className="text-white font-bold text-lg">PS</span>
          </div>
          
          {/* Main Heading */}
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome Back
          </h1>
          
          {/* Subtitle */}
          <p className="text-gray-400">
            Sign in to your account
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Email Input Field */}
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
                w-full p-3 rounded-md bg-gray-700 text-white placeholder-gray-400
                border transition duration-200
                focus:outline-none focus:ring-2 focus:ring-indigo-600
                ${errors.email 
                  ? 'border-red-500' 
                  : 'border-gray-600 focus:border-indigo-600'
                }
              `}
              placeholder="Enter your email address"
              autoComplete="email"
            />
            {/* Email Validation Error */}
            {errors.email && (
              <p className="text-red-500 text-sm mt-2">
                {errors.email}
              </p>
            )}
          </div>

          {/* Password Input Field */}
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
                  w-full p-3 pr-12 rounded-md bg-gray-700 text-white placeholder-gray-400
                  border transition duration-200
                  focus:outline-none focus:ring-2 focus:ring-indigo-600
                  ${errors.password 
                    ? 'border-red-500' 
                    : 'border-gray-600 focus:border-indigo-600'
                  }
                `}
                placeholder="Enter your password"
                autoComplete="current-password"
              />
              
              {/* Password Toggle Button */}
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white transition duration-200"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
            
            {/* Password Validation Error */}
            {errors.password && (
              <p className="text-red-500 text-sm mt-2">
                {errors.password}
              </p>
            )}
          </div>

          {/* Sign In Button */}
          <button
            type="submit"
            className="
              w-full bg-gradient-to-r from-indigo-900 to-purple-900 
              hover:from-indigo-700 hover:to-purple-700
              text-white font-semibold py-3 rounded-md
              transition duration-200
              focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 focus:ring-offset-gray-800
            "
          >
            Sign In
          </button>
        </form>

        {/* Footer Links */}
        <div className="text-gray-400 text-center mt-6">
          <p>
            Don't have an account?{' '}
            <span className="text-purple-500 hover:underline cursor-pointer">
              Sign up
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;