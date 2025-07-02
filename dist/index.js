/**
 * Form Functionality Library - Main Entry Point
 *
 * A modular, flexible form functionality library for Webflow forms
 * supporting single-step, multi-step, and branching forms.
 */
import { SELECTORS } from './config.js';
import { logVerbose } from './modules/utils.js';
import { FormState } from './modules/formState.js';
// Import all modules
import { initBranching, resetBranching, getNextStep, getBranchingState } from './modules/branching.js';
import { initMultiStep, goToStep, showStep, getCurrentStepInfo, getMultiStepState } from './modules/multiStep.js';
import { initValidation, validateField, validateStep, validateAllVisibleFields, getValidationState } from './modules/validation.js';
import { initErrors, showError, clearError, clearAllErrors, getErrorState } from './modules/errors.js';
import { initSummary, updateSummary, clearSummary, getSummaryState } from './modules/summary.js';
/**
 * Main FormLib class - singleton instance
 */
class FormLibrary {
    constructor() {
        this.initialized = false;
        this.rootElement = document;
        logVerbose('FormLibrary instance created');
    }
    /**
     * Get singleton instance
     */
    static getInstance() {
        if (!FormLibrary.instance) {
            FormLibrary.instance = new FormLibrary();
        }
        return FormLibrary.instance;
    }
    /**
     * Initialize the form library
     */
    init(root = document) {
        if (this.initialized) {
            logVerbose('FormLibrary already initialized, reinitializing...');
            this.destroy();
        }
        this.rootElement = root;
        logVerbose('Initializing FormLibrary', {
            root: root === document ? 'document' : 'custom element'
        });
        // Check if we have any forms to work with
        const multistepForms = root.querySelectorAll(SELECTORS.MULTISTEP);
        const logicForms = root.querySelectorAll(SELECTORS.LOGIC);
        const stepElements = root.querySelectorAll(SELECTORS.STEP);
        logVerbose('Form detection results', {
            multistepForms: multistepForms.length,
            logicForms: logicForms.length,
            stepElements: stepElements.length
        });
        if (multistepForms.length === 0 && stepElements.length === 0) {
            logVerbose('No compatible forms found, library will not initialize');
            return;
        }
        // Initialize modules in dependency order
        try {
            // 1. Initialize error handling first (used by validation)
            initErrors(root);
            // 2. Initialize validation (used by multi-step navigation)
            initValidation(root);
            // 3. Initialize branching logic (used by multi-step navigation)
            if (logicForms.length > 0) {
                initBranching(root);
            }
            // 4. Initialize multi-step navigation (coordinates with branching)
            if (multistepForms.length > 0 || stepElements.length > 0) {
                initMultiStep(root);
            }
            // 5. Initialize summary functionality (listens to field changes)
            initSummary(root);
            this.initialized = true;
            logVerbose('FormLibrary initialization complete');
            // Log initial state
            this.logCurrentState();
        }
        catch (error) {
            logVerbose('FormLibrary initialization failed', error);
            throw error;
        }
    }
    /**
     * Destroy and cleanup the form library
     */
    destroy() {
        if (!this.initialized) {
            logVerbose('FormLibrary not initialized, nothing to destroy');
            return;
        }
        logVerbose('Destroying FormLibrary');
        // Reset all modules (they handle their own cleanup)
        try {
            resetBranching();
            // Note: Other modules will be reset when re-initialized
        }
        catch (error) {
            logVerbose('Error during FormLibrary destruction', error);
        }
        // Clear FormState
        FormState.clear();
        this.initialized = false;
        logVerbose('FormLibrary destruction complete');
    }
    /**
     * Check if library is initialized
     */
    isInitialized() {
        return this.initialized;
    }
    /**
     * Get current form state for debugging
     */
    getState() {
        return {
            initialized: this.initialized,
            formState: FormState.getDebugInfo(),
            branching: getBranchingState(),
            multiStep: getMultiStepState(),
            validation: getValidationState(),
            errors: getErrorState(),
            summary: getSummaryState()
        };
    }
    /**
     * Log current state to console
     */
    logCurrentState() {
        const state = this.getState();
        logVerbose('Current FormLibrary State', state);
    }
    /**
     * Validate entire form
     */
    validateForm() {
        if (!this.initialized) {
            logVerbose('Cannot validate form - library not initialized');
            return false;
        }
        logVerbose('Validating entire form');
        const isValid = validateAllVisibleFields();
        logVerbose('Form validation result', { isValid });
        return isValid;
    }
    /**
     * Reset form to initial state
     */
    resetForm() {
        if (!this.initialized) {
            logVerbose('Cannot reset form - library not initialized');
            return;
        }
        logVerbose('Resetting form to initial state');
        // Clear all errors
        clearAllErrors();
        // Clear form state
        FormState.clear();
        // Clear summaries
        clearSummary();
        // Go to first step if multi-step
        try {
            goToStep(0);
        }
        catch (error) {
            logVerbose('Could not go to first step during reset', error);
        }
        logVerbose('Form reset complete');
    }
    /**
     * Get form data
     */
    getFormData() {
        return FormState.getAll();
    }
    /**
     * Set form data
     */
    setFormData(data) {
        Object.entries(data).forEach(([key, value]) => {
            FormState.setField(key, value);
        });
        // Update summaries after setting data
        updateSummary();
        logVerbose('Form data set', data);
    }
}
// Create and export singleton instance
const FormLib = FormLibrary.getInstance();
// Export the main interface
export default FormLib;
// Export individual modules for advanced usage
export { 
// Core
FormState, 
// Branching
initBranching, resetBranching, getNextStep, 
// Multi-step
initMultiStep, goToStep, showStep, getCurrentStepInfo, 
// Validation
initValidation, validateField, validateStep, validateAllVisibleFields, 
// Errors
initErrors, showError, clearError, clearAllErrors, 
// Summary
initSummary, updateSummary, clearSummary };
// Auto-initialize on DOM ready if forms are detected
if (typeof window !== 'undefined') {
    const autoInit = () => {
        const multistepForms = document.querySelectorAll(SELECTORS.MULTISTEP);
        const stepElements = document.querySelectorAll(SELECTORS.STEP);
        if (multistepForms.length > 0 || stepElements.length > 0) {
            logVerbose('Auto-initializing FormLibrary on DOM ready');
            FormLib.init();
        }
    };
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', autoInit);
    }
    else {
        // DOM is already ready
        autoInit();
    }
}
// Make FormLib available globally for testing
if (typeof window !== 'undefined') {
    window.FormLib = FormLib;
    logVerbose('FormLib attached to window for debugging');
}
//# sourceMappingURL=index.js.map