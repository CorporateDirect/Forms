/**
 * Form Functionality Library - Main Entry Point
 *
 * A modular, flexible form functionality library for Webflow forms
 * supporting single-step, multi-step, and branching forms.
 *
 * Version: CACHE_BUST_2025_01_10_14_45_FRESH
 */
import { FormState } from './modules/formState.js';
import { initMultiStep, goToStep, goToStepById } from './modules/multiStep.js';
import { initMultiStepClean, goToStepByIdClean, getCleanState } from './modules/multiStep-clean.js';
import { initMultiStepDiagnostic, goToStepByIdDiagnostic, getDiagnosticState } from './modules/multiStep-diagnostic.js';
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
}
declare const FormLib: FormLibrary;
export default FormLib;
export { FormState, initMultiStep, goToStep, goToStepById, initMultiStepClean, goToStepByIdClean, getCleanState, initMultiStepDiagnostic, goToStepByIdDiagnostic, getDiagnosticState, initValidation, validateField, validateStep, validateAllVisibleFields, initErrors, showError, clearError, clearAllErrors, initSummary, updateSummary, clearSummary };
//# sourceMappingURL=index.d.ts.map