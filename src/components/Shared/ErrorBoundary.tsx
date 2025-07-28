import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

// Type definitions for ErrorBoundary props and state
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showRetry?: boolean;
  showHomeButton?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
}

/**
 * ErrorBoundary Component
 * 
 * A React class component that catches JavaScript errors in child components
 * and displays a fallback UI with PulseSpark branding. Features error logging,
 * retry functionality, and accessible design.
 * 
 * Key Features:
 * - Catches and handles JavaScript errors in child components
 * - Displays user-friendly error message with PulseSpark styling
 * - Provides retry functionality to reset error state
 * - Logs errors for debugging and monitoring
 * - Accessible design with proper ARIA attributes
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryTimeoutId: NodeJS.Timeout | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    
    // Initialize error boundary state
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    };
  }

  /**
   * Static method to update state when an error occurs
   * Called by React when an error is caught during rendering
   */
  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state to trigger fallback UI rendering
    return {
      hasError: true,
      error
    };
  }

  /**
   * Lifecycle method called when an error is caught
   * Used for error logging and side effects
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Update state with detailed error information
    this.setState({
      error,
      errorInfo,
      retryCount: this.state.retryCount + 1
    });

    // Log error details to console for debugging
    console.group('🚨 ErrorBoundary: Caught an error');
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
    console.error('Component Stack:', errorInfo.componentStack);
    console.groupEnd();

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // In production, you would send error to monitoring service
    this.reportErrorToService(error, errorInfo);
  }

  /**
   * Stub function for error reporting service
   * In production, this would send errors to services like Sentry, LogRocket, etc.
   */
  private reportErrorToService = (error: Error, errorInfo: ErrorInfo): void => {
    // Simulate error reporting to external service
    const errorReport = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      retryCount: this.state.retryCount
    };

    // In production, replace with actual error reporting service
    console.log('📊 Error reported to monitoring service:', errorReport);
    
    // Example: Sentry.captureException(error, { extra: errorInfo });
    // Example: LogRocket.captureException(error);
  };

  /**
   * Handle retry button click
   * Resets error state to attempt re-rendering child components
   */
  private handleRetry = (): void => {
    // Clear any existing retry timeout
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }

    // Add slight delay for better UX (prevents rapid clicking)
    this.retryTimeoutId = setTimeout(() => {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null
      });
    }, 300);
  };

  /**
   * Handle navigation to home page
   * Provides escape route when retry doesn't work
   */
  private handleGoHome = (): void => {
    // In a real app, you would use React Router navigation
    window.location.href = '/dashboard';
  };

  /**
   * Cleanup method to clear timeouts
   * Prevents memory leaks when component unmounts
   */
  componentWillUnmount(): void {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  /**
   * Get user-friendly error message based on error type
   * Provides helpful messages for common error scenarios
   */
  private getErrorMessage = (): string => {
    const { error } = this.state;
    
    if (!error) {
      return 'An unexpected error occurred while loading this page.';
    }

    // Handle common error types with user-friendly messages
    if (error.message.includes('ChunkLoadError') || error.message.includes('Loading chunk')) {
      return 'There was a problem loading part of the application. This usually happens after an update.';
    }
    
    if (error.message.includes('Network Error') || error.message.includes('fetch')) {
      return 'Unable to connect to our servers. Please check your internet connection.';
    }
    
    if (error.message.includes('Permission denied') || error.message.includes('Unauthorized')) {
      return 'You don\'t have permission to access this resource. Please sign in again.';
    }

    // Default message for unknown errors
    return 'Something went wrong while loading this page. Our team has been notified.';
  };

  /**
   * Get appropriate retry button text based on error type and retry count
   * Provides contextual button text for better UX
   */
  private getRetryButtonText = (): string => {
    const { retryCount } = this.state;
    
    if (retryCount === 0) {
      return 'Try Again';
    } else if (retryCount === 1) {
      return 'Retry';
    } else {
      return 'Try Once More';
    }
  };

  render(): ReactNode {
    const { hasError, error } = this.state;
    const { children, fallback, showRetry = true, showHomeButton = true } = this.props;

    // If no error, render children normally
    if (!hasError) {
      return children;
    }

    // If custom fallback provided, use it
    if (fallback) {
      return fallback;
    }

    // Render default error fallback UI with PulseSpark branding
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        {/* Error Container - PulseSpark styled card */}
        <div 
          className="bg-white rounded-xl shadow-lg p-8 max-w-lg w-full text-center"
          role="alert"
          aria-live="assertive"
          aria-labelledby="error-title"
          aria-describedby="error-message"
        >
          {/* Error Icon - Red warning triangle */}
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-8 h-8 text-red-600" aria-hidden="true" />
          </div>

          {/* Error Title - Bold red text */}
          <h1 
            id="error-title"
            className="text-2xl font-bold text-red-600 mb-4"
          >
            Oops! Something went wrong
          </h1>

          {/* Error Message - User-friendly description */}
          <p 
            id="error-message"
            className="text-gray-700 mb-6 leading-relaxed"
          >
            {this.getErrorMessage()}
          </p>

          {/* Technical Error Details - Collapsible for debugging */}
          {process.env.NODE_ENV === 'development' && error && (
            <details className="mb-6 text-left">
              <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700 mb-2">
                Technical Details (Development Only)
              </summary>
              <div className="bg-gray-100 rounded-md p-3 text-xs font-mono text-gray-800 overflow-auto max-h-32">
                <p className="font-semibold mb-1">Error:</p>
                <p className="mb-2">{error.message}</p>
                {error.stack && (
                  <>
                    <p className="font-semibold mb-1">Stack Trace:</p>
                    <pre className="whitespace-pre-wrap">{error.stack}</pre>
                  </>
                )}
              </div>
            </details>
          )}

          {/* Action Buttons - Retry and Home navigation */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {/* Retry Button - PulseSpark green gradient */}
            {showRetry && (
              <button
                onClick={this.handleRetry}
                className="
                  flex items-center justify-center gap-2 px-6 py-3
                  bg-gradient-to-r from-green-600 to-green-700 
                  hover:from-green-500 hover:to-green-600
                  text-white font-semibold rounded-md shadow-sm
                  transform transition-all duration-200 
                  hover:scale-[1.02] hover:shadow-md
                  focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2
                  active:scale-[0.98]
                "
                aria-label={`${this.getRetryButtonText()} - Attempt to reload the page`}
              >
                <RefreshCw className="w-4 h-4" aria-hidden="true" />
                <span>{this.getRetryButtonText()}</span>
              </button>
            )}

            {/* Home Button - Secondary action */}
            {showHomeButton && (
              <button
                onClick={this.handleGoHome}
                className="
                  flex items-center justify-center gap-2 px-6 py-3
                  bg-gray-100 text-gray-700 font-semibold rounded-md
                  hover:bg-gray-200 transition-all duration-200
                  focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2
                "
                aria-label="Go to dashboard - Navigate to the main page"
              >
                <Home className="w-4 h-4" aria-hidden="true" />
                <span>Go to Dashboard</span>
              </button>
            )}
          </div>

          {/* Help Text - Additional guidance */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              If this problem persists, please{' '}
              <a 
                href="/support" 
                className="text-green-600 hover:text-green-700 hover:underline transition-colors"
              >
                contact support
              </a>
              {' '}or try refreshing your browser.
            </p>
          </div>

          {/* Error ID - For support reference */}
          <div className="mt-4">
            <p className="text-xs text-gray-400">
              Error ID: {Date.now().toString(36).toUpperCase()}
            </p>
          </div>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;