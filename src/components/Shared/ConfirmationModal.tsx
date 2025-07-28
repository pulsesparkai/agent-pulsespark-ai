import React, { useEffect, useRef } from 'react';
import { AlertTriangle, X } from 'lucide-react';

// Type definitions for modal props
interface ConfirmationModalProps {
  /** Controls modal visibility */
  isOpen: boolean;
  /** Modal title text */
  title: string;
  /** Modal message/description text */
  message: string;
  /** Callback function when user confirms action */
  onConfirm: () => void;
  /** Callback function when user cancels or closes modal */
  onCancel: () => void;
  /** Optional confirm button text (default: "Confirm") */
  confirmText?: string;
  /** Optional cancel button text (default: "Cancel") */
  cancelText?: string;
  /** Optional modal type for styling (default: "warning") */
  type?: 'warning' | 'danger' | 'info';
  /** Optional loading state for confirm button */
  isLoading?: boolean;
  /** Optional additional CSS classes */
  className?: string;
}

/**
 * ConfirmationModal Component
 * 
 * A reusable confirmation modal with PulseSpark branding featuring:
 * - Accessible modal dialog with focus trap
 * - Customizable title, message, and button text
 * - Green gradient confirm button with hover effects
 * - Keyboard navigation and ESC key support
 * - Backdrop click to cancel functionality
 * - Loading state support for async operations
 */
export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'warning',
  isLoading = false,
  className = ''
}) => {
  // Refs for focus management and accessibility
  const modalRef = useRef<HTMLDivElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  /**
   * Handle keyboard events for modal interaction
   * Supports ESC key to cancel and Tab key for focus management
   */
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Close modal on ESC key press
      if (event.key === 'Escape') {
        event.preventDefault();
        onCancel();
        return;
      }

      // Handle Tab key for focus trap
      if (event.key === 'Tab') {
        const focusableElements = modalRef.current?.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusableElements && focusableElements.length > 0) {
          const firstElement = focusableElements[0] as HTMLElement;
          const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
          
          // If shift+tab on first element, focus last element
          if (event.shiftKey && document.activeElement === firstElement) {
            event.preventDefault();
            lastElement.focus();
          }
          // If tab on last element, focus first element
          else if (!event.shiftKey && document.activeElement === lastElement) {
            event.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    // Add event listener when modal is open
    document.addEventListener('keydown', handleKeyDown);
    
    // Focus the confirm button when modal opens
    setTimeout(() => {
      confirmButtonRef.current?.focus();
    }, 100);

    // Cleanup event listener
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onCancel]);

  /**
   * Handle backdrop click to close modal
   * Only closes if clicking the backdrop, not the modal content
   */
  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onCancel();
    }
  };

  /**
   * Handle confirm button click
   * Prevents action if loading state is active
   */
  const handleConfirm = () => {
    if (!isLoading) {
      onConfirm();
    }
  };

  /**
   * Handle cancel button click
   * Prevents action if loading state is active
   */
  const handleCancel = () => {
    if (!isLoading) {
      onCancel();
    }
  };

  /**
   * Get icon based on modal type
   * Returns appropriate Lucide icon for visual context
   */
  const getModalIcon = () => {
    switch (type) {
      case 'danger':
        return <AlertTriangle className="w-6 h-6 text-red-600" />;
      case 'info':
        return <AlertTriangle className="w-6 h-6 text-blue-600" />;
      case 'warning':
      default:
        return <AlertTriangle className="w-6 h-6 text-yellow-600" />;
    }
  };

  /**
   * Get confirm button styling based on modal type
   * Returns appropriate Tailwind classes for different modal types
   */
  const getConfirmButtonStyling = () => {
    switch (type) {
      case 'danger':
        return `
          bg-gradient-to-r from-red-600 to-red-700 
          hover:from-red-500 hover:to-red-600
          focus:ring-red-500
        `;
      case 'info':
        return `
          bg-gradient-to-r from-blue-600 to-blue-700 
          hover:from-blue-500 hover:to-blue-600
          focus:ring-blue-500
        `;
      case 'warning':
      default:
        return `
          bg-gradient-to-r from-green-600 to-green-700 
          hover:from-green-500 hover:to-green-600
          focus:ring-green-500
        `;
    }
  };

  // Don't render modal if not open
  if (!isOpen) {
    return null;
  }

  return (
    <>
      {/* Modal Backdrop - Semi-transparent overlay covering entire screen */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={handleBackdropClick}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby="modal-message"
      >
        {/* Modal Container - White card with shadow and rounded corners */}
        <div
          ref={modalRef}
          className={`
            bg-white rounded-xl shadow-lg p-6 max-w-md w-full
            transform transition-all duration-200 scale-100
            ${className}
          `}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header - Icon, title, and close button */}
          <div className="flex items-start gap-4 mb-4">
            {/* Modal Icon - Visual indicator of modal type */}
            <div className="flex-shrink-0 mt-1">
              {getModalIcon()}
            </div>

            {/* Modal Title and Close Button */}
            <div className="flex-1">
              <h2 
                id="modal-title"
                className="text-lg font-bold text-gray-900 pr-8"
              >
                {title}
              </h2>
            </div>

            {/* Close Button - X icon in top-right corner */}
            <button
              onClick={handleCancel}
              disabled={isLoading}
              className="
                flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 
                hover:bg-gray-100 rounded transition-colors
                focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-1
                disabled:opacity-50 disabled:cursor-not-allowed
              "
              aria-label="Close modal"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Message - Main content describing the action */}
          <div className="mb-6">
            <p 
              id="modal-message"
              className="text-gray-700 leading-relaxed"
            >
              {message}
            </p>
          </div>

          {/* Modal Actions - Confirm and Cancel buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
            {/* Cancel Button - Secondary action */}
            <button
              ref={cancelButtonRef}
              onClick={handleCancel}
              disabled={isLoading}
              className="
                px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 
                rounded-md font-medium transition-colors
                focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2
                disabled:opacity-50 disabled:cursor-not-allowed
                order-2 sm:order-1
              "
              aria-label={`${cancelText} - Close modal without taking action`}
            >
              {cancelText}
            </button>

            {/* Confirm Button - Primary action with PulseSpark styling */}
            <button
              ref={confirmButtonRef}
              onClick={handleConfirm}
              disabled={isLoading}
              className={`
                flex items-center justify-center gap-2 px-4 py-2 
                text-white font-semibold rounded-md shadow-sm
                transform transition-all duration-200 
                hover:scale-[1.02] hover:shadow-md
                focus:outline-none focus:ring-2 focus:ring-offset-2
                disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                active:scale-[0.98] order-1 sm:order-2
                ${getConfirmButtonStyling()}
              `}
              aria-label={`${confirmText} - Proceed with the action`}
            >
              {/* Loading Spinner - Shows during async operations */}
              {isLoading && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              <span>{isLoading ? 'Processing...' : confirmText}</span>
            </button>
          </div>

          {/* Modal Footer - Additional context or help text */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-500 text-center">
              Press ESC to cancel or click outside to close
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default ConfirmationModal;