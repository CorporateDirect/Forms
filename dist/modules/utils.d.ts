/**
 * Utility functions for the form functionality library
 */
/**
 * Enhanced logging with consistent formatting
 */
export declare function logVerbose(message: string, data?: unknown): void;
/**
 * Clear query cache (useful for dynamic content)
 */
export declare function clearQueryCache(): void;
/**
 * Query all elements by data attribute with caching
 */
export declare function queryAllByAttr(selector: string, root?: Document | Element): NodeListOf<Element>;
/**
 * Query single element by data attribute with caching
 */
export declare function queryByAttr(selector: string, root?: Document | Element): Element | null;
/**
 * Get attribute value from element
 */
export declare function getAttrValue(element: Element, attribute: string): string | null;
/**
 * Set attribute value on element
 */
export declare function setAttrValue(element: Element, attribute: string, value: string): void;
/**
 * Remove attribute from element
 */
export declare function removeAttr(element: Element, attribute: string): void;
/**
 * Check if element has attribute
 */
export declare function hasAttr(element: Element, attribute: string): boolean;
/**
 * Add CSS class to element
 */
export declare function addClass(element: Element, className: string): void;
/**
 * Remove CSS class from element
 */
export declare function removeClass(element: Element, className: string): void;
/**
 * Toggle CSS class on element
 */
export declare function toggleClass(element: Element, className: string, force?: boolean): void;
/**
 * Check if element has CSS class
 */
export declare function hasClass(element: Element, className: string): boolean;
/**
 * Show element (remove hidden-step class and restore display)
 */
export declare function showElement(element: HTMLElement): void;
/**
 * Hide element (add hidden-step class and set display none)
 */
export declare function hideElement(element: HTMLElement): void;
/**
 * Check if element is visible
 */
export declare function isVisible(element: HTMLElement): boolean;
/**
 * Debounce function calls
 */
export declare function debounce<T extends (...args: unknown[]) => void>(func: T, delay: number): (...args: Parameters<T>) => void;
/**
 * Get form data as object
 */
export declare function getFormData(form: HTMLFormElement): Record<string, unknown>;
/**
 * Get all form inputs within an element
 */
export declare function getFormInputs(element: Element): HTMLInputElement[];
/**
 * Check if element is a form input
 */
export declare function isFormInput(element: Element): element is HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
/**
 * Get input value safely
 */
export declare function getInputValue(input: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement): string | string[];
/**
 * Set input value safely
 */
export declare function setInputValue(input: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement, value: string | string[]): void;
/**
 * Create delegated event listener
 */
export declare function delegateEvent<T extends Event>(root: Element | Document, eventType: string, selector: string, handler: (event: T, target: Element) => void): () => void;
//# sourceMappingURL=utils.d.ts.map