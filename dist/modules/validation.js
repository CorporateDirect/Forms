/**
 * Form validation module with branch awareness
 */
import { SELECTORS, DEFAULTS } from '../config.js';
import { logVerbose, queryAllByAttr, queryByAttr, getAttrValue, delegateEvent, debounce, getInputValue, isFormInput } from './utils.js';
import { FormState } from './formState.js';
import { showError, clearError } from './errors.js';
let initialized = false;
let cleanupFunctions = [];
let fieldValidations = new Map();
/**
 * Initialize validation functionality
 */
export function initValidation(root = document) {
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
function setupFieldValidations(inputs) {
    inputs.forEach(input => {
        if (!isFormInput(input))
            return;
        const htmlInput = input;
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
            element: input,
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
function extractValidationRules(input) {
    const rules = [];
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
function setupValidationListeners(root) {
    // Real-time validation on input (debounced)
    const debouncedValidation = debounce((...args) => {
        handleFieldValidation(args[0], args[1]);
    }, DEFAULTS.VALIDATION_DELAY);
    const cleanup1 = delegateEvent(root, 'input', 'input, select, textarea', debouncedValidation);
    // Validation on blur
    const cleanup2 = delegateEvent(root, 'blur', 'input, select, textarea', handleFieldValidation);
    // Validation on change
    const cleanup3 = delegateEvent(root, 'change', 'input, select, textarea', handleFieldValidation);
    cleanupFunctions.push(cleanup1, cleanup2, cleanup3);
}
/**
 * Handle field validation events
 */
function handleFieldValidation(event, target) {
    if (!isFormInput(target))
        return;
    const htmlTarget = target;
    const fieldName = htmlTarget.name || getAttrValue(target, 'data-step-field-name');
    if (!fieldName) {
        logVerbose('Skipping validation - no field name found', {
            element: target,
            name: htmlTarget.name,
            dataStepFieldName: getAttrValue(target, 'data-step-field-name')
        });
        return;
    }
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
export function validateField(fieldName) {
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
    const value = getInputValue(input);
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
};
/**
 * Validate a single rule
 */
function validateRule(value, rule) {
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
            if (typeof rule.value !== 'number')
                return { isValid: true };
            return {
                isValid: String(value).length >= rule.value,
                message: rule.message || `Minimum ${rule.value} characters required`
            };
        case 'max':
            if (typeof rule.value !== 'number')
                return { isValid: true };
            return {
                isValid: String(value).length <= rule.value,
                message: rule.message || `Maximum ${rule.value} characters allowed`
            };
        case 'pattern':
            if (!(rule.value instanceof RegExp))
                return { isValid: true };
            return {
                isValid: rule.value.test(String(value)),
                message: rule.message || 'Please enter a valid format'
            };
        case 'custom':
            if (!rule.validator)
                return { isValid: true };
            try {
                return {
                    isValid: rule.validator(value),
                    message: rule.message || 'Invalid value'
                };
            }
            catch (error) {
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
function updateFieldVisualState(input, isValid, errorMessage) {
    const fieldName = input.name || getAttrValue(input, 'data-step-field-name');
    if (!fieldName)
        return;
    if (!isValid) {
        showError(fieldName, errorMessage);
    }
    else {
        clearError(fieldName);
    }
}
/**
 * Validate a specific step
 */
export function validateStep(stepId) {
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
        if (!isFormInput(input))
            return;
        const fieldName = input.name || getAttrValue(input, 'data-step-field-name');
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
export function validateAllVisibleFields() {
    logVerbose('Validating all visible fields');
    let allValid = true;
    const validationResults = {};
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
export function clearFieldValidation(fieldName) {
    const fieldValidation = fieldValidations.get(fieldName);
    if (!fieldValidation)
        return;
    fieldValidation.isValid = true;
    fieldValidation.errorMessage = undefined;
    updateFieldVisualState(fieldValidation.element, true);
    logVerbose(`Cleared validation for field: ${fieldName}`);
}
/**
 * Clear validation errors for all fields
 */
export function clearAllValidation() {
    logVerbose('Clearing all field validation');
    fieldValidations.forEach((validation, fieldName) => {
        clearFieldValidation(fieldName);
    });
}
/**
 * Add custom validation rule to a field
 */
export function addCustomValidation(fieldName, validator, message) {
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
export function getValidationState() {
    return {
        initialized,
        fieldValidations: Array.from(fieldValidations.entries()).reduce((acc, [key, value]) => {
            acc[key] = {
                isValid: value.isValid,
                errorMessage: value.errorMessage,
                rules: value.rules.map(r => r.type)
            };
            return acc;
        }, {})
    };
}
/**
 * Reset validation state and cleanup
 */
function resetValidation() {
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
//# sourceMappingURL=validation.js.map