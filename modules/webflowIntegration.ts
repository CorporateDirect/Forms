/**
 * Webflow Integration Module
 * Hooks into Webflow's native validation system for seamless integration
 */

import { logVerbose } from './utils.js';
// Import removed - validateCurrentStep is not exported from multiStep.js
import { showError, clearError } from './errors.js';

let webflowInitialized = false;
let formElements: Map<string, HTMLFormElement> = new Map();

/**
 * Initialize Webflow integration
 */
export function initWebflowIntegration(): void {
  if (webflowInitialized) {
    logVerbose('Webflow integration already initialized');
    return;
  }

  logVerbose('Initializing Webflow integration');

  // Check if we're in a Webflow environment
  if (typeof (window as any).Webflow === 'undefined') {
    logVerbose('Webflow not detected, skipping native integration');
    return;
  }

  // Find all forms with data-form="multistep"
  const multistepForms = document.querySelectorAll('form[data-form="multistep"]');
  
  if (multistepForms.length === 0) {
    logVerbose('No multistep forms found for Webflow integration');
    return;
  }

  // Store form references
  multistepForms.forEach((form, index) => {
    const formId = form.id || `webflow-form-${index}`;
    formElements.set(formId, form as HTMLFormElement);
    logVerbose(`Registered Webflow form for integration: ${formId}`);
  });

  // Hook into Webflow's validation system
  setupWebflowHooks();
  
  webflowInitialized = true;
  logVerbose('Webflow integration initialized successfully');
}

/**
 * Setup Webflow.push() hooks for form validation
 */
function setupWebflowHooks(): void {
  logVerbose('Setting up Webflow.push() hooks');

  // Use Webflow.push to hook into their system
  (window as any).Webflow.push(function () {
    logVerbose('Webflow.push() executed - setting up form submission hooks');

    // Hook into all our multistep forms
    formElements.forEach((form, formId) => {
      logVerbose(`Setting up submission hook for form: ${formId}`);

      // Use jQuery (available in Webflow) to hook into form submission
      (window as any).$(form).submit(function (event: Event) {
        logVerbose(`[WebflowIntegration] Form submission intercepted: ${formId}`);

        // Perform our final validation
        const isValid = performFinalValidation(form);

        if (!isValid) {
          logVerbose(`[WebflowIntegration] Validation failed, blocking submission: ${formId}`);
          event.preventDefault();
          return false;
        }

        logVerbose(`[WebflowIntegration] Validation passed, allowing submission: ${formId}`);
        return true;
      });
    });
  });
}

/**
 * Perform final validation before form submission
 */
function performFinalValidation(form: HTMLFormElement): boolean {
  logVerbose('[WebflowIntegration] Performing final validation');

  // Clear any existing errors first
  clearAllFormErrors(form);

  // Get all required fields in the entire form (not just current step)
  const requiredFields = form.querySelectorAll('input[required], select[required], textarea[required]');
  
  if (requiredFields.length === 0) {
    logVerbose('[WebflowIntegration] No required fields found, validation passed');
    return true;
  }

  logVerbose(`[WebflowIntegration] Validating ${requiredFields.length} required fields`);

  let hasErrors = false;
  const errors: { field: HTMLElement; message: string }[] = [];

  // Validate each required field
  requiredFields.forEach((field) => {
    const input = field as HTMLInputElement;
    const fieldName = input.name || input.id || 'unnamed';
    const value = getFieldValue(input);

    if (isFieldEmpty(value)) {
      const errorMessage = getCustomErrorMessage(input) || 'This field is required';
      errors.push({ field: input, message: errorMessage });
      hasErrors = true;
      
      logVerbose(`[WebflowIntegration] Required field is empty: ${fieldName}`);
    } else {
      logVerbose(`[WebflowIntegration] Required field is valid: ${fieldName}`);
    }
  });

  // Show errors if any
  if (hasErrors) {
    logVerbose(`[WebflowIntegration] Validation failed - ${errors.length} fields with errors`);
    
    errors.forEach(({ field, message }) => {
      const fieldName = (field as HTMLInputElement).name || field.id || 'unknown';
      showError(fieldName, message);
    });

    // Focus first error field
    if (errors.length > 0) {
      focusField(errors[0].field);
    }

    return false;
  }

  logVerbose('[WebflowIntegration] All fields validated successfully');
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
 * Get integration status
 */
export function getWebflowIntegrationStatus(): {
  initialized: boolean;
  webflowAvailable: boolean;
  formsRegistered: number;
} {
  return {
    initialized: webflowInitialized,
    webflowAvailable: isWebflowAvailable(),
    formsRegistered: formElements.size
  };
}