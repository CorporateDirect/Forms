/**
 * Error handling and display module
 */
import { CSS_CLASSES, SELECTORS } from '../config.js';
import { logVerbose, getAttrValue, addClass, removeClass } from './utils.js';
import { formEvents } from './events.js';
let errorConfigs = new Map();
let errorStates = new Map();
let cssInjected = false;
// V1.7.0 WEBFLOW HARMONY: Removed nuclear CSS approach
// Now following Webflow's official patterns for elegant integration
/**
 * Inject required CSS for error visibility
 */
function injectErrorCSS() {
    if (cssInjected) {
        return;
    }
    const css = `
    /* Form Library Error Message Styles - Auto-injected v1.5.10 - Nuclear CSS Override */
    .form_error-message {
      display: none !important;
      opacity: 0 !important;
      visibility: hidden !important;
      transition: all 0.2s ease-in-out !important;
    }

    /* Ultra-aggressive CSS overrides for Webflow */
    .form_error-message.active-error,
    div.form_error-message.active-error,
    .form-field_wrapper .form_error-message.active-error,
    .w-form .form_error-message.active-error {
      display: block !important;
      opacity: 1 !important;
      visibility: visible !important;
      color: #e74c3c !important;
      font-size: 0.875rem !important;
      margin-top: 0.25rem !important;
      line-height: 1.4 !important;
      animation: errorAppear 0.2s ease-out !important;
      height: auto !important;
      max-height: none !important;
      overflow: visible !important;
      position: relative !important;
      z-index: 1000 !important;
      /* Nuclear-level Webflow overrides */
      width: auto !important;
      min-height: 1rem !important;
      padding: 0.25rem 0 !important;
      margin-bottom: 0.25rem !important;
      background: transparent !important;
      border: none !important;
      box-shadow: none !important;
      transform: none !important;
      clip: auto !important;
      clip-path: none !important;
      white-space: normal !important;
      font-weight: 400 !important;
      text-transform: none !important;
      letter-spacing: normal !important;
      text-align: left !important;
      left: auto !important;
      right: auto !important;
      top: auto !important;
      bottom: auto !important;
      float: none !important;
      clear: none !important;
      content: normal !important;
    }

    /* Error field styling - Enhanced red borders */
    input.error-field,
    select.error-field,
    textarea.error-field,
    .form_input.error-field {
      border: 2px solid #e74c3c !important;
      box-shadow: 0 0 0 3px rgba(231, 76, 60, 0.1) !important;
      background-color: rgba(231, 76, 60, 0.02) !important;
      transition: all 0.2s ease-in-out !important;
    }

    input.error-field:focus,
    select.error-field:focus,
    textarea.error-field:focus,
    .form_input.error-field:focus {
      border-color: #c0392b !important;
      box-shadow: 0 0 0 3px rgba(231, 76, 60, 0.2) !important;
      outline: none !important;
    }

    .form-field_wrapper.error-field {
      position: relative;
    }

    @keyframes errorAppear {
      from {
        opacity: 0 !important;
        transform: translateY(-5px) !important;
      }
      to {
        opacity: 1 !important;
        transform: translateY(0) !important;
      }
    }
  `;
    // Create and inject style element
    const styleElement = document.createElement('style');
    styleElement.setAttribute('data-form-lib', 'error-styles');
    styleElement.textContent = css;
    document.head.appendChild(styleElement);
    cssInjected = true;
    logVerbose('📦 [Errors] CSS auto-injected for error visibility');
}
/**
 * Initialize error handling
 */
export function initErrors(root = document) {
    logVerbose('Initializing error handling');
    // Inject required CSS for error visibility
    injectErrorCSS();
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
        // V1.7.3 ROBUST FIX: Find error element in multiple possible locations
        const visibleStep = document.querySelector('.step_wrapper[style*="flex"]');
        const fieldInput = visibleStep?.querySelector(`input[name="${config.element.getAttribute('name')}"]`);
        let currentStepErrorElement = null;
        if (fieldInput) {
            // Try same parent first
            currentStepErrorElement = fieldInput.parentElement?.querySelector('.form_error-message[data-form="required"]');
            // Try grandparent if not found in parent
            if (!currentStepErrorElement) {
                currentStepErrorElement = fieldInput.parentElement?.parentElement?.querySelector('.form_error-message[data-form="required"]');
            }
            // Try sibling if not found in parent or grandparent
            if (!currentStepErrorElement) {
                currentStepErrorElement = fieldInput.parentElement?.nextElementSibling?.querySelector?.('.form_error-message[data-form="required"]');
            }
            // Fallback: try any .form_error-message with data-form="required" near the field
            if (!currentStepErrorElement) {
                currentStepErrorElement = fieldInput.closest('.form-field_wrapper, .multi-form_input-field, .form_input-phone-wrapper')?.querySelector('.form_error-message[data-form="required"]');
            }
        }
        const actualErrorElement = (currentStepErrorElement || errorElement);
        // V1.7.0 WEBFLOW HARMONY: Follow Webflow's official error display pattern
        // Simple, elegant approach that works WITH Webflow's system
        // Use !important to override Webflow's CSS specificity
        actualErrorElement.style.setProperty('display', 'block', 'important');
        // Optional: Add basic styling that doesn't conflict with Webflow
        if (!actualErrorElement.style.color) {
            actualErrorElement.style.color = '#e74c3c';
        }
        if (!actualErrorElement.style.fontSize) {
            actualErrorElement.style.fontSize = '0.875rem';
        }
        if (!actualErrorElement.style.marginTop) {
            actualErrorElement.style.marginTop = '0.25rem';
        }
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
        // V1.7.0 WEBFLOW HARMONY: Simple, clean error clearing
        // Use !important to ensure proper hiding
        config.errorElement.style.setProperty('display', 'none', 'important');
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
        // PRIORITY 1: Look for data-form="required" elements first (new standardized approach)
        errorElement = fieldWrapper.querySelector('[data-form="required"]');
        // If found, extract custom message text and store it
        if (errorElement && errorElement.textContent && errorElement.textContent.trim() !== '') {
            const customText = errorElement.textContent.trim();
            config.customMessage = customText;
            logVerbose(`Found custom required error message for field: ${config.fieldName}`, { customText });
        }
        // PRIORITY 2: Look for .form_error-message (legacy support)
        if (!errorElement) {
            errorElement = fieldWrapper.querySelector('.form_error-message');
            // If found, extract custom message text and store it
            if (errorElement && errorElement.textContent && errorElement.textContent.trim() !== '') {
                const customText = errorElement.textContent.trim();
                config.customMessage = customText;
                logVerbose(`Found custom error message for field: ${config.fieldName}`, { customText });
            }
        }
        // Fallback: Look for data-form="error" attribute
        if (!errorElement) {
            errorElement = fieldWrapper.querySelector('[data-form="error"]');
        }
    }
    // ENHANCED: If no wrapper, look for error elements near the input
    if (!errorElement) {
        const parentElement = config.element.parentElement;
        // PRIORITY 1: Look for data-form="required" elements (new standardized approach)
        errorElement = parentElement.querySelector('[data-form="required"]');
        // If found, extract custom message text and store it
        if (errorElement && errorElement.textContent && errorElement.textContent.trim() !== '') {
            const customText = errorElement.textContent.trim();
            config.customMessage = customText;
            logVerbose(`Found custom required error message for field: ${config.fieldName}`, { customText });
        }
        // PRIORITY 2: Try to find .form_error-message as sibling or in parent (legacy support)
        if (!errorElement) {
            errorElement = parentElement.querySelector('.form_error-message');
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