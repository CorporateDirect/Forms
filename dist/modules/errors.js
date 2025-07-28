/**
 * Error handling and display module
 */
import { CSS_CLASSES, SELECTORS } from '../config.js';
import { logVerbose, getAttrValue, addClass, removeClass } from './utils.js';
import { formEvents } from './events.js';
let errorConfigs = new Map();
let errorStates = new Map();
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
    formEvents.registerModule('errors');
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
        // ALWAYS add active-error class to show the element
        addClass(errorElement, CSS_CLASSES.ACTIVE_ERROR);
        config.errorElement = errorElement;
        logVerbose(`Error element activated for field: ${fieldName}`, {
            elementVisible: errorElement.offsetParent !== null,
            hasActiveClass: errorElement.classList.contains(CSS_CLASSES.ACTIVE_ERROR)
        });
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
        removeClass(config.errorElement, CSS_CLASSES.ACTIVE_ERROR);
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
 * ENHANCED: Automatically detects existing .form_error-message elements and uses their custom text
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
    // Look for existing error element in form-field_wrapper structure
    let errorElement = null;
    // ENHANCED: First, try to find existing .form_error-message in field wrapper
    const fieldWrapper = config.element.closest('.form-field_wrapper');
    if (fieldWrapper) {
        // Look for .form_error-message first (our standard)
        errorElement = fieldWrapper.querySelector('.form_error-message');
        // If found, extract custom message text and store it
        if (errorElement && errorElement.textContent && errorElement.textContent.trim() !== '') {
            const customText = errorElement.textContent.trim();
            // Don't use generic placeholder text
            if (!customText.includes('This is some text inside of a div block')) {
                config.customMessage = customText;
                logVerbose(`Found custom error message for field: ${config.fieldName}`, { customText });
            }
        }
        // Fallback: Look for data-form="error" attribute
        if (!errorElement) {
            errorElement = fieldWrapper.querySelector('[data-form="error"]');
        }
    }
    // ENHANCED: If no wrapper, look for .form_error-message near the input
    if (!errorElement) {
        // Try to find .form_error-message as sibling or in parent
        const parentElement = config.element.parentElement;
        errorElement = parentElement.querySelector('.form_error-message');
        // Extract custom message if found
        if (errorElement && errorElement.textContent && errorElement.textContent.trim() !== '') {
            const customText = errorElement.textContent.trim();
            if (!customText.includes('This is some text inside of a div block')) {
                config.customMessage = customText;
                logVerbose(`Found custom error message for field: ${config.fieldName}`, { customText });
            }
        }
    }
    // Fallback: Look for existing error element by field name (legacy support)
    if (!errorElement) {
        try {
            errorElement = config.element.parentElement.querySelector(`${SELECTORS.ERROR_DISPLAY}[data-field="${config.fieldName}"]`);
        }
        catch (error) {
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
            }
            else {
                config.element.parentElement.insertBefore(errorElement, config.element.nextSibling);
            }
            logVerbose(`Created new error element for field: ${config.fieldName}`);
        }
        catch (error) {
            logVerbose(`Failed to create error element for field: ${config.fieldName}`, error);
            return null;
        }
    }
    else {
        logVerbose(`Found existing error element for field: ${config.fieldName}`, {
            className: errorElement.className,
            hasCustomMessage: !!config.customMessage
        });
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
        totalErrors: fieldsWithErrors.length,
        fieldsWithErrors,
        hasErrors: fieldsWithErrors.length > 0
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
 * Get current error state for debugging
 */
export function getErrorState() {
    const state = {};
    errorStates.forEach((value, key) => {
        state[key] = {
            message: value.message
        };
    });
    return state;
}
//# sourceMappingURL=errors.js.map