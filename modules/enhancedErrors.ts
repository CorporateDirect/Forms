/**
 * Enhanced Error Handling Module - Form Field Wrapper Standardization
 * Provides robust error message handling that works with inconsistent HTML structures
 * Version: 1.8.0 - Form Wrapper Standardization
 */

import { logVerbose } from './utils';
import { addClass, removeClass } from './utils';

const CSS_CLASSES = {
  ERROR_FIELD: 'error-field',
  ACTIVE_ERROR: 'active-error'
};

interface EnhancedErrorConfig {
  fieldName: string;
  element: HTMLElement;
  errorElement?: HTMLElement;
  customMessage?: string;
}

// Map to store enhanced error configurations
const enhancedErrorConfigs: Map<string, EnhancedErrorConfig> = new Map();

/**
 * Enhanced error element finder that handles inconsistent HTML structures
 */
function findOrCreateErrorElement(element: HTMLElement, fieldName: string): HTMLElement {
  const parentWrapper = element.closest('.form-field_wrapper, .multi-form_input-field, .form_input-phone-wrapper');
  
  if (!parentWrapper) {
    logVerbose(`No suitable parent wrapper found for field: ${fieldName}`);
    return createErrorElement(element, fieldName);
  }
  
  // Try multiple selectors in order of preference
  const selectors = [
    '.form_error-message[data-form="required"]',
    '.form_error-message',
    '[data-form="required"]'
  ];
  
  let errorElement: HTMLElement | null = null;
  
  // Search within the wrapper
  for (const selector of selectors) {
    errorElement = parentWrapper.querySelector(selector) as HTMLElement;
    if (errorElement) {
      logVerbose(`Found error element using selector: ${selector}`, { fieldName });
      break;
    }
  }
  
  // If no error element found, create one
  if (!errorElement) {
    logVerbose(`No error element found for field: ${fieldName}, creating new one`);
    errorElement = createErrorElement(element, fieldName);
  }
  
  // Ensure the error element has the required attributes
  standardizeErrorElement(errorElement);
  
  return errorElement;
}

/**
 * Create a new error element with proper structure
 */
function createErrorElement(inputElement: HTMLElement, fieldName: string): HTMLElement {
  const errorElement = document.createElement('div');
  errorElement.className = 'form_error-message';
  errorElement.setAttribute('data-form', 'required');
  errorElement.setAttribute('data-field', fieldName);
  errorElement.textContent = 'This field is required';
  
  // Hide by default
  errorElement.style.display = 'none';
  
  // Find the best insertion point
  const insertionPoint = findInsertionPoint(inputElement);
  insertionPoint.appendChild(errorElement);
  
  logVerbose(`Created new error element for field: ${fieldName}`, {
    insertedAfter: insertionPoint.tagName,
    parentClasses: insertionPoint.className
  });
  
  return errorElement;
}

/**
 * Find the best place to insert a new error element
 */
function findInsertionPoint(inputElement: HTMLElement): HTMLElement {
  // First preference: after the input's immediate wrapper if it exists
  const immediateWrapper = inputElement.parentElement;
  if (immediateWrapper && (
    immediateWrapper.classList.contains('multi-form_input-field') ||
    immediateWrapper.classList.contains('form_input-phone-wrapper')
  )) {
    return immediateWrapper.parentElement || immediateWrapper;
  }
  
  // Second preference: after the input itself
  return inputElement.parentElement || inputElement;
}

/**
 * Ensure error element has all required attributes and classes
 */
function standardizeErrorElement(errorElement: HTMLElement): void {
  if (!errorElement.hasAttribute('data-form')) {
    errorElement.setAttribute('data-form', 'required');
  }
  
  if (!errorElement.classList.contains('form_error-message')) {
    errorElement.classList.add('form_error-message');
  }
}

/**
 * Enhanced error showing function with multiple fallback strategies
 */
export function showEnhancedError(fieldName: string, message?: string): void {
  // Find the field element
  const fieldElement = findFieldElement(fieldName);
  if (!fieldElement) {
    logVerbose(`Cannot find field element for: ${fieldName}`);
    return;
  }
  
  // Get or create error configuration
  let config = enhancedErrorConfigs.get(fieldName);
  if (!config) {
    config = {
      fieldName,
      element: fieldElement
    };
    enhancedErrorConfigs.set(fieldName, config);
  }
  
  // Find or create error element
  const errorElement = findOrCreateErrorElement(fieldElement, fieldName);
  config.errorElement = errorElement;
  
  // Set error message
  const errorMessage = message || config.customMessage || 'This field is required';
  if (!config.customMessage || message) {
    errorElement.textContent = errorMessage;
  }
  
  // Apply error styling to the field
  addClass(fieldElement, CSS_CLASSES.ERROR_FIELD);
  
  // Show error element with multiple strategies
  showErrorElementRobustly(errorElement);
  
  // Add active class for additional styling
  addClass(errorElement, CSS_CLASSES.ACTIVE_ERROR);
  
  logVerbose(`Enhanced error shown for field: ${fieldName}`, {
    message: errorMessage,
    elementVisible: errorElement.offsetParent !== null,
    hasActiveClass: errorElement.classList.contains(CSS_CLASSES.ACTIVE_ERROR)
  });
}

/**
 * Clear enhanced error with multiple strategies
 */
export function clearEnhancedError(fieldName: string): void {
  const config = enhancedErrorConfigs.get(fieldName);
  if (!config || !config.errorElement) {
    logVerbose(`Cannot clear error for field: ${fieldName} - no config or error element`);
    return;
  }
  
  // Remove error styling from field
  removeClass(config.element, CSS_CLASSES.ERROR_FIELD);
  
  // Hide error element
  hideErrorElementRobustly(config.errorElement);
  
  // Remove active class
  removeClass(config.errorElement, CSS_CLASSES.ACTIVE_ERROR);
  
  // Clear text content
  config.errorElement.textContent = '';
  
  logVerbose(`Enhanced error cleared for field: ${fieldName}`);
}

/**
 * Show error element using multiple strategies for maximum compatibility
 */
function showErrorElementRobustly(errorElement: HTMLElement): void {
  // Strategy 1: Use setProperty with !important (highest priority)
  errorElement.style.setProperty('display', 'block', 'important');
  errorElement.style.setProperty('visibility', 'visible', 'important');
  errorElement.style.setProperty('opacity', '1', 'important');
  
  // Strategy 2: Apply inline styles as fallback
  errorElement.style.display = 'block';
  errorElement.style.visibility = 'visible';
  errorElement.style.opacity = '1';
  
  // Strategy 3: Remove any hidden classes that might exist
  errorElement.classList.remove('hidden', 'w-hidden', 'hide');
  
  // Strategy 4: Ensure basic error styling
  if (!errorElement.style.color) {
    errorElement.style.color = '#e74c3c';
  }
  if (!errorElement.style.fontSize) {
    errorElement.style.fontSize = '0.875rem';
  }
  if (!errorElement.style.marginTop) {
    errorElement.style.marginTop = '0.25rem';
  }
}

/**
 * Hide error element using multiple strategies
 */
function hideErrorElementRobustly(errorElement: HTMLElement): void {
  // Strategy 1: Use setProperty with !important
  errorElement.style.setProperty('display', 'none', 'important');
  errorElement.style.setProperty('visibility', 'hidden', 'important');
  errorElement.style.setProperty('opacity', '0', 'important');
  
  // Strategy 2: Apply inline styles as fallback
  errorElement.style.display = 'none';
  errorElement.style.visibility = 'hidden';
  errorElement.style.opacity = '0';
}

/**
 * Find field element using multiple strategies
 */
function findFieldElement(fieldName: string): HTMLElement | null {
  // Strategy 1: Find by name attribute
  let element = document.querySelector(`input[name="${fieldName}"], select[name="${fieldName}"], textarea[name="${fieldName}"]`) as HTMLElement;
  
  // Strategy 2: Find by data-step-field-name
  if (!element) {
    element = document.querySelector(`[data-step-field-name="${fieldName}"]`) as HTMLElement;
  }
  
  // Strategy 3: Find by ID
  if (!element) {
    element = document.getElementById(fieldName) as HTMLElement;
  }
  
  // Strategy 4: Find within current visible step
  if (!element) {
    const visibleStep = document.querySelector('.step_wrapper[style*="flex"]');
    if (visibleStep) {
      element = visibleStep.querySelector(`input[name="${fieldName}"], select[name="${fieldName}"], textarea[name="${fieldName}"]`) as HTMLElement;
    }
  }
  
  return element;
}

/**
 * Initialize enhanced error handling for all fields in the form
 */
export function initializeEnhancedErrorHandling(): void {
  logVerbose('Initializing enhanced error handling...');
  
  // Find all input, select, and textarea elements
  const formElements = document.querySelectorAll('input, select, textarea');
  
  formElements.forEach((element) => {
    const input = element as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
    const fieldName = input.name || input.getAttribute('data-step-field-name') || input.id;
    
    if (fieldName) {
      // Create configuration for this field
      const config: EnhancedErrorConfig = {
        fieldName,
        element: input as HTMLElement,
        customMessage: getCustomErrorMessage(input as HTMLElement) || undefined
      };
      
      enhancedErrorConfigs.set(fieldName, config);
      
      // Ensure error element exists
      findOrCreateErrorElement(input as HTMLElement, fieldName);
    }
  });
  
  logVerbose(`Enhanced error handling initialized for ${enhancedErrorConfigs.size} fields`);
}

/**
 * Get custom error message from element attributes or nearby elements
 */
function getCustomErrorMessage(element: HTMLElement): string | null {
  // Check for custom message in data attributes
  const customMessage = element.getAttribute('data-error-message') || 
                       element.getAttribute('data-validation-message');
  
  if (customMessage) {
    return customMessage;
  }
  
  // Check for custom message in nearby error element
  const wrapper = element.closest('.form-field_wrapper, .multi-form_input-field');
  if (wrapper) {
    const errorElement = wrapper.querySelector('.form_error-message');
    if (errorElement && errorElement.textContent && 
        errorElement.textContent !== 'This is some text inside of a div block.') {
      return errorElement.textContent.trim();
    }
  }
  
  return null;
}

/**
 * Clear all enhanced errors
 */
export function clearAllEnhancedErrors(): void {
  enhancedErrorConfigs.forEach((config, fieldName) => {
    clearEnhancedError(fieldName);
  });
  
  logVerbose('All enhanced errors cleared');
}

/**
 * Get statistics about enhanced error handling
 */
export function getEnhancedErrorStats() {
  const stats = {
    totalFields: enhancedErrorConfigs.size,
    fieldsWithCustomMessages: 0,
    fieldsWithErrorElements: 0
  };
  
  enhancedErrorConfigs.forEach(config => {
    if (config.customMessage) {
      stats.fieldsWithCustomMessages++;
    }
    if (config.errorElement) {
      stats.fieldsWithErrorElements++;
    }
  });
  
  return stats;
}