import React, { useState } from 'react';
import { CreditCard, Eye, EyeOff, AlertCircle, CheckCircle, Save } from 'lucide-react';
import { useNotification } from '../../contexts/NotificationContext';
import { LoadingSpinner } from '../Shared/LoadingSpinner';

// Type definitions for form data and validation
interface PaymentFormData {
  cardholderName: string;
  cardNumber: string;
  expirationMonth: string;
  expirationYear: string;
  cvv: string;
  billingAddress: string;
}

interface ValidationErrors {
  cardholderName?: string;
  cardNumber?: string;
  expirationMonth?: string;
  expirationYear?: string;
  cvv?: string;
}

interface PaymentMethodFormProps {
  onSubmit?: (data: PaymentFormData) => Promise<void>;
  onCancel?: () => void;
  className?: string;
}

/**
 * PaymentMethodForm Component
 * 
 * A secure payment method form with PulseSpark branding featuring:
 * - Comprehensive form validation with inline error messages
 * - Card number formatting and masking for better UX
 * - CVV field with show/hide toggle for security
 * - Accessible design with proper labels and ARIA attributes
 * - Responsive layout with consistent PulseSpark styling
 */
export const PaymentMethodForm: React.FC<PaymentMethodFormProps> = ({
  onSubmit,
  onCancel,
  className = ''
}) => {
  // Form state management - Initialize with empty values
  const [formData, setFormData] = useState<PaymentFormData>({
    cardholderName: '',
    cardNumber: '',
    expirationMonth: '',
    expirationYear: '',
    cvv: '',
    billingAddress: ''
  });

  // UI state management
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCvv, setShowCvv] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const { showNotification } = useNotification();

  /**
   * Validate credit card number using basic Luhn algorithm
   * Provides client-side validation for card number format
   */
  const validateCardNumber = (cardNumber: string): boolean => {
    // Remove spaces and non-digits
    const cleaned = cardNumber.replace(/\D/g, '');
    
    // Check length (13-19 digits for most cards)
    if (cleaned.length < 13 || cleaned.length > 19) {
      return false;
    }

    // Basic Luhn algorithm check
    let sum = 0;
    let isEven = false;
    
    for (let i = cleaned.length - 1; i >= 0; i--) {
      let digit = parseInt(cleaned[i]);
      
      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }
      
      sum += digit;
      isEven = !isEven;
    }
    
    return sum % 10 === 0;
  };

  /**
   * Validate expiration date is not in the past
   * Checks if the selected month/year combination is valid
   */
  const validateExpirationDate = (month: string, year: string): boolean => {
    if (!month || !year) return false;
    
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    
    const expYear = parseInt(year);
    const expMonth = parseInt(month);
    
    if (expYear < currentYear) return false;
    if (expYear === currentYear && expMonth < currentMonth) return false;
    
    return true;
  };

  /**
   * Validate all form fields and return validation errors
   * Comprehensive validation for all required and optional fields
   */
  const validateForm = (): ValidationErrors => {
    const newErrors: ValidationErrors = {};

    // Cardholder name validation - Required field
    if (!formData.cardholderName.trim()) {
      newErrors.cardholderName = 'Cardholder name is required';
    } else if (formData.cardholderName.trim().length < 2) {
      newErrors.cardholderName = 'Cardholder name must be at least 2 characters';
    }

    // Card number validation - Required with format check
    if (!formData.cardNumber.trim()) {
      newErrors.cardNumber = 'Card number is required';
    } else if (!validateCardNumber(formData.cardNumber)) {
      newErrors.cardNumber = 'Please enter a valid card number';
    }

    // Expiration month validation - Required field
    if (!formData.expirationMonth) {
      newErrors.expirationMonth = 'Expiration month is required';
    }

    // Expiration year validation - Required field
    if (!formData.expirationYear) {
      newErrors.expirationYear = 'Expiration year is required';
    }

    // Combined expiration date validation
    if (formData.expirationMonth && formData.expirationYear) {
      if (!validateExpirationDate(formData.expirationMonth, formData.expirationYear)) {
        newErrors.expirationMonth = 'Card has expired';
        newErrors.expirationYear = 'Card has expired';
      }
    }

    // CVV validation - Required with length check
    if (!formData.cvv.trim()) {
      newErrors.cvv = 'CVV is required';
    } else if (!/^\d{3,4}$/.test(formData.cvv)) {
      newErrors.cvv = 'CVV must be 3 or 4 digits';
    }

    return newErrors;
  };

  /**
   * Format card number with spaces for better readability
   * Adds spaces every 4 digits as user types
   */
  const formatCardNumber = (value: string): string => {
    // Remove all non-digits
    const cleaned = value.replace(/\D/g, '');
    
    // Add spaces every 4 digits
    const formatted = cleaned.replace(/(.{4})/g, '$1 ').trim();
    
    // Limit to 19 digits + spaces (max card length)
    return formatted.substring(0, 23);
  };

  /**
   * Handle input field changes
   * Updates form data and clears related validation errors
   */
  const handleInputChange = (field: keyof PaymentFormData, value: string) => {
    // Special handling for card number formatting
    if (field === 'cardNumber') {
      value = formatCardNumber(value);
    }
    
    // Special handling for CVV (digits only, max 4)
    if (field === 'cvv') {
      value = value.replace(/\D/g, '').substring(0, 4);
    }

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
   * Validates form, shows errors, or calls submit function
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form data
    const validationErrors = validateForm();
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      showNotification('Please fix the errors in the form', 'error');
      return;
    }

    // Clear any previous errors
    setErrors({});
    setIsSubmitting(true);

    try {
      // Call submit function if provided, otherwise simulate save
      if (onSubmit) {
        await onSubmit(formData);
      } else {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      // Show success feedback
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      showNotification('Payment method saved successfully!', 'success');
      
    } catch (error) {
      // Handle save errors
      showNotification('Failed to save payment method. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Get input styling classes based on validation state
   * Returns appropriate Tailwind classes for different input states
   */
  const getInputClasses = (fieldName: keyof ValidationErrors) => {
    const baseClasses = `
      w-full bg-gray-100 border rounded-md p-3 text-gray-900 placeholder-gray-400
      transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 
      focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed
    `;
    
    const errorClasses = errors[fieldName] 
      ? 'border-red-300 bg-red-50 focus:ring-red-500' 
      : 'border-gray-300 hover:border-gray-400';
    
    return `${baseClasses} ${errorClasses}`;
  };

  /**
   * Generate year options for expiration date dropdown
   * Creates options for current year + 15 years
   */
  const generateYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    
    for (let i = 0; i < 15; i++) {
      const year = currentYear + i;
      years.push(
        <option key={year} value={year}>
          {year}
        </option>
      );
    }
    
    return years;
  };

  return (
    <div className={`bg-white rounded-xl shadow-lg p-8 max-w-lg mx-auto my-8 ${className}`}>
      {/* Form Header - PulseSpark branding with credit card icon */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
          <CreditCard className="w-5 h-5 text-green-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Payment Method</h2>
          <p className="text-gray-600">Add or update your payment information</p>
        </div>
      </div>

      {/* Success Message - Green themed success feedback */}
      {showSuccess && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
          <p className="text-green-700 font-medium">Payment method saved successfully!</p>
        </div>
      )}

      {/* Payment Form - Clean form layout with proper spacing */}
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Cardholder Name Field - Required text input */}
        <div>
          <label htmlFor="cardholderName" className="block text-sm font-semibold text-gray-700 mb-2">
            Cardholder Name *
          </label>
          <input
            id="cardholderName"
            type="text"
            value={formData.cardholderName}
            onChange={(e) => handleInputChange('cardholderName', e.target.value)}
            className={getInputClasses('cardholderName')}
            placeholder="John Doe"
            disabled={isSubmitting}
            aria-describedby={errors.cardholderName ? 'cardholder-error' : undefined}
            autoComplete="cc-name"
          />
          {/* Cardholder name validation error display */}
          {errors.cardholderName && (
            <p id="cardholder-error" className="mt-2 text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {errors.cardholderName}
            </p>
          )}
        </div>

        {/* Card Number Field - Formatted input with masking */}
        <div>
          <label htmlFor="cardNumber" className="block text-sm font-semibold text-gray-700 mb-2">
            Card Number *
          </label>
          <input
            id="cardNumber"
            type="text"
            value={formData.cardNumber}
            onChange={(e) => handleInputChange('cardNumber', e.target.value)}
            className={getInputClasses('cardNumber')}
            placeholder="1234 5678 9012 3456"
            disabled={isSubmitting}
            aria-describedby={errors.cardNumber ? 'card-number-error' : undefined}
            autoComplete="cc-number"
          />
          {/* Card number validation error display */}
          {errors.cardNumber && (
            <p id="card-number-error" className="mt-2 text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {errors.cardNumber}
            </p>
          )}
        </div>

        {/* Expiration Date and CVV Row - Grid layout for compact display */}
        <div className="grid grid-cols-3 gap-4">
          {/* Expiration Month Dropdown */}
          <div>
            <label htmlFor="expirationMonth" className="block text-sm font-semibold text-gray-700 mb-2">
              Month *
            </label>
            <select
              id="expirationMonth"
              value={formData.expirationMonth}
              onChange={(e) => handleInputChange('expirationMonth', e.target.value)}
              className={getInputClasses('expirationMonth')}
              disabled={isSubmitting}
              aria-describedby={errors.expirationMonth ? 'exp-month-error' : undefined}
              autoComplete="cc-exp-month"
            >
              <option value="">MM</option>
              {Array.from({ length: 12 }, (_, i) => {
                const month = String(i + 1).padStart(2, '0');
                return (
                  <option key={month} value={month}>
                    {month}
                  </option>
                );
              })}
            </select>
            {/* Expiration month validation error display */}
            {errors.expirationMonth && (
              <p id="exp-month-error" className="mt-1 text-xs text-red-600">
                {errors.expirationMonth}
              </p>
            )}
          </div>

          {/* Expiration Year Dropdown */}
          <div>
            <label htmlFor="expirationYear" className="block text-sm font-semibold text-gray-700 mb-2">
              Year *
            </label>
            <select
              id="expirationYear"
              value={formData.expirationYear}
              onChange={(e) => handleInputChange('expirationYear', e.target.value)}
              className={getInputClasses('expirationYear')}
              disabled={isSubmitting}
              aria-describedby={errors.expirationYear ? 'exp-year-error' : undefined}
              autoComplete="cc-exp-year"
            >
              <option value="">YYYY</option>
              {generateYearOptions()}
            </select>
            {/* Expiration year validation error display */}
            {errors.expirationYear && (
              <p id="exp-year-error" className="mt-1 text-xs text-red-600">
                {errors.expirationYear}
              </p>
            )}
          </div>

          {/* CVV Field - Password input with show/hide toggle */}
          <div>
            <label htmlFor="cvv" className="block text-sm font-semibold text-gray-700 mb-2">
              CVV *
            </label>
            <div className="relative">
              <input
                id="cvv"
                type={showCvv ? 'text' : 'password'}
                value={formData.cvv}
                onChange={(e) => handleInputChange('cvv', e.target.value)}
                className={`${getInputClasses('cvv')} pr-10`}
                placeholder="123"
                disabled={isSubmitting}
                aria-describedby={errors.cvv ? 'cvv-error' : undefined}
                autoComplete="cc-csc"
              />
              {/* CVV visibility toggle button */}
              <button
                type="button"
                onClick={() => setShowCvv(!showCvv)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                disabled={isSubmitting}
                aria-label={showCvv ? 'Hide CVV' : 'Show CVV'}
              >
                {showCvv ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {/* CVV validation error display */}
            {errors.cvv && (
              <p id="cvv-error" className="mt-1 text-xs text-red-600">
                {errors.cvv}
              </p>
            )}
          </div>
        </div>

        {/* Billing Address Field - Optional multiline text area */}
        <div>
          <label htmlFor="billingAddress" className="block text-sm font-semibold text-gray-700 mb-2">
            Billing Address (Optional)
          </label>
          <textarea
            id="billingAddress"
            value={formData.billingAddress}
            onChange={(e) => handleInputChange('billingAddress', e.target.value)}
            rows={3}
            className="
              w-full bg-gray-100 border border-gray-300 rounded-md p-3 text-gray-900 
              placeholder-gray-400 resize-vertical transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent
              hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed
              min-h-[80px]
            "
            placeholder="123 Main Street&#10;City, State 12345&#10;Country"
            disabled={isSubmitting}
            autoComplete="billing street-address"
          />
          <p className="mt-1 text-sm text-gray-500">
            Enter your complete billing address including street, city, state, and ZIP code
          </p>
        </div>

        {/* Form Actions - Submit and Cancel buttons */}
        <div className="flex gap-4 pt-6">
          {/* Submit Button - PulseSpark green gradient with loading state */}
          <button
            type="submit"
            disabled={isSubmitting}
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
            {isSubmitting ? (
              <>
                {/* Loading spinner animation */}
                <LoadingSpinner size="sm" />
                <span>Saving Payment Method...</span>
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>Save Payment Method</span>
              </>
            )}
          </button>

          {/* Cancel Button - Optional secondary action */}
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="
                flex-1 flex justify-center items-center gap-3 py-4 px-6
                bg-gray-100 text-gray-700 font-semibold rounded-md
                hover:bg-gray-200 transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2
                disabled:opacity-50 disabled:cursor-not-allowed
              "
            >
              Cancel
            </button>
          )}
        </div>

        {/* Form Footer - Security notice and helper text */}
        <div className="pt-4 text-center">
          <p className="text-sm text-gray-500 mb-2">
            * Required fields. Your payment information is encrypted and secure.
          </p>
          <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
            <CheckCircle className="w-3 h-3 text-green-500" />
            <span>256-bit SSL encryption</span>
          </div>
        </div>
      </form>
    </div>
  );
};

export default PaymentMethodForm;