/**
 * Form Functionality Library - Main Entry Point
 *
 * A modular, flexible form functionality library for Webflow forms
 * supporting single-step, multi-step, and branching forms.
 */
import { FormState } from './modules/formState.js';
import { initBranching, resetBranching, getNextStep } from './modules/branching.js';
import { initMultiStep, goToStep, showStep, getCurrentStepInfo } from './modules/multiStep.js';
import { initValidation, validateField, validateStep, validateAllVisibleFields } from './modules/validation.js';
import { initErrors, showError, clearError, clearAllErrors } from './modules/errors.js';
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
    getState(): any;
    /**
     * Log current state to console
     */
    logCurrentState(): void;
    /**
     * Validate entire form
     */
    validateForm(): boolean;
    /**
     * Validate navigation patterns (data-go-to ↔ data-answer)
     */
    validateNavigation(): any;
    /**
     * Reset form to initial state
     */
    resetForm(): void;
    /**
     * Get form data
     */
    getFormData(): any;
    /**
     * Set form data
     */
    setFormData(data: Record<string, any>): void;
}
declare const FormLib: FormLibrary;
export default FormLib;
export { FormState, initBranching, resetBranching, getNextStep, initMultiStep, goToStep, showStep, getCurrentStepInfo, initValidation, validateField, validateStep, validateAllVisibleFields, initErrors, showError, clearError, clearAllErrors, initSummary, updateSummary, clearSummary };
//# sourceMappingURL=index.d.ts.map