/**
 * Webflow Validation Listener - Custom Error Display
 * 
 * This module listens for when Webflow's native validation is triggered
 * and displays our own custom error messages, completely independent
 * of Webflow's error system.
 */

import { logVerbose, addClass, removeClass } from './utils.js';

interface CustomErrorConfig {
  fieldElement: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
  errorElement: HTMLElement;
  fieldName: string;
  isRequired: boolean;
}

const fieldConfigs: Map<string, CustomErrorConfig> = new Map();
let isInitialized = false;

/**
 * Initialize custom error system that listens to Webflow validation
 */
export function initializeCustomErrorSystem(): void {
  if (isInitialized) {
    logVerbose('Custom error system already initialized');
    return;
  }

  logVerbose('🎯 Initializing custom error system (Webflow listener approach)');
  
  // Inject our own CSS for error styling
  injectCustomErrorCSS();
  
  // Find all required fields and set up our error elements
  const requiredFields = document.querySelectorAll('input[required], select[required], textarea[required]') as NodeListOf<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>;
  
  let configuredCount = 0;
  
  requiredFields.forEach(field => {
    if (setupCustomErrorForField(field)) {
      configuredCount++;
    }
  });
  
  // Listen for form submission attempts to trigger our validation
  setupValidationListeners();
  
  isInitialized = true;
  logVerbose(`✅ Custom error system initialized for ${configuredCount} fields`);
}

/**
 * Inject our own CSS for custom error styling
 */
function injectCustomErrorCSS(): void {
  const css = `
    /* Custom Error System - Independent of Webflow */
    
    /* Hide error messages by default */
    .custom-error-message {
      display: none;
      color: #e74c3c;
      font-size: 0.875rem;
      margin-top: 0.25rem;
      line-height: 1.4;
      transition: opacity 0.2s ease-in-out;
    }
    
    /* Show error messages when active */
    .custom-error-message.show-error {
      display: block;
      opacity: 1;
      animation: errorSlideIn 0.3s ease-out;
    }
    
    /* Error field styling */
    .custom-error-field {
      border: 2px solid #e74c3c !important;
      box-shadow: 0 0 0 3px rgba(231, 76, 60, 0.1) !important;
      background-color: rgba(231, 76, 60, 0.02) !important;
    }
    
    /* Error field focus state */
    .custom-error-field:focus {
      border-color: #c0392b !important;
      box-shadow: 0 0 0 3px rgba(231, 76, 60, 0.2) !important;
      outline: none !important;
    }
    
    /* Animation for error appearance */
    @keyframes errorSlideIn {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `;

  const styleElement = document.createElement('style');
  styleElement.id = 'custom-error-styles';
  styleElement.textContent = css;
  document.head.appendChild(styleElement);
  
  logVerbose('📦 Custom error CSS injected');
}

/**
 * Setup custom error handling for a specific field
 */
function setupCustomErrorForField(field: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement): boolean {
  const fieldName = field.name || field.id || `field-${Math.random().toString(36).substr(2, 9)}`;
  
  // Find the field's wrapper
  const wrapper = field.closest('.form-field_wrapper');
  if (!wrapper) {
    logVerbose(`❌ No wrapper found for field: ${fieldName}`);
    return false;
  }
  
  // Create our own error message element
  const errorElement = createCustomErrorElement(fieldName);
  
  // Insert our error element after the field or in the wrapper
  if (field.nextSibling) {
    wrapper.insertBefore(errorElement, field.nextSibling);
  } else {
    wrapper.appendChild(errorElement);
  }
  
  // Store configuration
  fieldConfigs.set(fieldName, {
    fieldElement: field,
    errorElement: errorElement,
    fieldName: fieldName,
    isRequired: field.hasAttribute('required')
  });
  
  logVerbose(`✅ Custom error setup for field: ${fieldName}`);
  return true;
}

/**
 * Create a custom error message element
 */
function createCustomErrorElement(fieldName: string): HTMLElement {
  const errorElement = document.createElement('div');
  errorElement.className = 'custom-error-message';
  errorElement.setAttribute('data-field', fieldName);
  errorElement.setAttribute('role', 'alert');
  errorElement.setAttribute('aria-live', 'polite');
  errorElement.textContent = 'This field is required';
  
  return errorElement;
}

/**
 * Setup listeners to detect when Webflow validation is triggered
 */
function setupValidationListeners(): void {
  // Listen for form submission attempts
  document.addEventListener('submit', handleFormSubmission, true);
  
  // Listen for button clicks that might trigger validation
  document.addEventListener('click', handleButtonClick, true);
  
  // Listen for Enter key presses in form fields
  document.addEventListener('keydown', handleKeyPress, true);
  
  logVerbose('🎧 Validation listeners setup');
}

/**
 * Handle form submission - validate and show errors if needed
 */
function handleFormSubmission(event: Event): void {
  const form = event.target as HTMLFormElement;
  if (!form || form.tagName !== 'FORM') return;
  
  logVerbose('🔍 Form submission detected, validating...');
  
  const hasErrors = validateAndShowErrors();
  
  if (hasErrors) {
    event.preventDefault();
    event.stopPropagation();
    logVerbose('🚫 Form submission prevented due to validation errors');
  }
}

/**
 * Handle button clicks that might trigger step navigation
 */
function handleButtonClick(event: Event): void {
  const button = event.target as HTMLElement;
  if (!button) return;
  
  // Check if this is a next/submit button
  const isNextButton = button.hasAttribute('data-form') && 
                      (button.getAttribute('data-form') === 'next-btn' || 
                       button.getAttribute('data-form') === 'submit');
  
  const isNavigationButton = button.textContent?.toLowerCase().includes('next') ||
                            button.textContent?.toLowerCase().includes('submit') ||
                            button.classList.contains('next-step');
  
  if (isNextButton || isNavigationButton) {
    logVerbose('🔍 Navigation button clicked, validating current step...');
    
    // Small delay to let any Webflow validation run first
    setTimeout(() => {
      const hasErrors = validateCurrentStepAndShowErrors();
      
      if (hasErrors) {
        // If we have errors, we need to prevent the navigation
        // This is tricky since the event already happened
        logVerbose('🚫 Validation errors found after navigation attempt');
      }
    }, 50);
  }
}

/**
 * Handle Enter key press in form fields
 */
function handleKeyPress(event: KeyboardEvent): void {
  if (event.key === 'Enter') {
    const target = event.target as HTMLElement;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA')) {
      logVerbose('🔍 Enter pressed in form field, validating...');
      
      setTimeout(() => {
        validateCurrentStepAndShowErrors();
      }, 50);
    }
  }
}

/**
 * Validate all fields and show errors
 */
function validateAndShowErrors(): boolean {
  let hasErrors = false;
  
  fieldConfigs.forEach((config, fieldName) => {
    const isEmpty = !config.fieldElement.value.trim();
    
    if (config.isRequired && isEmpty) {
      showCustomError(fieldName, 'This field is required');
      hasErrors = true;
    } else {
      clearCustomError(fieldName);
    }
  });
  
  return hasErrors;
}

/**
 * Validate only fields in the current visible step
 */
function validateCurrentStepAndShowErrors(): boolean {
  const visibleStep = document.querySelector('.step_wrapper[style*="flex"], .step_wrapper:not([style*="none"])') as HTMLElement;
  if (!visibleStep) {
    logVerbose('No visible step found');
    return false;
  }
  
  let hasErrors = false;
  
  // Find required fields in the visible step
  const stepRequiredFields = visibleStep.querySelectorAll('input[required], select[required], textarea[required]') as NodeListOf<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>;
  
  stepRequiredFields.forEach(field => {
    const fieldName = field.name || field.id || 'unknown-field';
    const config = fieldConfigs.get(fieldName);
    
    if (config) {
      const isEmpty = !field.value.trim();
      
      if (isEmpty) {
        showCustomError(fieldName, 'This field is required');
        hasErrors = true;
      } else {
        clearCustomError(fieldName);
      }
    }
  });
  
  logVerbose(`Validated current step: ${hasErrors ? 'has errors' : 'valid'}`, {
    fieldsChecked: stepRequiredFields.length,
    errorsFound: hasErrors
  });
  
  return hasErrors;
}

/**
 * Show custom error for a field
 */
export function showCustomError(fieldName: string, message: string): void {
  const config = fieldConfigs.get(fieldName);
  if (!config) return;
  
  // Add error styling to field
  addClass(config.fieldElement, 'custom-error-field');
  
  // Update and show error message
  config.errorElement.textContent = message;
  addClass(config.errorElement, 'show-error');
  
  logVerbose(`🔴 Showing custom error for: ${fieldName}`, { message });
}

/**
 * Clear custom error for a field
 */
export function clearCustomError(fieldName: string): void {
  const config = fieldConfigs.get(fieldName);
  if (!config) return;
  
  // Remove error styling from field
  removeClass(config.fieldElement, 'custom-error-field');
  
  // Hide error message
  removeClass(config.errorElement, 'show-error');
  
  logVerbose(`✅ Cleared custom error for: ${fieldName}`);
}

/**
 * Clear all custom errors
 */
export function clearAllCustomErrors(): void {
  fieldConfigs.forEach((config, fieldName) => {
    clearCustomError(fieldName);
  });
  
  logVerbose('Cleared all custom errors');
}

/**
 * Get fields with errors
 */
export function getFieldsWithCustomErrors(): string[] {
  const fieldsWithErrors: string[] = [];
  
  fieldConfigs.forEach((config, fieldName) => {
    if (config.errorElement.classList.contains('show-error')) {
      fieldsWithErrors.push(fieldName);
    }
  });
  
  return fieldsWithErrors;
}