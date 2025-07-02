/**
 * Error handling and display module
 */
import { CSS_CLASSES } from '../config.js';
import { logVerbose, getAttrValue, addClass, removeClass } from './utils.js';
let errorConfigs = new Map();
/**
 * Initialize error handling
 */
export function initErrors(root = document) {
    logVerbose('Initializing error handling');
    // Find all form inputs and set up error configurations
    const inputs = root.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        const fieldName = input.name ||
            getAttrValue(input, 'data-step-field-name');
        if (fieldName) {
            errorConfigs.set(fieldName, {
                fieldName,
                element: input,
                customMessage: getAttrValue(input, 'data-error-message') || undefined
            });
        }
    });
    logVerbose(`Error handling initialized for ${errorConfigs.size} fields`);
}
/**
 * Show error for a specific field
 */
export function showError(fieldName, message) {
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
        errorElement.style.display = 'block';
        config.errorElement = errorElement;
    }
    // Scroll to field if it's not visible
    scrollToFieldIfNeeded(config.element);
}
/**
 * Clear error for a specific field
 */
export function clearError(fieldName) {
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
        config.errorElement.style.display = 'none';
    }
}
/**
 * Clear all errors
 */
export function clearAllErrors() {
    logVerbose('Clearing all field errors');
    errorConfigs.forEach((config, fieldName) => {
        clearError(fieldName);
    });
}
/**
 * Show multiple errors at once
 */
export function showErrors(errors) {
    logVerbose('Showing multiple errors', errors);
    Object.entries(errors).forEach(([fieldName, message]) => {
        showError(fieldName, message);
    });
}
/**
 * Check if a field has an error
 */
export function hasError(fieldName) {
    const config = errorConfigs.get(fieldName);
    if (!config)
        return false;
    return config.element.classList.contains(CSS_CLASSES.ERROR_FIELD);
}
/**
 * Get all fields with errors
 */
export function getFieldsWithErrors() {
    const fieldsWithErrors = [];
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
export function setCustomErrorMessage(fieldName, message) {
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
function findOrCreateErrorElement(config) {
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
    let errorElement = null;
    try {
        errorElement = config.element.parentElement.querySelector(`.${CSS_CLASSES.ERROR_MESSAGE}[data-field="${config.fieldName}"]`);
    }
    catch (error) {
        logVerbose(`Error finding existing error element for field: ${config.fieldName}`, error);
        return null;
    }
    if (!errorElement) {
        try {
            // Create new error element
            errorElement = document.createElement('div');
            errorElement.className = CSS_CLASSES.ERROR_MESSAGE;
            errorElement.setAttribute('data-field', config.fieldName);
            errorElement.style.color = 'red';
            errorElement.style.fontSize = '0.875em';
            errorElement.style.marginTop = '0.25rem';
            errorElement.style.display = 'none';
            // Insert after the input
            const parent = config.element.parentElement;
            const nextSibling = config.element.nextSibling;
            if (nextSibling) {
                parent.insertBefore(errorElement, nextSibling);
            }
            else {
                parent.appendChild(errorElement);
            }
            logVerbose(`Created error element for field: ${config.fieldName}`);
        }
        catch (error) {
            logVerbose(`Error creating error element for field: ${config.fieldName}`, error);
            return null;
        }
    }
    return errorElement;
}
/**
 * Scroll to field if it's not in viewport
 */
function scrollToFieldIfNeeded(element) {
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
        logVerbose(`Scrolled to field with error: ${element.name || 'unnamed'}`);
    }
}
/**
 * Highlight field with error (alternative to standard error styling)
 */
export function highlightFieldError(fieldName, highlightClass = 'field-highlight') {
    const config = errorConfigs.get(fieldName);
    if (!config)
        return;
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
export function focusFirstError() {
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
export function getErrorStats() {
    const fieldsWithErrors = getFieldsWithErrors();
    return {
        totalFields: errorConfigs.size,
        fieldsWithErrors: fieldsWithErrors.length,
        fieldsWithoutErrors: errorConfigs.size - fieldsWithErrors.length,
        errorFields: fieldsWithErrors
    };
}
/**
 * Reset error handling
 */
export function resetErrors() {
    logVerbose('Resetting error handling');
    // Clear all errors
    clearAllErrors();
    // Clear configurations
    errorConfigs.clear();
    logVerbose('Error handling reset complete');
}
/**
 * Get error state for debugging
 */
export function getErrorState() {
    const fieldsWithErrors = getFieldsWithErrors();
    const state = {
        totalFields: errorConfigs.size,
        fieldsWithErrors: fieldsWithErrors.length,
        errors: {}
    };
    fieldsWithErrors.forEach(fieldName => {
        const config = errorConfigs.get(fieldName);
        state.errors[fieldName] = {
            message: config?.errorElement?.textContent || 'Unknown error',
            customMessage: config?.customMessage
        };
    });
    return state;
}
//# sourceMappingURL=errors.js.map