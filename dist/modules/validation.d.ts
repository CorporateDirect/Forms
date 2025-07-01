/**
 * Form validation module with branch awareness
 */
/**
 * Initialize validation functionality
 */
export declare function initValidation(root?: Document | Element): void;
/**
 * Validate a specific field
 */
export declare function validateField(fieldName: string): boolean;
/**
 * Validate a specific step
 */
export declare function validateStep(stepId: string): boolean;
/**
 * Validate all visible fields
 */
export declare function validateAllVisibleFields(): boolean;
/**
 * Clear validation errors for a field
 */
export declare function clearFieldValidation(fieldName: string): void;
/**
 * Clear validation errors for all fields
 */
export declare function clearAllValidation(): void;
/**
 * Add custom validation rule to a field
 */
export declare function addCustomValidation(fieldName: string, validator: (value: any) => boolean, message: string): void;
/**
 * Get validation state for debugging
 */
export declare function getValidationState(): any;
//# sourceMappingURL=validation.d.ts.map