import React from 'react';

/**
 * LoadingSpinner Component
 * 
 * A customizable loading spinner with PulseSpark branding featuring:
 * - Smooth continuous rotation animation
 * - Adjustable sizes (sm, md, lg) via props
 * - PulseSpark green color theming (#16a34a)
 * - Accessibility support with proper ARIA attributes
 * - Flexible styling with optional className prop
 */

// Type definition for spinner size options
interface LoadingSpinnerProps {
  /** Size of the spinner - controls diameter and stroke width */
  size?: 'sm' | 'md' | 'lg';
  /** Optional additional CSS classes for custom styling */
  className?: string;
}

/**
 * LoadingSpinner functional component
 * Creates a circular spinner with smooth rotation animation
 */
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  className = '' 
}) => {
  // Size configuration mapping for consistent scaling
  const sizeClasses = {
    sm: 'w-4 h-4',   // 16px - For buttons and inline elements
    md: 'w-6 h-6',   // 24px - Default size for general use
    lg: 'w-8 h-8'    // 32px - For prominent loading states
  };

  // Stroke width configuration for visual consistency across sizes
  const strokeWidths = {
    sm: '3',   // Thinner stroke for small spinner
    md: '3',   // Standard stroke width
    lg: '4'    // Thicker stroke for large spinner
  };

  return (
    <div 
      className={`inline-flex items-center justify-center ${className}`}
      role="status"
      aria-live="polite"
      aria-label="Loading content, please wait"
    >
      {/* SVG Spinner with PulseSpark green theming */}
      <svg
        className={`animate-spin ${sizeClasses[size]}`}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        {/* Background circle - light gray for contrast */}
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth={strokeWidths[size]}
          className="text-gray-200"
        />
        
        {/* Animated arc - PulseSpark green (#16a34a) */}
        <path
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          className="text-green-600"
        />
      </svg>
      
      {/* Screen reader only text for accessibility */}
      <span className="sr-only">Loading...</span>
    </div>
  );