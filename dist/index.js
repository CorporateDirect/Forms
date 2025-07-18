/**
 * Form Functionality Library - Main Entry Point
 *
 * A modular, flexible form functionality library for Webflow forms
 * supporting single-step, multi-step, and branching forms.
 *
 * Version: CACHE_BUST_2025_01_10_14_45_FRESH
 */
import { SELECTORS } from './config.js';
import { logVerbose, initFieldCoordinator, resetFieldCoordinator } from './modules/utils.js';
import { clearQueryCache } from './modules/utils.js';
import { FormState } from './modules/formState.js';
// Add version logging to verify which script is loading
console.log('🚀 [FormLib] === SCRIPT VERSION CHECK ===');
console.log('📦 [FormLib] Script Version: CACHE_BUST_2025_01_10_14_45_FRESH');
console.log('🔗 [FormLib] Expected URL: @9705259 or newer');
console.log('⏰ [FormLib] Load Time:', new Date().toISOString());
// Import all modules
import { initBranching, resetBranching, getBranchingState } from './modules/branching.js';
import { initMultiStep, goToStep, showStep, getCurrentStepInfo, getMultiStepState } from './modules/multiStep.js';
import { initValidation, validateField, validateStep, validateAllVisibleFields, getValidationState } from './modules/validation.js';
import { initErrors, showError, clearError, clearAllErrors, getErrorState } from './modules/errors.js';
import { initSummary, updateSummary, clearSummary, getSummaryState } from './modules/summary.js';
// Skip functionality now integrated into multiStep.js
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
            // 1. Initialize centralized field coordinator (used by all modules)
            initFieldCoordinator(root);
            // 2. Initialize error handling (used by validation)
            initErrors(root);
            // 3. Initialize validation (used by multi-step navigation)
            initValidation(root);
            // 4. Initialize branching logic (used by multi-step navigation)
            if (logicForms.length > 0) {
                initBranching(root);
            }
            // 5. Initialize multi-step navigation (coordinates with branching, includes skip)
            if (multistepForms.length > 0 || stepElements.length > 0) {
                initMultiStep(root); // Includes integrated skip functionality
            }
            // 6. Initialize summary functionality (listens to field changes)
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
            // Reset centralized field coordinator
            resetFieldCoordinator();
            // Skip functionality integrated into multiStep
            // Note: Other modules will be reset when re-initialized
        }
        catch (error) {
            logVerbose('Error during FormLibrary destruction', error);
        }
        // Clear FormState
        FormState.clear();
        // Clear query cache to prevent memory leaks
        clearQueryCache();
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
            summary: getSummaryState(),
            // skip functionality integrated into multiStep
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
initBranching, resetBranching, 
// Multi-step
initMultiStep, goToStep, showStep, getCurrentStepInfo, 
// Validation
initValidation, validateField, validateStep, validateAllVisibleFields, 
// Errors
initErrors, showError, clearError, clearAllErrors, 
// Summary
initSummary, updateSummary, clearSummary };
// Auto-initialize using Webflow's push system for proper timing
if (typeof window !== 'undefined') {
    const autoInit = () => {
        const multistepForms = document.querySelectorAll(SELECTORS.MULTISTEP);
        const stepElements = document.querySelectorAll(SELECTORS.STEP);
        if (multistepForms.length > 0 || stepElements.length > 0) {
            logVerbose('Auto-initializing FormLibrary via Webflow.push');
            FormLib.init();
        }
    };
    // Use Webflow.push for proper Webflow integration timing
    const webflowWindow = window;
    if (webflowWindow.Webflow?.push) {
        webflowWindow.Webflow.push(autoInit);
    }
    else {
        // Fallback to DOM ready if Webflow is not available
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', autoInit);
        }
        else {
            // DOM is already ready
            autoInit();
        }
    }
}
// Make FormLib available globally for testing
if (typeof window !== 'undefined') {
    window.FormLib = FormLib;
    logVerbose('FormLib attached to window for debugging');
}
//# sourceMappingURL=index.js.map