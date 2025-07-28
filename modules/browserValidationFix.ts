/**
 * Browser Validation Fix Module
 * Disables HTML5 browser validation conflicts and converts required → data-required
 */

import { logVerbose } from './utils.js';

/**
 * Disable browser validation conflicts
 */
export function initBrowserValidationFix(root: Document | Element = document): void {
  logVerbose('Initializing browser validation fix');

  // 1. Add novalidate to all forms
  const forms = root.querySelectorAll('form');
  let formsFixed = 0;
  
  forms.forEach((form) => {
    if (!form.hasAttribute('novalidate')) {
      form.setAttribute('novalidate', 'true');
      formsFixed++;
      logVerbose(`Added novalidate to form: ${form.id || 'unnamed'}`);
    }
  });

  // 2. Convert required attributes to data-required
  const requiredInputs = root.querySelectorAll('input[required], select[required], textarea[required]');
  let inputsFixed = 0;
  
  requiredInputs.forEach((input) => {
    const fieldName = (input as HTMLInputElement).name || 
                      input.getAttribute('data-step-field-name') || 
                      'unnamed';
    
    // Store original required state in data attribute for our validation
    input.setAttribute('data-required', 'true');
    input.removeAttribute('required');
    inputsFixed++;
    
    logVerbose(`Fixed validation conflict: ${fieldName} (required → data-required)`);
  });

  // 3. Clear any existing browser validation messages
  const inputsWithValidation = root.querySelectorAll('input, select, textarea');
  inputsWithValidation.forEach(input => {
    if ('setCustomValidity' in input && typeof input.setCustomValidity === 'function') {
      (input as HTMLInputElement).setCustomValidity('');
    }
  });

  logVerbose(`Browser validation fix complete: ${formsFixed} forms, ${inputsFixed} inputs fixed`);
  
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