/**
 * Form Functionality Library - Main Entry Point
 *
 * A modular, flexible form functionality library for Webflow forms
 * supporting single-step, multi-step, and branching forms.
 *
 * Version: CACHE_BUST_2025_01_28_22_20_INPUT_ONLY_BORDERS
 */
import { FormState } from './modules/formState.js';
import { initMultiStep, goToStep, goToStepById } from './modules/multiStep.js';
import { initMultiStepClean, goToStepByIdClean, getCleanState } from './modules/multiStep-clean.js';
import { initValidation, validateField, validateStep, validateAllVisibleFields } from './modules/validation.js';
import { initErrors, showError, clearError, clearAllErrors, showErrors, hasError, getFieldsWithErrors } from './modules/errors.js';
import { initializeWebflowErrorHandling, showFieldError, clearFieldError, validateCurrentStep, clearAllErrors as clearAllWebflowErrors, hasFieldError, getFieldsWithErrors as getWebflowFieldsWithErrors } from './modules/webflowNativeErrors.js';
import { initBrowserValidationFix } from './modules/browserValidationFix.js';
import { initSummary, updateSummary, clearSummary } from './modules/summary.js';
/**
 * Main FormLib class - singleton instance
 */
declare class FormLibrary {
    private static instance;
    private initialized;
    private rootElement;
    private constructor();
    /**
     * Get singleton instance
     */
    static getInstance(): FormLibrary;
    /**
     * Initialize the form library
     */
    init(root?: Document | Element): void;
    /**
     * Destroy and cleanup the form library
     */
    destroy(): void;
    /**
     * Check if library is initialized
     */
    isInitialized(): boolean;
    /**
     * Get current form state for debugging
     */
    getState(): Record<string, unknown>;
    /**
     * Log current state to console
     */
    logCurrentState(): void;
    /**
     * Validate entire form
     */
    validateForm(): boolean;
    /**
     * Reset form to initial state
     */
    resetForm(): void;
    /**
     * Get form data
     */
    getFormData(): Record<string, unknown>;
    /**
     * Set form data
     */
    setFormData(data: Record<string, unknown>): void;
    debugStepSystem(): void;
    getNavigatedSteps(): string[];
    showError(fieldName: string, message?: string): void;
    clearError(fieldName: string): void;
    clearAllErrors(): void;
    hasError(fieldName: string): boolean;
    getFieldsWithErrors(): string[];
}
declare const FormLib: FormLibrary;
export default FormLib;
export { FormState, initMultiStep, goToStep, goToStepById, initMultiStepClean, goToStepByIdClean, getCleanState, initValidation, validateField, validateStep, validateAllVisibleFields, initErrors, showError, clearError, clearAllErrors, showErrors, hasError, getFieldsWithErrors, initializeWebflowErrorHandling, showFieldError, clearFieldError, validateCurrentStep, clearAllWebflowErrors, hasFieldError, getWebflowFieldsWithErrors, initBrowserValidationFix, initSummary, updateSummary, clearSummary };
//# sourceMappingURL=index.d.ts.map