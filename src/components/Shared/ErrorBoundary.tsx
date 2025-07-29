import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({
      error,
      errorInfo
    });

    // Log error for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // In production, you would send error to monitoring service
    if (import.meta.env.PROD) {
      // Example: Sentry.captureException(error, { extra: errorInfo });
    }
  }

  private handleRetry = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  private handleGoHome = (): void => {
    window.location.href = '/dashboard';
  };

  render(): ReactNode {
    const { hasError, error } = this.state;
    const { children, fallback } = this.props;

    if (!hasError) {
      return children;
    }

    if (fallback) {
      return fallback;
    }

    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-gray-800 rounded-xl shadow-lg p-8 max-w-lg w-full text-center border border-gray-700">
          <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-8 h-8 text-white" />
          </div>

          <h1 className="text-2xl font-bold text-white mb-4">
            Something went wrong
          </h1>

          <p className="text-gray-300 mb-6 leading-relaxed">
            We encountered an unexpected error. Please try refreshing the page or return to the dashboard.
          </p>

          {import.meta.env.DEV && error && (
            <details className="mb-6 text-left">
              <summary className="cursor-pointer text-sm text-gray-400 hover:text-gray-300 mb-2">
                Technical Details (Development Only)
              </summary>
              <div className="bg-gray-900 rounded-md p-3 text-xs font-mono text-gray-300 overflow-auto max-h-32">
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

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={this.handleRetry}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>

            <button
              onClick={this.handleGoHome}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
            >
              <Home className="w-4 h-4" />
              Go to Dashboard
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-700">
            <p className="text-sm text-gray-400">
              If this problem persists, please contact support.
            </p>
          </div>
        </div>
      </div>
    );
  }
}