/**
 * Utility functions for the form functionality library
 */

import { DEFAULTS } from '../config.js';

// Simple query cache to improve performance
const queryCache = new Map<string, Element | NodeListOf<Element> | null>();

/**
 * Enhanced logging with consistent formatting
 */
export function logVerbose(message: string, data?: unknown): void {
  if (!DEFAULTS.DEBUG) return;
  
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  const prefix = `${DEFAULTS.LOG_PREFIX} [${timestamp}]`;
  
  if (data !== undefined) {
    console.log(`${prefix} ${message}`, data);
  } else {
    console.log(`${prefix} ${message}`);
  }
}

/**
 * Clear query cache (useful for dynamic content)
 */
export function clearQueryCache(): void {
  queryCache.clear();
}

/**
 * Query all elements by data attribute with caching
 */
export function queryAllByAttr(selector: string, root: Document | Element = document): NodeListOf<Element> {
  // Only cache document-level queries to avoid stale references
  if (root === document) {
    const cacheKey = `all:${selector}`;
    if (queryCache.has(cacheKey)) {
      return queryCache.get(cacheKey) as NodeListOf<Element>;
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
export function queryByAttr(selector: string, root: Document | Element = document): Element | null {
  // Only cache document-level queries to avoid stale references
  if (root === document) {
    const cacheKey = `single:${selector}`;
    if (queryCache.has(cacheKey)) {
      return queryCache.get(cacheKey) as Element | null;
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
export function getAttrValue(element: Element, attribute: string): string | null {
  return element.getAttribute(attribute);
}

/**
 * Set attribute value on element
 */
export function setAttrValue(element: Element, attribute: string, value: string): void {
  element.setAttribute(attribute, value);
}

/**
 * Remove attribute from element
 */
export function removeAttr(element: Element, attribute: string): void {
  element.removeAttribute(attribute);
}

/**
 * Check if element has attribute
 */
export function hasAttr(element: Element, attribute: string): boolean {
  return element.hasAttribute(attribute);
}

/**
 * Add CSS class to element
 */
export function addClass(element: Element, className: string): void {
  element.classList.add(className);
}

/**
 * Remove CSS class from element
 */
export function removeClass(element: Element, className: string): void {
  element.classList.remove(className);
}

/**
 * Toggle CSS class on element
 */
export function toggleClass(element: Element, className: string, force?: boolean): void {
  element.classList.toggle(className, force);
}

/**
 * Check if element has CSS class
 */
export function hasClass(element: Element, className: string): boolean {
  return element.classList.contains(className);
}

/**
 * Show element (remove hidden-step class and set display)
 */
export function showElement(element: HTMLElement): void {
  removeClass(element, 'hidden-step');
  element.style.display = '';
  logVerbose(`Showing element:`, element);
}

/**
 * Hide element (add hidden-step class and set display none)
 */
export function hideElement(element: HTMLElement): void {
  addClass(element, 'hidden-step');
  element.style.display = 'none';
  logVerbose(`Hiding element:`, element);
}

/**
 * Check if element is visible
 */
export function isVisible(element: HTMLElement): boolean {
  return element.style.display !== 'none' && !hasClass(element, 'hidden-step');
}

/**
 * Debounce function calls
 */
export function debounce<T extends (...args: unknown[]) => void>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

/**
 * Get form data as object
 */
export function getFormData(form: HTMLFormElement): Record<string, unknown> {
  const formData = new FormData(form);
  const data: Record<string, unknown> = {};
  
  for (const [key, value] of formData.entries()) {
    if (data[key]) {
      // Handle multiple values (checkboxes, multi-select)
      if (Array.isArray(data[key])) {
        (data[key] as unknown[]).push(value);
      } else {
        data[key] = [data[key], value];
      }
    } else {
      data[key] = value;
    }
  }
  
  return data;
}

/**
 * Get all form inputs within an element
 */
export function getFormInputs(element: Element): HTMLInputElement[] {
  return Array.from(element.querySelectorAll('input, select, textarea')) as HTMLInputElement[];
}

/**
 * Check if element is a form input
 */
export function isFormInput(element: Element): element is HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement {
  return element instanceof HTMLInputElement || 
         element instanceof HTMLSelectElement || 
         element instanceof HTMLTextAreaElement;
}

/**
 * Get input value safely
 */
export function getInputValue(input: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement): string | string[] {
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
export function setInputValue(
  input: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement, 
  value: string | string[]
): void {
  if (input instanceof HTMLInputElement) {
    if (input.type === 'checkbox' || input.type === 'radio') {
      input.checked = Array.isArray(value) ? value.includes(input.value) : value === input.value;
    } else {
      input.value = Array.isArray(value) ? value[0] || '' : value;
    }
  } else if (input instanceof HTMLSelectElement && input.multiple && Array.isArray(value)) {
    Array.from(input.options).forEach(option => {
      option.selected = value.includes(option.value);
    });
  } else {
    input.value = Array.isArray(value) ? value[0] || '' : value;
  }
}

/**
 * Create delegated event listener
 */
export function delegateEvent<T extends Event>(
  root: Element | Document,
  eventType: string,
  selector: string,
  handler: (event: T, target: Element) => void
): () => void {
  const delegatedHandler = (event: Event) => {
    const target = (event.target as Element)?.closest(selector);
    if (target) {
      handler(event as T, target);
    }
  };
  
  root.addEventListener(eventType, delegatedHandler);
  
  // Return cleanup function
  return () => {
    root.removeEventListener(eventType, delegatedHandler);
  };
} 