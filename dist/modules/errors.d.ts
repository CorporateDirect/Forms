/**
 * Error handling and display module
 */
/**
 * Initialize error handling
 */
export declare function initErrors(root?: Document | Element): void;
/**
 * Show error for a specific field
 */
export declare function showError(fieldName: string, message?: string): void;
/**
 * Clear error for a specific field
 */
export declare function clearError(fieldName: string): void;
/**
 * Clear all errors
 */
export declare function clearAllErrors(): void;
/**
 * Show multiple errors at once
 */
export declare function showErrors(errors: Record<string, string>): void;
/**
 * Check if a field has an error
 */
export declare function hasError(fieldName: string): boolean;
/**
 * Get all fields with errors
 */
export declare function getFieldsWithErrors(): string[];
/**
 * Set custom error message for a field
 */
export declare function setCustomErrorMessage(fieldName: string, message: string): void;
/**
 * Highlight field with error (alternative to standard error styling)
 */
export declare function highlightFieldError(fieldName: string, highlightClass?: string): void;
/**
 * Focus on first field with error
 */
export declare function focusFirstError(): void;
/**
 * Get error statistics
 */
export declare function getErrorStats(): Record<string, unknown>;
/**
 * Reset error handling
 */
export declare function resetErrors(): void;
/**
 * Get current error state for debugging
 */
export declare function getErrorState(): Record<string, unknown>;
//# sourceMappingURL=errors.d.ts.map