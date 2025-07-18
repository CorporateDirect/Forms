/**
 * Form validation module with branch awareness
 */

import { SELECTORS, DEFAULTS } from '../config.js';
import { 
  logVerbose, 
  queryAllByAttr, 
  queryByAttr, 
  getAttrValue, 
  debounce,
  getInputValue,
  isFormInput,
  isVisible
} from './utils.js';
import { showError, clearError } from './errors.js';
import { formEvents } from './events.js';

interface ValidationRule {
  type: 'required' | 'email' | 'phone' | 'min' | 'max' | 'pattern' | 'custom';
  value?: string | number | RegExp;
  message?: string;
  validator?: (value: string | string[]) => boolean;
}

interface FieldValidation {
  element: HTMLElement;
  rules: ValidationRule[];
  isValid: boolean;
  errorMessage?: string;
}

let initialized = false;
let eventCleanupFunctions: (() => void)[] = [];
let fieldValidations: Map<string, FieldValidation> = new Map();
let navigatedSteps: Set<string> = new Set(); // Track navigated steps locally

/**
 * Initialize validation functionality
 */
export function initValidation(root: Document | Element = document): void {
  if (initialized) {
    logVerbose('Validation already initialized, cleaning up first');
    resetValidation();
  }

  logVerbose('Initializing form validation');

  // Find all form inputs
  const formInputs = queryAllByAttr('input, select, textarea', root);
  logVerbose(`Found ${formInputs.length} form inputs`);

  // Set up validation rules for each input
  setupFieldValidations(formInputs);

  // Set up event listeners
  setupValidationEventListeners();

  initialized = true;
  formEvents.registerModule('validation');
  logVerbose('Validation initialization complete');
}

/**
 * Set up validation rules for form inputs
 */
function setupFieldValidations(inputs: NodeListOf<Element>): void {
  inputs.forEach(input => {
    if (!isFormInput(input)) return;

    const htmlInput = input as HTMLInputElement;
    const fieldName = htmlInput.name || getAttrValue(input, 'data-step-field-name');
    if (!fieldName) {
      logVerbose('Skipping field validation setup - no field name', {
        element: input,
        name: htmlInput.name,
        dataStepFieldName: getAttrValue(input, 'data-step-field-name'),
        id: htmlInput.id,
        type: htmlInput.type
      });
      return;
    }

    const rules = extractValidationRules(input);
    if (rules.length === 0) {
      logVerbose(`No validation rules found for field: ${fieldName}`);
      return;
    }

    fieldValidations.set(fieldName, {
      element: input as HTMLElement,
      rules,
      isValid: true
    });

    logVerbose(`Validation rules set for field: ${fieldName}`, { 
      rules: rules.map(r => r.type),
      rulesCount: rules.length 
    });
  });
}

/**
 * Extract validation rules from input element
 */
function extractValidationRules(input: Element): ValidationRule[] {
  const rules: ValidationRule[] = [];

  // Required validation
  if (input.hasAttribute('required')) {
    rules.push({
      type: 'required',
      message: getAttrValue(input, 'data-error-message') || 'This field is required'
    });
  }

  // Email validation
  if (input instanceof HTMLInputElement && input.type === 'email') {
    rules.push({
      type: 'email',
      message: 'Please enter a valid email address'
    });
  }

  // Phone validation
  if (input instanceof HTMLInputElement && input.type === 'tel') {
    rules.push({
      type: 'phone',
      message: 'Please enter a valid phone number'
    });
  }

  // Min length validation
  const minLength = getAttrValue(input, 'minlength');
  if (minLength) {
    rules.push({
      type: 'min',
      value: parseInt(minLength),
      message: `Minimum ${minLength} characters required`
    });
  }

  // Max length validation
  const maxLength = getAttrValue(input, 'maxlength');
  if (maxLength) {
    rules.push({
      type: 'max',
      value: parseInt(maxLength),
      message: `Maximum ${maxLength} characters allowed`
    });
  }

  // Pattern validation
  const pattern = getAttrValue(input, 'pattern');
  if (pattern) {
    rules.push({
      type: 'pattern',
      value: new RegExp(pattern),
      message: 'Please enter a valid format'
    });
  }

  return rules;
}

/**
 * Set up validation event listeners - UPDATED to track navigation
 */
function setupValidationEventListeners(): void {
  // Listen to centralized field events instead of direct DOM events
  const cleanup1 = formEvents.on('field:input', (data) => {
    // Apply debouncing to input events
    debounce(() => handleFieldValidationEvent(data), DEFAULTS.VALIDATION_DELAY)();
  });
  const cleanup2 = formEvents.on('field:blur', handleFieldValidationEvent);
  const cleanup3 = formEvents.on('field:change', handleFieldValidationEvent);

  // NEW: Listen to step changes to track navigated steps
  const cleanup4 = formEvents.on('step:change', (data) => {
    if (data.currentStepId) {
      navigatedSteps.add(data.currentStepId);
      logVerbose(`Validation: Step ${data.currentStepId} marked as navigated`, {
        totalNavigatedSteps: navigatedSteps.size,
        navigatedStepsList: Array.from(navigatedSteps)
      });
    }
  });

  eventCleanupFunctions.push(cleanup1, cleanup2, cleanup3, cleanup4);
  
  logVerbose('Validation module subscribed to centralized field and step events');
}

/**
 * Handle field validation events - UPDATED to only validate navigated steps
 */
function handleFieldValidationEvent(data: { fieldName: string; value: string | string[]; element: HTMLElement; eventType: string }): void {
  const { fieldName, element } = data;
  
  if (!fieldName) {
    logVerbose('Skipping validation - no field name found', {
      element,
      eventType: data.eventType
    });
    return;
  }

  // NEW: Check if field is in a step that has been navigated to
  const stepWrapper = element.closest('.step_wrapper[data-answer]');
  if (stepWrapper) {
    const stepId = getAttrValue(stepWrapper, 'data-answer');
    
    if (stepId && !navigatedSteps.has(stepId)) {
      logVerbose(`Skipping validation for field in non-navigated step: ${fieldName}`, {
        stepId,
        navigatedSteps: Array.from(navigatedSteps),
        fieldInNavigatedStep: false
      });
      return;
    }
    
    logVerbose(`Validating field in navigated step: ${fieldName}`, {
      stepId,
      navigatedSteps: Array.from(navigatedSteps),
      fieldInNavigatedStep: true
    });
  }

  validateField(fieldName);
}

/**
 * Validate a specific field
 */
export function validateField(fieldName: string): boolean {
  const fieldValidation = fieldValidations.get(fieldName);
  if (!fieldValidation) {
    logVerbose(`No validation rules found for field: ${fieldName}`);
    return true;
  }

  const input = fieldValidation.element;
  if (!input) {
    logVerbose(`No element found for field: ${fieldName}`);
    return true;
  }

  const value = getInputValue(input as HTMLInputElement);

  logVerbose(`Validating field: ${fieldName}`, { value, elementExists: !!input });

  for (const rule of fieldValidation.rules) {
    const { isValid, message } = validateRule(value, rule);
    if (!isValid) {
      fieldValidation.isValid = false;
      fieldValidation.errorMessage = message || 'Invalid field';
      showError(fieldName, fieldValidation.errorMessage);
      updateFieldVisualState(input, false, fieldValidation.errorMessage);
      return false;
    }
  }

  // All rules passed
  fieldValidation.isValid = true;
  clearError(fieldName);
  updateFieldVisualState(input, true);
  return true;
}

/**
 * Enhanced validation patterns for common use cases
 */
const VALIDATION_PATTERNS = {
  email: /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
  phone: /^[\+]?[1-9][\d]{0,15}$/, // International format
  phoneUS: /^(\+1\s?)?(\([0-9]{3}\)|[0-9]{3})[\s\-]?[0-9]{3}[\s\-]?[0-9]{4}$/, // US format
  url: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
  zipCode: /^\d{5}(-\d{4})?$/, // US ZIP code
  zipCodeCA: /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/, // Canadian postal code
  creditCard: /^(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|3[0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})$/, // Major credit cards
  ssn: /^\d{3}-?\d{2}-?\d{4}$/, // US SSN
  strongPassword: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/ // Strong password
} as const;

/**
 * Validate a single rule
 */
function validateRule(value: string | string[], rule: ValidationRule): { isValid: boolean; message?: string } {
  switch (rule.type) {
    case 'required':
      return { 
        isValid: Array.isArray(value) ? value.length > 0 : !!value && String(value).trim() !== '', 
        message: rule.message 
      };
    case 'email':
      // Enhanced email validation
      return { 
        isValid: VALIDATION_PATTERNS.email.test(String(value)), 
        message: rule.message || 'Please enter a valid email address'
      };
    case 'phone':
      // Enhanced phone validation with multiple formats
      const phoneValue = String(value).replace(/[\s\-\(\)]/g, ''); // Remove formatting
      const isValidPhone = VALIDATION_PATTERNS.phone.test(phoneValue) || VALIDATION_PATTERNS.phoneUS.test(String(value));
      return { 
        isValid: isValidPhone, 
        message: rule.message || 'Please enter a valid phone number'
      };
    case 'min':
      if (typeof rule.value !== 'number') return { isValid: true };
      return { 
        isValid: String(value).length >= rule.value, 
        message: rule.message || `Minimum ${rule.value} characters required`
      };
    case 'max':
      if (typeof rule.value !== 'number') return { isValid: true };
      return { 
        isValid: String(value).length <= rule.value, 
        message: rule.message || `Maximum ${rule.value} characters allowed`
      };
    case 'pattern':
      if (!(rule.value instanceof RegExp)) return { isValid: true };
      return { 
        isValid: rule.value.test(String(value)), 
        message: rule.message || 'Please enter a valid format'
      };
    case 'custom':
      if (!rule.validator) return { isValid: true };
      try {
        return { 
          isValid: rule.validator(value), 
          message: rule.message || 'Invalid value'
        };
      } catch (error) {
        logVerbose('Error in custom validator', { error, rule });
        return { isValid: false, message: 'Validation error occurred' };
      }
    default:
      return { isValid: true };
  }
}

/**
 * Update field visual state based on validation
 */
function updateFieldVisualState(input: HTMLElement, isValid: boolean, errorMessage?: string): void {
  const fieldName = (input as HTMLInputElement).name || getAttrValue(input, 'data-step-field-name');
  if (!fieldName) return;

  if (!isValid) {
    showError(fieldName, errorMessage);
  } else {
    clearError(fieldName);
  }
}

/**
 * Validate a specific step
 */
export function validateStep(stepId: string): boolean {
  const stepElement = queryByAttr(`[data-answer="${stepId}"]`);
  if (!stepElement) {
    logVerbose(`Step not found with data-answer="${stepId}"`);
    return true;
  }

  // Check if step is visible
  if (!isVisible(stepElement as HTMLElement)) {
    logVerbose(`Skipping validation for hidden step: ${stepId}`);
    return true;
  }

  logVerbose(`Validating step: ${stepId}`);

  const inputs = stepElement.querySelectorAll('input, select, textarea');
  let isStepValid = true;

  inputs.forEach(input => {
    if (!isFormInput(input)) return;

    const fieldName = (input as HTMLInputElement).name || getAttrValue(input, 'data-step-field-name');
    if (fieldName) {
      const isFieldValid = validateField(fieldName);
      if (!isFieldValid) {
        isStepValid = false;
      }
    }
  });

  logVerbose(`Step validation result: ${stepId}`, { isValid: isStepValid });
  return isStepValid;
}

/**
 * Validate all visible fields
 */
export function validateAllVisibleFields(): boolean {
  logVerbose('Validating all visible fields');

  let allValid = true;
  const validationResults: Record<string, boolean> = {};

  for (const [fieldName, fieldValidation] of fieldValidations) {
    // Check if field is in visible step
    const stepElement = fieldValidation.element.closest(SELECTORS.STEP);
    let shouldValidate = true;

    if (stepElement) {
      const stepId = getAttrValue(stepElement, 'data-answer');
      
      if (stepId && !isVisible(stepElement as HTMLElement)) {
        shouldValidate = false;
      }
    }

    if (shouldValidate) {
      const isValid = validateField(fieldName);
      validationResults[fieldName] = isValid;
      if (!isValid) {
        allValid = false;
      }
    }
  }

  logVerbose('All visible fields validation complete', {
    allValid,
    results: validationResults
  });

  return allValid;
}

/**
 * Clear validation errors for a field
 */
export function clearFieldValidation(fieldName: string): void {
  const fieldValidation = fieldValidations.get(fieldName);
  if (!fieldValidation) return;

  fieldValidation.isValid = true;
  fieldValidation.errorMessage = undefined;

  updateFieldVisualState(fieldValidation.element, true);
  logVerbose(`Cleared validation for field: ${fieldName}`);
}

/**
 * Clear validation errors for all fields
 */
export function clearAllValidation(): void {
  logVerbose('Clearing all field validation');

  fieldValidations.forEach((validation, fieldName) => {
    clearFieldValidation(fieldName);
  });
}

/**
 * Add custom validation rule to a field
 */
export function addCustomValidation(
  fieldName: string, 
  validator: (value: string | string[]) => boolean, 
  message: string
): void {
  const fieldValidation = fieldValidations.get(fieldName);
  if (!fieldValidation) {
    logVerbose(`Cannot add custom validation to unknown field: ${fieldName}`);
    return;
  }

  fieldValidation.rules.push({
    type: 'custom',
    validator,
    message
  });

  logVerbose(`Added custom validation to field: ${fieldName}`, { message });
}

/**
 * Get validation state for debugging
 */
export function getValidationState(): Record<string, unknown> {
  return {
    initialized,
    fieldValidations: Array.from(fieldValidations.entries()).reduce((acc, [key, value]) => {
      (acc as Record<string, unknown>)[key] = {
        isValid: value.isValid,
        errorMessage: value.errorMessage,
        rules: value.rules.map(r => r.type)
      };
      return acc;
    }, {} as Record<string, unknown>)
  };
}

/**
 * Reset validation state and cleanup - UPDATED to clear navigated steps
 */
function resetValidation(): void {
  logVerbose('Resetting validation');

  // Clean up event listeners
  eventCleanupFunctions.forEach(cleanup => cleanup());
  eventCleanupFunctions = [];

  // Clear all validation states
  clearAllValidation();

  // Reset field validations
  fieldValidations.clear();
  
  // Clear navigated steps tracking
  navigatedSteps.clear();

  initialized = false;
  logVerbose('Validation reset complete');
} 