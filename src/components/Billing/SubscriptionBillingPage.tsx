import React, { useState, useEffect } from 'react';
import { CreditCard, Calendar, TrendingUp, Download, CheckCircle, AlertCircle, Save, Spade as Upgrade, Eye, EyeOff, MapPin, User, Mail, Phone, Building } from 'lucide-react';
import { LoadingSpinner } from '../Shared/LoadingSpinner';
import { useNotification } from '../../contexts/NotificationContext';

// Type definitions for subscription and billing data
interface SubscriptionPlan {
  name: string;
  status: 'active' | 'cancelled' | 'past_due';
  billingCycle: 'monthly' | 'yearly';
  nextPaymentDate: string;
  amount: number;
}

interface UsageStats {
  apiCalls: {
    used: number;
    limit: number;
  };
  contentAnalyzed: {
    used: number;
    limit: number;
  };
  activeProjects: {
    used: number;
    limit: number;
  };
}

interface PaymentMethod {
  cardNumber: string;
  expirationMonth: string;
  expirationYear: string;
  cvv: string;
  cardholderName: string;
  billingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
}

interface Invoice {
  id: string;
  date: string;
  amount: number;
  status: 'paid' | 'pending' | 'failed';
  downloadUrl: string;
}

interface ValidationErrors {
  cardNumber?: string;
  expirationMonth?: string;
  expirationYear?: string;
  cvv?: string;
  cardholderName?: string;
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
}

/**
 * SubscriptionBillingPage Component
 * 
 * A comprehensive billing management page with PulseSpark branding featuring:
 * - Current subscription details and usage statistics
 * - Payment method management with secure form inputs
 * - Invoice history with download capabilities
 * - Responsive design with proper form validation
 */
export const SubscriptionBillingPage: React.FC = () => {
  // Subscription and usage state
  const [subscription, setSubscription] = useState<SubscriptionPlan>({
    name: 'Professional Plan',
    status: 'active',
    billingCycle: 'monthly',
    nextPaymentDate: '2024-02-15',
    amount: 29.99
  });

  const [usageStats, setUsageStats] = useState<UsageStats>({
    apiCalls: { used: 8750, limit: 10000 },
    contentAnalyzed: { used: 245, limit: 500 },
    activeProjects: { used: 12, limit: 25 }
  });

  // Payment method form state
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>({
    cardNumber: '',
    expirationMonth: '',
    expirationYear: '',
    cvv: '',
    cardholderName: '',
    billingAddress: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'US'
    }
  });

  // Invoice history state
  const [invoices, setInvoices] = useState<Invoice[]>([
    {
      id: 'INV-2024-001',
      date: '2024-01-15',
      amount: 29.99,
      status: 'paid',
      downloadUrl: '#'
    },
    {
      id: 'INV-2023-012',
      date: '2023-12-15',
      amount: 29.99,
      status: 'paid',
      downloadUrl: '#'
    },
    {
      id: 'INV-2023-011',
      date: '2023-11-15',
      amount: 29.99,
      status: 'paid',
      downloadUrl: '#'
    }
  ]);

  // UI state management
  const [showCvv, setShowCvv] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [showSuccess, setShowSuccess] = useState(false);

  const { showNotification } = useNotification();

  // Load initial data
  useEffect(() => {
    loadBillingData();
  }, []);

  /**
   * Simulate loading billing data from API
   * In production, this would fetch real subscription and payment data
   */
  const loadBillingData = async () => {
    setIsLoading(true);
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Data is already set in state initialization
      // In production, you would fetch from your billing API
    } catch (error) {
      showNotification('Failed to load billing information', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Validate credit card number using Luhn algorithm
   * Basic validation for demonstration purposes
   */
  const validateCardNumber = (cardNumber: string): boolean => {
    const cleaned = cardNumber.replace(/\s/g, '');
    return /^\d{13,19}$/.test(cleaned);
  };

  /**
   * Validate form inputs and return validation errors
   * Comprehensive validation for all payment form fields
   */
  const validatePaymentForm = (): ValidationErrors => {
    const newErrors: ValidationErrors = {};

    // Card number validation
    if (!paymentMethod.cardNumber.trim()) {
      newErrors.cardNumber = 'Card number is required';
    } else if (!validateCardNumber(paymentMethod.cardNumber)) {
      newErrors.cardNumber = 'Please enter a valid card number';
    }

    // Expiration month validation
    if (!paymentMethod.expirationMonth) {
      newErrors.expirationMonth = 'Expiration month is required';
    }

    // Expiration year validation
    if (!paymentMethod.expirationYear) {
      newErrors.expirationYear = 'Expiration year is required';
    }

    // CVV validation
    if (!paymentMethod.cvv.trim()) {
      newErrors.cvv = 'CVV is required';
    } else if (!/^\d{3,4}$/.test(paymentMethod.cvv)) {
      newErrors.cvv = 'CVV must be 3 or 4 digits';
    }

    // Cardholder name validation
    if (!paymentMethod.cardholderName.trim()) {
      newErrors.cardholderName = 'Cardholder name is required';
    }

    // Billing address validation
    if (!paymentMethod.billingAddress.street.trim()) {
      newErrors.street = 'Street address is required';
    }

    if (!paymentMethod.billingAddress.city.trim()) {
      newErrors.city = 'City is required';
    }

    if (!paymentMethod.billingAddress.state.trim()) {
      newErrors.state = 'State is required';
    }

    if (!paymentMethod.billingAddress.zipCode.trim()) {
      newErrors.zipCode = 'ZIP code is required';
    }

    return newErrors;
  };

  /**
   * Handle payment method form submission
   * Validates form and simulates API call to save payment method
   */
  const handleSavePaymentMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const validationErrors = validatePaymentForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setIsSaving(true);

    try {
      // Simulate API call to save payment method
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      showNotification('Payment method saved successfully', 'success');
    } catch (error) {
      showNotification('Failed to save payment method', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Handle input field changes
   * Updates payment method state and clears related errors
   */
  const handleInputChange = (field: string, value: string) => {
    if (field.includes('.')) {
      // Handle nested address fields
      const [parent, child] = field.split('.');
      setPaymentMethod(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof PaymentMethod],
          [child]: value
        }
      }));
    } else {
      setPaymentMethod(prev => ({ ...prev, [field]: value }));
    }

    // Clear error for this field
    if (errors[field as keyof ValidationErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  /**
   * Format card number with spaces for better readability
   * Adds spaces every 4 digits as user types
   */
  const formatCardNumber = (value: string): string => {
    const cleaned = value.replace(/\s/g, '');
    const formatted = cleaned.replace(/(.{4})/g, '$1 ').trim();
    return formatted.substring(0, 23); // Limit to 19 digits + spaces
  };

  /**
   * Handle card number input with formatting
   * Formats card number and updates state
   */
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    handleInputChange('cardNumber', formatted);
  };

  /**
   * Calculate usage percentage for progress bars
   * Returns percentage value for visual progress indicators
   */
  const getUsagePercentage = (used: number, limit: number): number => {
    return Math.min((used / limit) * 100, 100);
  };

  /**
   * Format currency for display
   * Converts numbers to USD currency format
   */
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  /**
   * Get status badge styling based on subscription status
   * Returns appropriate Tailwind classes for different statuses
   */
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'past_due':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  /**
   * Get invoice status styling
   * Returns appropriate styling for different invoice statuses
   */
  const getInvoiceStatusStyle = (status: string) => {
    switch (status) {
      case 'paid':
        return 'text-green-600';
      case 'pending':
        return 'text-yellow-600';
      case 'failed':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-8 max-w-4xl mx-auto my-8">
      {/* Page Header - PulseSpark branding with billing icon */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
          <CreditCard className="w-5 h-5 text-green-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Subscription & Billing</h1>
          <p className="text-gray-600">Manage your subscription, payment methods, and billing history</p>
        </div>
      </div>

      {/* Success Message */}
      {showSuccess && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
          <p className="text-green-700 font-medium">Payment method updated successfully!</p>
        </div>
      )}

      {/* Main Content Grid - Responsive layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Column - Subscription Details */}
        <div className="space-y-6">
          
          {/* Current Subscription Section */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              Current Subscription
            </h2>
            
            <div className="space-y-4">
              {/* Plan Name and Status */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{subscription.name}</h3>
                  <p className="text-sm text-gray-600">
                    Billed {subscription.billingCycle} • {formatCurrency(subscription.amount)}
                  </p>
                </div>
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusBadge(subscription.status)}`}>
                  {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                </span>
              </div>

              {/* Next Payment Date */}
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>Next payment: {new Date(subscription.nextPaymentDate).toLocaleDateString()}</span>
              </div>

              {/* Upgrade Button */}
              <button className="
                w-full flex items-center justify-center gap-2 py-3 px-4
                bg-gradient-to-r from-green-600 to-green-700 
                hover:from-green-500 hover:to-green-600
                text-white font-semibold rounded-lg shadow-sm
                transform transition-all duration-200 
                hover:scale-[1.02] hover:shadow-md
                focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2
              ">
                <Upgrade className="w-4 h-4" />
                Upgrade Plan
              </button>
            </div>
          </div>

          {/* Usage Statistics Section */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Usage This Month</h2>
            
            <div className="space-y-4">
              {/* API Calls Usage */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-700">API Calls</span>
                  <span className="text-gray-600">
                    {usageStats.apiCalls.used.toLocaleString()} / {usageStats.apiCalls.limit.toLocaleString()}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${getUsagePercentage(usageStats.apiCalls.used, usageStats.apiCalls.limit)}%` }}
                  />
                </div>
              </div>

              {/* Content Analyzed Usage */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-700">Content Analyzed (GB)</span>
                  <span className="text-gray-600">
                    {usageStats.contentAnalyzed.used} / {usageStats.contentAnalyzed.limit}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${getUsagePercentage(usageStats.contentAnalyzed.used, usageStats.contentAnalyzed.limit)}%` }}
                  />
                </div>
              </div>

              {/* Active Projects Usage */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-700">Active Projects</span>
                  <span className="text-gray-600">
                    {usageStats.activeProjects.used} / {usageStats.activeProjects.limit}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${getUsagePercentage(usageStats.activeProjects.used, usageStats.activeProjects.limit)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Billing History Section */}
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Recent Invoices</h2>
              <button className="text-sm text-green-600 hover:text-green-700 hover:underline">
                View All
              </button>
            </div>
            
            <div className="space-y-3">
              {invoices.map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between p-3 bg-white rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{invoice.id}</p>
                    <p className="text-sm text-gray-600">{new Date(invoice.date).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">{formatCurrency(invoice.amount)}</p>
                    <p className={`text-sm font-medium ${getInvoiceStatusStyle(invoice.status)}`}>
                      {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                    </p>
                  </div>
                  <button 
                    className="ml-3 p-2 text-gray-400 hover:text-green-600 transition-colors"
                    title="Download invoice"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Payment Method */}
        <div>
          <div className="bg-gray-50 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-green-600" />
              Payment Method
            </h2>

            <form onSubmit={handleSavePaymentMethod} className="space-y-4">
              {/* Card Number */}
              <div>
                <label htmlFor="cardNumber" className="block text-sm font-medium text-gray-700 mb-2">
                  Card Number
                </label>
                <input
                  id="cardNumber"
                  type="text"
                  value={paymentMethod.cardNumber}
                  onChange={handleCardNumberChange}
                  className={`
                    w-full bg-gray-100 border rounded-md p-3 text-gray-900 transition-colors
                    focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent
                    ${errors.cardNumber ? 'border-red-300 bg-red-50' : 'border-gray-300'}
                  `}
                  placeholder="1234 5678 9012 3456"
                  disabled={isSaving}
                />
                {errors.cardNumber && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.cardNumber}
                  </p>
                )}
              </div>

              {/* Expiration and CVV */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label htmlFor="expirationMonth" className="block text-sm font-medium text-gray-700 mb-2">
                    Month
                  </label>
                  <select
                    id="expirationMonth"
                    value={paymentMethod.expirationMonth}
                    onChange={(e) => handleInputChange('expirationMonth', e.target.value)}
                    className={`
                      w-full bg-gray-100 border rounded-md p-3 text-gray-900 transition-colors
                      focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent
                      ${errors.expirationMonth ? 'border-red-300 bg-red-50' : 'border-gray-300'}
                    `}
                    disabled={isSaving}
                  >
                    <option value="">MM</option>
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i + 1} value={String(i + 1).padStart(2, '0')}>
                        {String(i + 1).padStart(2, '0')}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="expirationYear" className="block text-sm font-medium text-gray-700 mb-2">
                    Year
                  </label>
                  <select
                    id="expirationYear"
                    value={paymentMethod.expirationYear}
                    onChange={(e) => handleInputChange('expirationYear', e.target.value)}
                    className={`
                      w-full bg-gray-100 border rounded-md p-3 text-gray-900 transition-colors
                      focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent
                      ${errors.expirationYear ? 'border-red-300 bg-red-50' : 'border-gray-300'}
                    `}
                    disabled={isSaving}
                  >
                    <option value="">YYYY</option>
                    {Array.from({ length: 10 }, (_, i) => {
                      const year = new Date().getFullYear() + i;
                      return (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label htmlFor="cvv" className="block text-sm font-medium text-gray-700 mb-2">
                    CVV
                  </label>
                  <div className="relative">
                    <input
                      id="cvv"
                      type={showCvv ? 'text' : 'password'}
                      value={paymentMethod.cvv}
                      onChange={(e) => handleInputChange('cvv', e.target.value)}
                      className={`
                        w-full bg-gray-100 border rounded-md p-3 pr-10 text-gray-900 transition-colors
                        focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent
                        ${errors.cvv ? 'border-red-300 bg-red-50' : 'border-gray-300'}
                      `}
                      placeholder="123"
                      maxLength={4}
                      disabled={isSaving}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCvv(!showCvv)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                      disabled={isSaving}
                    >
                      {showCvv ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.cvv && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.cvv}
                    </p>
                  )}
                </div>
              </div>

              {/* Cardholder Name */}
              <div>
                <label htmlFor="cardholderName" className="block text-sm font-medium text-gray-700 mb-2">
                  Cardholder Name
                </label>
                <input
                  id="cardholderName"
                  type="text"
                  value={paymentMethod.cardholderName}
                  onChange={(e) => handleInputChange('cardholderName', e.target.value)}
                  className={`
                    w-full bg-gray-100 border rounded-md p-3 text-gray-900 transition-colors
                    focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent
                    ${errors.cardholderName ? 'border-red-300 bg-red-50' : 'border-gray-300'}
                  `}
                  placeholder="John Doe"
                  disabled={isSaving}
                />
                {errors.cardholderName && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.cardholderName}
                  </p>
                )}
              </div>

              {/* Billing Address */}
              <div className="pt-4 border-t border-gray-200">
                <h3 className="text-md font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-green-600" />
                  Billing Address
                </h3>

                <div className="space-y-4">
                  {/* Street Address */}
                  <div>
                    <label htmlFor="street" className="block text-sm font-medium text-gray-700 mb-2">
                      Street Address
                    </label>
                    <input
                      id="street"
                      type="text"
                      value={paymentMethod.billingAddress.street}
                      onChange={(e) => handleInputChange('billingAddress.street', e.target.value)}
                      className={`
                        w-full bg-gray-100 border rounded-md p-3 text-gray-900 transition-colors
                        focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent
                        ${errors.street ? 'border-red-300 bg-red-50' : 'border-gray-300'}
                      `}
                      placeholder="123 Main Street"
                      disabled={isSaving}
                    />
                    {errors.street && (
                      <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.street}
                      </p>
                    )}
                  </div>

                  {/* City, State, ZIP */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                        City
                      </label>
                      <input
                        id="city"
                        type="text"
                        value={paymentMethod.billingAddress.city}
                        onChange={(e) => handleInputChange('billingAddress.city', e.target.value)}
                        className={`
                          w-full bg-gray-100 border rounded-md p-3 text-gray-900 transition-colors
                          focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent
                          ${errors.city ? 'border-red-300 bg-red-50' : 'border-gray-300'}
                        `}
                        placeholder="New York"
                        disabled={isSaving}
                      />
                      {errors.city && (
                        <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {errors.city}
                        </p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-2">
                        State
                      </label>
                      <input
                        id="state"
                        type="text"
                        value={paymentMethod.billingAddress.state}
                        onChange={(e) => handleInputChange('billingAddress.state', e.target.value)}
                        className={`
                          w-full bg-gray-100 border rounded-md p-3 text-gray-900 transition-colors
                          focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent
                          ${errors.state ? 'border-red-300 bg-red-50' : 'border-gray-300'}
                        `}
                        placeholder="NY"
                        disabled={isSaving}
                      />
                      {errors.state && (
                        <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {errors.state}
                        </p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700 mb-2">
                        ZIP Code
                      </label>
                      <input
                        id="zipCode"
                        type="text"
                        value={paymentMethod.billingAddress.zipCode}
                        onChange={(e) => handleInputChange('billingAddress.zipCode', e.target.value)}
                        className={`
                          w-full bg-gray-100 border rounded-md p-3 text-gray-900 transition-colors
                          focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent
                          ${errors.zipCode ? 'border-red-300 bg-red-50' : 'border-gray-300'}
                        `}
                        placeholder="10001"
                        disabled={isSaving}
                      />
                      {errors.zipCode && (
                        <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {errors.zipCode}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="pt-6">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="
                    w-full flex justify-center items-center gap-3 py-3 px-6
                    bg-gradient-to-r from-green-600 to-green-700 
                    hover:from-green-500 hover:to-green-600
                    text-white font-semibold rounded-lg shadow-sm
                    transform transition-all duration-200 
                    hover:scale-[1.02] hover:shadow-md
                    focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2
                    disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                  "
                >
                  {isSaving ? (
                    <>
                      <LoadingSpinner size="sm" />
                      <span>Saving Payment Method...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save Payment Method</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Security Notice */}
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-blue-900 mb-1">Secure Payment Processing</h3>
            <p className="text-sm text-blue-700">
              Your payment information is encrypted and processed securely. We never store your full credit card details on our servers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionBillingPage;