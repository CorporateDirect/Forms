/**
 * Error handling and display module
 */

import { CSS_CLASSES, SELECTORS } from '../config.js';
import { 
  logVerbose, 
  getAttrValue, 
  addClass,
  removeClass
} from './utils.js';
import { formEvents } from './events.js';

interface ErrorConfig {
  fieldName: string;
  element: HTMLElement;
  errorElement?: HTMLElement;
  customMessage?: string;
}

let errorConfigs: Map<string, ErrorConfig> = new Map();

interface ErrorState {
  field: string;
  message: string;
  element: HTMLElement;
}

let errorStates: Map<string, ErrorState> = new Map();

/**
 * Initialize error handling
 */
export function initErrors(root: Document | Element = document): void {
  logVerbose('Initializing error handling');
  
  // Find all form inputs and set up error configurations
  const inputs = root.querySelectorAll('input, select, textarea');
  
  inputs.forEach(input => {
    const fieldName = (input as HTMLInputElement).name || 
                      getAttrValue(input, 'data-step-field-name');
    
    if (fieldName) {
      errorConfigs.set(fieldName, {
        fieldName,
        element: input as HTMLElement,
        customMessage: getAttrValue(input, 'data-error-message') || undefined
      });
    }
  });

  formEvents.registerModule('errors');
  logVerbose(`Error handling initialized for ${errorConfigs.size} fields`);
}

/**
 * Show error for a specific field
 */
export function showError(fieldName: string, message?: string): void {
  const config = errorConfigs.get(fieldName);
  if (!config) {
    logVerbose(`Cannot show error for unknown field: ${fieldName}`);
    return;
  }

  const errorMessage = message || config.customMessage || 'This field has an error';
  
  logVerbose(`Showing error for field: ${fieldName}`, { message: errorMessage });

  // Add error styling to the field
  addClass(config.element, CSS_CLASSES.ERROR_FIELD);

  // Create or update error message element
  const errorElement = findOrCreateErrorElement(config);
  if (errorElement) {
    errorElement.textContent = errorMessage;
    addClass(errorElement, CSS_CLASSES.ACTIVE_ERROR);
    config.errorElement = errorElement;
  }

  // Scroll to field if it's not visible
  scrollToFieldIfNeeded(config.element);
}

/**
 * Clear error for a specific field
 */
export function clearError(fieldName: string): void {
  const config = errorConfigs.get(fieldName);
  if (!config) {
    logVerbose(`Cannot clear error for unknown field: ${fieldName}`);
    return;
  }

  logVerbose(`Clearing error for field: ${fieldName}`);

  // Remove error styling from the field
  removeClass(config.element, CSS_CLASSES.ERROR_FIELD);

  // Hide error message element
  if (config.errorElement) {
    config.errorElement.textContent = '';
    removeClass(config.errorElement, CSS_CLASSES.ACTIVE_ERROR);
  }
}

/**
 * Clear all errors
 */
export function clearAllErrors(): void {
  logVerbose('Clearing all field errors');

  errorConfigs.forEach((config, fieldName) => {
    clearError(fieldName);
  });
}

/**
 * Show multiple errors at once
 */
export function showErrors(errors: Record<string, string>): void {
  logVerbose('Showing multiple errors', errors);

  Object.entries(errors).forEach(([fieldName, message]) => {
    showError(fieldName, message);
  });
}

/**
 * Check if a field has an error
 */
export function hasError(fieldName: string): boolean {
  const config = errorConfigs.get(fieldName);
  if (!config) return false;

  return config.element.classList.contains(CSS_CLASSES.ERROR_FIELD);
}

/**
 * Get all fields with errors
 */
export function getFieldsWithErrors(): string[] {
  const fieldsWithErrors: string[] = [];

  errorConfigs.forEach((config, fieldName) => {
    if (hasError(fieldName)) {
      fieldsWithErrors.push(fieldName);
    }
  });

  return fieldsWithErrors;
}

/**
 * Set custom error message for a field
 */
export function setCustomErrorMessage(fieldName: string, message: string): void {
  const config = errorConfigs.get(fieldName);
  if (!config) {
    logVerbose(`Cannot set custom error message for unknown field: ${fieldName}`);
    return;
  }

  config.customMessage = message;
  logVerbose(`Custom error message set for field: ${fieldName}`, { message });
}

/**
 * Find or create error message element for a field
 */
function findOrCreateErrorElement(config: ErrorConfig): HTMLElement | null {
  // Defensive checks
  if (!config || !config.element) {
    logVerbose('Cannot create error element - no config or element provided');
    return null;
  }

  // Check if element has a parent element
  if (!config.element.parentElement) {
    logVerbose(`Cannot create error element for field: ${config.fieldName} - no parent element`, {
      element: config.element,
      parentElement: config.element.parentElement,
      nodeName: config.element.nodeName,
      id: config.element.id
    });
    return null;
  }

  // Look for existing error element
  let errorElement: HTMLElement | null = null;
  
  try {
    errorElement = config.element.parentElement.querySelector(
      `${SELECTORS.ERROR_DISPLAY}[data-field="${config.fieldName}"]`
    ) as HTMLElement;
  } catch (error) {
    logVerbose(`Error finding existing error element for field: ${config.fieldName}`, error);
    return null;
  }

  if (!errorElement) {
    try {
      // Create new error element
      errorElement = document.createElement('div');
      errorElement.setAttribute('data-form', 'error');
      errorElement.setAttribute('data-field', config.fieldName);

      // Insert after the input
      const parent = config.element.parentElement;
      const nextSibling = config.element.nextSibling;
      if (nextSibling) {
        parent.insertBefore(errorElement, nextSibling);
      } else {
        parent.appendChild(errorElement);
      }

      logVerbose(`Created error element for field: ${config.fieldName}`);
    } catch (error) {
      logVerbose(`Error creating error element for field: ${config.fieldName}`, error);
      return null;
    }
  }

  return errorElement;
}

/**
 * Scroll to field if it's not in viewport
 */
function scrollToFieldIfNeeded(element: HTMLElement): void {
  const rect = element.getBoundingClientRect();
  const isVisible = rect.top >= 0 && 
                   rect.left >= 0 && 
                   rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) && 
                   rect.right <= (window.innerWidth || document.documentElement.clientWidth);

  if (!isVisible) {
    element.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'center' 
    });
    
    logVerbose(`Scrolled to field with error: ${(element as HTMLInputElement).name || 'unnamed'}`);
  }
}

/**
 * Highlight field with error (alternative to standard error styling)
 */
export function highlightFieldError(fieldName: string, highlightClass = 'field-highlight'): void {
  const config = errorConfigs.get(fieldName);
  if (!config) return;

  addClass(config.element, highlightClass);
  
  // Remove highlight after a delay
  setTimeout(() => {
    removeClass(config.element, highlightClass);
  }, 3000);

  logVerbose(`Highlighted field with error: ${fieldName}`);
}

/**
 * Focus on first field with error
 */
export function focusFirstError(): void {
  const fieldsWithErrors = getFieldsWithErrors();
  
  if (fieldsWithErrors.length > 0) {
    const firstErrorField = fieldsWithErrors[0];
    const config = errorConfigs.get(firstErrorField);
    
    if (config && config.element instanceof HTMLInputElement) {
      config.element.focus();
      logVerbose(`Focused on first error field: ${firstErrorField}`);
    }
  }
}

/**
 * Get error statistics
 */
export function getErrorStats(): Record<string, unknown> {
  const fieldsWithErrors = getFieldsWithErrors();
  
  return {
    totalErrors: fieldsWithErrors.length,
    fieldsWithErrors,
    hasErrors: fieldsWithErrors.length > 0
  };
}

/**
 * Reset error handling
 */
export function resetErrors(): void {
  logVerbose('Resetting error handling');

  // Clear all errors
  clearAllErrors();

  // Clear configurations
  errorConfigs.clear();

  logVerbose('Error handling reset complete');
}

/**
 * Get current error state for debugging
 */
export function getErrorState(): Record<string, unknown> {
  const state: Record<string, { message: string }> = {};
  errorStates.forEach((value, key) => {
    state[key] = {
      message: value.message
    };
  });
  return state;
} 