/**
 * Utility functions for the form functionality library
 */
import { DEFAULTS } from '../config.js';
// Simple query cache to improve performance
const queryCache = new Map();
/**
 * Enhanced logging with consistent formatting
 */
export function logVerbose(message, data) {
    if (!DEFAULTS.DEBUG)
        return;
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    const prefix = `${DEFAULTS.LOG_PREFIX} [${timestamp}]`;
    if (data !== undefined) {
        console.log(`${prefix} ${message}`, data);
    }
    else {
        console.log(`${prefix} ${message}`);
    }
}
/**
 * Clear query cache (useful for dynamic content)
 */
export function clearQueryCache() {
    queryCache.clear();
}
/**
 * Query all elements by data attribute with caching
 */
export function queryAllByAttr(selector, root = document) {
    // Only cache document-level queries to avoid stale references
    if (root === document) {
        const cacheKey = `all:${selector}`;
        if (queryCache.has(cacheKey)) {
            return queryCache.get(cacheKey);
        }
        const result = root.querySelectorAll(selector);
        queryCache.set(cacheKey, result);
        return result;
    }
    return root.querySelectorAll(selector);
}
/**
 * Query single element by data attribute with caching
 */
export function queryByAttr(selector, root = document) {
    // Only cache document-level queries to avoid stale references
    if (root === document) {
        const cacheKey = `single:${selector}`;
        if (queryCache.has(cacheKey)) {
            return queryCache.get(cacheKey);
        }
        const result = root.querySelector(selector);
        queryCache.set(cacheKey, result);
        return result;
    }
    return root.querySelector(selector);
}
/**
 * Get attribute value from element
 */
export function getAttrValue(element, attribute) {
    return element.getAttribute(attribute);
}
/**
 * Set attribute value on element
 */
export function setAttrValue(element, attribute, value) {
    element.setAttribute(attribute, value);
}
/**
 * Remove attribute from element
 */
export function removeAttr(element, attribute) {
    element.removeAttribute(attribute);
}
/**
 * Check if element has attribute
 */
export function hasAttr(element, attribute) {
    return element.hasAttribute(attribute);
}
/**
 * Add CSS class to element
 */
export function addClass(element, className) {
    element.classList.add(className);
}
/**
 * Remove CSS class from element
 */
export function removeClass(element, className) {
    element.classList.remove(className);
}
/**
 * Toggle CSS class on element
 */
export function toggleClass(element, className, force) {
    element.classList.toggle(className, force);
}
/**
 * Check if element has CSS class
 */
export function hasClass(element, className) {
    return element.classList.contains(className);
}
/**
 * Show element (remove hidden-step class and restore display)
 */
export function showElement(element) {
    removeClass(element, 'hidden-step');
    // Get the original display value from data attribute or compute it
    const originalDisplay = element.getAttribute('data-original-display') || '';
    // If we have an original display value, use it; otherwise set to block as fallback
    if (originalDisplay && originalDisplay !== 'none') {
        element.style.setProperty('display', originalDisplay, 'important');
    }
    else {
        // Fallback to block, but check if it should be flex based on CSS classes
        const shouldBeFlex = element.classList.contains('flex') ||
            element.classList.contains('d-flex') ||
            element.classList.contains('step_wrapper') ||
            getComputedStyle(element).display === 'flex';
        element.style.setProperty('display', shouldBeFlex ? 'flex' : 'block', 'important');
    }
    // Force visibility for critical elements with !important
    element.style.setProperty('visibility', 'visible', 'important');
    element.style.setProperty('opacity', '1', 'important');
    console.log(`🔄 [Utils] Showing element:`, {
        element: element,
        tagName: element.tagName,
        id: element.id,
        className: element.className,
        originalDisplay: originalDisplay || 'none stored',
        currentDisplay: element.style.display,
        computedDisplay: getComputedStyle(element).display,
        computedVisibility: getComputedStyle(element).visibility,
        hasHiddenClass: element.classList.contains('hidden-step'),
        isVisible: isVisible(element)
    });
}
/**
 * Hide element (add hidden-step class and set display none)
 */
export function hideElement(element) {
    // Store the original display value before hiding
    const computedDisplay = getComputedStyle(element).display;
    if (computedDisplay && computedDisplay !== 'none') {
        element.setAttribute('data-original-display', computedDisplay);
    }
    addClass(element, 'hidden-step');
    element.style.setProperty('display', 'none', 'important');
    element.style.setProperty('visibility', 'hidden', 'important');
    element.style.setProperty('opacity', '0', 'important');
    console.log(`🔄 [Utils] Hiding element:`, {
        element: element,
        tagName: element.tagName,
        id: element.id,
        className: element.className,
        originalDisplay: computedDisplay,
        currentDisplay: element.style.display,
        computedDisplay: getComputedStyle(element).display,
        computedVisibility: getComputedStyle(element).visibility,
        hasHiddenClass: element.classList.contains('hidden-step'),
        isVisible: isVisible(element)
    });
}
/**
 * Check if element is visible
 */
export function isVisible(element) {
    const style = getComputedStyle(element);
    return style.display !== 'none' &&
        style.visibility !== 'hidden' &&
        style.opacity !== '0' &&
        !hasClass(element, 'hidden-step');
}
/**
 * Debounce function calls
 */
export function debounce(func, delay) {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func(...args), delay);
    };
}
/**
 * Get form data as object
 */
export function getFormData(form) {
    const formData = new FormData(form);
    const data = {};
    for (const [key, value] of formData.entries()) {
        if (data[key]) {
            // Handle multiple values (checkboxes, multi-select)
            if (Array.isArray(data[key])) {
                data[key].push(value);
            }
            else {
                data[key] = [data[key], value];
            }
        }
        else {
            data[key] = value;
        }
    }
    return data;
}
/**
 * Get all form inputs within an element
 */
export function getFormInputs(element) {
    return Array.from(element.querySelectorAll('input, select, textarea'));
}
/**
 * Check if element is a form input
 */
export function isFormInput(element) {
    return element instanceof HTMLInputElement ||
        element instanceof HTMLSelectElement ||
        element instanceof HTMLTextAreaElement;
}
/**
 * Get input value safely
 */
export function getInputValue(input) {
    if (input instanceof HTMLInputElement) {
        if (input.type === 'checkbox' || input.type === 'radio') {
            return input.checked ? input.value : '';
        }
        return input.value;
    }
    if (input instanceof HTMLSelectElement && input.multiple) {
        return Array.from(input.selectedOptions).map(option => option.value);
    }
    return input.value;
}
/**
 * Set input value safely
 */
export function setInputValue(input, value) {
    if (input instanceof HTMLInputElement) {
        if (input.type === 'checkbox' || input.type === 'radio') {
            input.checked = Array.isArray(value) ? value.includes(input.value) : value === input.value;
        }
        else {
            input.value = Array.isArray(value) ? value[0] || '' : value;
        }
    }
    else if (input instanceof HTMLSelectElement && input.multiple && Array.isArray(value)) {
        Array.from(input.options).forEach(option => {
            option.selected = value.includes(option.value);
        });
    }
    else {
        input.value = Array.isArray(value) ? value[0] || '' : value;
    }
}
/**
 * Create delegated event listener
 */
export function delegateEvent(root, eventType, selector, handler) {
    const delegatedHandler = (event) => {
        const target = event.target?.closest(selector);
        if (target) {
            handler(event, target);
        }
    };
    root.addEventListener(eventType, delegatedHandler);
    // Return cleanup function
    return () => {
        root.removeEventListener(eventType, delegatedHandler);
    };
}
/**
 * Centralized Field Coordinator
 * Handles all field input events and notifies interested modules via events
 */
import { FormState } from './formState.js';
import { formEvents } from './events.js';
let fieldCoordinatorInitialized = false;
let fieldCoordinatorCleanup = [];
/**
 * Initialize centralized field coordinator
 * This replaces individual field listeners in branching, validation, and summary modules
 */
export function initFieldCoordinator(root = document) {
    if (fieldCoordinatorInitialized) {
        logVerbose('Field coordinator already initialized, cleaning up first');
        resetFieldCoordinator();
    }
    logVerbose('Initializing centralized field coordinator');
    // Single event listener for all form field changes
    const cleanup1 = delegateEvent(root, 'input', 'input, select, textarea', handleFieldInput);
    const cleanup2 = delegateEvent(root, 'change', 'input, select, textarea', handleFieldChange);
    const cleanup3 = delegateEvent(root, 'blur', 'input, select, textarea', handleFieldBlur);
    fieldCoordinatorCleanup.push(cleanup1, cleanup2, cleanup3);
    fieldCoordinatorInitialized = true;
    logVerbose('Field coordinator initialization complete');
}
/**
 * Handle field input events (real-time)
 */
function handleFieldInput(event, target) {
    if (!isFormInput(target))
        return;
    const fieldName = getFieldName(target);
    const fieldValue = getInputValue(target);
    if (fieldName) {
        // Store in FormState (single source of truth)
        FormState.setField(fieldName, fieldValue);
        logVerbose('Field input detected', {
            fieldName,
            value: fieldValue,
            eventType: 'input'
        });
        // Notify interested modules via events
        formEvents.emit('field:input', {
            fieldName,
            value: fieldValue,
            element: target,
            eventType: 'input'
        });
    }
}
/**
 * Handle field change events (when value finalizes)
 */
function handleFieldChange(event, target) {
    if (!isFormInput(target))
        return;
    const fieldName = getFieldName(target);
    const fieldValue = getInputValue(target);
    if (fieldName) {
        // Store in FormState (single source of truth)
        FormState.setField(fieldName, fieldValue);
        logVerbose('Field change detected', {
            fieldName,
            value: fieldValue,
            eventType: 'change'
        });
        // Notify interested modules via events
        formEvents.emit('field:change', {
            fieldName,
            value: fieldValue,
            element: target,
            eventType: 'change'
        });
    }
}
/**
 * Handle field blur events (for validation)
 */
function handleFieldBlur(event, target) {
    if (!isFormInput(target))
        return;
    const fieldName = getFieldName(target);
    const fieldValue = getInputValue(target);
    if (fieldName) {
        logVerbose('Field blur detected', {
            fieldName,
            value: fieldValue,
            eventType: 'blur'
        });
        // Notify interested modules via events
        formEvents.emit('field:blur', {
            fieldName,
            value: fieldValue,
            element: target,
            eventType: 'blur'
        });
    }
}
/**
 * Get field name from element
 */
function getFieldName(element) {
    const htmlElement = element;
    return htmlElement.name || getAttrValue(element, 'data-step-field-name') || null;
}
/**
 * Reset field coordinator
 */
export function resetFieldCoordinator() {
    if (!fieldCoordinatorInitialized) {
        logVerbose('Field coordinator not initialized, nothing to reset');
        return;
    }
    logVerbose('Resetting field coordinator');
    fieldCoordinatorCleanup.forEach(cleanup => cleanup());
    fieldCoordinatorCleanup = [];
    fieldCoordinatorInitialized = false;
    logVerbose('Field coordinator reset complete');
}
//# sourceMappingURL=utils.js.map