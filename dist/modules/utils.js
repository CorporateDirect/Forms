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
 * Show element (remove hidden-step class and set display)
 */
export function showElement(element) {
    removeClass(element, 'hidden-step');
    element.style.display = '';
    logVerbose(`Showing element:`, element);
}
/**
 * Hide element (add hidden-step class and set display none)
 */
export function hideElement(element) {
    addClass(element, 'hidden-step');
    element.style.display = 'none';
    logVerbose(`Hiding element:`, element);
}
/**
 * Check if element is visible
 */
export function isVisible(element) {
    return element.style.display !== 'none' && !hasClass(element, 'hidden-step');
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
//# sourceMappingURL=utils.js.map