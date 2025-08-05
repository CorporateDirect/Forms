/**
 * Browser Validation Fix Module
 * Webflow-aware validation fix that preserves required attributes for Webflow integration
 */

import { logVerbose } from './utils.js';

/**
 * Disable browser validation conflicts with Webflow-aware approach
 */
export function initBrowserValidationFix(root: Document | Element = document): { formsFixed: number; inputsFixed: number; conflictsEliminated: boolean } {
  logVerbose('Initializing Webflow-aware browser validation fix');

  // 1. Add novalidate to all forms to prevent browser validation
  const forms = root.querySelectorAll('form');
  let formsFixed = 0;
  
  forms.forEach((form) => {
    if (!form.hasAttribute('novalidate')) {
      form.setAttribute('novalidate', 'true');
      formsFixed++;
      logVerbose(`Added novalidate to form: ${form.id || 'unnamed'}`);
    }
  });

  // 2. Handle required attributes based on form type
  const requiredInputs = root.querySelectorAll('input[required], select[required], textarea[required]');
  let inputsFixed = 0;
  
  requiredInputs.forEach((input) => {
    const fieldName = (input as HTMLInputElement).name || 
                      input.getAttribute('data-step-field-name') || 
                      'unnamed';
    
    // Check if this input is in a Webflow multistep form
    const isWebflowForm = input.closest('form[data-form="multistep"]') !== null;
    
    if (isWebflowForm) {
      // For Webflow forms: Keep required attribute, add data-required as backup
      input.setAttribute('data-required', 'true');
      // Keep the required attribute for Webflow integration
      logVerbose(`Webflow form detected - keeping required attribute: ${fieldName}`);
    } else {
      // For non-Webflow forms: Convert required to data-required
      input.setAttribute('data-required', 'true');
      input.removeAttribute('required');
      logVerbose(`Non-Webflow form - converted required → data-required: ${fieldName}`);
    }
    
    inputsFixed++;
  });

  // 3. Clear any existing browser validation messages
  const inputsWithValidation = root.querySelectorAll('input, select, textarea');
  inputsWithValidation.forEach(input => {
    if ('setCustomValidity' in input && typeof input.setCustomValidity === 'function') {
      (input as HTMLInputElement).setCustomValidity('');
    }
  });

  logVerbose(`Webflow-aware validation fix complete: ${formsFixed} forms, ${inputsFixed} inputs processed`);
  
  return {
    formsFixed,
    inputsFixed,
    conflictsEliminated: inputsFixed > 0
  };
}

/**
 * Check if browser validation conflicts exist
 */
export function hasBrowserValidationConflicts(root: Document | Element = document): boolean {
  const formsWithoutNovalidate = root.querySelectorAll('form:not([novalidate])');
  const requiredInputs = root.querySelectorAll('input[required], select[required], textarea[required]');
  
  return formsWithoutNovalidate.length > 0 || requiredInputs.length > 0;
} 