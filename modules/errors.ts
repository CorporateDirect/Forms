/**
 * Error handling and display module - Legacy System
 * Note: v1.9.0 introduces webflowNativeErrors.ts for Webflow-native error handling
 */

import { logVerbose, addClass, removeClass } from './utils.js';

import { CSS_CLASSES, SELECTORS } from '../config.js';
import { 
  getAttrValue
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
let cssInjected = false;

// V1.7.0 WEBFLOW HARMONY: Removed nuclear CSS approach
// Now following Webflow's official patterns for elegant integration

/**
 * Inject required CSS for error visibility - DISABLED FOR TESTING
 */
function injectErrorCSS(): void {
  // TEMPORARILY DISABLED - Let's see what Webflow does natively
  logVerbose('📦 [Errors] CSS injection disabled - testing Webflow native behavior');
  cssInjected = true;
  return;

  // CSS injection disabled for testing Webflow native behavior
}

/**
 * Initialize error handling
 */
export function initErrors(root: Document | Element = document): void {
  logVerbose('Initializing error handling');
  
  // Inject required CSS for error visibility
  injectErrorCSS();
  
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
 * Show error for a specific field
 */
export function showError(fieldName: string, message?: string): void {
  const config = errorConfigs.get(fieldName);
  if (!config) {
    logVerbose(`Cannot show error for unknown field: ${fieldName}`);
    return;
  }

  // ENHANCED: Prioritize custom message from HTML, then passed message, then fallback
  const errorMessage = config.customMessage || message || 'This field has an error';
  
  logVerbose(`Showing error for field: ${fieldName}`, { 
    message: errorMessage,
    hasCustomMessage: !!config.customMessage,
    messageSource: config.customMessage ? 'html' : message ? 'parameter' : 'fallback'
  });

  // Add error styling to the field
  addClass(config.element, CSS_CLASSES.ERROR_FIELD);

  // Create or update error message element
  const errorElement = findOrCreateErrorElement(config);
  if (errorElement) {
    // ENHANCED: Only update text if we don't have custom HTML content or if it's a validation message
    if (!config.customMessage || message) {
      errorElement.textContent = errorMessage;
    }
    
    // V1.8.0 CLEAN FIX: Find error element within form field wrapper
    const visibleStep = document.querySelector('.step_wrapper[style*="flex"]');
    const fieldInput = visibleStep?.querySelector(`input[name="${config.element.getAttribute('name')}"]`) || config.element;
    
    // Find error element by traversing up to .form-field_wrapper and searching within it
    const formFieldWrapper = fieldInput.closest('.form-field_wrapper');
    const currentStepErrorElement = formFieldWrapper?.querySelector('.form_error-message[data-form="required"]') as HTMLElement;
    
    const actualErrorElement = (currentStepErrorElement || errorElement) as HTMLElement;
    
    // V1.8.3 WEBFLOW HARMONY: Work with Webflow's natural flow
    // Simple, elegant approach that follows Webflow's patterns
    
    // Strategy 1: Use Webflow's standard display approach
    actualErrorElement.style.display = 'block';
    
    // Strategy 2: Add Webflow-compatible error styling
    actualErrorElement.style.color = '#e74c3c';
    actualErrorElement.style.fontSize = '0.875rem';
    actualErrorElement.style.marginTop = '0.25rem';
    actualErrorElement.style.lineHeight = '1.4';
    
    // Strategy 3: Remove any hiding attributes that might exist
    actualErrorElement.removeAttribute('hidden');
    
    // Strategy 4: Add accessibility and visual state
    actualErrorElement.setAttribute('aria-live', 'polite');
    actualErrorElement.setAttribute('role', 'alert');
    
    // Still add the class for any additional styling
    addClass(actualErrorElement, CSS_CLASSES.ACTIVE_ERROR);
    config.errorElement = actualErrorElement;
    
    logVerbose(`Error element activated for field: ${fieldName}`, {
      elementVisible: actualErrorElement.offsetParent !== null,
      hasActiveClass: actualErrorElement.classList.contains(CSS_CLASSES.ACTIVE_ERROR),
      hasInlineStyles: true,
      usingCurrentStepElement: !!currentStepErrorElement,
      elementLookupSuccess: currentStepErrorElement ? 'found in current step' : 'using cached element'
    });
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
    
    // V1.7.0 WEBFLOW HARMONY: Simple, clean error clearing
    // Use !important to ensure proper hiding
    config.errorElement.style.setProperty('display', 'none', 'important');
    
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
 * ENHANCED: Automatically detects existing .form_error-message elements and uses their custom text
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

  // Look for existing error element in form-field_wrapper structure
  let errorElement: HTMLElement | null = null;
  
  // ENHANCED: First, try to find existing .form_error-message in field wrapper
  const fieldWrapper = config.element.closest('.form-field_wrapper');
  if (fieldWrapper) {
    // PRIORITY 1: Look for data-form="required" elements first (new standardized approach)
    errorElement = fieldWrapper.querySelector('[data-form="required"]') as HTMLElement;
    
    // If found, extract custom message text and store it
    if (errorElement && errorElement.textContent && errorElement.textContent.trim() !== '') {
      const customText = errorElement.textContent.trim();
      config.customMessage = customText;
      logVerbose(`Found custom required error message for field: ${config.fieldName}`, { customText });
    }
    
    // PRIORITY 2: Look for .form_error-message (legacy support)
    if (!errorElement) {
      errorElement = fieldWrapper.querySelector('.form_error-message') as HTMLElement;
      
             // If found, extract custom message text and store it
       if (errorElement && errorElement.textContent && errorElement.textContent.trim() !== '') {
         const customText = errorElement.textContent.trim();
         config.customMessage = customText;
         logVerbose(`Found custom error message for field: ${config.fieldName}`, { customText });
       }
    }
    
    // Fallback: Look for data-form="error" attribute
    if (!errorElement) {
      errorElement = fieldWrapper.querySelector('[data-form="error"]') as HTMLElement;
    }
  }
  
  // ENHANCED: If no wrapper, look for error elements near the input
  if (!errorElement) {
    const parentElement = config.element.parentElement;
    
    // PRIORITY 1: Look for data-form="required" elements (new standardized approach)
    errorElement = parentElement.querySelector('[data-form="required"]') as HTMLElement;
    
         // If found, extract custom message text and store it
     if (errorElement && errorElement.textContent && errorElement.textContent.trim() !== '') {
       const customText = errorElement.textContent.trim();
       config.customMessage = customText;
       logVerbose(`Found custom required error message for field: ${config.fieldName}`, { customText });
     }
    
    // PRIORITY 2: Try to find .form_error-message as sibling or in parent (legacy support)
    if (!errorElement) {
      errorElement = parentElement.querySelector('.form_error-message') as HTMLElement;
      
             // Extract custom message if found
       if (errorElement && errorElement.textContent && errorElement.textContent.trim() !== '') {
         const customText = errorElement.textContent.trim();
         config.customMessage = customText;
         logVerbose(`Found custom error message for field: ${config.fieldName}`, { customText });
       }
    }
  }
  
  // Fallback: Look for existing error element by field name (legacy support)
  if (!errorElement) {
    try {
      errorElement = config.element.parentElement.querySelector(
        `${SELECTORS.ERROR_DISPLAY}[data-field="${config.fieldName}"]`
      ) as HTMLElement;
    } catch (error) {
      logVerbose(`Error finding existing error element for field: ${config.fieldName}`, error);
    }
  }

  if (!errorElement) {
    try {
      // Create new error element with proper structure
      errorElement = document.createElement('div');
      errorElement.setAttribute('data-form', 'error');
      errorElement.setAttribute('data-field', config.fieldName);
      errorElement.className = 'form_error-message';

      // Insert in form-field_wrapper if available, otherwise fallback to old method
      if (fieldWrapper) {
        fieldWrapper.appendChild(errorElement);
      } else {
        config.element.parentElement.insertBefore(errorElement, config.element.nextSibling);
      }
      
      logVerbose(`Created new error element for field: ${config.fieldName}`);
    } catch (error) {
      logVerbose(`Failed to create error element for field: ${config.fieldName}`, error);
      return null;
    }
  } else {
    logVerbose(`Found existing error element for field: ${config.fieldName}`, {
      className: errorElement.className,
      hasCustomMessage: !!config.customMessage
    });
  }

  return errorElement;
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