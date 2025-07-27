import React, { useState, useCallback } from 'react';
import { 
  ChevronDown, 
  ChevronRight, 
  HelpCircle, 
  Mail, 
  User, 
  MessageSquare,
  Send,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useNotification } from '../../contexts/NotificationContext';
import { LoadingSpinner } from '../Shared/LoadingSpinner';

// Type definitions for FAQ data and form management
interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category?: 'general' | 'billing' | 'technical' | 'account';
}

interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

interface ValidationErrors {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
}

interface SupportFAQPageProps {
  className?: string;
}

/**
 * SupportFAQPage Component
 * 
 * A comprehensive support page with PulseSpark branding featuring:
 * - Expandable FAQ accordion with smooth animations
 * - Contact support form with validation
 * - Accessible design with proper ARIA attributes
 * - Responsive layout with consistent green and white styling
 */
export const SupportFAQPage: React.FC<SupportFAQPageProps> = ({ 
  className = '' 
}) => {
  // FAQ data - Sample questions and answers for demonstration
  const [faqItems] = useState<FAQItem[]>([
    {
      id: '1',
      question: 'How do I add an API key to my account?',
      answer: 'To add an API key, navigate to the API Keys section in your dashboard. Click "Add API Key", select your provider (OpenAI, Claude, etc.), and paste your API key. Your key will be encrypted and stored securely.',
      category: 'account'
    },
    {
      id: '2',
      question: 'What AI providers does PulseSpark support?',
      answer: 'PulseSpark supports multiple AI providers including OpenAI (GPT models), Anthropic Claude, DeepSeek, Grok (X.AI), and Mistral AI. You can switch between providers in your chat settings.',
      category: 'general'
    },
    {
      id: '3',
      question: 'How is my data and API keys secured?',
      answer: 'We take security seriously. All API keys are encrypted using industry-standard encryption before storage. Your chat history is stored securely and only accessible to you. We never share your data with third parties.',
      category: 'technical'
    },
    {
      id: '4',
      question: 'Can I export my chat history?',
      answer: 'Yes! You can export your chat history from the Settings page. Choose from JSON, CSV, or PDF formats. This feature is available for all subscription plans.',
      category: 'general'
    },
    {
      id: '5',
      question: 'What are the subscription plan differences?',
      answer: 'Our Free plan includes 1,000 API calls per month. Professional plan ($29/month) includes 10,000 calls, priority support, and advanced features. Enterprise plans offer unlimited usage and custom integrations.',
      category: 'billing'
    },
    {
      id: '6',
      question: 'How do I cancel my subscription?',
      answer: 'You can cancel your subscription anytime from the Billing section in your account settings. Your subscription will remain active until the end of your current billing period.',
      category: 'billing'
    },
    {
      id: '7',
      question: 'Can I use PulseSpark for commercial projects?',
      answer: 'Yes! All our plans support commercial use. Please ensure you comply with the terms of service of the AI providers you\'re using (OpenAI, Claude, etc.) for commercial applications.',
      category: 'general'
    },
    {
      id: '8',
      question: 'What happens if I exceed my API limits?',
      answer: 'If you exceed your monthly API limits, your requests will be temporarily paused. You can upgrade your plan or wait for the next billing cycle. We\'ll send notifications as you approach your limits.',
      category: 'technical'
    },
    {
      id: '9',
      question: 'How do I integrate PulseSpark with my existing workflow?',
      answer: 'PulseSpark offers API access, webhook integrations, and export capabilities. Check our Developer Documentation for detailed integration guides and code examples.',
      category: 'technical'
    },
    {
      id: '10',
      question: 'Is there a mobile app available?',
      answer: 'Currently, PulseSpark is available as a web application optimized for mobile browsers. A dedicated mobile app is in development and will be available soon.',
      category: 'general'
    }
  ]);

  // State management for accordion and form
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [contactForm, setContactForm] = useState<ContactFormData>({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const { showNotification } = useNotification();

  /**
   * Toggle FAQ item expansion
   * Manages which FAQ items are currently expanded
   */
  const toggleFAQItem = useCallback((itemId: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  }, []);

  /**
   * Validate email format using regex
   * Basic email validation for contact form
   */
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  /**
   * Validate contact form fields
   * Returns object with validation errors or empty object if valid
   */
  const validateContactForm = (): ValidationErrors => {
    const newErrors: ValidationErrors = {};

    // Name validation - Required field
    if (!contactForm.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (contactForm.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    // Email validation - Required with format check
    if (!contactForm.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(contactForm.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Subject validation - Required field
    if (!contactForm.subject.trim()) {
      newErrors.subject = 'Subject is required';
    } else if (contactForm.subject.trim().length < 5) {
      newErrors.subject = 'Subject must be at least 5 characters';
    }

    // Message validation - Required with minimum length
    if (!contactForm.message.trim()) {
      newErrors.message = 'Message is required';
    } else if (contactForm.message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters';
    }

    return newErrors;
  };

  /**
   * Handle contact form input changes
   * Updates form data and clears related validation errors
   */
  const handleInputChange = (field: keyof ContactFormData, value: string) => {
    setContactForm(prev => ({ ...prev, [field]: value }));
    
    // Clear validation error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
    
    // Hide success message when user makes changes
    if (showSuccess) {
      setShowSuccess(false);
    }
  };

  /**
   * Handle contact form submission
   * Validates form, shows errors, or submits to support system
   */
  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form data
    const validationErrors = validateContactForm();
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      showNotification('Please fix the errors in the form', 'error');
      return;
    }

    // Clear any previous errors
    setErrors({});
    setIsSubmitting(true);

    try {
      // Simulate API call to submit support request
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Reset form on successful submission
      setContactForm({
        name: '',
        email: '',
        subject: '',
        message: ''
      });
      
      // Show success feedback
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 5000);
      showNotification('Support request submitted successfully! We\'ll get back to you soon.', 'success');
      
    } catch (error) {
      // Handle submission errors
      showNotification('Failed to submit support request. Please try again.', 'error');
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
   * Get category badge styling
   * Returns appropriate styling for different FAQ categories
   */
  const getCategoryBadge = (category?: string) => {
    const badges: Record<string, string> = {
      'general': 'bg-blue-100 text-blue-700',
      'billing': 'bg-purple-100 text-purple-700',
      'technical': 'bg-orange-100 text-orange-700',
      'account': 'bg-green-100 text-green-700'
    };
    
    return badges[category || 'general'] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className={`bg-white rounded-xl shadow-lg p-8 max-w-4xl mx-auto my-8 ${className}`}>
      {/* Page Header - PulseSpark branding with support icon */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
          <HelpCircle className="w-5 h-5 text-green-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Support & FAQ</h1>
          <p className="text-gray-600">Find answers to common questions or contact support</p>
        </div>
      </div>

      {/* Success Message - Green themed success feedback */}
      {showSuccess && (
        <div className="mb-8 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
          <p className="text-green-700 font-medium">
            Thank you for contacting support! We've received your message and will respond within 24 hours.
          </p>
        </div>
      )}

      {/* Main Content Grid - Responsive layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* FAQ Section - Takes up 2/3 of the width on desktop */}
        <div className="lg:col-span-2">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Frequently Asked Questions</h2>
            <p className="text-gray-600">
              Browse our most common questions and answers. Click on any question to expand the answer.
            </p>
          </div>

          {/* FAQ Accordion List */}
          <div className="space-y-4" role="list" aria-label="Frequently asked questions">
            {faqItems.map((item) => {
              const isExpanded = expandedItems.has(item.id);
              
              return (
                <div
                  key={item.id}
                  className="border border-gray-200 rounded-lg overflow-hidden transition-all duration-200 hover:shadow-md"
                  role="listitem"
                >
                  {/* FAQ Question Header - Clickable to expand/collapse */}
                  <button
                    onClick={() => toggleFAQItem(item.id)}
                    className="
                      w-full flex items-center justify-between p-4 text-left
                      hover:bg-green-50 transition-colors duration-200
                      focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-inset
                    "
                    aria-expanded={isExpanded}
                    aria-controls={`faq-answer-${item.id}`}
                    aria-label={`FAQ: ${item.question}`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-green-600 font-semibold text-lg">
                          {item.question}
                        </h3>
                        {item.category && (
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryBadge(item.category)}`}>
                            {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Expand/Collapse Icon */}
                    <div className="flex-shrink-0 ml-4">
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5 text-green-600 transition-transform duration-200" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-green-600 transition-transform duration-200" />
                      )}
                    </div>
                  </button>

                  {/* FAQ Answer - Expandable content with smooth animation */}
                  {isExpanded && (
                    <div
                      id={`faq-answer-${item.id}`}
                      className="px-4 pb-4 text-gray-800 bg-gray-50 border-t border-gray-100 animate-fadeIn"
                      role="region"
                      aria-labelledby={`faq-question-${item.id}`}
                    >
                      <div className="pt-4 leading-relaxed">
                        {item.answer}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Expand All / Collapse All Actions */}
          <div className="mt-6 flex items-center gap-4 text-sm">
            <button
              onClick={() => setExpandedItems(new Set(faqItems.map(item => item.id)))}
              className="text-green-600 hover:text-green-700 hover:underline transition-colors"
            >
              Expand All
            </button>
            <button
              onClick={() => setExpandedItems(new Set())}
              className="text-green-600 hover:text-green-700 hover:underline transition-colors"
            >
              Collapse All
            </button>
          </div>
        </div>

        {/* Contact Support Section - Takes up 1/3 of the width on desktop */}
        <div className="lg:col-span-1">
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <Mail className="w-5 h-5 text-green-600" />
              <h2 className="text-xl font-semibold text-gray-900">Contact Support</h2>
            </div>
            
            <p className="text-gray-600 mb-6">
              Can't find what you're looking for? Send us a message and we'll get back to you within 24 hours.
            </p>

            {/* Contact Form */}
            <form onSubmit={handleContactSubmit} className="space-y-4">
              {/* Name Field */}
              <div>
                <label htmlFor="contactName" className="block text-sm font-medium text-gray-700 mb-2">
                  Name *
                </label>
                <div className="relative">
                  <input
                    id="contactName"
                    type="text"
                    value={contactForm.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className={getInputClasses('name')}
                    placeholder="Your full name"
                    disabled={isSubmitting}
                    aria-describedby={errors.name ? 'name-error' : undefined}
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <User className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
                {errors.name && (
                  <p id="name-error" className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.name}
                  </p>
                )}
              </div>

              {/* Email Field */}
              <div>
                <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <div className="relative">
                  <input
                    id="contactEmail"
                    type="email"
                    value={contactForm.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={getInputClasses('email')}
                    placeholder="your.email@example.com"
                    disabled={isSubmitting}
                    aria-describedby={errors.email ? 'email-error' : undefined}
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
                {errors.email && (
                  <p id="email-error" className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Subject Field */}
              <div>
                <label htmlFor="contactSubject" className="block text-sm font-medium text-gray-700 mb-2">
                  Subject *
                </label>
                <input
                  id="contactSubject"
                  type="text"
                  value={contactForm.subject}
                  onChange={(e) => handleInputChange('subject', e.target.value)}
                  className={getInputClasses('subject')}
                  placeholder="Brief description of your issue"
                  disabled={isSubmitting}
                  aria-describedby={errors.subject ? 'subject-error' : undefined}
                />
                {errors.subject && (
                  <p id="subject-error" className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.subject}
                  </p>
                )}
              </div>

              {/* Message Field */}
              <div>
                <label htmlFor="contactMessage" className="block text-sm font-medium text-gray-700 mb-2">
                  Message *
                </label>
                <div className="relative">
                  <textarea
                    id="contactMessage"
                    value={contactForm.message}
                    onChange={(e) => handleInputChange('message', e.target.value)}
                    rows={4}
                    className={`${getInputClasses('message')} resize-vertical min-h-[100px]`}
                    placeholder="Please describe your issue or question in detail..."
                    disabled={isSubmitting}
                    aria-describedby={errors.message ? 'message-error' : undefined}
                  />
                  <div className="absolute top-3 right-3 pointer-events-none">
                    <MessageSquare className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
                {errors.message && (
                  <p id="message-error" className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.message}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="
                  w-full flex justify-center items-center gap-3 py-3 px-6
                  bg-gradient-to-r from-green-600 to-green-700 
                  hover:from-green-500 hover:to-green-600
                  text-white font-semibold rounded-md shadow-sm
                  transform transition-all duration-200 
                  hover:scale-[1.02] hover:shadow-md
                  focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2
                  disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                  active:scale-[0.98]
                "
              >
                {isSubmitting ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span>Sending Message...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Send Message</span>
                  </>
                )}
              </button>
            </form>

            {/* Contact Information */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="font-medium text-gray-900 mb-3">Other Ways to Reach Us</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p>📧 Email: support@pulsespark.ai</p>
                <p>💬 Live Chat: Available 9 AM - 6 PM EST</p>
                <p>📞 Phone: +1 (555) 123-4567</p>
                <p>⏰ Response Time: Within 24 hours</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Resources Section */}
      <div className="mt-8 pt-8 border-t border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Additional Resources</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="#"
            className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-green-50 transition-colors"
          >
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <HelpCircle className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Documentation</h3>
              <p className="text-sm text-gray-600">Detailed guides and tutorials</p>
            </div>
          </a>
          
          <a
            href="#"
            className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-green-50 transition-colors"
          >
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Community Forum</h3>
              <p className="text-sm text-gray-600">Connect with other users</p>
            </div>
          </a>
          
          <a
            href="#"
            className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-green-50 transition-colors"
          >
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <Mail className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Status Page</h3>
              <p className="text-sm text-gray-600">Service status and updates</p>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
};

export default SupportFAQPage;