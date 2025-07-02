/**
 * Form validation module with branch awareness
 */

import { SELECTORS, DEFAULTS, CSS_CLASSES } from '../config.js';
import { 
  logVerbose, 
  queryAllByAttr, 
  queryByAttr, 
  getAttrValue, 
  delegateEvent,
  debounce,
  getInputValue,
  isFormInput,
  addClass,
  removeClass,
  isVisible
} from './utils.js';
import { FormState } from './formState.js';

interface ValidationRule {
  type: 'required' | 'email' | 'phone' | 'min' | 'max' | 'pattern' | 'custom';
  value?: any;
  message?: string;
  validator?: (value: any) => boolean;
}

interface FieldValidation {
  element: HTMLElement;
  rules: ValidationRule[];
  isValid: boolean;
  errorMessage?: string;
}

let initialized = false;
let cleanupFunctions: (() => void)[] = [];
let fieldValidations: Map<string, FieldValidation> = new Map();

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
  setupValidationListeners(root);

  initialized = true;
  logVerbose('Validation initialization complete');
}

/**
 * Set up validation rules for form inputs
 */
function setupFieldValidations(inputs: NodeListOf<Element>): void {
  inputs.forEach(input => {
    if (!isFormInput(input)) return;

    const fieldName = input.name || getAttrValue(input, 'data-step-field-name');
    if (!fieldName) return;

    const rules = extractValidationRules(input);
    if (rules.length === 0) return;

    fieldValidations.set(fieldName, {
      element: input as HTMLElement,
      rules,
      isValid: true
    });

    logVerbose(`Validation rules set for field: ${fieldName}`, rules);
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
 * Set up validation event listeners
 */
function setupValidationListeners(root: Document | Element): void {
  // Real-time validation on input (debounced)
  const debouncedValidation = debounce(handleFieldValidation, DEFAULTS.VALIDATION_DELAY);
  
  const cleanup1 = delegateEvent(
    root,
    'input',
    'input, select, textarea',
    debouncedValidation
  );

  // Validation on blur
  const cleanup2 = delegateEvent(
    root,
    'blur',
    'input, select, textarea',
    handleFieldValidation
  );

  // Validation on change
  const cleanup3 = delegateEvent(
    root,
    'change',
    'input, select, textarea',
    handleFieldValidation
  );

  cleanupFunctions.push(cleanup1, cleanup2, cleanup3);
}

/**
 * Handle field validation events
 */
function handleFieldValidation(event: Event, target: Element): void {
  if (!isFormInput(target)) return;

  const fieldName = target.name || getAttrValue(target, 'data-step-field-name');
  if (!fieldName) return;

  // Check if field is in visible step
  const stepElement = target.closest(SELECTORS.STEP);
  if (stepElement) {
    const stepId = getAttrValue(stepElement, 'data-answer');
    
    if (stepId && !FormState.isStepVisible(stepId)) {
      logVerbose(`Skipping validation for field in hidden step: ${fieldName}`);
      return;
    }
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
  const value = getInputValue(input as HTMLInputElement);

  logVerbose(`Validating field: ${fieldName}`, { value });

  // Run all validation rules
  let isValid = true;
  let errorMessage = '';

  for (const rule of fieldValidation.rules) {
    const ruleResult = validateRule(value, rule);
    if (!ruleResult.isValid) {
      isValid = false;
      errorMessage = ruleResult.message || 'Validation failed';
      break; // Stop at first failed rule
    }
  }

  // Update field validation state
  fieldValidation.isValid = isValid;
  fieldValidation.errorMessage = errorMessage;

  // Update visual state
  updateFieldVisualState(input, isValid, errorMessage);

  // Update FormState
  FormState.setField(fieldName, value);

  logVerbose(`Field validation result: ${fieldName}`, {
    isValid,
    errorMessage,
    value
  });

  return isValid;
}

/**
 * Validate a single rule
 */
function validateRule(value: any, rule: ValidationRule): { isValid: boolean; message?: string } {
  switch (rule.type) {
    case 'required':
      const isEmpty = value === '' || value === null || value === undefined ||
                     (Array.isArray(value) && value.length === 0);
      return {
        isValid: !isEmpty,
        message: rule.message
      };

    case 'email':
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return {
        isValid: !value || emailRegex.test(String(value)),
        message: rule.message
      };

    case 'phone':
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
      return {
        isValid: !value || phoneRegex.test(String(value).replace(/\D/g, '')),
        message: rule.message
      };

    case 'min':
      return {
        isValid: !value || String(value).length >= rule.value,
        message: rule.message
      };

    case 'max':
      return {
        isValid: !value || String(value).length <= rule.value,
        message: rule.message
      };

    case 'pattern':
      return {
        isValid: !value || rule.value.test(String(value)),
        message: rule.message
      };

    case 'custom':
      return {
        isValid: !rule.validator || rule.validator(value),
        message: rule.message
      };

    default:
      return { isValid: true };
  }
}

/**
 * Update field visual state based on validation
 */
function updateFieldVisualState(input: HTMLElement, isValid: boolean, errorMessage?: string): void {
  // Update field styling
  if (isValid) {
    removeClass(input, CSS_CLASSES.ERROR_FIELD);
  } else {
    addClass(input, CSS_CLASSES.ERROR_FIELD);
  }

  // Update error message display
  const errorElement = findOrCreateErrorElement(input);
  if (errorElement) {
    if (isValid) {
      errorElement.textContent = '';
      errorElement.style.display = 'none';
    } else {
      errorElement.textContent = errorMessage || 'Validation failed';
      errorElement.style.display = 'block';
    }
  }
}

/**
 * Find or create error message element
 */
function findOrCreateErrorElement(input: HTMLElement): HTMLElement | null {
  const fieldName = (input as HTMLInputElement).name || getAttrValue(input, 'data-step-field-name');
  if (!fieldName) return null;

  // Look for existing error element
  let errorElement = input.parentElement?.querySelector(`.${CSS_CLASSES.ERROR_MESSAGE}[data-field="${fieldName}"]`) as HTMLElement;
  
  if (!errorElement) {
    // Create new error element
    errorElement = document.createElement('div');
    errorElement.className = CSS_CLASSES.ERROR_MESSAGE;
    errorElement.setAttribute('data-field', fieldName);
    errorElement.style.color = 'red';
    errorElement.style.fontSize = '0.875em';
    errorElement.style.marginTop = '0.25rem';
    errorElement.style.display = 'none';
    
    // Insert after the input
    input.parentElement?.insertBefore(errorElement, input.nextSibling);
  }

  return errorElement;
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
  if (!FormState.isStepVisible(stepId)) {
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
      
      if (stepId && !FormState.isStepVisible(stepId)) {
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
  validator: (value: any) => boolean, 
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
export function getValidationState(): any {
  const state: any = {
    initialized,
    totalFields: fieldValidations.size,
    validFields: 0,
    invalidFields: 0,
    fields: {}
  };

  fieldValidations.forEach((validation, fieldName) => {
    state.fields[fieldName] = {
      isValid: validation.isValid,
      errorMessage: validation.errorMessage,
      rulesCount: validation.rules.length
    };

    if (validation.isValid) {
      state.validFields++;
    } else {
      state.invalidFields++;
    }
  });

  return state;
}

/**
 * Reset validation state and cleanup
 */
function resetValidation(): void {
  logVerbose('Resetting validation');

  // Clean up event listeners
  cleanupFunctions.forEach(cleanup => cleanup());
  cleanupFunctions = [];

  // Clear all validation states
  clearAllValidation();

  // Reset field validations
  fieldValidations.clear();

  initialized = false;
  logVerbose('Validation reset complete');
} 