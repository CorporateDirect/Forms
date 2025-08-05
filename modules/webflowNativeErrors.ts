/**
 * Webflow Native Error Handling - Version 1.9.0
 * 
 * This module provides error handling that works seamlessly with Webflow's native 
 * required attribute system and styling patterns.
 * 
 * APPROACH:
 * - Uses Webflow's native `required` attribute to identify required fields
 * - Adds `.active-error` class to `.form_input` for red border styling
 * - Adds `.active-error` class to `.form_error-message` for visibility
 * - Works with complex structures (email fields with icons, etc.)
 * - Removes classes when validation passes
 */

import { logVerbose, addClass, removeClass } from './utils.js';

interface FieldErrorConfig {
  fieldElement: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
  errorElement: HTMLElement;
  fieldName: string;
}

// Map to store field configurations
const fieldConfigs: Map<string, FieldErrorConfig> = new Map();
let isInitialized = false;

/**
 * Initialize the Webflow-native error handling system
 */
export function initializeWebflowErrorHandling(): void {
  if (isInitialized) {
    logVerbose('Webflow error handling already initialized');
    return;
  }

  logVerbose('🚀 Initializing Webflow-native error handling...');
  
  // Find all form inputs with Webflow's native required attribute
  const requiredFields = document.querySelectorAll('input[required], select[required], textarea[required]') as NodeListOf<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>;
  
  let configuredFieldsCount = 0;
  
  requiredFields.forEach(field => {
    if (setupFieldErrorHandling(field)) {
      configuredFieldsCount++;
    }
  });
  
  isInitialized = true;
  logVerbose(`✅ Configured error handling for ${configuredFieldsCount} of ${requiredFields.length} required fields`);
}

/**
 * Setup error handling for a specific required field
 */
function setupFieldErrorHandling(field: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement): boolean {
  const fieldName = field.name || field.id || `field-${Math.random().toString(36).substr(2, 9)}`;
  
  // Find the field's parent wrapper
  const wrapper = field.closest('.form-field_wrapper');
  if (!wrapper) {
    logVerbose(`❌ No .form-field_wrapper found for field: ${fieldName}`);
    return false;
  }
  
  // Find error message element within the wrapper
  const errorElement = wrapper.querySelector('.form_error-message[data-form="required"]') as HTMLElement;
  if (!errorElement) {
    logVerbose(`❌ No error message element found for field: ${fieldName}`);
    return false;
  }
  
  // Store the configuration
  fieldConfigs.set(fieldName, {
    fieldElement: field,
    errorElement: errorElement,
    fieldName: fieldName
  });
  
  // Add event listeners for real-time validation
  field.addEventListener('blur', () => validateFieldOnBlur(fieldName));
  field.addEventListener('input', () => clearFieldErrorOnInput(fieldName));
  
  logVerbose(`✅ Setup error handling for field: ${fieldName}`);
  return true;
}

/**
 * Validate a field when it loses focus (blur event)
 */
function validateFieldOnBlur(fieldName: string): void {
  const config = fieldConfigs.get(fieldName);
  if (!config) return;
  
  const { fieldElement } = config;
  
  // Check if field is empty and required
  const isEmpty = !fieldElement.value.trim();
  
  if (isEmpty) {
    showFieldError(fieldName, 'This field is required');
  } else {
    clearFieldError(fieldName);
  }
}

/**
 * Clear field error when user starts typing (input event)
 */
function clearFieldErrorOnInput(fieldName: string): void {
  const config = fieldConfigs.get(fieldName);
  if (!config) return;
  
  const { fieldElement } = config;
  
  // If field has content, clear any existing error
  if (fieldElement.value.trim()) {
    clearFieldError(fieldName);
  }
}

/**
 * Show error for a specific field using Webflow's pattern
 */
export function showFieldError(fieldName: string, message?: string): void {
  const config = fieldConfigs.get(fieldName);
  if (!config) {
    logVerbose(`Cannot show error for unknown field: ${fieldName}`);
    return;
  }
  
  const { fieldElement, errorElement } = config;
  
  // Add .active-error to .form_input for red border
  addClass(fieldElement, 'active-error');
  
  // Add .active-error to .form_error-message for visibility
  addClass(errorElement, 'active-error');
  
  // Optionally update the error message text
  if (message && errorElement.textContent !== message) {
    errorElement.textContent = message;
  }
  
  logVerbose(`🔴 Showing error for field: ${fieldName}`, {
    fieldHasActiveError: fieldElement.classList.contains('active-error'),
    errorElementHasActiveError: errorElement.classList.contains('active-error'),
    message: message || errorElement.textContent
  });
}

/**
 * Clear error for a specific field
 */
export function clearFieldError(fieldName: string): void {
  const config = fieldConfigs.get(fieldName);
  if (!config) {
    logVerbose(`Cannot clear error for unknown field: ${fieldName}`);
    return;
  }
  
  const { fieldElement, errorElement } = config;
  
  // Remove .active-error from .form_input (removes red border)
  removeClass(fieldElement, 'active-error');
  
  // Remove .active-error from .form_error-message (hides error message)
  removeClass(errorElement, 'active-error');
  
  logVerbose(`✅ Cleared error for field: ${fieldName}`);
}

/**
 * Validate all required fields in the current visible step
 */
export function validateCurrentStep(): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Find the currently visible step
  const visibleStep = document.querySelector('.step_wrapper[style*="flex"], .step_wrapper:not([style*="none"])') as HTMLElement;
  if (!visibleStep) {
    logVerbose('No visible step found for validation');
    return { isValid: true, errors: [] };
  }
  
  // Find all required fields in the visible step
  const stepRequiredFields = visibleStep.querySelectorAll('input[required], select[required], textarea[required]') as NodeListOf<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>;
  
  stepRequiredFields.forEach(field => {
    const fieldName = field.name || field.id || 'unknown-field';
    const isEmpty = !field.value.trim();
    
    if (isEmpty) {
      errors.push(fieldName);
      showFieldError(fieldName, 'This field is required');
    } else {
      clearFieldError(fieldName);
    }
  });
  
  const isValid = errors.length === 0;
  
  logVerbose(`Validation result for current step:`, {
    isValid,
    fieldsChecked: stepRequiredFields.length,
    errorsFound: errors.length,
    errorFields: errors
  });
  
  return { isValid, errors };
}

/**
 * Clear all errors
 */
export function clearAllErrors(): void {
  fieldConfigs.forEach((config, fieldName) => {
    clearFieldError(fieldName);
  });
  
  logVerbose('Cleared all field errors');
}

/**
 * Check if a specific field has an error
 */
export function hasFieldError(fieldName: string): boolean {
  const config = fieldConfigs.get(fieldName);
  if (!config) return false;
  
  return config.fieldElement.classList.contains('active-error');
}

/**
 * Get all fields with errors
 */
export function getFieldsWithErrors(): string[] {
  const fieldsWithErrors: string[] = [];
  
  fieldConfigs.forEach((config, fieldName) => {
    if (hasFieldError(fieldName)) {
      fieldsWithErrors.push(fieldName);
    }
  });
  
  return fieldsWithErrors;
}