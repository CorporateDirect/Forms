/**
 * Webflow Integration Module - v1.6.1 
 * FIXED: Comprehensive solution for GET forms, jQuery dependency, timing, and event interception
 */

import { logVerbose } from './utils.js';
import { showError, clearError } from './errors.js';

let webflowInitialized = false;
let formElements: Map<string, HTMLFormElement> = new Map();
let submissionInterceptors: Set<HTMLFormElement> = new Set();

/**
 * Initialize Webflow integration with comprehensive error handling
 */
export function initWebflowIntegration(): void {
  if (webflowInitialized) {
    logVerbose('[WebflowIntegration] Already initialized');
    return;
  }

  // Use both logVerbose AND console.log to ensure visibility
  logVerbose('[WebflowIntegration] 🚀 Starting comprehensive integration (v1.6.2)');
  console.log('[WebflowIntegration] 🚀 Starting comprehensive integration (v1.6.2) - NUCLEAR CSS EDITION');

  // Find all forms with data-form="multistep" 
  const multistepForms = document.querySelectorAll('form[data-form="multistep"]');
  
  logVerbose(`[WebflowIntegration] Found ${multistepForms.length} multistep forms`);
  console.log(`[WebflowIntegration] Found ${multistepForms.length} multistep forms`);
  
  if (multistepForms.length === 0) {
    logVerbose('[WebflowIntegration] ⚠️ No multistep forms found for integration');
    console.log('[WebflowIntegration] ⚠️ No multistep forms found for integration');
    return;
  }

  // Store form references and analyze each form
  multistepForms.forEach((form, index) => {
    const formElement = form as HTMLFormElement;
    const formId = formElement.id || `webflow-form-${index}`;
    const method = formElement.method || 'get';
    
    formElements.set(formId, formElement);
    
    logVerbose(`[WebflowIntegration] 📋 Registered form: ${formId}`, {
      method: method,
      action: formElement.action || 'current-page',
      elements: formElement.elements.length,
      hasWebflowClass: formElement.classList.contains('w-form')
    });
  });

  // Set up multiple integration strategies for maximum compatibility
  console.log('[WebflowIntegration] 🔧 Setting up comprehensive hooks...');
  setupComprehensiveHooks();
  
  webflowInitialized = true;
  logVerbose('[WebflowIntegration] ✅ Integration initialized successfully');
}

/**
 * Setup comprehensive hooks for maximum compatibility (v1.6.1)
 */
function setupComprehensiveHooks(): void {
  logVerbose('[WebflowIntegration] 🔧 Setting up comprehensive hooks');

  // Strategy 1: Direct event listeners (immediate)
  setupDirectEventListeners();

  // Strategy 2: Webflow.push() integration (if available)
  setupWebflowPushIntegration();

  // Strategy 3: Submit button interception (GET form workaround)
  setupSubmitButtonInterception();

  // Strategy 4: Final safety net with form action override
  setupFormActionOverride();
}

/**
 * Strategy 1: Direct native JavaScript event listeners
 */
function setupDirectEventListeners(): void {
  logVerbose('[WebflowIntegration] 📡 Strategy 1: Setting up direct event listeners');

  formElements.forEach((form, formId) => {
    // Handle form submission events
    form.addEventListener('submit', function(event) {
      logVerbose(`[WebflowIntegration] 🚫 Direct submit intercepted: ${formId}`);
      
      if (interceptFormSubmission(form, event)) {
        logVerbose(`[WebflowIntegration] ✅ Direct validation passed: ${formId}`);
      } else {
        logVerbose(`[WebflowIntegration] ❌ Direct validation failed, blocking: ${formId}`);
        event.preventDefault();
        event.stopPropagation();
      }
    });

    // Handle beforesubmit for additional safety
    form.addEventListener('beforesubmit', function(event) {
      logVerbose(`[WebflowIntegration] 🚫 Before-submit intercepted: ${formId}`);
      
      if (!interceptFormSubmission(form, event)) {
        event.preventDefault();
        event.stopPropagation();
      }
    });

    logVerbose(`[WebflowIntegration] ✅ Direct listeners attached to: ${formId}`);
  });
}

/**
 * Strategy 2: Webflow.push() integration (if available)
 */
function setupWebflowPushIntegration(): void {
  logVerbose('[WebflowIntegration] 📡 Strategy 2: Setting up Webflow.push() integration');

  // Check if Webflow is available
  if (typeof (window as any).Webflow === 'undefined') {
    logVerbose('[WebflowIntegration] ⚠️ Webflow object not available, skipping push integration');
    return;
  }

  try {
    (window as any).Webflow.push(function () {
      logVerbose('[WebflowIntegration] 🎯 Webflow.push() executed - setting up form hooks');

      formElements.forEach((form, formId) => {
        // Use native JavaScript instead of jQuery
        form.addEventListener('submit', function(event) {
          logVerbose(`[WebflowIntegration] 🚫 Webflow.push submit intercepted: ${formId}`);
          
          if (!interceptFormSubmission(form, event)) {
            event.preventDefault();
            event.stopPropagation();
          }
        });

        logVerbose(`[WebflowIntegration] ✅ Webflow.push listeners attached to: ${formId}`);
      });
    });
  } catch (error) {
    logVerbose(`[WebflowIntegration] ❌ Webflow.push() failed: ${error}`);
  }
}

/**
 * Strategy 3: Submit button interception (GET form workaround)
 */
function setupSubmitButtonInterception(): void {
  logVerbose('[WebflowIntegration] 📡 Strategy 3: Setting up submit button interception');

  formElements.forEach((form, formId) => {
    // Find submit buttons and submit-like elements
    const submitButtons = form.querySelectorAll('input[type="submit"], button[type="submit"], button:not([type]), [data-form="submit"]');
    
    logVerbose(`[WebflowIntegration] Found ${submitButtons.length} submit buttons in form: ${formId}`);

    submitButtons.forEach((button, index) => {
      button.addEventListener('click', function(event) {
        logVerbose(`[WebflowIntegration] 🚫 Submit button clicked: ${formId}-button-${index}`);
        
        // Perform validation before allowing the click to proceed
        if (!performFinalValidation(form)) {
          logVerbose(`[WebflowIntegration] ❌ Button click validation failed: ${formId}`);
          event.preventDefault();
          event.stopPropagation();
        } else {
          logVerbose(`[WebflowIntegration] ✅ Button click validation passed: ${formId}`);
        }
      });
    });

    // Also look for Webflow's form submission triggers
    const webflowSubmits = form.querySelectorAll('.w-button[type="submit"], .w-button[form]');
    webflowSubmits.forEach((button, index) => {
      button.addEventListener('click', function(event) {
        logVerbose(`[WebflowIntegration] 🚫 Webflow submit button clicked: ${formId}-wf-${index}`);
        
        if (!performFinalValidation(form)) {
          event.preventDefault();
          event.stopPropagation();
        } else {
          logVerbose(`[WebflowIntegration] ✅ Webflow submit validation passed: ${formId}`);
        }
      });
    });
  });
}

/**
 * Strategy 4: Form action override (final safety net)
 */
function setupFormActionOverride(): void {
  logVerbose('[WebflowIntegration] 📡 Strategy 4: Setting up form action override');

  formElements.forEach((form, formId) => {
    // Store original action
    const originalAction = form.action;
    
    // Override form action temporarily
    Object.defineProperty(form, 'action', {
      get: function() {
        return originalAction;
      },
      set: function(value) {
        logVerbose(`[WebflowIntegration] 🚫 Form action change intercepted: ${formId}`);
        
        // Perform validation before allowing action change
        if (performFinalValidation(form)) {
          logVerbose(`[WebflowIntegration] ✅ Action change validation passed: ${formId}`);
          return value;
        } else {
          logVerbose(`[WebflowIntegration] ❌ Action change validation failed: ${formId}`);
          return '#'; // Block the action change
        }
      }
    });
  });
}

/**
 * Central form submission interception logic
 */
function interceptFormSubmission(form: HTMLFormElement, event: Event): boolean {
  const formId = form.id || 'unknown';
  logVerbose(`[WebflowIntegration] 🔍 Intercepting submission for: ${formId}`);
  
  return performFinalValidation(form);
}

/**
 * Perform final validation before form submission (enhanced v1.6.1)
 */
function performFinalValidation(form: HTMLFormElement): boolean {
  const formId = form.id || 'unknown';
  logVerbose(`[WebflowIntegration] 🔍 Performing final validation for: ${formId}`);

  // Clear any existing errors first
  clearAllFormErrors(form);

  // Get all required fields in the entire form (supports both required and data-required)
  const requiredFields = form.querySelectorAll('input[required], input[data-required], select[required], select[data-required], textarea[required], textarea[data-required]');
  
  logVerbose(`[WebflowIntegration] Found ${requiredFields.length} required fields in form`);
  
  if (requiredFields.length === 0) {
    logVerbose(`[WebflowIntegration] ✅ No required fields found, validation passed: ${formId}`);
    return true;
  }

  let hasErrors = false;
  const errors: { field: HTMLElement; message: string }[] = [];

  // Validate each required field
  requiredFields.forEach((field, index) => {
    const input = field as HTMLInputElement;
    const fieldName = input.name || input.id || `field-${index}`;
    const value = getFieldValue(input);

    logVerbose(`[WebflowIntegration] 🔍 Validating field ${index + 1}: ${fieldName}`, {
      type: input.type,
      value: Array.isArray(value) ? `[${value.length} items]` : value,
      isEmpty: isFieldEmpty(value)
    });

    if (isFieldEmpty(value)) {
      const errorMessage = getCustomErrorMessage(input) || 'This field is required';
      errors.push({ field: input, message: errorMessage });
      hasErrors = true;
      
      logVerbose(`[WebflowIntegration] ❌ Required field is empty: ${fieldName}`);
    } else {
      logVerbose(`[WebflowIntegration] ✅ Required field is valid: ${fieldName}`);
    }
  });

  // Show errors if any
  if (hasErrors) {
    logVerbose(`[WebflowIntegration] 🚫 Validation failed - ${errors.length} fields with errors in form: ${formId}`);
    
    errors.forEach(({ field, message }) => {
      const fieldName = (field as HTMLInputElement).name || field.id || 'unknown';
      showError(fieldName, message);
      logVerbose(`[WebflowIntegration] 📝 Showing error for field: ${fieldName} - "${message}"`);
    });

    // Focus first error field
    if (errors.length > 0) {
      focusField(errors[0].field);
      logVerbose(`[WebflowIntegration] 🎯 Focused first error field: ${(errors[0].field as any).name || errors[0].field.id}`);
    }

    return false;
  }

  logVerbose(`[WebflowIntegration] ✅ All fields validated successfully for form: ${formId}`);
  return true;
}

/**
 * Get field value based on input type
 */
function getFieldValue(input: HTMLInputElement): string | string[] {
  switch (input.type) {
    case 'checkbox':
      return input.checked ? [input.value] : [];
    case 'radio':
      const radioGroup = document.querySelectorAll(`input[name="${input.name}"]:checked`);
      return Array.from(radioGroup).map((radio) => (radio as HTMLInputElement).value);
    default:
      return input.value;
  }
}

/**
 * Check if field value is empty
 */
function isFieldEmpty(value: string | string[]): boolean {
  if (Array.isArray(value)) {
    return value.length === 0;
  }
  return !value || value.trim() === '';
}

/**
 * Get custom error message for field
 */
function getCustomErrorMessage(input: HTMLElement): string | null {
  // Look for custom error message in parent container
  const fieldWrapper = input.closest('.form-field_wrapper') || input.parentElement;
  if (!fieldWrapper) return null;

  // PRIORITY 1: Look for data-form="required" elements first
  const customErrorElement = fieldWrapper.querySelector('[data-form="required"]') as HTMLElement;
  if (customErrorElement && customErrorElement.textContent) {
    const customText = customErrorElement.textContent.trim();
    if (customText) {
      logVerbose(`[WebflowIntegration] Found custom error message: ${customText}`);
      return customText;
    }
  }

  // PRIORITY 2: Look for .form_error-message elements
  const errorElement = fieldWrapper.querySelector('.form_error-message') as HTMLElement;
  if (errorElement && errorElement.textContent) {
    const customText = errorElement.textContent.trim();
    if (customText) {
      logVerbose(`[WebflowIntegration] Found fallback error message: ${customText}`);
      return customText;
    }
  }

  return null;
}

/**
 * Clear all form errors
 */
function clearAllFormErrors(form: HTMLFormElement): void {
  const errorElements = form.querySelectorAll('.form_error-message, [data-form="required"]');
  errorElements.forEach((element) => {
    const input = findRelatedInput(element as HTMLElement);
    if (input) {
      const fieldName = (input as HTMLInputElement).name || input.id || 'unknown';
      clearError(fieldName);
    }
  });
}

/**
 * Find input related to error element
 */
function findRelatedInput(errorElement: HTMLElement): HTMLElement | null {
  const fieldWrapper = errorElement.closest('.form-field_wrapper') || errorElement.parentElement;
  if (!fieldWrapper) return null;

  return fieldWrapper.querySelector('input, select, textarea') as HTMLElement;
}

/**
 * Focus a field
 */
function focusField(field: HTMLElement): void {
  try {
    if ('focus' in field && typeof field.focus === 'function') {
      field.focus();
      logVerbose(`[WebflowIntegration] Focused field: ${(field as any).name || field.id}`);
    }
  } catch (error) {
    logVerbose(`[WebflowIntegration] Could not focus field: ${error}`);
  }
}

/**
 * Check if Webflow integration is available
 */
export function isWebflowAvailable(): boolean {
  return typeof (window as any).Webflow !== 'undefined';
}

/**
 * Get comprehensive integration status (v1.6.1)
 */
export function getWebflowIntegrationStatus(): {
  initialized: boolean;
  webflowAvailable: boolean;
  formsRegistered: number;
  interceptorsActive: number;
  formDetails: Array<{
    id: string;
    method: string;
    action: string;
    requiredFields: number;
    hasWebflowClass: boolean;
  }>;
  strategies: {
    directListeners: boolean;
    webflowPush: boolean;
    buttonInterception: boolean;
    actionOverride: boolean;
  };
} {
  const formDetails = Array.from(formElements.entries()).map(([id, form]) => ({
    id,
    method: form.method || 'get',
    action: form.action || 'current-page',
    requiredFields: form.querySelectorAll('input[required], input[data-required], select[required], select[data-required], textarea[required], textarea[data-required]').length,
    hasWebflowClass: form.classList.contains('w-form')
  }));

  return {
    initialized: webflowInitialized,
    webflowAvailable: isWebflowAvailable(),
    formsRegistered: formElements.size,
    interceptorsActive: submissionInterceptors.size,
    formDetails,
    strategies: {
      directListeners: true, // Always attempted
      webflowPush: typeof (window as any).Webflow !== 'undefined',
      buttonInterception: true, // Always attempted
      actionOverride: true // Always attempted
    }
  };
}