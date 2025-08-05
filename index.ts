/**
 * Form Functionality Library - Main Entry Point
 * 
 * A modular, flexible form functionality library for Webflow forms
 * supporting single-step, multi-step, and branching forms.
 * 
 * Version: CACHE_BUST_2025_01_28_22_20_INPUT_ONLY_BORDERS
 */

import { SELECTORS } from './config.js';
import { logVerbose, initFieldCoordinator, resetFieldCoordinator } from './modules/utils.js';
import { clearQueryCache } from './modules/utils.js';
import { FormState } from './modules/formState.js';

// Add version logging to verify which script is loading
console.log('🚀 [FormLib] === SCRIPT VERSION CHECK ===');
console.log('📦 [FormLib] Script Version: v1.7.3 ROBUST ELEMENT LOOKUP');
console.log('🔗 [FormLib] Expected URL: @9705259 or newer');
console.log('⏰ [FormLib] Load Time:', new Date().toISOString());

// Import all modules  
import { initMultiStep, goToStep, goToStepById, debugStepSystem, getNavigatedSteps } from './modules/multiStep.js';
import { initMultiStepClean, goToStepByIdClean, getCleanState } from './modules/multiStep-clean.js';
// import { initMultiStepDiagnostic, goToStepByIdDiagnostic, getDiagnosticState } from './modules/multiStep-diagnostic.js';
import { initValidation, validateField, validateStep, validateAllVisibleFields, getValidationState } from './modules/validation.js';
import { initErrors, showError, clearError, clearAllErrors, showErrors, hasError, getFieldsWithErrors, getErrorState } from './modules/errors.js';
import { initializeWebflowErrorHandling, showFieldError, clearFieldError, validateCurrentStep, clearAllErrors as clearAllWebflowErrors, hasFieldError, getFieldsWithErrors as getWebflowFieldsWithErrors } from './modules/webflowNativeErrors.js';
import { initializeCustomErrorSystem, showCustomError, clearCustomError, clearAllCustomErrors, getFieldsWithCustomErrors } from './modules/webflowListenerErrors.js';
import { initBrowserValidationFix } from './modules/browserValidationFix.js';
import { initWebflowIntegration, getWebflowIntegrationStatus } from './modules/webflowIntegration.js';
import { initSummary, updateSummary, clearSummary, getSummaryState } from './modules/summary.js';
// Skip functionality now integrated into multiStep.js

/**
 * Main FormLib class - singleton instance
 */
class FormLibrary {
  private static instance: FormLibrary;
  private initialized = false;
  private rootElement: Document | Element = document;

  private constructor() {
    logVerbose('FormLibrary instance created');
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): FormLibrary {
    if (!FormLibrary.instance) {
      FormLibrary.instance = new FormLibrary();
    }
    return FormLibrary.instance;
  }

  /**
   * Initialize the form library
   */
  public init(root: Document | Element = document): void {
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
      
      // 2. Fix browser validation conflicts (must happen before validation)
      initBrowserValidationFix(root);
      
      // 3. Initialize error handling (used by validation)
      initErrors(root);
      
      // 3.1. Initialize Webflow-native error handling (v1.9.0)
      initializeWebflowErrorHandling();
      
      // 3.2. Initialize custom error system that listens to Webflow (v1.9.5)
      initializeCustomErrorSystem();

      // 4. Initialize validation (used by multi-step navigation)
      initValidation(root);

      // 5. Initialize multi-step navigation (linear navigation only)
      if (multistepForms.length > 0 || stepElements.length > 0) {
        initMultiStep(root); // Includes integrated skip functionality
      }

      // 6. Initialize Webflow integration (hooks into Webflow's validation system)
      initWebflowIntegration();

      // 7. Initialize summary functionality (listens to field changes)
      initSummary(root);

      this.initialized = true;
      logVerbose('FormLibrary initialization complete');

      // Log initial state
      this.logCurrentState();

    } catch (error) {
      logVerbose('FormLibrary initialization failed', error);
      throw error;
    }
  }

  /**
   * Destroy and cleanup the form library
   */
  public destroy(): void {
    if (!this.initialized) {
      logVerbose('FormLibrary not initialized, nothing to destroy');
      return;
    }

    logVerbose('Destroying FormLibrary');

    // Reset all modules (they handle their own cleanup)
    try {
      // Reset centralized field coordinator
      resetFieldCoordinator();
      // Skip functionality integrated into multiStep
      // Note: Other modules will be reset when re-initialized
    } catch (error) {
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
  public isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Get current form state for debugging
   */
  public getState(): Record<string, unknown> {
    return {
      initialized: this.initialized,
      formState: FormState.getDebugInfo(),
      multiStep: { note: "Simplified linear navigation - debug info removed" },
      validation: getValidationState(),
      errors: getErrorState(),
      webflowIntegration: getWebflowIntegrationStatus(),
      summary: getSummaryState(),
      // skip functionality integrated into multiStep
    };
  }

  /**
   * Log current state to console
   */
  public logCurrentState(): void {
    const state = this.getState();
    logVerbose('Current FormLibrary State', state);
  }

  /**
   * Validate entire form
   */
  public validateForm(): boolean {
    if (!this.initialized) {
      logVerbose('Cannot validate form - library not initialized');
      return false;
    }

    logVerbose('Validating entire form');
    
    // Use both validation systems
    const legacyIsValid = validateAllVisibleFields();
    const webflowValidation = validateCurrentStep();
    
    const isValid = legacyIsValid && webflowValidation.isValid;
    
    logVerbose('Form validation result', { 
      legacyValidation: legacyIsValid,
      webflowValidation: webflowValidation.isValid,
      overallValid: isValid,
      webflowErrors: webflowValidation.errors
    });
    
    return isValid;
  }

  /**
   * Reset form to initial state
   */
  public resetForm(): void {
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
    } catch (error) {
      logVerbose('Could not go to first step during reset', error);
    }

    logVerbose('Form reset complete');
  }

  /**
   * Get form data
   */
  public getFormData(): Record<string, unknown> {
    return FormState.getAll();
  }

  /**
   * Set form data
   */
  public setFormData(data: Record<string, unknown>): void {
    Object.entries(data).forEach(([key, value]) => {
      FormState.setField(key, value);
    });

    // Update summaries after setting data
    updateSummary();
    
    logVerbose('Form data set', data);
  }

  // ADDED: Debug and utility functions for troubleshooting
  public debugStepSystem(): void {
    debugStepSystem();
  }

  public getNavigatedSteps(): string[] {
    return getNavigatedSteps();
  }

  // Error handling methods for testing
  public showError(fieldName: string, message?: string): void {
    showError(fieldName, message);
  }

  public clearError(fieldName: string): void {
    clearError(fieldName);
  }

  public clearAllErrors(): void {
    clearAllErrors();
  }

  public hasError(fieldName: string): boolean {
    return hasError(fieldName);
  }

  public getFieldsWithErrors(): string[] {
    return getFieldsWithErrors();
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
  
  // Multi-step (simplified linear navigation)
  initMultiStep,
  goToStep,
  goToStepById,
  
  // Ultra-minimal clean version (zero legacy code)
  initMultiStepClean,
  goToStepByIdClean,
  getCleanState,
  
  // Ultra-verbose diagnostic version for debugging
  // initMultiStepDiagnostic,
  // goToStepByIdDiagnostic,
  // getDiagnosticState,
  
  // Validation
  initValidation,
  validateField,
  validateStep,
  validateAllVisibleFields,
  
  // Errors
  initErrors,
  showError,
  clearError,
  clearAllErrors,
  showErrors,
  hasError,
  getFieldsWithErrors,
  
  // Webflow Native Errors (v1.9.0)
  initializeWebflowErrorHandling,
  showFieldError,
  clearFieldError,
  validateCurrentStep,
  clearAllWebflowErrors,
  hasFieldError,
  getWebflowFieldsWithErrors,
  
  // Custom Error System - Webflow Listener (v1.9.5)
  initializeCustomErrorSystem,
  showCustomError,
  clearCustomError,
  clearAllCustomErrors,
  getFieldsWithCustomErrors,
  
  // Browser Validation Fix
  initBrowserValidationFix,
  
  // Summary
  initSummary,
  updateSummary,
  clearSummary
};

// Auto-initialize using Webflow's push system for proper timing
if (typeof window !== 'undefined') {
  const autoInit = () => {
    const multistepForms = document.querySelectorAll(SELECTORS.MULTISTEP);
    const stepElements = document.querySelectorAll(SELECTORS.STEP);
    
    console.log('🔍 [FormLib] Auto-init check:', {
      multistepForms: multistepForms.length,
      stepElements: stepElements.length,
      readyState: document.readyState
    });
    
    if (multistepForms.length > 0 || stepElements.length > 0) {
      console.log('🚀 [FormLib] Auto-initializing FormLibrary');
      try {
        FormLib.init();
        console.log('✅ [FormLib] Auto-initialization complete');
      } catch (error) {
        console.error('❌ [FormLib] Auto-initialization failed:', error);
      }
    } else {
      console.log('⏭️ [FormLib] No compatible forms found, skipping auto-init');
    }
  };

  // Enhanced timing for Webflow compatibility
  const webflowWindow = window as unknown as { Webflow?: { push: (fn: () => void) => void } };
  
  // Try multiple initialization strategies for maximum compatibility
  if (webflowWindow.Webflow?.push) {
    console.log('🌐 [FormLib] Using Webflow.push for initialization');
    webflowWindow.Webflow.push(autoInit);
  } else {
    console.log('🔄 [FormLib] Webflow not available, using DOM events');
  }
  
  // Always add DOM ready fallback
  if (document.readyState === 'loading') {
    console.log('⏳ [FormLib] DOM loading, waiting for ready');
    document.addEventListener('DOMContentLoaded', autoInit);
  } else {
    console.log('✅ [FormLib] DOM already ready, initializing now');
    // Add slight delay to ensure all elements are rendered
    setTimeout(autoInit, 100);
  }
  
  // Additional fallback for dynamic content
  setTimeout(() => {
    if (!FormLib.isInitialized()) {
      console.log('🔁 [FormLib] Fallback initialization attempt');
      autoInit();
    }
  }, 1000);
}

// Make FormLib available globally for testing
if (typeof window !== 'undefined') {
  (window as CustomWindow).FormLib = FormLib;
  logVerbose('FormLib attached to window for debugging');
}

interface CustomWindow extends Window {
  FormLib?: unknown;
} 